"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

type Point = { week: string; score: number | null; count: number };

export function ScoreTrend({ data }: { data: Point[] }) {
  const filled = data.map((d) => ({ ...d, score: d.score ?? undefined }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={filled} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2E7D52" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#2E7D52" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, border: "1px solid var(--border, #e5e7eb)", borderRadius: 6 }}
          formatter={(v) => [`${v}%`, "Score médio"]}
          labelFormatter={(l) => `Semana ${l}`}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="#2E7D52"
          strokeWidth={2}
          fill="url(#scoreGrad)"
          connectNulls
          dot={{ r: 3, fill: "#2E7D52", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
