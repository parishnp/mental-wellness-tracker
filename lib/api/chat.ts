import type { ChatMessage, ChatResponse, DatasetId } from "@/types/domain";

export async function sendChat(
  datasetId: DatasetId,
  message: string,
  history: ChatMessage[],
): Promise<ChatResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ datasetId, message, history }),
  });
  if (!res.ok) throw new Error(`chat failed: ${res.status}`);
  return res.json() as Promise<ChatResponse>;
}
