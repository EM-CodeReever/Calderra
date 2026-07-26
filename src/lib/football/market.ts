import { attributeTotal } from './lineup';
import type { FootballPlayerLite } from './types';

/** A rough "what a listing like this typically goes for" estimate, driven by attribute
 *  total and level. Shown as a suggested price when listing a player for sale. */
export function estimateMarketValue(p: FootballPlayerLite): number {
    const total = attributeTotal(p);
    const levelBonus = (p.level - 1) * 15;
    return Math.max(20, Math.round(total * 5 + levelBonus));
}

/** Guaranteed, instant payout for a quick sell — well below the market estimate, trading
 *  value for not having to wait around for a buyer. */
export function quickSellValue(p: FootballPlayerLite): number {
    return Math.max(10, Math.round(estimateMarketValue(p) * 0.5));
}
