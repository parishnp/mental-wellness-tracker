// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { createElement as h } from "react";
import axe from "axe-core";
import ResultsPanel from "@/components/results/ResultsPanel";
import { runPipeline } from "@/lib/core/pipeline";
import { buildSafetyView } from "@/lib/core/safety";
import { loadDataset } from "@/lib/data/loadDataset";

// Recharts needs real layout that jsdom can't provide — stub the chart to a
// simple accessible element (async factory avoids the hoisting/JSX pitfalls).
vi.mock("@/components/results/TrajectoryChart", async () => {
  const React = await import("react");
  return {
    TrajectoryChart: () =>
      React.createElement("div", {
        role: "img",
        "aria-label": "trajectory chart",
      }),
  };
});

const dataset = loadDataset("before");
const core = runPipeline("before", dataset);
const apiResult = {
  ...core,
  insight:
    "You don't have a chemistry problem. You have a Sunday problem — and a Sunday problem has a fix.",
  personalizedIntervention: "Cap your Sunday results review at 15 minutes.",
  safety: buildSafetyView(core.crisis),
  sources: { insight: "fallback", personalize: "fallback" },
};

beforeEach(() => {
  cleanup();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => apiResult,
  }) as unknown as typeof fetch;
});

const panel = () =>
  h(ResultsPanel, {
    student: dataset.student,
    initialEntries: dataset.entries,
  });

describe("ResultsPanel", () => {
  it("renders the journal feed on first paint, before any analysis", () => {
    render(panel());
    expect(
      screen.getByRole("button", { name: /analyze the week/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Mood/i).length).toBeGreaterThan(0);
  });

  it("runs the pipeline on click and reveals insight, scores, and the safety escalation", async () => {
    render(panel());
    fireEvent.click(screen.getByRole("button", { name: /analyze the week/i }));

    expect(await screen.findByText(/Sunday problem/i)).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: /stress/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: /confidence/i }),
    ).toBeInTheDocument();
    // Deterministic crisis (06-13) drives the rule-decided safety alert.
    expect(
      screen.getByRole("alert", { name: /support resources/i }),
    ).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/analyze",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("has no WCAG A/AA accessibility violations after analysis", async () => {
    const { container } = render(panel());
    fireEvent.click(screen.getByRole("button", { name: /analyze the week/i }));
    await screen.findByText(/Sunday problem/i);

    const results = await axe.run(container, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
      },
    });
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});
