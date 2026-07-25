import type { PageServerLoad } from './$types';
import { prisma } from '$lib/index';
import { getMemoryCardLeaderboard } from '$lib/memoryCardLeaderboard';


export const load = (async ({ parent }) => {
    const { userProfile } = await parent();

    const leaderboard = await getMemoryCardLeaderboard();

    const topScore = leaderboard[0]?.score ?? null;

    let bestRecord = null;
    let rank: number | null = null;
    let gamesPlayed = 0;
    if (userProfile) {
        bestRecord = leaderboard.find((r) => r.player_id === userProfile.id) ?? null;
        if (bestRecord) {
            rank = leaderboard.indexOf(bestRecord) + 1;
        }
        gamesPlayed = await prisma.lB_MemoryCards.count({ where: { player_id: userProfile.id } });
    }

    return { bestRecord, rank, topScore, gamesPlayed };
}) satisfies PageServerLoad;

export const actions = { updateProfile: async ({ request }) => {
      const formData = await request.formData();
      const firstName = formData.get('firstName');
      const lastName = formData.get('lastName');
      const username = formData.get('username');
      const sessionUserId = formData.get('sessionUserId');
      const sessionUserEmail = formData.get('sessionUserEmail');
      
      let profile = await prisma.profile.create({
            data: {
               auth_user_id: sessionUserId as string,
               auth_email: sessionUserEmail as string,
               avatar: '',
               created_at: new Date(),
               first_name: firstName as string,
               last_name: lastName as string,
               username: username as string,
            },
        });
        if (formData) {
            return { 
                success: true,
                data: profile
            };
        }else{
            return { 
                success: false,
                data: null
             };
        }
    },
  };