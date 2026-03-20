"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calculator,
  TrendingUp,
  PiggyBank,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import type { Account, AccountSummary, MonthlyContribution } from "@/lib/types";
import { calculateWhatIf } from "@/lib/calculations";
import { formatMoney, formatPercent, generateId, cn } from "@/lib/utils";
import { ProjectionsChart } from "./projections-chart";

interface Props {
  accounts: Account[];
  accountSummaries: AccountSummary[];
}

export function WhatIfSimulator({ accounts, accountSummaries }: Props) {
  const [months, setMonths] = useState(12);
  const [contributions, setContributions] = useState<
    Record<string, { amount: string; enabled: boolean }>
  >({});

  const contribList: MonthlyContribution[] = useMemo(() => {
    return accounts
      .map((a) => {
        const c = contributions[a.id];
        return {
          id: a.id,
          accountId: a.id,
          amount: parseFloat(c?.amount || "0") || 0,
          enabled: c?.enabled ?? false,
        };
      })
      .filter((c) => c.enabled && c.amount > 0);
  }, [accounts, contributions]);

  const projections = useMemo(
    () => calculateWhatIf(accountSummaries, contribList, months),
    [accountSummaries, contribList, months]
  );

  const totalMonthlyContrib = contribList.reduce((s, c) => s + c.amount, 0);
  const currentTotal = accountSummaries.reduce(
    (s, a) => s + a.currentBalance,
    0
  );
  const futureTotal = projections[projections.length - 1]?.total ?? currentTotal;
  const totalContributed = totalMonthlyContrib * months;
  const totalReturn = futureTotal - currentTotal - totalContributed;

  // Base projections (no contributions) for comparison
  const baseProjections = useMemo(
    () => calculateWhatIf(accountSummaries, [], months),
    [accountSummaries, months]
  );
  const baseFuture = baseProjections[baseProjections.length - 1]?.total ?? currentTotal;
  const advantage = futureTotal - baseFuture;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h3 className="section-title flex items-center gap-2">
          <Calculator className="w-5 h-5 text-accent-violet" />
          ¿Qué pasaría si abonas mensualmente?
        </h3>
        <p className="text-sm text-surface-500 mt-1">
          Simula cómo crecerían tus inversiones con abonos recurrentes.
        </p>
      </div>

      {/* Controls */}
      <div className="glass-card p-6 space-y-4">
        {/* Time horizon */}
        <div>
          <label className="text-xs text-surface-500 mb-2 block">
            Horizonte de proyección
          </label>
          <div className="flex gap-2">
            {[6, 12, 24, 36, 60].map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  months === m
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20"
                    : "bg-surface-200/50 text-surface-600 hover:bg-surface-300/50"
                )}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>

        {/* Per-account contributions */}
        <div>
          <label className="text-xs text-surface-500 mb-3 block">
            Abono mensual por cuenta
          </label>
          <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
            {accounts.map((account) => {
              const c = contributions[account.id] ?? {
                amount: "",
                enabled: false,
              };
              return (
                <div
                  key={account.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all",
                    c.enabled
                      ? "bg-brand-500/5 border border-brand-500/20"
                      : "bg-surface-200/30 border border-surface-300/20"
                  )}
                >
                  <button
                    onClick={() =>
                      setContributions({
                        ...contributions,
                        [account.id]: { ...c, enabled: !c.enabled },
                      })
                    }
                    className="shrink-0"
                  >
                    {c.enabled ? (
                      <ToggleRight className="w-6 h-6 text-brand-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-surface-500" />
                    )}
                  </button>

                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: account.color }}
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-800 truncate">
                      {account.institution} — {account.subAccount}
                    </p>
                    <p className="text-xs text-surface-500">
                      {account.isVariable
                        ? `Variable (${account.ticker})`
                        : formatPercent(account.annualRate ?? 0)}
                      {account.maxAmount
                        ? ` · Máx: ${formatMoney(account.maxAmount)}`
                        : ""}
                    </p>
                  </div>

                  <input
                    type="number"
                    placeholder="$0"
                    className={cn(
                      "w-28 input-field font-mono text-sm text-right",
                      !c.enabled && "opacity-40"
                    )}
                    disabled={!c.enabled}
                    value={c.amount}
                    onChange={(e) =>
                      setContributions({
                        ...contributions,
                        [account.id]: { ...c, amount: e.target.value },
                      })
                    }
                    min="0"
                    step="500"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results */}
      {contribList.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ResultCard
              label="Total en abonos"
              value={formatMoney(totalContributed)}
              sub={`${formatMoney(totalMonthlyContrib)}/mes × ${months} meses`}
              icon={PiggyBank}
            />
            <ResultCard
              label="Rendimiento generado"
              value={formatMoney(totalReturn)}
              sub="Interés compuesto"
              icon={TrendingUp}
              positive
            />
            <ResultCard
              label={`Balance en ${months} meses`}
              value={formatMoney(futureTotal)}
              sub={`Hoy: ${formatMoney(currentTotal)}`}
              icon={Sparkles}
            />
            <ResultCard
              label="Ventaja vs no abonar"
              value={`+${formatMoney(advantage)}`}
              sub={`Sin abonos: ${formatMoney(baseFuture)}`}
              icon={Calculator}
              positive
            />
          </div>

          {/* Chart */}
          <div className="glass-card p-6">
            <h4 className="text-sm font-medium text-surface-700 mb-4">
              Proyección con abonos mensuales
            </h4>
            <ProjectionsChart
              projections={projections}
              accounts={accounts}
              height={350}
            />
          </div>
        </>
      )}

      {contribList.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Calculator className="w-12 h-12 text-surface-400 mx-auto mb-4" />
          <p className="text-surface-600 mb-1">
            Activa al menos una cuenta y define un monto
          </p>
          <p className="text-surface-500 text-sm">
            Verás una simulación completa con interés compuesto.
          </p>
        </div>
      )}
    </motion.div>
  );
}

function ResultCard({
  label,
  value,
  sub,
  icon: Icon,
  positive,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof TrendingUp;
  positive?: boolean;
}) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="stat-label">{label}</span>
        <Icon
          className={cn(
            "w-4 h-4",
            positive ? "text-accent-emerald" : "text-surface-500"
          )}
        />
      </div>
      <p className="font-mono text-xl font-semibold text-surface-950">
        {value}
      </p>
      <p className="text-xs text-surface-500 mt-0.5">{sub}</p>
    </div>
  );
}
