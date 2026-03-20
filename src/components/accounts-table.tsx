"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Shield,
  TrendingUp,
  Lock,
} from "lucide-react";
import type { AccountSummary, InstitutionSummary, AlertType } from "@/lib/types";
import { formatMoney, formatPercent, cn } from "@/lib/utils";
import { INSTITUTION_COLORS } from "@/lib/types";

interface Props {
  summaries: AccountSummary[];
  institutionSummaries: InstitutionSummary[];
}

export function AccountsTable({ summaries, institutionSummaries }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(institutionSummaries.map((i) => i.institution))
  );

  const toggle = (inst: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(inst)) next.delete(inst);
      else next.add(inst);
      return next;
    });
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-surface-300/30 flex items-center justify-between">
        <h3 className="section-title">Detalle por cuenta</h3>
        <span className="text-xs text-surface-500 font-mono">
          {summaries.length} sub-cuentas
        </span>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-200/50 text-surface-600">
              <th className="text-left px-4 py-3 font-medium sticky left-0 bg-surface-200/50 min-w-[200px]">
                Cuenta
              </th>
              <th className="text-right px-3 py-3 font-medium">Saldo</th>
              <th className="text-right px-3 py-3 font-medium">Tasa</th>
              <th className="text-right px-3 py-3 font-medium">Tasa Efectiva</th>
              <th className="text-center px-3 py-3 font-medium">Límite</th>
              <th className="text-center px-3 py-3 font-medium">Estado</th>
              <th className="text-right px-3 py-3 font-medium">Rend/Mes</th>
              <th className="text-right px-3 py-3 font-medium">Proy 6M</th>
              <th className="text-right px-3 py-3 font-medium">Proy 12M</th>
            </tr>
          </thead>
          <tbody>
            {institutionSummaries.map((inst) => (
              <InstitutionGroup
                key={inst.institution}
                institution={inst}
                isExpanded={expanded.has(inst.institution)}
                onToggle={() => toggle(inst.institution)}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-surface-200/80 font-semibold">
              <td className="px-4 py-3 sticky left-0 bg-surface-200/80 text-surface-900">
                Total General
              </td>
              <td className="text-right px-3 py-3 font-mono text-surface-950">
                {formatMoney(
                  summaries.reduce((s, a) => s + a.currentBalance, 0)
                )}
              </td>
              <td className="px-3 py-3" />
              <td className="text-right px-3 py-3 font-mono text-surface-800">
                {formatPercent(
                  summaries.reduce((s, a) => s + a.currentBalance, 0) > 0
                    ? summaries.reduce(
                        (s, a) => s + a.currentBalance * a.effectiveRate,
                        0
                      ) /
                        summaries.reduce((s, a) => s + a.currentBalance, 0)
                    : 0
                )}
              </td>
              <td className="px-3 py-3" />
              <td className="px-3 py-3" />
              <td className="text-right px-3 py-3 font-mono text-accent-emerald">
                {formatMoney(summaries.reduce((s, a) => s + a.monthlyReturn, 0))}
              </td>
              <td className="text-right px-3 py-3 font-mono text-surface-800">
                {formatMoney(summaries.reduce((s, a) => s + a.projection6m, 0))}
              </td>
              <td className="text-right px-3 py-3 font-mono text-surface-800">
                {formatMoney(
                  summaries.reduce((s, a) => s + a.projection12m, 0)
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function InstitutionGroup({
  institution,
  isExpanded,
  onToggle,
}: {
  institution: InstitutionSummary;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const color = INSTITUTION_COLORS[institution.institution] ?? "#71717a";

  return (
    <>
      {/* Institution header row */}
      <tr
        onClick={onToggle}
        className="cursor-pointer hover:bg-surface-200/40 transition-colors border-b border-surface-200/50"
      >
        <td className="px-4 py-3 sticky left-0 bg-surface-100/80">
          <div className="flex items-center gap-3">
            <div
              className="w-1 h-8 rounded-full"
              style={{ backgroundColor: color }}
            />
            <button className="text-surface-500">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            <span className="font-semibold text-surface-950">
              {institution.institution}
            </span>
            <span className="text-xs text-surface-500">
              {institution.accounts.length} cuenta
              {institution.accounts.length > 1 ? "s" : ""}
            </span>
          </div>
        </td>
        <td className="text-right px-3 py-3 font-mono font-semibold text-surface-950">
          {formatMoney(institution.totalBalance)}
        </td>
        <td className="px-3 py-3" />
        <td className="text-right px-3 py-3 font-mono text-surface-700">
          {formatPercent(institution.weightedRate)}
        </td>
        <td className="px-3 py-3" />
        <td className="px-3 py-3" />
        <td className="text-right px-3 py-3 font-mono text-accent-emerald">
          {formatMoney(institution.monthlyReturn)}
        </td>
        <td className="text-right px-3 py-3 font-mono text-surface-700">
          {formatMoney(institution.projection6m)}
        </td>
        <td className="text-right px-3 py-3 font-mono text-surface-700">
          {formatMoney(institution.projection12m)}
        </td>
      </tr>

      {/* Sub-account rows */}
      <AnimatePresence>
        {isExpanded &&
          institution.accounts.map((summary) => (
            <motion.tr
              key={summary.account.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="table-row"
            >
              <td className="px-4 py-2.5 sticky left-0 bg-surface-100/80">
                <div className="flex items-center gap-3 pl-10">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: summary.account.color }}
                  />
                  <span className="text-surface-800">
                    {summary.account.subAccount}
                  </span>
                  {summary.account.isVariable && (
                    <span className="badge badge-info text-[10px]">
                      <TrendingUp className="w-3 h-3" />
                      {summary.account.ticker}
                    </span>
                  )}
                </div>
              </td>
              <td className="text-right px-3 py-2.5 font-mono text-surface-900">
                {formatMoney(summary.currentBalance)}
              </td>
              <td className="text-right px-3 py-2.5 font-mono text-surface-600">
                {summary.account.isVariable
                  ? "Variable"
                  : formatPercent(summary.nominalRate ?? 0)}
              </td>
              <td className="text-right px-3 py-2.5 font-mono text-surface-800">
                {summary.effectiveRate > 0
                  ? formatPercent(summary.effectiveRate)
                  : "—"}
              </td>
              <td className="text-center px-3 py-2.5">
                <LimitIndicator summary={summary} />
              </td>
              <td className="text-center px-3 py-2.5">
                <AlertBadge alert={summary.alert} />
              </td>
              <td className="text-right px-3 py-2.5 font-mono text-accent-emerald">
                {summary.monthlyReturn > 0
                  ? formatMoney(summary.monthlyReturn)
                  : "—"}
              </td>
              <td className="text-right px-3 py-2.5 font-mono text-surface-700">
                {formatMoney(summary.projection6m)}
              </td>
              <td className="text-right px-3 py-2.5 font-mono text-surface-700">
                {formatMoney(summary.projection12m)}
              </td>
            </motion.tr>
          ))}
      </AnimatePresence>
    </>
  );
}

function LimitIndicator({ summary }: { summary: AccountSummary }) {
  const { account, percentOccupied } = summary;

  if (account.maxAmount === null || account.maxAmount === 0) {
    return <span className="text-xs text-surface-500">∞</span>;
  }

  const pct = percentOccupied ?? 0;
  const color =
    pct >= 1
      ? "bg-accent-rose"
      : pct >= 0.8
      ? "bg-accent-amber"
      : "bg-accent-emerald";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-16 h-1.5 bg-surface-300 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(pct * 100, 100)}%` }}
        />
      </div>
      <span className="text-[10px] text-surface-500 font-mono">
        {(pct * 100).toFixed(0)}% de {formatMoney(account.maxAmount)}
      </span>
    </div>
  );
}

function AlertBadge({ alert }: { alert: AlertType }) {
  switch (alert) {
    case "ok":
      return (
        <span className="badge badge-ok">
          <Shield className="w-3 h-3" />
          OK
        </span>
      );
    case "near_limit":
      return (
        <span className="badge badge-warning">
          <AlertTriangle className="w-3 h-3" />
          Cerca
        </span>
      );
    case "cap_reached":
      return (
        <span className="badge badge-danger">
          <Lock className="w-3 h-3" />
          Tope
        </span>
      );
    case "rate_reduced":
      return (
        <span className="badge badge-danger">
          <AlertTriangle className="w-3 h-3" />
          Reducida
        </span>
      );
  }
}
