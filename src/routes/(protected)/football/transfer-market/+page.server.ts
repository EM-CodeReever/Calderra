import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib';

export const load: PageServerLoad = async ({ parent }) => {
    const { userProfile } = await parent();
    if (!userProfile) return { team: null, freeAgents: [] };

    const team = await prisma.footballTeam.findFirst({ where: { owner_id: userProfile.id } });
    if (!team) throw redirect(303, '/football/create');

    const freeAgents = await prisma.footballPlayer.findMany({
        where: { team_id: null },
        orderBy: [{ position: 'asc' }, { price: 'asc' }],
    });

    return { team, freeAgents };
};

export const actions: Actions = {
    sign: async ({ request, locals: { supabase } }) => {
        const { data: { user } } = await supabase.auth.getUser();
        const userProfile = user?.email
            ? await prisma.profile.findFirst({ where: { auth_email: user.email } })
            : null;
        if (!userProfile) return fail(401);

        const team = await prisma.footballTeam.findFirst({ where: { owner_id: userProfile.id } });
        if (!team) return fail(404);

        const formData = await request.formData();
        const playerId = BigInt(formData.get('playerId') as string);

        const player = await prisma.footballPlayer.findFirst({ where: { id: playerId, team_id: null } });
        if (!player) return fail(404, { error: 'That player is no longer available.' });

        const price = player.price ?? 0;
        if (team.budget < price) return fail(400, { error: `Not enough budget. You need ${price} credits but only have ${team.budget}.` });

        // atomically claim the player so two concurrent signings can't both succeed
        const claimed = await prisma.footballPlayer.updateMany({ where: { id: player.id, team_id: null }, data: { team_id: team.id } });
        if (claimed.count === 0) return fail(400, { error: 'That player was just signed by someone else.' });

        await prisma.footballTeam.update({ where: { id: team.id }, data: { budget: { decrement: price } } });

        return { success: true, signedName: player.name };
    },
};
