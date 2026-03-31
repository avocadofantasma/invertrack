"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Wallet,
  PiggyBank,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Settings,
  BarChart3,
  List,
  Calculator,
  CreditCard,
  DollarSign,
  Receipt,
  PieChart,
  SlidersHorizontal,
  X,
  Check,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  buildAccountSummary,
  buildInstitutionSummaries,
  generateProjections,
} from "@/lib/calculations";
import { formatMoney, formatPercent, cn } from "@/lib/utils";
import { useAllMarketData } from "@/hooks/use-market-data";
import { AccountsTable } from "./accounts-table";
import { MovementsList } from "./movements-list";
import { AddMovementModal } from "./add-movement-modal";
import { ProjectionsChart } from "./projections-chart";
import { WhatIfSimulator } from "./what-if-simulator";
import { DataManager } from "./data-manager";
import { RemindersBanner } from "./finance/reminders-banner";
import { BudgetTab } from "./finance/budget-tab";
import { IncomeTab } from "./finance/income-tab";
import { ExpensesTab } from "./finance/expenses-tab";
import { DebtsTab } from "./finance/debts-tab";
import { toast } from "sonner";

type Tab =
  | "overview"
  | "movements"
  | "projections"
  | "whatif"
  | "budget"
  | "income"
  | "expenses"
  | "debts"
  | "settings";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showAddMovement, setShowAddMovement] = useState(false);
  const [correctingAccount, setCorrectingAccount] = useState<{ id: string; name: string; currentBalance: number } | null>(null);

  const store = useStore();
  const { accounts, movements, initialBalances, monthlyContributions, marketData } = store;

  // Fetch market data for variable accounts
  useAllMarketData(accounts);

  // Compute all summaries
  const accountSummaries = useMemo(
    () =>
      accounts.map((a) =>
        buildAccountSummary(a, movements, initialBalances, marketData)
      ),
    [accounts, movements, initialBalances, marketData]
  );

  const institutionSummaries = useMemo(
    () => buildInstitutionSummaries(accountSummaries),
    [accountSummaries]
  );

  const projections = useMemo(
    () => generateProjections(accountSummaries, 12, monthlyContributions),
    [accountSummaries, monthlyContributions]
  );

  // Aggregate stats
  const totalBalance = accountSummaries.reduce(
    (s, a) => s + a.currentBalance,
    0
  );
  const totalMonthlyReturn = accountSummaries.reduce(
    (s, a) => s + a.monthlyReturn,
    0
  );
  const totalAnnualReturn = accountSummaries.reduce(
    (s, a) => s + a.annualReturn,
    0
  );
  const weightedRate =
    totalBalance > 0
      ? accountSummaries.reduce(
          (s, a) => s + a.currentBalance * a.effectiveRate,
          0
        ) / totalBalance
      : 0;

  const proj6Total = projections[6]?.total ?? totalBalance;
  const proj12Total = projections[12]?.total ?? totalBalance;

  const tabs: { id: Tab; label: string; icon: typeof TrendingUp; group?: string }[] = [
    { id: "overview", label: "Resumen", icon: BarChart3, group: "inversiones" },
    { id: "movements", label: "Movimientos", icon: List, group: "inversiones" },
    { id: "projections", label: "Proyecciones", icon: TrendingUp, group: "inversiones" },
    { id: "whatif", label: "¿Qué pasaría si...?", icon: Calculator, group: "inversiones" },
    { id: "budget", label: "Presupuesto", icon: PieChart, group: "finanzas" },
    { id: "income", label: "Ingresos", icon: DollarSign, group: "finanzas" },
    { id: "expenses", label: "Gastos", icon: Receipt, group: "finanzas" },
    { id: "debts", label: "Deudas", icon: CreditCard, group: "finanzas" },
    { id: "settings", label: "Datos", icon: Settings },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-surface-0/80 border-b border-surface-300/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h1 className="font-display text-lg font-bold text-surface-950">
                Inver<span className="text-gradient">track</span>
              </h1>
            </div>

            <button
              onClick={() => setShowAddMovement(true)}
              className="btn-primary text-sm py-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo movimiento</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px overflow-x-auto scrollbar-thin pb-px">
            {tabs.map(({ id, label, icon: Icon, group }, i) => {
              // Add separator between groups
              const prevGroup = i > 0 ? tabs[i - 1].group : undefined;
              const showSeparator = prevGroup && group && prevGroup !== group;

              return (
                <div key={id} className="flex items-center">
                  {showSeparator && (
                    <div className="w-px h-5 bg-surface-300/50 mx-1" />
                  )}
                  <button
                    onClick={() => setActiveTab(id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200",
                      activeTab === id
                        ? "border-brand-500 text-brand-400"
                        : "border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-400"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Reminders banner - show on all finance tabs */}
        {["overview", "budget", "income", "expenses", "debts"].includes(activeTab) && (
          <RemindersBanner />
        )}

        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Hero Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Inversión Total"
                value={formatMoney(totalBalance)}
                icon={Wallet}
                gradient="from-brand-500/20 to-accent-cyan/10"
                iconColor="text-brand-400"
              />
              <StatCard
                label="Rendimiento Mensual"
                value={formatMoney(totalMonthlyReturn)}
                subValue={`${formatPercent(weightedRate)} ponderada`}
                icon={PiggyBank}
                gradient="from-accent-emerald/20 to-brand-500/10"
                iconColor="text-accent-emerald"
                positive
              />
              <StatCard
                label="Proyección 6 Meses"
                value={formatMoney(proj6Total)}
                subValue={`+${formatMoney(proj6Total - totalBalance)}`}
                icon={Target}
                gradient="from-accent-cyan/20 to-accent-violet/10"
                iconColor="text-accent-cyan"
                positive
              />
              <StatCard
                label="Proyección 12 Meses"
                value={formatMoney(proj12Total)}
                subValue={`+${formatMoney(proj12Total - totalBalance)}`}
                icon={TrendingUp}
                gradient="from-accent-violet/20 to-accent-rose/10"
                iconColor="text-accent-violet"
                positive
              />
            </div>

            {/* Accounts Table */}
            <AccountsTable
              summaries={accountSummaries}
              institutionSummaries={institutionSummaries}
            />

            {/* Mini projection chart */}
            <div className="glass-card p-6">
              <h3 className="section-title mb-4">Crecimiento proyectado</h3>
              <ProjectionsChart
                projections={projections}
                accounts={accounts}
                height={300}
              />
            </div>
          </motion.div>
        )}

        {activeTab === "movements" && (
          <MovementsList
            movements={movements}
            accounts={accounts}
            initialBalances={initialBalances}
            onAdd={() => setShowAddMovement(true)}
            onDelete={(id) => {
              store.deleteMovement(id);
              toast.success("Movimiento eliminado");
            }}
          />
        )}

        {activeTab === "projections" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="section-title mb-4">
                Proyección a 12 meses por sub-cuenta
              </h3>
              <ProjectionsChart
                projections={projections}
                accounts={accounts}
                height={400}
                detailed
              />
            </div>

            {/* Projection table */}
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-surface-300/30">
                <h3 className="section-title">Detalle mensual</h3>
              </div>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-200/50">
                      <th className="text-left px-4 py-3 font-medium text-surface-600 sticky left-0 bg-surface-200/50">
                        Mes
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-surface-600">
                        Total
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-surface-600">
                        Rendimiento
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {projections.map((p) => (
                      <tr key={p.month} className="table-row">
                        <td className="px-4 py-2.5 font-medium text-surface-800 sticky left-0 bg-surface-100/80">
                          {p.label}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-surface-900">
                          {formatMoney(p.total)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono">
                          <span
                            className={
                              p.totalReturn >= 0
                                ? "text-accent-emerald"
                                : "text-accent-rose"
                            }
                          >
                            {p.totalReturn >= 0 ? "+" : ""}
                            {formatMoney(p.totalReturn)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Balance corrections */}
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-surface-300/30 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                <div>
                  <h3 className="section-title">Ajustar saldos actuales</h3>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Si el saldo real difiere de la proyección, registra un ajuste.
                  </p>
                </div>
              </div>
              <div className="divide-y divide-surface-200/50">
                {accountSummaries.map((s) => (
                  <div key={s.account.id} className="flex items-center gap-4 px-4 py-3">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: s.account.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900">{s.account.institution} — {s.account.subAccount}</p>
                      <p className="text-xs text-surface-500 font-mono">{formatMoney(s.currentBalance)}</p>
                    </div>
                    <button
                      onClick={() => setCorrectingAccount({
                        id: s.account.id,
                        name: `${s.account.institution} — ${s.account.subAccount}`,
                        currentBalance: s.currentBalance,
                      })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-surface-600 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Corregir saldo
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "whatif" && (
          <WhatIfSimulator
            accounts={accounts}
            accountSummaries={accountSummaries}
          />
        )}

        {activeTab === "budget" && <BudgetTab />}
        {activeTab === "income" && <IncomeTab />}
        {activeTab === "expenses" && <ExpensesTab />}
        {activeTab === "debts" && <DebtsTab />}
        {activeTab === "settings" && <DataManager />}
      </main>

      {/* Balance Correction Modal */}
      {correctingAccount && (
        <BalanceCorrectionModal
          accountId={correctingAccount.id}
          accountName={correctingAccount.name}
          currentBalance={correctingAccount.currentBalance}
          onClose={() => setCorrectingAccount(null)}
          onSave={(accountId, targetBalance, currentBalance, date) => {
            const diff = targetBalance - currentBalance;
            if (diff === 0) {
              setCorrectingAccount(null);
              return;
            }
            store.addMovement({
              accountId,
              date,
              type: diff > 0 ? "deposit" : "withdrawal",
              amount: Math.abs(diff),
              notes: "Ajuste de saldo",
            });
            toast.success("Ajuste registrado");
            setCorrectingAccount(null);
          }}
        />
      )}

      {/* Add Movement Modal */}
      {showAddMovement && (
        <AddMovementModal
          accounts={accounts}
          onClose={() => setShowAddMovement(false)}
          onAdd={(movement) => {
            store.addMovement(movement);
            setShowAddMovement(false);
            toast.success("Movimiento registrado");
          }}
        />
      )}
    </div>
  );
}

function BalanceCorrectionModal({
  accountId,
  accountName,
  currentBalance,
  onClose,
  onSave,
}: {
  accountId: string;
  accountName: string;
  currentBalance: number;
  onClose: () => void;
  onSave: (accountId: string, targetBalance: number, currentBalance: number, date: string) => void;
}) {
  const [targetBalance, setTargetBalance] = useState(currentBalance.toFixed(2));
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const diff = parseFloat(targetBalance) - currentBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(accountId, parseFloat(targetBalance), currentBalance, date);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card-elevated p-6 w-full max-w-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Corregir saldo</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-300/50 transition-colors">
            <X className="w-4 h-4 text-surface-500" />
          </button>
        </div>
        <p className="text-sm text-surface-600 mb-4">{accountName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">
              Saldo proyectado actual
            </label>
            <p className="font-mono text-sm text-surface-700">{formatMoney(currentBalance)}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">
              Saldo real (actual)
            </label>
            <input
              type="number"
              value={targetBalance}
              onChange={(e) => setTargetBalance(e.target.value)}
              className="input-field"
              min="0"
              step="0.01"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Fecha del ajuste</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" required />
          </div>
          {!isNaN(diff) && diff !== 0 && (
            <div className={`p-3 rounded-lg text-sm ${diff > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
              Se registrará un {diff > 0 ? "depósito" : "retiro"} de {formatMoney(Math.abs(diff))} como ajuste.
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Guardar ajuste</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  gradient,
  iconColor,
  positive,
}: {
  label: string;
  value: string;
  subValue?: string;
  icon: typeof TrendingUp;
  gradient: string;
  iconColor: string;
  positive?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-5 bg-gradient-to-br ${gradient} relative overflow-hidden`}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="stat-label">{label}</span>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <p className="stat-value text-surface-950">{value}</p>
        {subValue && (
          <p className="text-xs mt-1 flex items-center gap-1">
            {positive && (
              <ArrowUpRight className="w-3 h-3 text-accent-emerald" />
            )}
            <span className={positive ? "text-accent-emerald" : "text-surface-500"}>
              {subValue}
            </span>
          </p>
        )}
      </div>
    </motion.div>
  );
}
