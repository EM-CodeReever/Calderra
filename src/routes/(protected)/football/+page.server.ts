import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib';
import { kickoffMatch } from '$lib/football/startMatch';

export const load: PageServerLoad = async ({ parent }) => {
    const { userProfile } = await parent();
    if (!userProfile) return { team: null, aiTeams: [], matches: [] };

    const team = await prisma.footballTeam.findFirst({
        where: { owner_id: userProfile.id },
        include: { players: true },
    });
    if (!team) throw redirect(303, '/football/create');

    const aiTeams = await prisma.footballTeam.findMany({ where: { is_ai: true }, orderBy: { id: 'asc' } });

    const [matches, pendingChallengeCount] = await Promise.all([
        prisma.footballMatch.findMany({
            where: { OR: [{ home_team_id: team.id }, { away_team_id: team.id }] },
            include: { home_team: true, away_team: true },
            orderBy: { created_at: 'desc' },
            take: 10,
        }),
        prisma.footballChallenge.count({ where: { opponent_team_id: team.id, status: 'PENDING' } }),
    ]);

    return {
        team,
        pendingChallengeCount,
        aiTeams: aiTeams.map((t) => ({ id: t.id.toString(), name: t.name, formation: t.default_formation })),
        matches: matches.map((m) => {
            const isHome = m.home_team_id === team.id;
            const viewerHalftimeLineup = isHome ? m.home_halftime_lineup : m.away_halftime_lineup;
            return {
                id: m.id.toString(),
                status: m.status,
                homeTeamName: m.home_team.name,
                awayTeamName: m.away_team.name,
                homeScore: m.home_score,
                awayScore: m.away_score,
                isHome,
                viewerSubmittedHalftime: !!viewerHalftimeLineup,
                createdAt: m.created_at.toISOString(),
            };
        }),
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
        const aiTeam = await prisma.footballTeam.findFirst({ where: { id: aiTeamId, is_ai: true } });
        if (!aiTeam || !aiTeam.default_lineup) return fail(400, { error: 'Choose a valid opponent.' });

        const matchId = await kickoffMatch(team.id, aiTeam.id);
        throw redirect(303, `/football/match/${matchId}`);
    },
};
