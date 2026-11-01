import { getTodayDateString } from './dates';
import type { ParsedAIDraft } from '../components/ai/ConfirmCard';
import type {
  Member,
  PaymentMode,
  PaymentType,
  Vendor,
  WeddingCategory,
  WeddingEvent,
} from '../types';

/**
 * Pure helpers that turn Gemini's raw reading into a draft entry the user confirms.
 * No network or Firebase here, so everything in this file is unit-tested.
 * Rule: unknown values stay empty (null). Nothing is guessed.
 */

export interface AIContext {
  categories: WeddingCategory[];
  vendors: Vendor[];
  members: Member[];
  events: WeddingEvent[];
  speakerName: string;
}

const MAX_RUPEES = 100_000_000; // ₹10 crore
const MODES: PaymentMode[] = ['cash', 'upi', 'card', 'bank', 'cheque'];
const TYPES: PaymentType[] = ['full', 'advance', 'balance'];

export interface RawResult {
  kind: 'expense' | 'gift' | 'unknown';
  transcript: string | null;
  amountRupees: number | null;
  categoryId: string | null;
  vendorName: string | null;
  paidByName: string | null;
  mode: string | null;
  type: string | null;
  eventName: string | null;
  date: string | null;
  upiRef: string | null;
  note: string | null;
  giverName: string | null;
  relation: string | null;
  town: string | null;
  goldGrams: number | null;
  items: string | null;
  uncertainFields?: string[];
  warnings?: string[];
}

export function buildContext(ctx: AIContext): string {
  return JSON.stringify({
    today: getTodayDateString(),
    timezone: 'Asia/Kolkata',
    categories: ctx.categories.filter((c) => !c.hidden).map((c) => ({ id: c.id, label: c.label })),
    vendors: ctx.vendors.filter((v) => !v.deleted).map((v) => v.name),
    members: ctx.members.filter((m) => !m.removed).map((m) => m.displayName),
    events: ctx.events
      .filter((e) => !e.deleted)
      .map((e) => ({ name: e.name, date: e.date || null })),
    speakerName: ctx.speakerName,
  });
}

export const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\p{Script=Telugu}\p{Script=Devanagari}]+/gu, ' ')
    .trim();

/** Finds a list item whose name clearly matches the spoken/read name. */
export function matchByName<T>(
  name: string | null,
  items: T[],
  getName: (item: T) => string
): T | undefined {
  if (!name) return undefined;
  const target = normalise(name);
  if (target.length < 3) return undefined;
  return (
    items.find((i) => normalise(getName(i)) === target) ||
    items.find((i) => {
      const n = normalise(getName(i));
      return n.length >= 3 && (n.includes(target) || target.includes(n));
    })
  );
}

export function cleanAmount(value: number | null, warnings: string[]): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  if (value <= 0 || value > MAX_RUPEES) {
    warnings.push('The amount looked wrong, so it was left empty. Please type it.');
    return null;
  }
  return Math.round(value * 100) / 100;
}

export function cleanDate(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return Number.isNaN(new Date(value).getTime()) ? null : value;
}

export function toDraft(raw: RawResult, ctx: AIContext, imageThumbnail?: string): ParsedAIDraft {
  const warnings = [...(raw.warnings || [])];
  const confidence: Record<string, 'high' | 'medium' | 'low'> = {};
  const uncertain = new Set(raw.uncertainFields || []);
  const event = matchByName(
    raw.eventName,
    ctx.events.filter((e) => !e.deleted),
    (e) => e.name
  );
  const amountRupees = cleanAmount(raw.amountRupees, warnings);

  const mark = (prefix: 'expense' | 'gift', field: string, value: unknown, rawField = field) => {
    if (value !== null && value !== undefined && value !== '') {
      confidence[`${prefix}.${field}`] = uncertain.has(rawField) ? 'low' : 'high';
    }
  };

  if (raw.kind === 'gift') {
    const goldGrams =
      raw.goldGrams && raw.goldGrams > 0 && raw.goldGrams < 10_000 ? raw.goldGrams : null;
    const gift = {
      giverName: raw.giverName?.trim() || null,
      relation: raw.relation?.trim() || null,
      town: raw.town?.trim() || null,
      cashRupees: amountRupees,
      goldGrams,
      items: raw.items?.trim() || null,
      eventId: event?.id || null,
    };
    mark('gift', 'giverName', gift.giverName);
    mark('gift', 'cashRupees', gift.cashRupees, 'amountRupees');
    mark('gift', 'town', gift.town);
    return {
      kind: 'gift',
      transcript: raw.transcript || undefined,
      imageThumbnail,
      gift,
      confidence,
      warnings,
    };
  }

  if (raw.kind === 'expense') {
    const visibleCategories = ctx.categories.filter((c) => !c.hidden);
    let categoryId = raw.categoryId;
    if (categoryId && !visibleCategories.some((c) => c.id === categoryId)) {
      categoryId = visibleCategories.some((c) => c.id === 'misc') ? 'misc' : null;
      uncertain.add('categoryId');
    }
    const vendor = matchByName(
      raw.vendorName,
      ctx.vendors.filter((v) => !v.deleted),
      (v) => v.name
    );
    const member = matchByName(
      raw.paidByName,
      ctx.members.filter((m) => !m.removed),
      (m) => m.displayName
    );
    const mode = MODES.includes(raw.mode as PaymentMode) ? (raw.mode as PaymentMode) : null;
    const type = TYPES.includes(raw.type as PaymentType) ? (raw.type as PaymentType) : null;
    const expense = {
      amountRupees,
      categoryId: categoryId || vendor?.categoryId || null,
      vendorName: vendor?.name || raw.vendorName?.trim() || null,
      vendorId: vendor?.id || null,
      paidByName: member?.displayName || raw.paidByName?.trim() || null,
      paidByUid: member?.uid || null,
      mode,
      type,
      eventId: event?.id || null,
      date: cleanDate(raw.date),
      upiRef: raw.upiRef ? raw.upiRef.replace(/\s+/g, '') : null,
      note: raw.note?.trim() || null,
    };
    mark('expense', 'amountRupees', expense.amountRupees);
    mark('expense', 'categoryId', expense.categoryId);
    mark('expense', 'vendorName', expense.vendorName);
    mark('expense', 'mode', expense.mode);
    return {
      kind: 'expense',
      transcript: raw.transcript || undefined,
      imageThumbnail,
      expense,
      confidence,
      warnings,
    };
  }

  return {
    kind: 'unknown',
    transcript: raw.transcript || undefined,
    imageThumbnail,
    confidence: {},
    warnings: warnings.length ? warnings : ["Couldn't understand this. Please type it instead."],
  };
}
