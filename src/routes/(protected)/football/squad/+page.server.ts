import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib';
import { ATTRIBUTES_BY_POSITION, ATTRIBUTE_MAX, FORMATIONS, type AttributeKey, type Position } from '$lib/football/types';
import { formationCounts, toLite } from '$lib/football/lineup';

export const load: PageServerLoad = async ({ parent }) => {
    const { userProfile } = await parent();
    if (!userProfile) return { team: null };
    const team = await prisma.footballTeam.findFirst({
        where: { owner_id: userProfile.id },
        include: { players: true },
    });
    if (!team) throw redirect(303, '/football/create');
    return { team };
};

export const actions: Actions = {
    allocatePoints: async ({ request, locals: { supabase } }) => {
        const { data: { user } } = await supabase.auth.getUser();
        const userProfile = user?.email
            ? await prisma.profile.findFirst({ where: { auth_email: user.email } })
            : null;
        if (!userProfile) return fail(401);

        const formData = await request.formData();
        const playerId = BigInt(formData.get('playerId') as string);
        const attr = formData.get('attribute') as AttributeKey;

        const player = await prisma.footballPlayer.findFirst({
            where: { id: playerId, team: { owner_id: userProfile.id } },
        });
        if (!player) return fail(404);
        if (player.unspent_points <= 0) return fail(400, { error: 'No points left to spend.' });
        const validAttrs = ATTRIBUTES_BY_POSITION[player.position as Position];
        if (!validAttrs.includes(attr)) return fail(400, { error: 'Invalid attribute for this position.' });
        if ((player as any)[attr] >= ATTRIBUTE_MAX) return fail(400, { error: 'That attribute is already maxed.' });

        await prisma.footballPlayer.update({
            where: { id: playerId },
            data: {
                unspent_points: { decrement: 1 },
                [attr]: { increment: 1 },
            },
        });
        return { success: true };
    },

    saveLineup: async ({ request, locals: { supabase } }) => {
        const { data: { user } } = await supabase.auth.getUser();
        const userProfile = user?.email
            ? await prisma.profile.findFirst({ where: { auth_email: user.email } })
            : null;
        if (!userProfile) return fail(401);

        const team = await prisma.footballTeam.findFirst({
            where: { owner_id: userProfile.id },
            include: { players: true },
        });
        if (!team) return fail(404);

        const formData = await request.formData();
        const formation = formData.get('formation') as string;
        if (!FORMATIONS.includes(formation as any)) return fail(400, { error: 'Invalid formation.' });
        const counts = formationCounts(formation as any);

        const defIds = formData.getAll('def') as string[];
        const midIds = formData.getAll('mid') as string[];
        const fwdIds = formData.getAll('fwd') as string[];

        if (defIds.length !== counts.DEF || midIds.length !== counts.MID || fwdIds.length !== counts.FWD) {
            return fail(400, { error: `${formation} needs exactly ${counts.DEF} defenders, ${counts.MID} midfielders, ${counts.FWD} forwards.` });
        }

        const roster = team.players.map(toLite);
        const rosterIds = new Set(roster.map((p) => p.id));
        const gk = roster.find((p) => p.position === 'GK');
        const allChosen = [...defIds, ...midIds, ...fwdIds];
        const validPosition = (ids: string[], pos: Position) => ids.every((id) => roster.find((p) => p.id === id)?.position === pos);

        if (!gk || new Set(allChosen).size !== allChosen.length || !allChosen.every((id) => rosterIds.has(id))
            || !validPosition(defIds, 'DEF') || !validPosition(midIds, 'MID') || !validPosition(fwdIds, 'FWD')) {
            return fail(400, { error: 'Invalid lineup selection.' });
        }

        const bench = roster
            .filter((p) => p.position !== 'GK' && !allChosen.includes(p.id))
            .map((p) => p.id);

        const lineup = { formation, GK: gk.id, DEF: defIds, MID: midIds, FWD: fwdIds, bench };

        await prisma.footballTeam.update({
            where: { id: team.id },
            data: { default_formation: formation, default_lineup: lineup as any },
        });
        return { success: true };
    },
};
