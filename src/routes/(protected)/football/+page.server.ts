import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib';
import { createRng, initTeamState, simulateHalf, aiHalftimeLineup } from '$lib/football/matchEngine';
import { toLite } from '$lib/football/lineup';
import type { Lineup } from '$lib/football/types';

export const load: PageServerLoad = async ({ parent }) => {
    const { userProfile } = await parent();
    if (!userProfile) return { team: null, aiTeams: [], matches: [] };

    const team = await prisma.footballTeam.findFirst({
        where: { owner_id: userProfile.id },
        include: { players: true },
    });
    if (!team) throw redirect(303, '/football/create');

    const aiTeams = await prisma.footballTeam.findMany({ where: { is_ai: true }, orderBy: { id: 'asc' } });

    const matches = await prisma.footballMatch.findMany({
        where: { OR: [{ home_team_id: team.id }, { away_team_id: team.id }] },
        include: { home_team: true, away_team: true },
        orderBy: { created_at: 'desc' },
        take: 10,
    });

    return {
        team,
        aiTeams: aiTeams.map((t) => ({ id: t.id.toString(), name: t.name, formation: t.default_formation })),
        matches: matches.map((m) => ({
            id: m.id.toString(),
            status: m.status,
            homeTeamName: m.home_team.name,
            awayTeamName: m.away_team.name,
            homeScore: m.home_score,
            awayScore: m.away_score,
            isHome: m.home_team_id === team.id,
            createdAt: m.created_at.toISOString(),
        })),
    };
};

export const actions: Actions = {
    playMatch: async ({ request, locals: { supabase } }) => {
        const { data: { user } } = await supabase.auth.getUser();
        const userProfile = user?.email
            ? await prisma.profile.findFirst({ where: { auth_email: user.email } })
            : null;
        if (!userProfile) return fail(401);

        const team = await prisma.footballTeam.findFirst({ where: { owner_id: userProfile.id }, include: { players: true } });
        if (!team || !team.default_lineup) return fail(400, { error: 'Set a lineup before playing a match.' });

        const formData = await request.formData();
        const aiTeamId = BigInt(formData.get('aiTeamId') as string);
        const aiTeam = await prisma.footballTeam.findFirst({ where: { id: aiTeamId, is_ai: true }, include: { players: true } });
        if (!aiTeam || !aiTeam.default_lineup) return fail(400, { error: 'Choose a valid opponent.' });

        const homeRoster = team.players.map(toLite);
        const awayRoster = aiTeam.players.map(toLite);
        const homeLineup = team.default_lineup as unknown as Lineup;
        const awayLineup = aiTeam.default_lineup as unknown as Lineup;

        const seed = Number(BigInt.asIntN(32, BigInt(Date.now())));
        const rng = createRng(seed);
        const homeState = initTeamState(homeRoster, homeLineup, rng, true);
        const awayState = initTeamState(awayRoster, awayLineup, rng, false);

        const half1 = simulateHalf(homeState, awayState, 1, 0, 0, 1, rng);
        const awayHalftimeLineup = aiHalftimeLineup(awayState);

        const match = await prisma.footballMatch.create({
            data: {
                home_team_id: team.id,
                away_team_id: aiTeam.id,
                status: 'AWAITING_HALFTIME',
                home_score: half1.homeGoals,
                away_score: half1.awayGoals,
                home_lineup: homeLineup as any,
                away_lineup: awayLineup as any,
                away_halftime_lineup: awayHalftimeLineup as any,
                events: {
                    create: half1.events.map((e) => ({
                        sequence: e.sequence,
                        minute: e.minute,
                        half: e.half,
                        type: e.type,
                        description: e.description,
                        player_id: e.playerId ? BigInt(e.playerId) : null,
                        position_data: e.positionData as any,
                    })),
                },
            },
        });

        throw redirect(303, `/football/match/${match.id}`);
    },
};
