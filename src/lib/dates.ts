import { format, parseISO, isValid, differenceInDays } from 'date-fns';

/**
 * Format ISO or YYYY-MM-DD string into readable Indian format: '22 Nov 2026'
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = dateStr.length === 10 ? parseISO(dateStr) : new Date(dateStr);
    if (!isValid(d)) return dateStr;
    return format(d, 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Short date: '22 Nov'
 */
export function formatShortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = dateStr.length === 10 ? parseISO(dateStr) : new Date(dateStr);
    if (!isValid(d)) return dateStr;
    return format(d, 'dd MMM');
  } catch {
    return dateStr;
  }
}

/**
 * Relative date: 'Today', 'Yesterday', or '12 Nov 2026'
 */
export function formatRelativeDay(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const today = getTodayDateString();
  if (dateStr === today) return 'Today';

  try {
    const d = parseISO(dateStr);
    const now = parseISO(today);
    const diff = differenceInDays(now, d);
    if (diff === 1) return 'Yesterday';
    if (diff === -1) return 'Tomorrow';
    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
}

/**
 * Countdown to wedding: '23 days to go' or 'Wedding day today!' or '3 days ago'
 */
export function formatCountdown(targetDateStr: string | null | undefined): string {
  if (!targetDateStr) return '';
  try {
    const today = parseISO(getTodayDateString());
    const target = parseISO(targetDateStr);
    const diff = differenceInDays(target, today);

    if (diff === 0) return 'Wedding day today! 🎉';
    if (diff === 1) return 'Tomorrow! 🔔';
    if (diff > 1) return `${diff} days to go`;
    if (diff === -1) return '1 day ago';
    return `${Math.abs(diff)} days ago`;
  } catch {
    return '';
  }
}

/**
 * Get current date string formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
