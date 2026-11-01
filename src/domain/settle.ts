/**
 * "Settle up": when several relatives pay for a wedding, split the total equally between them
 * and work out the smallest set of transfers that makes everyone even. Pure, integer paise only.
 */
export interface Transfer {
  from: string;
  to: string;
  amountPaise: number;
}

export interface SettleResult {
  totalPaise: number;
  sharePaise: number;
  /** positive = paid more than their share (is owed), negative = paid less (owes). */
  balances: Array<{ name: string; paidPaise: number; balancePaise: number }>;
  transfers: Transfer[];
}

export function settleUp(paidByPayerPaise: Record<string, number>): SettleResult {
  const names = Object.keys(paidByPayerPaise).filter((n) => paidByPayerPaise[n] > 0);
  const totalPaise = names.reduce((sum, n) => sum + paidByPayerPaise[n], 0);
  if (names.length === 0) return { totalPaise: 0, sharePaise: 0, balances: [], transfers: [] };

  const sharePaise = Math.floor(totalPaise / names.length);
  // Hand the few leftover paise to the biggest payers so balances always add up to exactly zero.
  let remainder = totalPaise - sharePaise * names.length;
  const ordered = [...names].sort((a, b) => paidByPayerPaise[b] - paidByPayerPaise[a] || a.localeCompare(b));
  const shareOf: Record<string, number> = {};
  for (const n of ordered) {
    shareOf[n] = sharePaise + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
  }

  const balances = ordered.map((name) => ({
    name,
    paidPaise: paidByPayerPaise[name],
    balancePaise: paidByPayerPaise[name] - shareOf[name],
  }));

  const creditors = balances.filter((b) => b.balancePaise > 0).map((b) => ({ name: b.name, left: b.balancePaise }));
  const debtors = balances.filter((b) => b.balancePaise < 0).map((b) => ({ name: b.name, left: -b.balancePaise }));
  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].left, creditors[j].left);
    if (amount > 0) transfers.push({ from: debtors[i].name, to: creditors[j].name, amountPaise: amount });
    debtors[i].left -= amount;
    creditors[j].left -= amount;
    if (debtors[i].left === 0) i++;
    if (creditors[j].left === 0) j++;
  }
  return { totalPaise, sharePaise, balances, transfers };
}
