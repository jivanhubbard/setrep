"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function VolumeChart({
  data,
}: {
  data: { week: string; volume: number }[];
}) {
  const chartData = data.map((d) => ({
    ...d,
    label: d.week.slice(5),
  }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={48} />
          <Tooltip
            contentStyle={{ borderRadius: 8 }}
            formatter={(value: number) => [`${value.toLocaleString()}`, "Volume (reps × weight)"]}
          />
          <Bar dataKey="volume" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SessionsChart({
  data,
}: {
  data: { week: string; sessions: number }[];
}) {
  const chartData = data.map((d) => ({
    ...d,
    label: d.week.slice(5),
  }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
          <Tooltip contentStyle={{ borderRadius: 8 }} />
          <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
