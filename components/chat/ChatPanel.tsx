"use client";

import { useRef, useState } from "react";
import type { ChatMessage, DatasetId, SafetyView } from "@/types/domain";
import { sendChat } from "@/lib/api/chat";
import { Card } from "@/components/ui/Card";
import { SafetyCard } from "@/components/results/SafetyCard";

export function ChatPanel({ datasetId }: { datasetId: DatasetId }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [safety, setSafety] = useState<SafetyView | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await sendChat(datasetId, text, next.slice(-10));
      setMessages([...next, { role: "assistant", content: res.reply }]);
      setSafety(res.safety);
    } catch {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: "Sorry — I couldn't respond just now. Try again?",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <Card>
      <div
        aria-live="polite"
        aria-label="Conversation with ExamCompanion"
        className="flex max-h-72 flex-col gap-2 overflow-y-auto"
      >
        {messages.length === 0 && (
          <p className="text-sm text-slate-500">
            Ask the companion anything — it answers grounded in the pattern
            above. Try “why do Sundays hit so hard?” or “I’m exhausted.”
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "self-end rounded-2xl rounded-br-sm bg-accent px-3 py-2 text-sm text-white"
                : "self-start rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2 text-sm text-ink"
            }
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="self-start text-xs text-slate-500">
            Companion is typing…
          </div>
        )}
      </div>

      {safety && <SafetyCard safety={safety} />}

      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <label htmlFor="chat-input" className="sr-only">
          Message to ExamCompanion
        </label>
        <input
          id="chat-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <button
          type="submit"
          disabled={loading || input.trim().length === 0}
          aria-busy={loading}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </Card>
  );
}
