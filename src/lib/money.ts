/**
 * Currency and weights utility functions for Indian financial formats.
 * All internal money is stored as integer paise (1 Rupee = 100 paise).
 */

export function toPaise(rupees: number): number {
  if (isNaN(rupees)) return 0;
  return Math.round(rupees * 100);
}

export function fromPaise(paise: number | null | undefined): number {
  if (paise == null || isNaN(paise)) return 0;
  return Math.round(paise) / 100;
}

/**
 * Format integer paise into standard Indian currency string (e.g. ₹1,23,456)
 */
export function formatINR(paise: number | null | undefined): string {
  if (paise == null || isNaN(paise)) return '₹0';
  const rupees = Math.round(paise / 100);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Compact Indian currency formatting (e.g. ₹1.5L, ₹2.5Cr, ₹45K)
 */
export function compactINR(paise: number | null | undefined): string {
  if (paise == null || isNaN(paise)) return '₹0';
  const rupees = Math.round(paise / 100);
  const abs = Math.abs(rupees);
  const sign = rupees < 0 ? '-' : '';

  if (abs >= 10000000) {
    const cr = (abs / 10000000).toFixed(1).replace(/\.0$/, '');
    return `${sign}₹${cr}Cr`;
  }
  if (abs >= 100000) {
    const l = (abs / 100000).toFixed(1).replace(/\.0$/, '');
    return `${sign}₹${l}L`;
  }
  if (abs >= 1000) {
    const k = (abs / 1000).toFixed(1).replace(/\.0$/, '');
    return `${sign}₹${k}K`;
  }
  return `${sign}₹${abs}`;
}

/**
 * Gold format (milligrams -> grams display)
 */
export function formatGoldMg(mg: number | null | undefined): string {
  if (mg == null || isNaN(mg) || mg <= 0) return '';
  const grams = mg / 1000;
  return `${grams.toFixed(grams % 1 === 0 ? 0 : 2)}g`;
}
