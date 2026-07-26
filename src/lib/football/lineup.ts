import type { Formation, FootballPlayerLite, Lineup } from './types';

export function formationCounts(formation: Formation): { DEF: number; MID: number; FWD: number } {
    const [d, m, f] = formation.split('-').map(Number);
    return { DEF: d, MID: m, FWD: f };
}

/** Builds a default lineup for a squad: fills GK, then DEF/MID/FWD up to the formation's
 *  counts (preferring higher combined attribute total first), rest go to bench. */
export function buildDefaultLineup(players: FootballPlayerLite[], formation: Formation): Lineup {
    const counts = formationCounts(formation);
    const byPosition = (pos: string) =>
        players
            .filter((p) => p.position === pos)
            .sort((a, b) => attributeTotal(b) - attributeTotal(a));

    const gk = byPosition('GK');
    const def = byPosition('DEF');
    const mid = byPosition('MID');
    const fwd = byPosition('FWD');

    const startDef = def.slice(0, counts.DEF).map((p) => p.id);
    const startMid = mid.slice(0, counts.MID).map((p) => p.id);
    const startFwd = fwd.slice(0, counts.FWD).map((p) => p.id);
    const bench = [
        ...def.slice(counts.DEF),
        ...mid.slice(counts.MID),
        ...fwd.slice(counts.FWD),
        ...gk.slice(1),
    ].map((p) => p.id);

    return {
        formation,
        GK: gk[0]?.id ?? '',
        DEF: startDef,
        MID: startMid,
        FWD: startFwd,
        bench,
    };
}

function attributeTotal(p: FootballPlayerLite): number {
    return (
        p.finishing + p.trickery + p.timing +
        p.control + p.passing + p.vision +
        p.tackling + p.disruption + p.positioning +
        p.reflexes + p.handling + p.distribution
    );
}

export type PitchSlot = { id: string; name: string; x: number; y: number; team: 'HOME' | 'AWAY' };

/** Base formation positions for rendering — home attacks toward x=100, away toward x=0. */
export function computeSlots(lineup: Lineup, players: FootballPlayerLite[], team: 'HOME' | 'AWAY'): PitchSlot[] {
    const byId = new Map(players.map((p) => [p.id, p]));
    const spread = (ids: string[], baseX: number) => {
        const n = ids.length;
        return ids.map((id, i) => {
            const y = n === 1 ? 50 : 15 + (70 * i) / (n - 1);
            const x = team === 'HOME' ? baseX : 100 - baseX;
            const player = byId.get(id);
            return { id, name: player?.name ?? '?', x, y, team };
        });
    };

    const gk = byId.get(lineup.GK);
    const gkSlot: PitchSlot[] = gk
        ? [{ id: gk.id, name: gk.name, x: team === 'HOME' ? 5 : 95, y: 50, team }]
        : [];

    return [
        ...gkSlot,
        ...spread(lineup.DEF, 22),
        ...spread(lineup.MID, 48),
        ...spread(lineup.FWD, 74),
    ];
}

export function toLite(p: any): FootballPlayerLite {
    return {
        id: p.id.toString(),
        name: p.name,
        position: p.position,
        personality: p.personality,
        level: p.level,
        xp: p.xp,
        unspent_points: p.unspent_points,
        finishing: p.finishing, trickery: p.trickery, timing: p.timing,
        control: p.control, passing: p.passing, vision: p.vision,
        tackling: p.tackling, disruption: p.disruption, positioning: p.positioning,
        reflexes: p.reflexes, handling: p.handling, distribution: p.distribution,
    };
}
