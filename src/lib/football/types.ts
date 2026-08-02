export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export type Personality =
    | 'FOCUSED'
    | 'INCONSISTENT'
    | 'RASH'
    | 'OVERCONFIDENT'
    | 'CLUTCH'
    | 'LEADER';

export type AttributeKey =
    | 'finishing' | 'trickery' | 'timing'
    | 'control' | 'passing' | 'vision'
    | 'tackling' | 'disruption' | 'positioning'
    | 'reflexes' | 'handling' | 'distribution';

export const ATTRIBUTES_BY_POSITION: Record<Position, [AttributeKey, AttributeKey, AttributeKey]> = {
    FWD: ['finishing', 'trickery', 'timing'],
    MID: ['control', 'passing', 'vision'],
    DEF: ['tackling', 'disruption', 'positioning'],
    GK: ['reflexes', 'handling', 'distribution'],
};

export const POSITIONS: Position[] = ['GK', 'DEF', 'MID', 'FWD'];
export const PERSONALITIES: Personality[] = ['FOCUSED', 'INCONSISTENT', 'RASH', 'OVERCONFIDENT', 'CLUTCH', 'LEADER'];

export const ATTRIBUTE_MIN = 1;
export const ATTRIBUTE_MAX = 20;
export const ATTRIBUTE_BASE = 5; // every new player starts with this in each of their 3 attributes
export const CREATION_BONUS_POOL = 20; // extra points to distribute at creation
export const CREATION_MAX_PER_ATTRIBUTE = 15; // cap at creation, room left to grow via XP up to ATTRIBUTE_MAX

// Formation is expressed as outfield players in DEF-MID-FWD order (always sums to 6, GK is implicit).
export const FORMATIONS = ['3-2-1', '2-2-2', '2-1-3', '1-2-3', '2-3-1', '1-3-2', '3-1-2'] as const;
export type Formation = (typeof FORMATIONS)[number];

export type PlayerAttributes = Record<AttributeKey, number>;

export type FootballPlayerLite = {
    id: string;
    name: string;
    position: Position;
    personality: Personality;
    level: number;
    xp: number;
    unspent_points: number;
} & PlayerAttributes;

// { GK: id, DEF: [id...], MID: [id...], FWD: [id...], bench: [id...] }
export type Lineup = {
    formation: Formation;
    GK: string;
    DEF: string[];
    MID: string[];
    FWD: string[];
    bench: string[];
};

export type MatchStatus = 'FIRST_HALF_PENDING' | 'AWAITING_HALFTIME' | 'COMPLETED';

export type MatchEventType =
    | 'KICKOFF' | 'BUILDUP' | 'RUN_SUCCESS' | 'RUN_FAIL'
    | 'DRIBBLE_SUCCESS' | 'DRIBBLE_FAIL' | 'SHOT_GOAL' | 'SHOT_SAVED'
    | 'SHOT_BLOCKED' | 'SHOT_OFF' | 'CARD_YELLOW' | 'CARD_RED' | 'OFFSIDE'
    | 'SUB' | 'HALFTIME' | 'FULLTIME';

export type PitchPoint = { x: number; y: number };

export type MatchEventRecord = {
    sequence: number;
    minute: number;
    half: 1 | 2;
    type: MatchEventType;
    description: string;
    playerId: string | null;
    team: 'HOME' | 'AWAY' | null;
    positionData: PitchPoint | null;
};
