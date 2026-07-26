export const MAX_LEVEL = 10;
export const POINTS_PER_LEVEL = 2;

export function xpToReachLevel(level: number): number {
    // level 1->2 costs 100, 2->3 costs 200, etc. Gentle, not grindy.
    return 100 * level;
}

export type LevelUpResult = {
    level: number;
    xp: number;
    unspentPoints: number;
    leveledUp: boolean;
};

export function applyXp(currentLevel: number, currentXp: number, currentUnspent: number, gained: number): LevelUpResult {
    let level = currentLevel;
    let xp = currentXp + gained;
    let unspentPoints = currentUnspent;
    let leveledUp = false;

    while (level < MAX_LEVEL && xp >= xpToReachLevel(level)) {
        xp -= xpToReachLevel(level);
        level += 1;
        unspentPoints += POINTS_PER_LEVEL;
        leveledUp = true;
    }
    if (level >= MAX_LEVEL) {
        xp = 0;
    }

    return { level, xp, unspentPoints, leveledUp };
}

export type MatchXpInput = {
    playedInMatch: boolean;
    goals: number;
    assists: number;
    cleanSheet: boolean; // only meaningful for GK/DEF
    redCard: boolean;
    vsAi: boolean;
};

export function computeMatchXp(input: MatchXpInput): number {
    if (!input.playedInMatch) return 0;
    let xp = 20;
    xp += input.goals * 15;
    xp += input.assists * 10;
    if (input.cleanSheet) xp += 15;
    if (input.redCard) xp -= 10;
    xp = Math.max(0, xp);
    if (input.vsAi) xp = Math.round(xp * 0.5);
    return xp;
}
