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
            homeIsAi: match.home_team.is_ai,
            awayIsAi: match.away_team.is_ai,
            homeLineup: match.home_lineup,
            awayLineup: match.away_lineup,
            homeHalftimeLineup: match.home_halftime_lineup,
            awayHalftimeLineup: match.away_halftime_lineup,
            homeStamina: match.home_stamina as Record<string, number> | null,
            awayStamina: match.away_stamina as Record<string, number> | null,
            homeForm: match.home_form as Record<string, number> | null,
            awayForm: match.away_form as Record<string, number> | null,
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

        const existingOwnHalftime = viewerIsHome ? match.home_halftime_lineup : match.away_halftime_lineup;
        if (existingOwnHalftime) return fail(400, { error: 'You already submitted your halftime move.' });

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

        // The opponent's halftime move: already present if they're AI (pre-filled at kickoff)
        // or a human who submitted first. Null means we're the first to move — just save and wait.
        const opponentHalftimeLineup = viewerIsHome ? match.away_halftime_lineup : match.home_halftime_lineup;

        if (!opponentHalftimeLineup) {
            await prisma.footballMatch.update({
                where: { id: match.id },
                data: viewerIsHome ? { home_halftime_lineup: newLineup as any } : { away_halftime_lineup: newLineup as any },
            });
            throw redirect(303, `/football/match/${match.id}`);
        }

        const homeLineupFinal = viewerIsHome ? newLineup : (opponentHalftimeLineup as unknown as Lineup);
        const awayLineupFinal = !viewerIsHome ? newLineup : (opponentHalftimeLineup as unknown as Lineup);

        const homeRoster = match.home_team.players.map(toLite);
        const awayRoster = match.away_team.players.map(toLite);

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
                home_stamina: homeState.stamina as any,
                away_stamina: awayState.stamina as any,
                home_form: homeState.formRoll as any,
                away_form: awayState.formRoll as any,
                ...(viewerIsHome ? { home_halftime_lineup: newLineup as any } : { away_halftime_lineup: newLineup as any }),
            },
        });

        // Award XP to every human-owned side. AI opponents give half XP; a human opponent (PvP) gives full XP.
        const allEvents = [...match.events, ...half2.events.map((e) => ({ ...e, player_id: e.playerId ? BigInt(e.playerId) : null }))];
        const sides = [
            { team: match.home_team, lineup: homeLineupFinal, firstHalfLineup: match.home_lineup as unknown as Lineup, conceded: finalAwayScore, vsAi: match.away_team.is_ai },
            { team: match.away_team, lineup: awayLineupFinal, firstHalfLineup: match.away_lineup as unknown as Lineup, conceded: finalHomeScore, vsAi: match.home_team.is_ai },
        ];

        for (const side of sides) {
            if (!side.team.owner_id) continue; // AI teams don't need progression
            const participants = new Set([side.lineup.GK, ...side.lineup.DEF, ...side.lineup.MID, ...side.lineup.FWD].filter(Boolean));
            for (const pid of [side.firstHalfLineup.GK, ...side.firstHalfLineup.DEF, ...side.firstHalfLineup.MID, ...side.firstHalfLineup.FWD]) {
                if (pid) participants.add(pid);
            }

            for (const playerId of participants) {
                const player = side.team.players.find((p) => p.id.toString() === playerId);
                if (!player) continue;
                const goals = allEvents.filter((e: any) => e.type === 'SHOT_GOAL' && (e.playerId ?? e.player_id?.toString()) === playerId).length;
                const redCard = allEvents.some((e: any) => e.type === 'CARD_RED' && (e.playerId ?? e.player_id?.toString()) === playerId);
                const cleanSheet = side.conceded === 0 && (player.position === 'GK' || player.position === 'DEF');
                const gained = computeMatchXp({ playedInMatch: true, goals, assists: 0, cleanSheet, redCard, vsAi: side.vsAi });
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
