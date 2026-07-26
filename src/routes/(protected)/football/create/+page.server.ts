import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib';
import { ATTRIBUTES_BY_POSITION, ATTRIBUTE_BASE, CREATION_BONUS_POOL, CREATION_MAX_PER_ATTRIBUTE, PERSONALITIES, POSITIONS, type Position, type Personality } from '$lib/football/types';
import { generateSquadFillers } from '$lib/football/generate';
import { buildDefaultLineup } from '$lib/football/lineup';

export const load: PageServerLoad = async ({ parent }) => {
    const { userProfile } = await parent();
    if (userProfile) {
        const existing = await prisma.footballTeam.findFirst({ where: { owner_id: userProfile.id } });
        if (existing) throw redirect(303, '/football');
    }
    return {};
};

export const actions: Actions = {
    default: async ({ request, locals: { supabase } }) => {
        const { data: { user } } = await supabase.auth.getUser();
        const userProfile = user?.email
            ? await prisma.profile.findFirst({ where: { auth_email: user.email } })
            : null;
        if (!userProfile) return fail(401, { error: 'You need a profile first.' });

        const existing = await prisma.footballTeam.findFirst({ where: { owner_id: userProfile.id } });
        if (existing) throw redirect(303, '/football');

        const formData = await request.formData();
        const teamName = (formData.get('teamName') as string | null)?.trim();
        const playerName = (formData.get('playerName') as string | null)?.trim();
        const position = formData.get('position') as Position;
        const personality = formData.get('personality') as Personality;

        if (!teamName || teamName.length > 40) return fail(400, { error: 'Enter a team name (up to 40 characters).' });
        if (!playerName || playerName.length > 30) return fail(400, { error: 'Enter a player name (up to 30 characters).' });
        if (!POSITIONS.includes(position)) return fail(400, { error: 'Choose a valid position.' });
        if (!PERSONALITIES.includes(personality)) return fail(400, { error: 'Choose a valid personality.' });

        const attrKeys = ATTRIBUTES_BY_POSITION[position];
        const allocations = attrKeys.map((key) => {
            const raw = Number(formData.get(`alloc_${key}`) ?? 0);
            return Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
        });
        const totalAllocated = allocations.reduce((a, b) => a + b, 0);
        if (totalAllocated > CREATION_BONUS_POOL) {
            return fail(400, { error: `You only have ${CREATION_BONUS_POOL} points to allocate.` });
        }
        if (allocations.some((a) => a > CREATION_MAX_PER_ATTRIBUTE - ATTRIBUTE_BASE)) {
            return fail(400, { error: `No single attribute can exceed ${CREATION_MAX_PER_ATTRIBUTE} at creation.` });
        }

        const starAttrs: Record<string, number> = {
            finishing: 0, trickery: 0, timing: 0,
            control: 0, passing: 0, vision: 0,
            tackling: 0, disruption: 0, positioning: 0,
            reflexes: 0, handling: 0, distribution: 0,
        };
        attrKeys.forEach((key, i) => {
            starAttrs[key] = ATTRIBUTE_BASE + allocations[i];
        });

        const fillers = generateSquadFillers(position);

        const team = await prisma.footballTeam.create({
            data: {
                owner_id: userProfile.id,
                name: teamName,
                is_ai: false,
                players: {
                    create: [
                        { name: playerName, position, personality, level: 1, xp: 0, ...starAttrs },
                        ...fillers,
                    ],
                },
            },
            include: { players: true },
        });

        const lite = team.players.map((p) => ({
            id: p.id.toString(),
            name: p.name,
            position: p.position as Position,
            personality: p.personality as Personality,
            level: p.level,
            xp: p.xp,
            unspent_points: p.unspent_points,
            finishing: p.finishing, trickery: p.trickery, timing: p.timing,
            control: p.control, passing: p.passing, vision: p.vision,
            tackling: p.tackling, disruption: p.disruption, positioning: p.positioning,
            reflexes: p.reflexes, handling: p.handling, distribution: p.distribution,
        }));
        const lineup = buildDefaultLineup(lite, team.default_formation as any);
        await prisma.footballTeam.update({ where: { id: team.id }, data: { default_lineup: lineup as any } });

        throw redirect(303, '/football');
    },
};
