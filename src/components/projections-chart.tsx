"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Account, ProjectionMonth } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

interface Props {
  projections: ProjectionMonth[];
  accounts: Account[];
  height?: number;
  detailed?: boolean;
}

export function ProjectionsChart({
  projections,
  accounts,
  height = 300,
  detailed = false,
}: Props) {
  // Build chart data
  const data = projections.map((p) => {
    const entry: Record<string, string | number> = {
      name: p.label,
      total: Math.round(p.total),
      rendimiento: Math.round(p.totalReturn),
    };

    if (detailed) {
      accounts.forEach((a) => {
        entry[a.id] = Math.round(p.balances[a.id] ?? 0);
      });
    }

    return entry;
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
      <div className="glass-card-elevated p-3 min-w-[180px]">
        <p className="text-xs font-medium text-surface-600 mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-4 text-xs mb-1"
          >
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-surface-700">
                {entry.dataKey === "total"
                  ? "Total"
                  : entry.dataKey === "rendimiento"
                  ? "Rendimiento"
                  : accounts.find((a) => a.id === entry.dataKey)?.subAccount ??
                    entry.dataKey}
              </span>
            </div>
            <span className="font-mono text-surface-900">
              {formatMoney(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (!detailed) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="returnGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(63,63,70,0.3)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={{ stroke: "rgba(63,63,70,0.3)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatMoney(v)}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#totalGradient)"
            name="Total"
          />
          <Area
            type="monotone"
            dataKey="rendimiento"
            stroke="#22d3ee"
            strokeWidth={1.5}
            fill="url(#returnGradient)"
            name="Rendimiento"
            strokeDasharray="4 4"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // Detailed: stacked areas per account
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(63,63,70,0.3)"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={{ stroke: "rgba(63,63,70,0.3)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatMoney(v)}
          width={90}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => {
            const acc = accounts.find((a) => a.id === value);
            return acc
              ? `${acc.institution} — ${acc.subAccount}`
              : value;
          }}
          wrapperStyle={{ fontSize: 11 }}
        />
        {accounts.map((account, i) => (
          <Area
            key={account.id}
            type="monotone"
            dataKey={account.id}
            stackId="1"
            stroke={account.color}
            fill={account.color}
            fillOpacity={0.15}
            strokeWidth={1.5}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
