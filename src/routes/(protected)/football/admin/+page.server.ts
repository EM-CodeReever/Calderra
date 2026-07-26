import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib';
import { ATTRIBUTES_BY_POSITION, ATTRIBUTE_MIN, ATTRIBUTE_MAX, PERSONALITIES, POSITIONS, type Position, type Personality } from '$lib/football/types';

async function requireAdminFromSupabase(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser();
    const userProfile = user?.email
        ? await prisma.profile.findFirst({ where: { auth_email: user.email } })
        : null;
    if (!userProfile?.is_admin) throw error(403, 'Admins only.');
    return userProfile;
}

export const load: PageServerLoad = async ({ parent }) => {
    const { userProfile } = await parent();
    if (!userProfile?.is_admin) throw error(403, 'Admins only.');
    const freeAgents = await prisma.footballPlayer.findMany({
        where: { team_id: null },
        orderBy: [{ position: 'asc' }, { created_at: 'desc' }],
    });
    return { freeAgents };
};

export const actions: Actions = {
    createPlayer: async ({ request, locals: { supabase } }) => {
        await requireAdminFromSupabase(supabase);

        const formData = await request.formData();
        const name = (formData.get('name') as string | null)?.trim();
        const position = formData.get('position') as Position;
        const personality = formData.get('personality') as Personality;
        const price = Number(formData.get('price'));

        if (!name || name.length > 30) return fail(400, { error: 'Enter a player name (up to 30 characters).' });
        if (!POSITIONS.includes(position)) return fail(400, { error: 'Choose a valid position.' });
        if (!PERSONALITIES.includes(personality)) return fail(400, { error: 'Choose a valid personality.' });
        if (!Number.isFinite(price) || price < 0) return fail(400, { error: 'Enter a valid price.' });

        const attrKeys = ATTRIBUTES_BY_POSITION[position];
        const attrs: Record<string, number> = {
            finishing: 0, trickery: 0, timing: 0,
            control: 0, passing: 0, vision: 0,
            tackling: 0, disruption: 0, positioning: 0,
            reflexes: 0, handling: 0, distribution: 0,
        };
        for (const key of attrKeys) {
            const raw = Math.floor(Number(formData.get(`attr_${key}`)));
            if (!Number.isFinite(raw) || raw < ATTRIBUTE_MIN || raw > ATTRIBUTE_MAX) {
                return fail(400, { error: `${key} must be between ${ATTRIBUTE_MIN} and ${ATTRIBUTE_MAX}.` });
            }
            attrs[key] = raw;
        }

        await prisma.footballPlayer.create({
            data: {
                team_id: null,
                name,
                position,
                personality,
                price: Math.floor(price),
                level: 1,
                xp: 0,
                ...attrs,
            },
        });

        return { success: true };
    },

    deletePlayer: async ({ request, locals: { supabase } }) => {
        await requireAdminFromSupabase(supabase);
        const formData = await request.formData();
        const playerId = BigInt(formData.get('playerId') as string);
        // only ever allow deleting players that are still unsigned free agents
        await prisma.footballPlayer.deleteMany({ where: { id: playerId, team_id: null } });
        return { success: true };
    },
};
