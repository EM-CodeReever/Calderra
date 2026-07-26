import { PrismaClient } from '../generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type Tier = { name: string; min: number; max: number; formation: string };

const TIERS: Tier[] = [
    { name: 'Sunday League FC', min: 5, max: 9, formation: '2-2-2' },
    { name: 'Riverside Athletic', min: 8, max: 13, formation: '2-2-2' },
    { name: 'Ironclad United', min: 11, max: 16, formation: '3-2-1' },
];

const FIRST_NAMES = ['Marco', 'Jules', 'Theo', 'Kian', 'Noah', 'Rafi', 'Dexter', 'Milo', 'Ezra', 'Finn', 'Otis', 'Reggie', 'Wes', 'Sami', 'Cal', 'Bram', 'Toby', 'Reo', 'Nico', 'Enzo'];
const LAST_NAMES = ['Voss', 'Okafor', 'Bianchi', 'Kessler', 'Marsh', 'Delacroix', 'Whitfield', 'Rourke', 'Salvi', 'Brandt', 'Costa', 'Hartley', 'Pemberton', 'Iyer', 'Novak', 'Sato', 'Reyes', 'Lund', 'Adeyemi', 'Beaumont'];

const PERSONALITIES = ['FOCUSED', 'INCONSISTENT', 'RASH', 'OVERCONFIDENT', 'CLUTCH', 'LEADER'];

function rand(seed: { v: number }) {
    seed.v |= 0;
    seed.v = (seed.v + 0x6d2b79f5) | 0;
    let t = Math.imul(seed.v ^ (seed.v >>> 15), 1 | seed.v);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function randInt(seed: { v: number }, min: number, max: number) {
    return Math.floor(min + rand(seed) * (max - min + 1));
}

function pick<T>(seed: { v: number }, arr: T[]): T {
    return arr[randInt(seed, 0, arr.length - 1)];
}

const ATTRS_BY_POS: Record<string, string[]> = {
    FWD: ['finishing', 'trickery', 'timing'],
    MID: ['control', 'passing', 'vision'],
    DEF: ['tackling', 'disruption', 'positioning'],
    GK: ['reflexes', 'handling', 'distribution'],
};

async function main() {
    for (const [tierIdx, tier] of TIERS.entries()) {
        const seed = { v: 1000 + tierIdx * 777 };
        const composition = [
            { position: 'GK', count: 1 },
            { position: 'DEF', count: 3 },
            { position: 'MID', count: 3 },
            { position: 'FWD', count: 3 },
        ];

        const playersData: any[] = [];
        for (const group of composition) {
            for (let i = 0; i < group.count; i++) {
                const name = `${pick(seed, FIRST_NAMES)} ${pick(seed, LAST_NAMES)}`;
                const attrs: Record<string, number> = {
                    finishing: 0, trickery: 0, timing: 0,
                    control: 0, passing: 0, vision: 0,
                    tackling: 0, disruption: 0, positioning: 0,
                    reflexes: 0, handling: 0, distribution: 0,
                };
                for (const key of ATTRS_BY_POS[group.position]) {
                    attrs[key] = randInt(seed, tier.min, tier.max);
                }
                playersData.push({
                    name,
                    position: group.position,
                    personality: pick(seed, PERSONALITIES),
                    level: 1,
                    xp: 0,
                    ...attrs,
                });
            }
        }

        const existing = await prisma.footballTeam.findFirst({ where: { name: tier.name, is_ai: true } });
        if (existing) {
            console.log(`Skipping ${tier.name}, already seeded (team id ${existing.id})`);
            continue;
        }

        const team = await prisma.footballTeam.create({
            data: {
                name: tier.name,
                is_ai: true,
                default_formation: tier.formation,
                players: { create: playersData },
            },
            include: { players: true },
        });

        const byPos = (pos: string) => team.players.filter((p) => p.position === pos).map((p) => p.id.toString());
        const def = byPos('DEF');
        const mid = byPos('MID');
        const fwd = byPos('FWD');
        const [dCount, mCount, fCount] = tier.formation.split('-').map(Number);
        const lineup = {
            formation: tier.formation,
            GK: byPos('GK')[0],
            DEF: def.slice(0, dCount),
            MID: mid.slice(0, mCount),
            FWD: fwd.slice(0, fCount),
            bench: [...def.slice(dCount), ...mid.slice(mCount), ...fwd.slice(fCount)],
        };
        await prisma.footballTeam.update({ where: { id: team.id }, data: { default_lineup: lineup } });

        console.log(`Seeded ${tier.name} (team id ${team.id}) with ${team.players.length} players`);
    }
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
