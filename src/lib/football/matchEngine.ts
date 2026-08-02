import type {
    AttributeKey,
    FootballPlayerLite,
    Lineup,
    MatchEventRecord,
    Personality,
} from './types';
import * as lines from './commentary';

// ---------- RNG ----------

export function createRng(seed: number): () => number {
    let s = seed | 0;
    return function () {
        s |= 0;
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function weightedPick<T>(rng: () => number, items: { item: T; weight: number }[]): T {
    const total = items.reduce((s, i) => s + i.weight, 0);
    let r = rng() * total;
    for (const i of items) {
        if (r < i.weight) return i.item;
        r -= i.weight;
    }
    return items[items.length - 1].item;
}

// ---------- Form ----------

const FORM_ROLL_AVERAGES: Record<Personality, number> = {
    FOCUSED: 3,
    INCONSISTENT: 1,
    RASH: 2,
    OVERCONFIDENT: 2,
    CLUTCH: 2,
    LEADER: 2,
};

/** One-time per-match form roll (0-100) for a player, shaped by personality. */
export function rollForm(rng: () => number, personality: Personality): number {
    const n = FORM_ROLL_AVERAGES[personality];
    let sum = 0;
    for (let i = 0; i < n; i++) sum += rng() * 100;
    return sum / n;
}

export function formMultiplier(roll: number): number {
    return 0.85 + (roll / 100) * 0.3;
}

export function formBand(roll: number): 'poor' | 'normal' | 'on fire' {
    if (roll < 33) return 'poor';
    if (roll < 66) return 'normal';
    return 'on fire';
}

function staminaMultiplier(stamina: number): number {
    if (stamina >= 50) return 1;
    return 0.85 + (Math.max(stamina, 0) / 50) * 0.15;
}

// ---------- Match state ----------

export type TeamMatchState = {
    roster: Map<string, FootballPlayerLite>; // full squad (starters + bench), by id
    lineup: Lineup;
    stamina: Record<string, number>;
    formRoll: Record<string, number>;
    yellowCards: Record<string, number>;
    sentOff: Set<string>;
    homeAdvantage: boolean;
};

export function initTeamState(
    roster: FootballPlayerLite[],
    lineup: Lineup,
    rng: () => number,
    homeAdvantage: boolean,
): TeamMatchState {
    const rosterMap = new Map(roster.map((p) => [p.id, p]));
    const startingIds = [lineup.GK, ...lineup.DEF, ...lineup.MID, ...lineup.FWD];
    const hasLeader = startingIds.some((id) => rosterMap.get(id)?.personality === 'LEADER');

    const formRoll: Record<string, number> = {};
    const stamina: Record<string, number> = {};
    for (const id of startingIds) {
        const player = rosterMap.get(id);
        if (!player) continue;
        let roll = rollForm(rng, player.personality);
        if (hasLeader && player.personality !== 'LEADER') roll = Math.min(100, roll + 3);
        formRoll[id] = roll;
        stamina[id] = 100;
    }

    return {
        roster: rosterMap,
        lineup,
        stamina,
        formRoll,
        yellowCards: {},
        sentOff: new Set(),
        homeAdvantage,
    };
}

function activeStarters(state: TeamMatchState): string[] {
    return [state.lineup.GK, ...state.lineup.DEF, ...state.lineup.MID, ...state.lineup.FWD].filter(
        (id) => !state.sentOff.has(id),
    );
}

function attributeScore(
    state: TeamMatchState,
    playerId: string,
    attr: AttributeKey,
    minute: number,
    scoreDiff: number,
): number {
    const player = state.roster.get(playerId);
    if (!player) return 1;
    let roll = state.formRoll[playerId] ?? 50;
    if (player.personality === 'CLUTCH' && (minute >= 80 || Math.abs(scoreDiff) <= 1)) {
        roll = Math.min(100, roll + 10);
    }
    let mult = formMultiplier(roll) * staminaMultiplier(state.stamina[playerId] ?? 100);
    if (player.personality === 'OVERCONFIDENT') {
        const band = formBand(roll);
        if (band === 'on fire') mult *= 1.08;
        else if (band === 'poor') mult *= 0.92;
    }
    if (state.homeAdvantage) mult *= 1.05;
    return Math.max(1, player[attr] * mult);
}

/** Passive drain applied to every starter each phase, regardless of involvement — general
 *  running and positioning. Players actually involved in a phase's action lose extra stamina
 *  on top of this via applyActionDrain. */
function depleteStamina(state: TeamMatchState, rng: () => number) {
    for (const id of activeStarters(state)) {
        const player = state.roster.get(id);
        const isGk = player?.position === 'GK';
        const drain = isGk ? rng() * 0.5 : rng() * 1.5 + 0.5;
        state.stamina[id] = Math.max(0, (state.stamina[id] ?? 100) - drain);
    }
}

/** Extra stamina cost for a player directly involved in a phase's action (sprinting,
 *  tackling, diving) — on top of the passive per-phase drain everyone gets. */
function applyActionDrain(state: TeamMatchState, playerId: string, amount: number) {
    state.stamina[playerId] = Math.max(0, (state.stamina[playerId] ?? 100) - amount);
}

function cardCheck(
    rng: () => number,
    state: TeamMatchState,
    defenderId: string,
    attackerName: string,
    minute: number,
    half: 1 | 2,
    sequence: number,
): MatchEventRecord | null {
    const defender = state.roster.get(defenderId);
    if (!defender) return null;
    const isRash = defender.personality === 'RASH';
    const yellowChance = 0.06 * (isRash ? 2 : 1);
    const redChance = 0.007 * (isRash ? 2 : 1);

    const roll = rng();
    if (roll < redChance) {
        state.sentOff.add(defenderId);
        return {
            sequence,
            minute,
            half,
            type: 'CARD_RED',
            description: lines.redCardLine(rng, defender.name, attackerName),
            playerId: defenderId,
            team: null,
            positionData: null,
        };
    }
    if (roll < redChance + yellowChance) {
        state.yellowCards[defenderId] = (state.yellowCards[defenderId] ?? 0) + 1;
        if (state.yellowCards[defenderId] >= 2) {
            state.sentOff.add(defenderId);
            return {
                sequence,
                minute,
                half,
                type: 'CARD_RED',
                description: `Second yellow! ${defender.name} is sent off after another foul on ${attackerName}.`,
                playerId: defenderId,
                team: null,
                positionData: null,
            };
        }
        return {
            sequence,
            minute,
            half,
            type: 'CARD_YELLOW',
            description: lines.yellowCardLine(rng, defender.name, attackerName),
            playerId: defenderId,
            team: null,
            positionData: null,
        };
    }
    return null;
}

const PHASES_PER_HALF = 15;

export type HalfResult = {
    events: MatchEventRecord[];
    homeGoals: number;
    awayGoals: number;
};

export function simulateHalf(
    home: TeamMatchState,
    away: TeamMatchState,
    half: 1 | 2,
    homeScoreBefore: number,
    awayScoreBefore: number,
    startSequence: number,
    rng: () => number,
): HalfResult {
    const events: MatchEventRecord[] = [];
    let sequence = startSequence;
    let homeGoals = 0;
    let awayGoals = 0;
    const startMinute = half === 1 ? 0 : 45;

    for (let phase = 0; phase < PHASES_PER_HALF; phase++) {
        const minute = startMinute + Math.floor(phase * 3 + rng() * 2);
        const scoreDiff = homeScoreBefore + homeGoals - (awayScoreBefore + awayGoals);

        depleteStamina(home, rng);
        depleteStamina(away, rng);

        const homeMid = midfieldStrength(home, minute, scoreDiff);
        const awayMid = midfieldStrength(away, minute, -scoreDiff);
        const homeAttacking = rng() < homeMid / (homeMid + awayMid);

        const attackers = homeAttacking ? home : away;
        const defenders = homeAttacking ? away : home;
        const attackingTeam: 'HOME' | 'AWAY' = homeAttacking ? 'HOME' : 'AWAY';
        const teamName = homeAttacking ? 'The home side' : 'The away side';

        if (rng() < 0.45 || activeStarters(attackers).length === 0) {
            events.push({
                sequence: sequence++,
                minute,
                half,
                type: 'BUILDUP',
                description: lines.buildupLine(rng, teamName),
                playerId: null,
                team: attackingTeam,
                positionData: { x: 50, y: 30 + rng() * 40 },
            });
            continue;
        }

        const result = resolveAttack(
            rng,
            attackers,
            defenders,
            attackingTeam,
            minute,
            half,
            scoreDiff,
            sequence,
        );
        events.push(...result.events);
        sequence += result.events.length;
        if (result.goal) {
            if (homeAttacking) homeGoals++;
            else awayGoals++;
        }
    }

    const finalHome = homeScoreBefore + homeGoals;
    const finalAway = awayScoreBefore + awayGoals;
    if (half === 1) {
        events.push({
            sequence: sequence++,
            minute: 45,
            half: 1,
            type: 'HALFTIME',
            description: lines.halftimeLine(finalHome, finalAway),
            playerId: null,
            team: null,
            positionData: null,
        });
    } else {
        events.push({
            sequence: sequence++,
            minute: 90,
            half: 2,
            type: 'FULLTIME',
            description: lines.fulltimeLine(finalHome, finalAway),
            playerId: null,
            team: null,
            positionData: null,
        });
    }

    return { events, homeGoals, awayGoals };
}

function midfieldStrength(state: TeamMatchState, minute: number, scoreDiff: number): number {
    const mids = state.lineup.MID.filter((id) => !state.sentOff.has(id));
    if (mids.length === 0) return 10;
    const total = mids.reduce((sum, id) => {
        const c = attributeScore(state, id, 'control', minute, scoreDiff);
        const p = attributeScore(state, id, 'passing', minute, scoreDiff);
        const v = attributeScore(state, id, 'vision', minute, scoreDiff);
        return sum + (c + p + v) / 3;
    }, 0);
    return total / mids.length;
}

function clamp(n: number, lo: number, hi: number) {
    return Math.min(hi, Math.max(lo, n));
}

/** Midfield creativity feeding the attack — a modest boost to the striker's run,
 *  representing good service, without needing MID players to carry the ball themselves. */
function midfieldServiceBonus(state: TeamMatchState, minute: number, scoreDiff: number): number {
    const mids = state.lineup.MID.filter((id) => !state.sentOff.has(id));
    if (mids.length === 0) return 0;
    const avgVision = mids.reduce((sum, id) => sum + attributeScore(state, id, 'vision', minute, scoreDiff), 0) / mids.length;
    return avgVision * 0.35;
}

function resolveAttack(
    rng: () => number,
    attackers: TeamMatchState,
    defenders: TeamMatchState,
    attackingTeam: 'HOME' | 'AWAY',
    minute: number,
    half: 1 | 2,
    scoreDiff: number,
    startSequence: number,
): { events: MatchEventRecord[]; goal: boolean } {
    const events: MatchEventRecord[] = [];
    let sequence = startSequence;

    // Only FWDs carry the ball through this sequence — they're the only position with
    // timing/trickery/finishing. MID influence comes in as a service bonus below instead
    // of MID players personally dribbling (their own attributes are 0 for those fields).
    const attackerPool = poolByPosition(attackers, ['FWD'], [100]);
    const defenderPool = poolByPosition(defenders, ['DEF'], [100]);
    if (attackerPool.length === 0 || defenderPool.length === 0) return { events, goal: false };

    const attackerId = weightedPick(rng, attackerPool);
    const defenderId = weightedPick(rng, defenderPool);
    const attacker = attackers.roster.get(attackerId)!;
    const defender = defenders.roster.get(defenderId)!;
    const midService = midfieldServiceBonus(attackers, minute, scoreDiff);

    // The attacker and their marker are directly engaged in this phase's action — they tire
    // faster than teammates who weren't involved this time.
    applyActionDrain(attackers, attackerId, rng() * 2 + 1);
    applyActionDrain(defenders, defenderId, rng() * 1.5 + 1);

    // 1. Run / timing
    const runScore = attributeScore(attackers, attackerId, 'timing', minute, scoreDiff) + midService;
    const coverScore = attributeScore(defenders, defenderId, 'positioning', minute, scoreDiff);
    const runChance = clamp(runScore / (runScore + coverScore), 0.15, 0.85);
    if (rng() >= runChance) {
        events.push({
            sequence: sequence++,
            minute,
            half,
            type: 'RUN_FAIL',
            description: lines.runFailLine(rng, attacker.name, defender.name),
            playerId: attackerId,
            team: attackingTeam,
            positionData: { x: pitchX(attackingTeam, 60), y: 20 + rng() * 60 },
        });
        return { events, goal: false };
    }
    events.push({
        sequence: sequence++,
        minute,
        half,
        type: 'RUN_SUCCESS',
        description: lines.runSuccessLine(rng, attacker.name),
        playerId: attackerId,
        team: attackingTeam,
        positionData: { x: pitchX(attackingTeam, 65), y: 20 + rng() * 60 },
    });

    // 1b. Offside — did the attacker time that run onside? Sharper defensive positioning
    // relative to the attacker's own timing raises the risk of being caught out.
    const offsideChance = clamp(0.12 * (coverScore / runScore), 0.03, 0.22);
    if (rng() < offsideChance) {
        events.push({
            sequence: sequence++,
            minute,
            half,
            type: 'OFFSIDE',
            description: lines.offsideLine(rng, attacker.name),
            playerId: attackerId,
            team: attackingTeam,
            positionData: { x: pitchX(attackingTeam, 68), y: 20 + rng() * 60 },
        });
        return { events, goal: false };
    }

    // 2. Dribble / trickery vs tackling
    const trickScore = attributeScore(attackers, attackerId, 'trickery', minute, scoreDiff);
    const tackleScore = attributeScore(defenders, defenderId, 'tackling', minute, scoreDiff);
    const dribbleChance = clamp(trickScore / (trickScore + tackleScore), 0.2, 0.8);
    if (rng() >= dribbleChance) {
        events.push({
            sequence: sequence++,
            minute,
            half,
            type: 'DRIBBLE_FAIL',
            description: lines.dribbleFailLine(rng, attacker.name, defender.name),
            playerId: attackerId,
            team: attackingTeam,
            positionData: { x: pitchX(attackingTeam, 75), y: 20 + rng() * 60 },
        });
        const card = cardCheck(rng, defenders, defenderId, attacker.name, minute, half, sequence);
        if (card) {
            events.push(card);
            sequence++;
        }
        return { events, goal: false };
    }
    events.push({
        sequence: sequence++,
        minute,
        half,
        type: 'DRIBBLE_SUCCESS',
        description: lines.dribbleSuccessLine(rng, attacker.name, defender.name),
        playerId: attackerId,
        team: attackingTeam,
        positionData: { x: pitchX(attackingTeam, 80), y: 20 + rng() * 60 },
    });

    // 3. Block chance from a covering defender
    const blockerPool = poolByPosition(defenders, ['DEF'], [100]);
    if (blockerPool.length > 0 && rng() < 0.18) {
        const blockerId = weightedPick(rng, blockerPool);
        const blocker = defenders.roster.get(blockerId)!;
        applyActionDrain(defenders, blockerId, rng() * 1 + 0.5);
        events.push({
            sequence: sequence++,
            minute,
            half,
            type: 'SHOT_BLOCKED',
            description: lines.blockedLine(rng, blocker.name, attacker.name),
            playerId: blockerId,
            team: attackingTeam === 'HOME' ? 'AWAY' : 'HOME',
            positionData: { x: pitchX(attackingTeam, 88), y: 20 + rng() * 60 },
        });
        return { events, goal: false };
    }

    // 4. Off target flat chance
    if (rng() < 0.15) {
        events.push({
            sequence: sequence++,
            minute,
            half,
            type: 'SHOT_OFF',
            description: lines.offTargetLine(rng, attacker.name),
            playerId: attackerId,
            team: attackingTeam,
            positionData: { x: pitchX(attackingTeam, 90), y: 20 + rng() * 60 },
        });
        return { events, goal: false };
    }

    // 5. Finishing vs GK reflexes
    const gkId = defenders.lineup.GK;
    const gk = defenders.roster.get(gkId);
    const finishScore = attributeScore(attackers, attackerId, 'finishing', minute, scoreDiff);
    const gkScore = gk ? attributeScore(defenders, gkId, 'reflexes', minute, scoreDiff) : 8;
    const goalChance = clamp(finishScore / (finishScore + gkScore), 0.2, 0.85);
    if (gk) applyActionDrain(defenders, gkId, rng() * 1.5 + 0.5);
    if (rng() < goalChance) {
        events.push({
            sequence: sequence++,
            minute,
            half,
            type: 'SHOT_GOAL',
            description: lines.goalLine(rng, attacker.name),
            playerId: attackerId,
            team: attackingTeam,
            positionData: { x: pitchX(attackingTeam, 95), y: 50 },
        });
        return { events, goal: true };
    }
    events.push({
        sequence: sequence++,
        minute,
        half,
        type: 'SHOT_SAVED',
        description: gk ? lines.savedLine(rng, gk.name, attacker.name) : `${attacker.name}'s shot is saved!`,
        playerId: gkId ?? null,
        team: attackingTeam === 'HOME' ? 'AWAY' : 'HOME',
        positionData: { x: pitchX(attackingTeam, 92), y: 50 },
    });
    return { events, goal: false };
}

function pitchX(attackingTeam: 'HOME' | 'AWAY', progress: number): number {
    // home attacks toward x=100 (right), away attacks toward x=0 (left)
    return attackingTeam === 'HOME' ? progress : 100 - progress;
}

function poolByPosition(
    state: TeamMatchState,
    positions: ('GK' | 'DEF' | 'MID' | 'FWD')[],
    weights: number[],
): { item: string; weight: number }[] {
    const groups: Record<string, string[]> = {
        GK: [state.lineup.GK].filter((id) => !state.sentOff.has(id)),
        DEF: state.lineup.DEF.filter((id) => !state.sentOff.has(id)),
        MID: state.lineup.MID.filter((id) => !state.sentOff.has(id)),
        FWD: state.lineup.FWD.filter((id) => !state.sentOff.has(id)),
    };
    const pool: { item: string; weight: number }[] = [];
    positions.forEach((pos, i) => {
        const ids = groups[pos] ?? [];
        if (ids.length === 0) return;
        const perPlayerWeight = weights[i] / ids.length;
        for (const id of ids) pool.push({ item: id, weight: perPlayerWeight });
    });
    return pool;
}

/** Simple heuristic halftime response for AI teams: sub the most tired starter for a same-position bench player, if one exists. */
export function aiHalftimeLineup(state: TeamMatchState): Lineup {
    const lineup: Lineup = {
        formation: state.lineup.formation,
        GK: state.lineup.GK,
        DEF: [...state.lineup.DEF],
        MID: [...state.lineup.MID],
        FWD: [...state.lineup.FWD],
        bench: [...state.lineup.bench],
    };
    const starters = [...lineup.DEF, ...lineup.MID, ...lineup.FWD];
    let mostTiredId: string | null = null;
    let lowestStamina = 101;
    for (const id of starters) {
        const s = state.stamina[id] ?? 100;
        if (s < lowestStamina) {
            lowestStamina = s;
            mostTiredId = id;
        }
    }
    if (!mostTiredId || lowestStamina >= 40) return lineup;
    const tiredPlayer = state.roster.get(mostTiredId);
    if (!tiredPlayer) return lineup;
    const replacementId = lineup.bench.find((id) => state.roster.get(id)?.position === tiredPlayer.position);
    if (!replacementId) return lineup;

    for (const key of ['DEF', 'MID', 'FWD'] as const) {
        const idx = lineup[key].indexOf(mostTiredId);
        if (idx !== -1) {
            lineup[key][idx] = replacementId;
            break;
        }
    }
    lineup.bench = lineup.bench.map((id) => (id === replacementId ? mostTiredId! : id));
    return lineup;
}
