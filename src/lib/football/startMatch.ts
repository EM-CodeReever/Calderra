import { prisma } from '$lib';
import { createRng, initTeamState, simulateHalf, aiHalftimeLineup } from './matchEngine';
import { toLite } from './lineup';
import type { Lineup } from './types';

/** Simulates kickoff + first half and creates the match row. Shared by AI-opponent kickoff
 *  and accepted PvP challenges. AI sides get their halftime response pre-filled immediately;
 *  human sides leave it null until they submit it themselves on the match page. */
export async function kickoffMatch(homeTeamId: bigint, awayTeamId: bigint): Promise<bigint> {
    const homeTeam = await prisma.footballTeam.findFirst({ where: { id: homeTeamId }, include: { players: true } });
    const awayTeam = await prisma.footballTeam.findFirst({ where: { id: awayTeamId }, include: { players: true } });
    if (!homeTeam || !homeTeam.default_lineup) throw new Error('Home team has no lineup set.');
    if (!awayTeam || !awayTeam.default_lineup) throw new Error('Away team has no lineup set.');

    const homeRoster = homeTeam.players.map(toLite);
    const awayRoster = awayTeam.players.map(toLite);
    const homeLineup = homeTeam.default_lineup as unknown as Lineup;
    const awayLineup = awayTeam.default_lineup as unknown as Lineup;

    const seed = Number(BigInt.asIntN(32, BigInt(Date.now())));
    const rng = createRng(seed);
    const homeState = initTeamState(homeRoster, homeLineup, rng, true);
    const awayState = initTeamState(awayRoster, awayLineup, rng, false);

    const half1 = simulateHalf(homeState, awayState, 1, 0, 0, 1, rng);

    const homeHalftimeLineup = homeTeam.is_ai ? aiHalftimeLineup(homeState) : null;
    const awayHalftimeLineup = awayTeam.is_ai ? aiHalftimeLineup(awayState) : null;

    const match = await prisma.footballMatch.create({
        data: {
            home_team_id: homeTeam.id,
            away_team_id: awayTeam.id,
            status: 'AWAITING_HALFTIME',
            home_score: half1.homeGoals,
            away_score: half1.awayGoals,
            home_lineup: homeLineup as any,
            away_lineup: awayLineup as any,
            home_halftime_lineup: homeHalftimeLineup as any,
            away_halftime_lineup: awayHalftimeLineup as any,
            events: {
                create: half1.events.map((e) => ({
                    sequence: e.sequence,
                    minute: e.minute,
                    half: e.half,
                    type: e.type,
                    description: e.description,
                    player_id: e.playerId ? BigInt(e.playerId) : null,
                    position_data: e.positionData as any,
                })),
            },
        },
    });

    return match.id;
}
