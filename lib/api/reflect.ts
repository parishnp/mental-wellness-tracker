import type { ReflectResponse } from "@/types/domain";

/** Typed client for the reflect endpoint. Keeps fetch/JSON details out of components. */
export async function reflect(input: {
  text: string;
  mood?: number;
  sleep_hrs?: number;
  study_hrs?: number;
}): Promise<ReflectResponse> {
  const res = await fetch("/api/reflect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`reflect failed: ${res.status}`);
  return res.json() as Promise<ReflectResponse>;
}
