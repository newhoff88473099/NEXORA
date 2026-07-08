"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const SEV_COLORS: Record<string, string> = {
  critica: "#EF4444",
  maior:   "#F59E0B",
  menor:   "#3B82F6",
  observacao: "#9CA3AF",
};

const SEV_LABEL: Record<string, string> = {
  critica: "Crítica", maior: "Maior", menor: "Menor", observacao: "Observação",
};

type Point = { severity: string; count: number };

export function SeverityBars({ data }: { data: Point[] }) {
  const display = data.map((d) => ({ ...d, name: SEV_LABEL[d.severity] ?? d.severity }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={display} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <XAxis type="number" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#555" }} axisLine={false} tickLine={false} width={72} />
        <Tooltip
          contentStyle={{ fontSize: 12, border: "1px solid var(--border, #e5e7eb)", borderRadius: 6 }}
          formatter={(v) => [v, "NCs"]}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
          {display.map((d) => (
            <Cell key={d.severity} fill={SEV_COLORS[d.severity] ?? "#9CA3AF"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
