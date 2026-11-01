import { GoogleGenAI, Type } from '@google/genai';
import { RECEIPT_PROMPT, VOICE_PROMPT } from './prompts';
import type { ReadRequest } from './validate';

/** Structured output Gemini must return (the browser turns it into a draft the user confirms). */
const nullableString = { type: Type.STRING, nullable: true };
const nullableNumber = { type: Type.NUMBER, nullable: true };
export const responseSchema = {
  type: Type.OBJECT,
  properties: {
    kind: { type: Type.STRING, enum: ['expense', 'gift', 'unknown'] },
    transcript: nullableString,
    amountRupees: nullableNumber,
    categoryId: nullableString,
    vendorName: nullableString,
    paidByName: nullableString,
    mode: nullableString,
    type: nullableString,
    eventName: nullableString,
    date: nullableString,
    upiRef: nullableString,
    note: nullableString,
    giverName: nullableString,
    relation: nullableString,
    town: nullableString,
    goldGrams: nullableNumber,
    items: nullableString,
    uncertainFields: { type: Type.ARRAY, items: { type: Type.STRING } },
    warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['kind', 'uncertainFields', 'warnings'],
};

/** Builds the Gemini request for a validated voice note or bill photo. */
export function buildGeminiRequest(req: ReadRequest) {
  if (req.kind === 'voice') {
    return {
      systemInstruction: VOICE_PROMPT,
      contents: [{ role: 'user', parts: [{ text: `Context: ${req.context}` }, { text: `Spoken note: ${req.text}` }] }],
    };
  }
  return {
    systemInstruction: RECEIPT_PROMPT,
    contents: [
      {
        role: 'user',
        parts: [{ text: `Context: ${req.context}` }, { inlineData: { data: req.imageBase64, mimeType: req.mimeType } }],
      },
    ],
  };
}

export function createGeminiReader(apiKey: string, model: string) {
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });

  return async function readWithAI(req: ReadRequest): Promise<unknown> {
    const { systemInstruction, contents } = buildGeminiRequest(req);
    const call = () =>
      ai.models.generateContent({
        model,
        contents,
        config: { systemInstruction, temperature: 0.1, responseMimeType: 'application/json', responseSchema },
      });

    let result;
    try {
      result = await call();
    } catch (first) {
      // One retry for brief network / server hiccups; client errors are not retried.
      const status = (first as { status?: number }).status;
      if (status && status < 500 && status !== 429) throw first;
      await new Promise((r) => setTimeout(r, 800));
      result = await call();
    }
    return JSON.parse(result.text || '{}');
  };
}
