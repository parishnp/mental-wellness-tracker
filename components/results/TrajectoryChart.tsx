"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrajectoryPoint } from "@/types/domain";

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: TrajectoryPoint;
}

function MoodDot({ cx, cy, payload }: DotProps) {
  if (cx == null || cy == null) return null;
  const worst = payload?.isWorstDay;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={worst ? 6 : 3}
      fill={worst ? "#e2574c" : "#5b8def"}
      stroke="#fff"
      strokeWidth={worst ? 2 : 1}
    />
  );
}

export function TrajectoryChart({
  data,
  summary,
}: {
  data: TrajectoryPoint[];
  summary?: string;
}) {
  return (
    <div
      role="img"
      aria-label={
        summary ??
        "Wellness trajectory: mood, sleep and entry length over the week"
      }
      className="h-72 w-full rounded-2xl border border-slate-200 bg-white p-4"
    >
      {summary && <p className="sr-only">{summary}</p>}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 4, left: -16 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={50}
          />
          <YAxis yAxisId="left" domain={[0, 12]} tick={{ fontSize: 11 }} />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 70]}
            tick={{ fontSize: 11 }}
          />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="mood"
            name="Mood (1–10)"
            stroke="#5b8def"
            strokeWidth={2.5}
            dot={<MoodDot />}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="sleep"
            name="Sleep (hrs)"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="length"
            name="Entry length (words)"
            stroke="#94a3b8"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
