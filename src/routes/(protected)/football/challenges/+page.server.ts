import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib';
import { kickoffMatch } from '$lib/football/startMatch';

async function requireProfileAndTeam(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser();
    const userProfile = user?.email
        ? await prisma.profile.findFirst({ where: { auth_email: user.email } })
        : null;
    if (!userProfile) return { userProfile: null, team: null };
    const team = await prisma.footballTeam.findFirst({ where: { owner_id: userProfile.id } });
    return { userProfile, team };
}

export const load: PageServerLoad = async ({ parent }) => {
    const { userProfile } = await parent();
    if (!userProfile) return { team: null, opponents: [], incoming: [], outgoing: [] };

    const team = await prisma.footballTeam.findFirst({ where: { owner_id: userProfile.id } });
    if (!team) throw redirect(303, '/football/create');

    const [otherTeams, incoming, outgoing] = await Promise.all([
        prisma.footballTeam.findMany({
            where: { is_ai: false, owner_id: { not: userProfile.id } },
            include: { owner: { select: { username: true, first_name: true } } },
            orderBy: { name: 'asc' },
        }),
        prisma.footballChallenge.findMany({
            where: { opponent_team_id: team.id, status: 'PENDING' },
            include: { challenger_team: { include: { owner: { select: { username: true } } } } },
            orderBy: { created_at: 'desc' },
        }),
        prisma.footballChallenge.findMany({
            where: { challenger_team_id: team.id, status: 'PENDING' },
            include: { opponent_team: { include: { owner: { select: { username: true } } } } },
            orderBy: { created_at: 'desc' },
        }),
    ]);

    return {
        team,
        opponents: otherTeams.map((t) => ({
            id: t.id.toString(),
            name: t.name,
            formation: t.default_formation,
            hasLineup: !!t.default_lineup,
            ownerName: t.owner?.username ?? t.owner?.first_name ?? 'Manager',
        })),
        incoming: incoming.map((c) => ({
            id: c.id.toString(),
            teamName: c.challenger_team.name,
            ownerName: c.challenger_team.owner?.username ?? 'Manager',
        })),
        outgoing: outgoing.map((c) => ({
            id: c.id.toString(),
            teamName: c.opponent_team.name,
            ownerName: c.opponent_team.owner?.username ?? 'Manager',
        })),
    };
};

export const actions: Actions = {
    send: async ({ request, locals: { supabase } }) => {
        const { team } = await requireProfileAndTeam(supabase);
        if (!team) return fail(401);
        if (!team.default_lineup) return fail(400, { error: 'Set your lineup before challenging anyone.' });

        const formData = await request.formData();
        const opponentTeamId = BigInt(formData.get('opponentTeamId') as string);
        const opponent = await prisma.footballTeam.findFirst({ where: { id: opponentTeamId, is_ai: false } });
        if (!opponent || opponent.id === team.id) return fail(400, { error: 'Choose a valid opponent.' });
        if (!opponent.default_lineup) return fail(400, { error: "That manager hasn't set a lineup yet." });

        const existing = await prisma.footballChallenge.findFirst({
            where: {
                status: 'PENDING',
                OR: [
                    { challenger_team_id: team.id, opponent_team_id: opponent.id },
                    { challenger_team_id: opponent.id, opponent_team_id: team.id },
                ],
            },
        });
        if (existing) return fail(400, { error: 'There is already a pending challenge between your teams.' });

        await prisma.footballChallenge.create({
            data: { challenger_team_id: team.id, opponent_team_id: opponent.id },
        });
        return { success: true };
    },

    respond: async ({ request, locals: { supabase } }) => {
        const { team } = await requireProfileAndTeam(supabase);
        if (!team) return fail(401);

        const formData = await request.formData();
        const challengeId = BigInt(formData.get('challengeId') as string);
        const decision = formData.get('decision') as string;

        const challenge = await prisma.footballChallenge.findFirst({ where: { id: challengeId } });
        if (!challenge || challenge.opponent_team_id !== team.id || challenge.status !== 'PENDING') {
            return fail(404, { error: 'Challenge not found.' });
        }

        if (decision === 'decline') {
            await prisma.footballChallenge.update({ where: { id: challenge.id }, data: { status: 'DECLINED' } });
            return { success: true };
        }

        if (decision === 'accept') {
            const matchId = await kickoffMatch(challenge.challenger_team_id, challenge.opponent_team_id);
            await prisma.footballChallenge.update({
                where: { id: challenge.id },
                data: { status: 'ACCEPTED', match_id: matchId },
            });
            throw redirect(303, `/football/match/${matchId}`);
        }

        return fail(400, { error: 'Invalid decision.' });
    },

    cancel: async ({ request, locals: { supabase } }) => {
        const { team } = await requireProfileAndTeam(supabase);
        if (!team) return fail(401);

        const formData = await request.formData();
        const challengeId = BigInt(formData.get('challengeId') as string);
        await prisma.footballChallenge.deleteMany({
            where: { id: challengeId, challenger_team_id: team.id, status: 'PENDING' },
        });
        return { success: true };
    },
};
