import { prisma } from '$lib';
import type { LB_MemoryCards, Profile } from '$prisma';

export type MemoryCardLeaderboardEntry = LB_MemoryCards & { Profile: Profile };

// Every completed game is logged as its own row, so the "leaderboard" is computed
// here rather than physically maintained: each player's single best game, sorted
// by score. Reused by the dashboard teaser, the leaderboard page, and the score
// submission endpoint's high-score check, so all three agree on what "top 10" means.
export async function getMemoryCardLeaderboard(): Promise<MemoryCardLeaderboardEntry[]> {
    const allGames = await prisma.lB_MemoryCards.findMany({
        include: { Profile: true },
        orderBy: { score: 'desc' },
    });

    const bestPerPlayer = new Map<string, MemoryCardLeaderboardEntry>();
    for (const game of allGames) {
        const key = game.player_id.toString();
        if (!bestPerPlayer.has(key)) {
            bestPerPlayer.set(key, game);
        }
    }

    return Array.from(bestPerPlayer.values());
}
