import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib';

async function requireTeam(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser();
    const userProfile = user?.email
        ? await prisma.profile.findFirst({ where: { auth_email: user.email } })
        : null;
    if (!userProfile) return null;
    return prisma.footballTeam.findFirst({ where: { owner_id: userProfile.id } });
}

export const load: PageServerLoad = async ({ parent }) => {
    const { userProfile } = await parent();
    if (!userProfile) return { team: null, freeAgents: [] };

    const team = await prisma.footballTeam.findFirst({ where: { owner_id: userProfile.id } });
    if (!team) throw redirect(303, '/football/create');

    const freeAgents = await prisma.footballPlayer.findMany({
        where: { team_id: null },
        orderBy: [{ position: 'asc' }, { price: 'asc' }],
    });

    return {
        team,
        freeAgents: freeAgents.map((p) => ({ ...p, isMine: p.listed_by_team_id === team.id })),
    };
};

export const actions: Actions = {
    sign: async ({ request, locals: { supabase } }) => {
        const team = await requireTeam(supabase);
        if (!team) return fail(401);

        const formData = await request.formData();
        const playerId = BigInt(formData.get('playerId') as string);

        const player = await prisma.footballPlayer.findFirst({ where: { id: playerId, team_id: null } });
        if (!player) return fail(404, { error: 'That player is no longer available.' });
        if (player.listed_by_team_id === team.id) return fail(400, { error: "You can't sign your own listing." });

        const price = player.price ?? 0;
        if (team.budget < price) return fail(400, { error: `Not enough budget. You need ${price} credits but only have ${team.budget}.` });

        // atomically claim the player so two concurrent signings can't both succeed
        const claimed = await prisma.footballPlayer.updateMany({
            where: { id: player.id, team_id: null },
            data: { team_id: team.id, listed_by_team_id: null, price: null },
        });
        if (claimed.count === 0) return fail(400, { error: 'That player was just signed by someone else.' });

        await prisma.footballTeam.update({ where: { id: team.id }, data: { budget: { decrement: price } } });

        return { success: true, signedName: player.name };
    },

    updatePrice: async ({ request, locals: { supabase } }) => {
        const team = await requireTeam(supabase);
        if (!team) return fail(401);

        const formData = await request.formData();
        const playerId = BigInt(formData.get('playerId') as string);
        const price = Math.floor(Number(formData.get('price')));
        if (!Number.isFinite(price) || price < 0) return fail(400, { error: 'Enter a valid price.' });

        const result = await prisma.footballPlayer.updateMany({
            where: { id: playerId, listed_by_team_id: team.id },
            data: { price },
        });
        if (result.count === 0) return fail(404, { error: "That listing isn't yours." });
        return { success: true };
    },

    cancelListing: async ({ request, locals: { supabase } }) => {
        const team = await requireTeam(supabase);
        if (!team) return fail(401);

        const formData = await request.formData();
        const playerId = BigInt(formData.get('playerId') as string);

        const result = await prisma.footballPlayer.updateMany({
            where: { id: playerId, listed_by_team_id: team.id },
            data: { team_id: team.id, listed_by_team_id: null, price: null },
        });
        if (result.count === 0) return fail(404, { error: "That listing isn't yours." });
        return { success: true };
    },
};
