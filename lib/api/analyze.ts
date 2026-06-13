import type { AnalyzeResponse, DatasetId } from "@/types/domain";

/** Typed client for the analyze endpoint. Keeps fetch/JSON details out of components. */
export async function analyze(datasetId: DatasetId): Promise<AnalyzeResponse> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ datasetId }),
  });
  if (!res.ok) throw new Error(`analyze failed: ${res.status}`);
  return res.json() as Promise<AnalyzeResponse>;
}
