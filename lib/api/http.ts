// Shared route-handler helpers — keep IP extraction, rate-limit responses, and
// body validation in one place instead of repeating them in every API route.
import { NextResponse } from "next/server";
import type { z } from "zod";
import { rateLimit } from "@/lib/security/rateLimit";

/** Best-effort client IP from the forwarded-for header. */
export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

/** Returns a 429 response if the caller is over the limit, otherwise null. */
export function rateLimited(
  req: Request,
  bucket: string,
  limit: number,
): NextResponse | null {
  const result = rateLimit(`${bucket}:${clientIp(req)}`, limit);
  if (result.ok) return null;
  return NextResponse.json(
    { error: "rate_limited" },
    { status: 429, headers: { "Retry-After": String(result.retryAfter) } },
  );
}

/** Parse + validate a JSON body. Returns the schema's output type or a ready 400. */
export async function readBody<S extends z.ZodTypeAny>(
  req: Request,
  schema: S,
): Promise<{ data: z.infer<S> } | { error: NextResponse }> {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return {
      error: NextResponse.json({ error: "invalid_request" }, { status: 400 }),
    };
  }
  return { data: parsed.data };
}
