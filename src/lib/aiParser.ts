import { ParsedAIDraft } from '../components/ai/ConfirmCard';
import { PaymentMode, PaymentType } from '../types';

/**
 * OFFLINE FALLBACK parser for spoken notes (used only when Gemini can't be reached).
 * It recognises simple patterns and leaves everything else EMPTY so the person types it.
 * It must never invent an amount, a name or a payer.
 */

const UNIT_WORDS: Array<{ pattern: RegExp; multiplier: number }> = [
  { pattern: /(crore|koti|kotlu)/, multiplier: 10_000_000 },
  { pattern: /(lakh|lakhs|laksha|lakshalu|lac)/, multiplier: 100_000 },
  { pattern: /(thousand|vela|veyyi|hazaar|hazar|k\b)/, multiplier: 1_000 },
];

// Telugu / Hindi / English number words (common ones only).
const NUMBER_WORDS: Record<string, number> = {
  oka: 1,
  okati: 1,
  ek: 1,
  one: 1,
  rendu: 2,
  do: 2,
  two: 2,
  moodu: 3,
  mudu: 3,
  teen: 3,
  three: 3,
  nalugu: 4,
  char: 4,
  four: 4,
  aidu: 5,
  ayidu: 5,
  paanch: 5,
  panch: 5,
  five: 5,
  aaru: 6,
  chhe: 6,
  six: 6,
  edu: 7,
  saat: 7,
  seven: 7,
  enimidi: 8,
  aath: 8,
  eight: 8,
  tommidi: 9,
  nau: 9,
  nine: 9,
  padi: 10,
  das: 10,
  ten: 10,
  iravai: 20,
  bees: 20,
  twenty: 20,
  muppai: 30,
  tees: 30,
  thirty: 30,
  nalabhai: 40,
  nalabai: 40,
  chalees: 40,
  forty: 40,
  yabhai: 50,
  yaabhai: 50,
  pachaas: 50,
  fifty: 50,
};

function extractAmountRupees(lower: string): number | null {
  // 1. Digits followed by a unit: "40 thousand", "1.5 lakh", "2 lakhs"
  for (const { pattern, multiplier } of UNIT_WORDS) {
    const re = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${pattern.source}`);
    const m = lower.match(re);
    if (m) return Math.round(parseFloat(m[1]) * multiplier);
  }

  // 2. Number word + "nara" (and a half) + unit: "okati nara laksha", "nalabhai vela"
  for (const { pattern, multiplier } of UNIT_WORDS) {
    const re = new RegExp(`([a-z]+)(\\s+nara)?\\s+${pattern.source}`);
    const m = lower.match(re);
    if (m && NUMBER_WORDS[m[1]] !== undefined) {
      const base = NUMBER_WORDS[m[1]] + (m[2] ? 0.5 : 0);
      return Math.round(base * multiplier);
    }
  }

  // 3. Plain digits: "5000", "25,000"
  const digits = lower.replace(/,/g, '').match(/\b\d{2,9}\b/);
  if (digits) return parseInt(digits[0], 10);

  return null;
}

export function parseSpokenTextToDraft(
  text: string,
  categories: Array<{ id: string; label: string }>
): ParsedAIDraft {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  if (/\b(dowry|katnam|varakatnam|dahej)\b/.test(lower)) {
    return {
      kind: 'unknown',
      transcript: clean,
      warnings: ["This app doesn't record dowry."],
      confidence: {},
    };
  }

  const amountRupees = extractAmountRupees(lower);
  const warnings: string[] = ['Offline reading: please check every field before saving.'];
  if (amountRupees === null) warnings.push("Couldn't catch the amount. Please type it.");

  const isGift =
    /(icharu|ichindi|ichadu|chadivincharu|chadivimpu|gave us|shagun|\bmoi\b|gift ga)/.test(lower);

  if (isGift) {
    const hasGold = /(bangaram|gold)/.test(lower);
    const digitGrams = lower.match(/(\d+(?:\.\d+)?)\s*(grams?|gm|g)\b/);
    const wordGrams = lower.match(/\b([a-z]+)\s*(grams?|gm)\b/);
    const grams = digitGrams
      ? parseFloat(digitGrams[1])
      : wordGrams && NUMBER_WORDS[wordGrams[1]] !== undefined
        ? NUMBER_WORDS[wordGrams[1]]
        : null;
    let items: string | null = null;
    if (/(ungaram|ring)/.test(lower)) items = 'Ring';
    else if (/(gaajulu|bangle)/.test(lower)) items = 'Bangles';
    else if (/(chain|golusu)/.test(lower)) items = 'Chain';

    warnings.push('Please type the giver’s name and town.');
    return {
      kind: 'gift',
      transcript: clean,
      gift: {
        giverName: null,
        relation: null,
        town: null,
        cashRupees: hasGold && grams !== null ? null : amountRupees,
        goldGrams: hasGold ? grams : null,
        items,
        eventId: null,
      },
      confidence: { 'gift.cashRupees': 'low' },
      warnings,
    };
  }

  const has = (id: string) => categories.some((c) => c.id === id);
  let categoryId: string | null = null;
  const rules: Array<[RegExp, string]> = [
    [/(cater|vanta|food|bhojanam|bojanam|khana)/, 'catering'],
    [/(photo|video|shoot)/, 'photography'],
    [/(decor|poolu|flower|stage|pandal|tent)/, 'decoration'],
    [/(hall|venue|mandapam)/, 'venue'],
    [/(saree|batta|cloth|dress)/, 'clothing'],
    [/(jewel|nagalu)/, 'jewellery'],
    [/(pandit|purohit|pantulu)/, 'priest'],
    [/(\bcar\b|\bbus\b|travels|transport)/, 'transport'],
    [/(room|hotel|lodge)/, 'accommodation'],
  ];
  for (const [re, id] of rules) {
    if (re.test(lower) && has(id)) {
      categoryId = id;
      break;
    }
  }

  let mode: PaymentMode | null = null;
  if (/(phonepe|gpay|google pay|paytm|upi)/.test(lower)) mode = 'upi';
  else if (/\bcash\b|nagadu/.test(lower)) mode = 'cash';
  else if (/\bcard\b/.test(lower)) mode = 'card';
  else if (/(neft|imps|bank|account)/.test(lower)) mode = 'bank';
  else if (/cheque|check/.test(lower)) mode = 'cheque';

  let type: PaymentType | null = null;
  if (/(advance|token|mundu)/.test(lower)) type = 'advance';
  else if (/(balance|migatha|remaining)/.test(lower)) type = 'balance';

  let paidByName: string | null = null;
  const relative = lower.match(/\b(mama|anna|nanna|babai|bava|akka|amma|chinnanna|peddanna)\b/);
  if (relative) paidByName = relative[1].charAt(0).toUpperCase() + relative[1].slice(1);

  return {
    kind: 'expense',
    transcript: clean,
    expense: {
      amountRupees,
      categoryId,
      vendorName: null,
      vendorId: null,
      paidByName,
      paidByUid: null,
      mode,
      type,
      eventId: null,
      date: null,
      upiRef: null,
      note: clean,
    },
    confidence: {
      'expense.amountRupees': 'low',
      'expense.categoryId': 'low',
    },
    warnings,
  };
}
