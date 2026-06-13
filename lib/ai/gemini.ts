// Server-only Gemini client. Returns null when no key is configured so callers fall back.
import "server-only";
import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/config/env";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!env.GEMINI_API_KEY) return null;
  if (!client) client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return client;
}

export function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export async function generateText(opts: {
  model: string;
  system: string;
  user: string;
}): Promise<string | null> {
  const c = getClient();
  if (!c) return null;
  const res = await c.models.generateContent({
    model: opts.model,
    contents: opts.user,
    config: { systemInstruction: opts.system },
  });
  const text = res.text?.trim();
  return text && text.length > 0 ? text : null;
}

export async function generateJSON<T>(opts: {
  model: string;
  system: string;
  user: string;
  validate: (value: unknown) => T;
}): Promise<T | null> {
  const c = getClient();
  if (!c) return null;
  const res = await c.models.generateContent({
    model: opts.model,
    contents: opts.user,
    config: { systemInstruction: opts.system, responseMimeType: "application/json" },
  });
  if (!res.text) return null;
  return opts.validate(JSON.parse(stripFences(res.text)));
}
