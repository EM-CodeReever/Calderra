import { getMemoryCardLeaderboard } from "$lib/memoryCardLeaderboard";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({}) => {
    const leaderboard = await getMemoryCardLeaderboard();
    return { lb_memory_cards: leaderboard.slice(0, 10) };
}
