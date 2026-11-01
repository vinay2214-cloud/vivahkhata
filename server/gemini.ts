import { GoogleGenAI, Type } from '@google/genai';
import { RECEIPT_PROMPT, THANKS_PROMPT, VOICE_PROMPT } from './prompts';
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

export const thanksSchema = {
  type: Type.OBJECT,
  properties: { message: { type: Type.STRING } },
  required: ['message'],
};

/** Builds the Gemini request for a validated voice note, bill photo or thank-you message. */
export function buildGeminiRequest(req: ReadRequest) {
  if (req.kind === 'thanks') {
    const facts = [
      `Language: ${req.language}`,
      `Guest: ${req.giverName}`,
      req.relation && `Relation to the family: ${req.relation}`,
      req.town && `Town: ${req.town}`,
      req.amountRupees != null && 'The guest gave a cash gift (do not state the amount).',
      req.hostNames && `Host family: ${req.hostNames}`,
    ].filter(Boolean);
    return {
      systemInstruction: THANKS_PROMPT,
      contents: [{ role: 'user', parts: [{ text: facts.join('\n') }] }],
    };
  }
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
        config: {
          systemInstruction,
          temperature: req.kind === 'thanks' ? 0.6 : 0.1,
          responseMimeType: 'application/json',
          responseSchema: req.kind === 'thanks' ? thanksSchema : responseSchema,
        },
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
