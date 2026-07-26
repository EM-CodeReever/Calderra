import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib';
import { createRng, initTeamState, simulateHalf } from '$lib/football/matchEngine';
import { toLite } from '$lib/football/lineup';
import { computeMatchXp, applyXp } from '$lib/football/xp';
import type { Lineup } from '$lib/football/types';

async function loadMatchOrThrow(id: bigint) {
    const match = await prisma.footballMatch.findFirst({
        where: { id },
        include: {
            home_team: { include: { players: true } },
            away_team: { include: { players: true } },
            events: { orderBy: { sequence: 'asc' } },
        },
    });
    if (!match) throw error(404, 'Match not found');
    return match;
}

export const load: PageServerLoad = async ({ params, parent }) => {
    const { userProfile } = await parent();
    const id = BigInt(params.id);
    const match = await loadMatchOrThrow(id);

    const isOwner = userProfile && (match.home_team.owner_id === userProfile.id || match.away_team.owner_id === userProfile.id);
    if (!isOwner) throw error(403, 'Not your match');

    const viewerIsHome = match.home_team.owner_id === userProfile!.id;

    return {
        match: {
            id: match.id.toString(),
            status: match.status,
            homeScore: match.home_score,
            awayScore: match.away_score,
            homeTeamName: match.home_team.name,
            awayTeamName: match.away_team.name,
            homeLineup: match.home_lineup,
            awayLineup: match.away_lineup,
            homeHalftimeLineup: match.home_halftime_lineup,
            awayHalftimeLineup: match.away_halftime_lineup,
            homePlayers: match.home_team.players,
            awayPlayers: match.away_team.players,
            events: match.events.map((e) => ({
                sequence: e.sequence,
                minute: e.minute,
                half: e.half,
                type: e.type,
                description: e.description,
                playerId: e.player_id?.toString() ?? null,
                positionData: e.position_data,
            })),
        },
        viewerIsHome,
    };
};

export const actions: Actions = {
    submitHalftime: async ({ request, params, locals: { supabase } }) => {
        const { data: { user } } = await supabase.auth.getUser();
        const userProfile = user?.email
            ? await prisma.profile.findFirst({ where: { auth_email: user.email } })
            : null;
        if (!userProfile) return fail(401);

        const id = BigInt(params.id);
        const match = await loadMatchOrThrow(id);
        if (match.status !== 'AWAITING_HALFTIME') return fail(400, { error: 'This match is not awaiting halftime changes.' });

        const viewerIsHome = match.home_team.owner_id === userProfile.id;
        if (!viewerIsHome && match.away_team.owner_id !== userProfile.id) return fail(403);

        const formData = await request.formData();
        const subOutId = formData.get('subOut') as string | null;
        const subInId = formData.get('subIn') as string | null;

        const baseLineup = (viewerIsHome ? match.home_lineup : match.away_lineup) as unknown as Lineup;
        let newLineup: Lineup = { ...baseLineup, DEF: [...baseLineup.DEF], MID: [...baseLineup.MID], FWD: [...baseLineup.FWD], bench: [...baseLineup.bench] };

        if (subOutId && subInId && subOutId !== subInId) {
            for (const key of ['DEF', 'MID', 'FWD'] as const) {
                const idx = newLineup[key].indexOf(subOutId);
                if (idx !== -1) {
                    newLineup[key][idx] = subInId;
                    newLineup.bench = newLineup.bench.map((id) => (id === subInId ? subOutId : id));
                    break;
                }
            }
        }

        const homeRoster = match.home_team.players.map(toLite);
        const awayRoster = match.away_team.players.map(toLite);
        const homeLineupFinal = viewerIsHome ? newLineup : ((match.home_halftime_lineup as unknown as Lineup) ?? (match.home_lineup as unknown as Lineup));
        const awayLineupFinal = !viewerIsHome ? newLineup : ((match.away_halftime_lineup as unknown as Lineup) ?? (match.away_lineup as unknown as Lineup));

        const seed = Number(BigInt.asIntN(32, id * 7919n + BigInt(Date.now())));
        const rng = createRng(seed);
        const homeState = initTeamState(homeRoster, homeLineupFinal, rng, true);
        const awayState = initTeamState(awayRoster, awayLineupFinal, rng, false);

        const nextSequence = match.events.length + 1;
        const half2 = simulateHalf(homeState, awayState, 2, match.home_score, match.away_score, nextSequence, rng);

        const finalHomeScore = match.home_score + half2.homeGoals;
        const finalAwayScore = match.away_score + half2.awayGoals;

        await prisma.footballMatchEvent.createMany({
            data: half2.events.map((e) => ({
                match_id: match.id,
                sequence: e.sequence,
                minute: e.minute,
                half: e.half,
                type: e.type,
                description: e.description,
                player_id: e.playerId ? BigInt(e.playerId) : null,
                position_data: e.positionData as any,
            })),
        });

        await prisma.footballMatch.update({
            where: { id: match.id },
            data: {
                status: 'COMPLETED',
                home_score: finalHomeScore,
                away_score: finalAwayScore,
                completed_at: new Date(),
                ...(viewerIsHome ? { home_halftime_lineup: newLineup as any } : { away_halftime_lineup: newLineup as any }),
            },
        });

        // Award XP only for the human-owned side (AI players don't need progression).
        const humanTeam = match.home_team.owner_id ? match.home_team : match.away_team;
        if (humanTeam.owner_id) {
            const isHomeHuman = humanTeam.id === match.home_team.id;
            const humanLineup = isHomeHuman ? homeLineupFinal : awayLineupFinal;
            const conceded = isHomeHuman ? finalAwayScore : finalHomeScore;
            const allEvents = [...match.events, ...half2.events.map((e) => ({ ...e, player_id: e.playerId ? BigInt(e.playerId) : null }))];
            const participants = new Set([humanLineup.GK, ...humanLineup.DEF, ...humanLineup.MID, ...humanLineup.FWD].filter(Boolean));
            // include first-half starters too, in case they were subbed off at halftime
            const firstHalfLineup = isHomeHuman ? (match.home_lineup as unknown as Lineup) : (match.away_lineup as unknown as Lineup);
            for (const id of [firstHalfLineup.GK, ...firstHalfLineup.DEF, ...firstHalfLineup.MID, ...firstHalfLineup.FWD]) {
                if (id) participants.add(id);
            }

            for (const playerId of participants) {
                const player = humanTeam.players.find((p) => p.id.toString() === playerId);
                if (!player) continue;
                const goals = allEvents.filter((e: any) => e.type === 'SHOT_GOAL' && (e.playerId ?? e.player_id?.toString()) === playerId).length;
                const redCard = allEvents.some((e: any) => e.type === 'CARD_RED' && (e.playerId ?? e.player_id?.toString()) === playerId);
                const cleanSheet = conceded === 0 && (player.position === 'GK' || player.position === 'DEF');
                const gained = computeMatchXp({ playedInMatch: true, goals, assists: 0, cleanSheet, redCard, vsAi: true });
                const result = applyXp(player.level, player.xp, player.unspent_points, gained);
                await prisma.footballPlayer.update({
                    where: { id: player.id },
                    data: { level: result.level, xp: result.xp, unspent_points: result.unspentPoints },
                });
            }
        }

        throw redirect(303, `/football/match/${match.id}`);
    },
};
