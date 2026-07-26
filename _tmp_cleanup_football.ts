import { PrismaClient } from './generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const before = {
    teams: await prisma.footballTeam.count({ where: { is_ai: false } }),
    aiTeams: await prisma.footballTeam.count({ where: { is_ai: true } }),
    matches: await prisma.footballMatch.count(),
    events: await prisma.footballMatchEvent.count(),
    players: await prisma.footballPlayer.count(),
    freeAgents: await prisma.footballPlayer.count({ where: { team_id: null } }),
};
console.log('before:', before);

// Deleting human-owned teams cascades to their players and any matches/events referencing them.
await prisma.footballTeam.deleteMany({ where: { is_ai: false } });
// Clean up any leftover unsigned free agents too (not tied to any team, so not cascaded above).
await prisma.footballPlayer.deleteMany({ where: { team_id: null } });

const after = {
    teams: await prisma.footballTeam.count({ where: { is_ai: false } }),
    aiTeams: await prisma.footballTeam.count({ where: { is_ai: true } }),
    matches: await prisma.footballMatch.count(),
    events: await prisma.footballMatchEvent.count(),
    players: await prisma.footballPlayer.count(),
    freeAgents: await prisma.footballPlayer.count({ where: { team_id: null } }),
};
console.log('after:', after);

await prisma.$disconnect();
