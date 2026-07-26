import { ATTRIBUTES_BY_POSITION, PERSONALITIES, type Position, type Personality, type PlayerAttributes } from './types';

const FIRST_NAMES = ['Marco', 'Jules', 'Theo', 'Kian', 'Noah', 'Rafi', 'Dexter', 'Milo', 'Ezra', 'Finn', 'Otis', 'Reggie', 'Wes', 'Sami', 'Cal', 'Bram', 'Toby', 'Reo', 'Nico', 'Enzo', 'Arlo', 'Idris', 'Lior', 'Zane'];
const LAST_NAMES = ['Voss', 'Okafor', 'Bianchi', 'Kessler', 'Marsh', 'Delacroix', 'Whitfield', 'Rourke', 'Salvi', 'Brandt', 'Costa', 'Hartley', 'Pemberton', 'Iyer', 'Novak', 'Sato', 'Reyes', 'Lund', 'Adeyemi', 'Beaumont', 'Fontaine', 'Osei'];

function emptyAttributes(): PlayerAttributes {
    return {
        finishing: 0, trickery: 0, timing: 0,
        control: 0, passing: 0, vision: 0,
        tackling: 0, disruption: 0, positioning: 0,
        reflexes: 0, handling: 0, distribution: 0,
    };
}

export type GeneratedPlayer = {
    name: string;
    position: Position;
    personality: Personality;
    level: 1;
    xp: 0;
    unspent_points: 0;
} & PlayerAttributes;

/** Baseline "walk-on" teammates to fill out a new manager's squad, roughly between the two weaker AI tiers. */
export function generateFillerPlayer(position: Position, rng: () => number = Math.random): GeneratedPlayer {
    const name = `${FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)]}`;
    const attrs = emptyAttributes();
    for (const key of ATTRIBUTES_BY_POSITION[position]) {
        attrs[key] = Math.floor(6 + rng() * 5); // 6-10
    }
    const personality = PERSONALITIES[Math.floor(rng() * PERSONALITIES.length)];
    return { name, position, personality, level: 1, xp: 0, unspent_points: 0, ...attrs };
}

/** Fills out the rest of a 15-player squad (2 GK, 5 DEF, 4 MID, 4 FWD total) around one
 *  already-chosen position (the manager's custom star player). */
export function generateSquadFillers(starPosition: Position, rng: () => number = Math.random): GeneratedPlayer[] {
    const need: Record<Position, number> = { GK: 2, DEF: 5, MID: 4, FWD: 4 };
    need[starPosition] -= 1;
    const players: GeneratedPlayer[] = [];
    for (const pos of ['GK', 'DEF', 'MID', 'FWD'] as Position[]) {
        for (let i = 0; i < need[pos]; i++) {
            players.push(generateFillerPlayer(pos, rng));
        }
    }
    return players;
}
