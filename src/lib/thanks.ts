export type ThanksLanguage = 'en' | 'te' | 'hi';

export interface ThanksInput {
  giverName: string;
  relation?: string;
  hostNames?: string;
}

const MAX_LENGTH = 600;

/** Plain template used when the AI is off or offline. Never mentions the amount. */
export function templateThanks(
  { giverName, hostNames }: ThanksInput,
  language: ThanksLanguage
): string {
  const name = giverName.trim();
  const sign = hostNames?.trim();
  if (language === 'te') {
    return `${name} గారికి నమస్కారం. మా శుభకార్యానికి విచ్చేసి మమ్మల్ని ఆశీర్వదించినందుకు హృదయపూర్వక ధన్యవాదాలు.\n${sign || 'ప్రేమతో'}`;
  }
  if (language === 'hi') {
    return `${name} जी, नमस्कार। हमारे विवाह समारोह में पधारकर हमें आशीर्वाद देने के लिए हृदय से धन्यवाद।\n${sign || 'सप्रेम'}`;
  }
  return `Dear ${name}, thank you for joining us and blessing us on our special day. Your presence meant a great deal to our family.\n${sign || 'With love'}`;
}

/** Tidies what Gemini returned: trims, caps the length and drops anything empty. */
export function cleanThanks(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const text = raw
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!text) return null;
  return text.length > MAX_LENGTH ? `${text.slice(0, MAX_LENGTH).trimEnd()}…` : text;
}

/** WhatsApp link with the message filled in. Phone is optional (Indian numbers are given a 91 prefix). */
export function whatsappLink(message: string, phone?: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
}
