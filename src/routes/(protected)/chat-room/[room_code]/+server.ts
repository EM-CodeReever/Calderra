import { error, json } from '@sveltejs/kit';
import { prisma } from '$lib';

export const POST = async ({ params, request, locals: { supabase } }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
        return new Response('Unauthorized', { status: 401 });
    }

    const userProfile = await prisma.profile.findFirst({ where: { auth_email: user.email } });
    if (!userProfile) {
        return new Response('Unauthorized', { status: 401 });
    }

    const room = await prisma.chatRoom.findFirst({ where: { code: params.room_code } });
    if (!room) {
        throw error(404, 'Room not found');
    }

    const body = await request.json();
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!content) {
        throw error(400, 'Message content is required');
    }

    const message = await prisma.chatMessage.create({
        data: {
            room_id: room.id,
            profile_id: userProfile.id,
            content: content.slice(0, 2000),
        },
        include: { profile: true },
    });

    return json({
        id: message.id.toString(),
        content: message.content,
        sentAt: message.created_at.toISOString(),
        username: message.profile.username,
        avatar: message.profile.avatar,
        profileId: message.profile_id.toString(),
    });
};
