import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
    const { userProfile } = await parent();

    if (!userProfile) {
        return { rooms: [] };
    }

    const memberships = await prisma.chatRoomMember.findMany({
        where: { profile_id: userProfile.id },
        include: { room: true },
        orderBy: { joined_at: 'desc' },
    });

    const rooms = memberships
        .map((m) => m.room)
        .filter((room) => room.code !== 'global');

    return { rooms };
};

export const actions: Actions = {
    createRoom: async ({ request, locals: { supabase } }) => {
        const { data: { user } } = await supabase.auth.getUser();
        const userProfile = user?.email
            ? await prisma.profile.findFirst({ where: { auth_email: user.email } })
            : null;
        if (!userProfile) {
            return fail(401, { error: 'You need a profile before creating a room.' });
        }

        const formData = await request.formData();
        const name = (formData.get('name') as string | null)?.trim();
        if (!name) {
            return fail(400, { error: 'Room name is required.' });
        }

        const room = await prisma.chatRoom.create({
            data: {
                name,
                owner_id: userProfile.id,
                members: {
                    create: { profile_id: userProfile.id },
                },
            },
        });

        throw redirect(303, `/chat-room/${room.code}`);
    },
};
