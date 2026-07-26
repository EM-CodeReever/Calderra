import { redirect, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { prisma } from "$lib";

const MESSAGE_HISTORY_LIMIT = 50;

export const load: PageServerLoad = async ({ params, parent }) => {
    const { userProfile } = await parent();

    let room;
    try {
        room = await prisma.chatRoom.findFirstOrThrow({
            where: { code: params.room_code },
            include: { owner: true },
        });
    } catch (error) {
        throw redirect(302, "/error/room-not-found");
    }

    if (userProfile) {
        await prisma.chatRoomMember.upsert({
            where: { room_id_profile_id: { room_id: room.id, profile_id: userProfile.id } },
            update: {},
            create: { room_id: room.id, profile_id: userProfile.id },
        });
    }

    const messages = await prisma.chatMessage.findMany({
        where: { room_id: room.id },
        include: { profile: true },
        orderBy: { created_at: "desc" },
        take: MESSAGE_HISTORY_LIMIT,
    });

    return {
        room: {
            code: room.code,
            name: room.name,
            isGlobal: room.code === "global",
            ownerUsername: room.owner?.username ?? null,
        },
        messages: messages.reverse().map((m) => ({
            id: m.id.toString(),
            content: m.content,
            sentAt: m.created_at.toISOString(),
            username: m.profile.username,
            avatar: m.profile.avatar,
            profileId: m.profile_id.toString(),
        })),
    };
};

export const actions: Actions = {
    leaveRoom: async ({ params, locals: { supabase } }) => {
        if (params.room_code === "global") {
            return fail(400, { error: "You can't leave the global chat." });
        }

        const { data: { user } } = await supabase.auth.getUser();
        const userProfile = user?.email
            ? await prisma.profile.findFirst({ where: { auth_email: user.email } })
            : null;
        if (!userProfile) {
            return fail(401);
        }

        const room = await prisma.chatRoom.findFirst({ where: { code: params.room_code } });
        if (room) {
            await prisma.chatRoomMember.deleteMany({
                where: { room_id: room.id, profile_id: userProfile.id },
            });
        }

        throw redirect(303, "/chat-room");
    },
};
