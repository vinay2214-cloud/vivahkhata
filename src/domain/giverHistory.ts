import type { Gift } from '../types';
import { generateNameKey } from '../lib/names';

export interface GiverSummary {
  nameKey: string;
  giverName: string;
  town?: string;
  count: number;
  totalCashPaise: number;
  totalGoldMg: number;
}

/** Groups gifts by giver so repeat givers (engagement + wedding) show one combined total. */
export function summariseGivers(gifts: Gift[]): GiverSummary[] {
  const byKey = new Map<string, GiverSummary>();
  for (const g of gifts) {
    if (g.deleted) continue;
    const key = g.nameKey || generateNameKey(g.giverName);
    const row = byKey.get(key) ?? {
      nameKey: key,
      giverName: g.giverName,
      town: g.town,
      count: 0,
      totalCashPaise: 0,
      totalGoldMg: 0,
    };
    row.count += 1;
    row.totalCashPaise += g.cashPaise || 0;
    row.totalGoldMg += g.goldMg || 0;
    byKey.set(key, row);
  }
  return [...byKey.values()].sort((a, b) => b.totalCashPaise - a.totalCashPaise);
}

/** Givers who gave more than once. */
export const repeatGivers = (gifts: Gift[]): GiverSummary[] =>
  summariseGivers(gifts).filter((g) => g.count > 1);
