"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="text-lg font-medium">Something went wrong.</p>
      <button
        onClick={reset}
        className="rounded-lg bg-accent px-4 py-2 text-white"
      >
        Try again
      </button>
    </div>
  );
}
