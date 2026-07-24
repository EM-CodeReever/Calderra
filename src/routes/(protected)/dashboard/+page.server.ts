import type { PageServerLoad } from './$types';
import { prisma } from '$lib/index';


export const load = (async ({ parent }) => {
    const { userProfile } = await parent();

    const allRecords = await prisma.lB_MemoryCards.findMany({
        orderBy: { score: 'desc' },
    });

    const topScore = allRecords[0]?.score ?? null;

    let bestRecord = null;
    let rank: number | null = null;
    if (userProfile) {
        bestRecord = allRecords.find((r) => r.player_id === userProfile.id) ?? null;
        if (bestRecord) {
            rank = allRecords.indexOf(bestRecord) + 1;
        }
    }

    return { bestRecord, rank, topScore };
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