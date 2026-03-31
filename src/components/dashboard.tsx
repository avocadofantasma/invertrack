"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Settings,
  Calculator,
  CreditCard,
  DollarSign,
  Receipt,
  PieChart,
  SlidersHorizontal,
  X,
  ArrowRight,
  BarChart3,
  List,
  Landmark,
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

type MainSection = "dinero" | "ingresos" | "egresos";
type DineroTab = "resumen" | "movimientos" | "proyecciones" | "simulador";
type EgresosTab = "presupuesto" | "gastos" | "deudas";

export function Dashboard() {
  const [section, setSection] = useState<MainSection>("dinero");
  const [dineroTab, setDineroTab] = useState<DineroTab>("resumen");
  const [egresosTab, setEgresosTab] = useState<EgresosTab>("presupuesto");
  const [showAddMovement, setShowAddMovement] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [correctingAccount, setCorrectingAccount] = useState<{
    id: string;
    name: string;
    currentBalance: number;
  } | null>(null);

  const store = useStore();
  const {
    accounts,
    movements,
    initialBalances,
    monthlyContributions,
    marketData,
    incomeEntries,
    expenseEntries,
    creditCardStatements,
    loanPayments,
  } = store;

  useAllMarketData(accounts);

  const accountSummaries = useMemo(
    () => accounts.map((a) => buildAccountSummary(a, movements, initialBalances, marketData)),
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

  const totalBalance = accountSummaries.reduce((s, a) => s + a.currentBalance, 0);
  const totalMonthlyReturn = accountSummaries.reduce((s, a) => s + a.monthlyReturn, 0);

  // Cash flow for current month
  const currentMonth = new Date().toISOString().slice(0, 7);
  const incomeThisMonth = useMemo(
    () => incomeEntries.filter((e) => e.date.startsWith(currentMonth)).reduce((s, e) => s + e.amount, 0),
    [incomeEntries, currentMonth]
  );
  const expensesThisMonth = useMemo(
    () => expenseEntries.filter((e) => e.date.startsWith(currentMonth)).reduce((s, e) => s + e.amount, 0),
    [expenseEntries, currentMonth]
  );
  const ccPaidThisMonth = useMemo(
    () => creditCardStatements.filter((s) => s.paid && s.paidDate?.startsWith(currentMonth)).reduce((sum, s) => sum + (s.paidAmount ?? s.totalBalance), 0),
    [creditCardStatements, currentMonth]
  );
  const loansPaidThisMonth = useMemo(
    () => loanPayments.filter((p) => p.date.startsWith(currentMonth)).reduce((s, p) => s + p.amount, 0),
    [loanPayments, currentMonth]
  );
  const totalOutThisMonth = expensesThisMonth + ccPaidThisMonth + loansPaidThisMonth;
  const netCashFlow = incomeThisMonth - totalOutThisMonth;

  const DINERO_TABS: { id: DineroTab; label: string; icon: typeof BarChart3 }[] = [
    { id: "resumen", label: "Resumen", icon: BarChart3 },
    { id: "movimientos", label: "Movimientos", icon: List },
    { id: "proyecciones", label: "Proyecciones", icon: TrendingUp },
    { id: "simulador", label: "Simulador", icon: Calculator },
  ];

  const EGRESOS_TABS: { id: EgresosTab; label: string; icon: typeof PieChart }[] = [
    { id: "presupuesto", label: "Presupuesto", icon: PieChart },
    { id: "gastos", label: "Gastos fijos", icon: Receipt },
    { id: "deudas", label: "Deudas", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-surface-0/80 border-b border-surface-300/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display text-base font-bold text-surface-950 hidden sm:block">
                Inver<span className="text-gradient">track</span>
              </span>
            </div>

            {/* Main section tabs */}
            <nav className="flex items-center gap-1">
              {(["dinero", "ingresos", "egresos"] as MainSection[]).map((s) => {
                const icons = { dinero: Landmark, ingresos: DollarSign, egresos: Receipt };
                const labels = { dinero: "Dinero", ingresos: "Ingresos", egresos: "Egresos" };
                const Icon = icons[s];
                return (
                  <button
                    key={s}
                    onClick={() => setSection(s)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      section === s && !showSettings
                        ? "bg-brand-500/20 text-brand-400"
                        : "text-surface-500 hover:text-surface-700 hover:bg-surface-200/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{labels[s]}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddMovement(true)}
                className="btn-primary text-sm py-1.5 px-3"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Movimiento</span>
              </button>
              <button
                onClick={() => setShowSettings((v) => !v)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  showSettings ? "bg-brand-500/20 text-brand-400" : "hover:bg-surface-200/50 text-surface-500"
                )}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-navigation */}
          {!showSettings && (
            <div className="flex gap-0.5 -mb-px pb-px overflow-x-auto scrollbar-thin">
              {section === "dinero" && DINERO_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setDineroTab(id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-all",
                    dineroTab === id
                      ? "border-brand-500 text-brand-400"
                      : "border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-400"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
              {section === "ingresos" && (
                <div className="flex items-center px-3 py-2">
                  <span className="text-xs text-surface-500">Fuentes · Historial · Presupuesto</span>
                </div>
              )}
              {section === "egresos" && EGRESOS_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setEgresosTab(id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-all",
                    egresosTab === id
                      ? "border-brand-500 text-brand-400"
                      : "border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-400"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Settings override */}
        {showSettings && <DataManager />}

        {!showSettings && (
          <>
            {/* Reminders */}
            {(section === "dinero" || section === "ingresos" || section === "egresos") && (
              <RemindersBanner />
            )}

            {/* ── DINERO ── */}
            {section === "dinero" && dineroTab === "resumen" && (
              <DineroResumen
                totalBalance={totalBalance}
                totalMonthlyReturn={totalMonthlyReturn}
                incomeThisMonth={incomeThisMonth}
                totalOutThisMonth={totalOutThisMonth}
                netCashFlow={netCashFlow}
                expensesThisMonth={expensesThisMonth}
                ccPaidThisMonth={ccPaidThisMonth}
                loansPaidThisMonth={loansPaidThisMonth}
                accountSummaries={accountSummaries}
                institutionSummaries={institutionSummaries}
                projections={projections}
                accounts={accounts}
              />
            )}

            {section === "dinero" && dineroTab === "movimientos" && (
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

            {section === "dinero" && dineroTab === "proyecciones" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="glass-card p-6">
                  <h3 className="section-title mb-4">Proyección a 12 meses por sub-cuenta</h3>
                  <ProjectionsChart projections={projections} accounts={accounts} height={400} detailed />
                </div>
                <div className="glass-card overflow-hidden">
                  <div className="p-4 border-b border-surface-300/30">
                    <h3 className="section-title">Detalle mensual</h3>
                  </div>
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-surface-200/50">
                          <th className="text-left px-4 py-3 font-medium text-surface-600 sticky left-0 bg-surface-200/50">Mes</th>
                          <th className="text-right px-4 py-3 font-medium text-surface-600">Total</th>
                          <th className="text-right px-4 py-3 font-medium text-surface-600">Rendimiento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projections.map((p) => (
                          <tr key={p.month} className="table-row">
                            <td className="px-4 py-2.5 font-medium text-surface-800 sticky left-0 bg-surface-100/80">{p.label}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-surface-900">{formatMoney(p.total)}</td>
                            <td className="px-4 py-2.5 text-right font-mono">
                              <span className={p.totalReturn >= 0 ? "text-accent-emerald" : "text-accent-rose"}>
                                {p.totalReturn >= 0 ? "+" : ""}{formatMoney(p.totalReturn)}
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
                      <p className="text-xs text-surface-500 mt-0.5">Si el saldo real difiere de la proyección, registra un ajuste.</p>
                    </div>
                  </div>
                  <div className="divide-y divide-surface-200/50">
                    {accountSummaries.map((s) => (
                      <div key={s.account.id} className="flex items-center gap-4 px-4 py-3">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.account.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-surface-900">{s.account.institution} — {s.account.subAccount}</p>
                          <p className="text-xs text-surface-500 font-mono">{formatMoney(s.currentBalance)}</p>
                        </div>
                        <button
                          onClick={() => setCorrectingAccount({ id: s.account.id, name: `${s.account.institution} — ${s.account.subAccount}`, currentBalance: s.currentBalance })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-surface-600 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          Corregir
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {section === "dinero" && dineroTab === "simulador" && (
              <WhatIfSimulator accounts={accounts} accountSummaries={accountSummaries} />
            )}

            {/* ── INGRESOS ── */}
            {section === "ingresos" && <IncomeTab />}

            {/* ── EGRESOS ── */}
            {section === "egresos" && egresosTab === "presupuesto" && <BudgetTab />}
            {section === "egresos" && egresosTab === "gastos" && <ExpensesTab />}
            {section === "egresos" && egresosTab === "deudas" && <DebtsTab />}
          </>
        )}
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
            if (diff === 0) { setCorrectingAccount(null); return; }
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

// ─── Dinero Resumen ───────────────────────────────────────────────────────────

function DineroResumen({
  totalBalance,
  totalMonthlyReturn,
  incomeThisMonth,
  totalOutThisMonth,
  netCashFlow,
  expensesThisMonth,
  ccPaidThisMonth,
  loansPaidThisMonth,
  accountSummaries,
  institutionSummaries,
  projections,
  accounts,
}: {
  totalBalance: number;
  totalMonthlyReturn: number;
  incomeThisMonth: number;
  totalOutThisMonth: number;
  netCashFlow: number;
  expensesThisMonth: number;
  ccPaidThisMonth: number;
  loansPaidThisMonth: number;
  accountSummaries: import("@/lib/types").AccountSummary[];
  institutionSummaries: import("@/lib/types").InstitutionSummary[];
  projections: import("@/lib/types").ProjectionMonth[];
  accounts: import("@/lib/types").Account[];
}) {
  const proj12 = projections[12]?.total ?? totalBalance;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Hero stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total en cuentas"
          value={formatMoney(totalBalance)}
          icon={Wallet}
          gradient="from-brand-500/20 to-accent-cyan/10"
          iconColor="text-brand-400"
        />
        <StatCard
          label="Rendimiento mensual"
          value={formatMoney(totalMonthlyReturn)}
          icon={PiggyBank}
          gradient="from-accent-emerald/20 to-brand-500/10"
          iconColor="text-accent-emerald"
          positive
        />
        <StatCard
          label="Entradas este mes"
          value={formatMoney(incomeThisMonth)}
          icon={ArrowUpRight}
          gradient="from-cyan-500/20 to-emerald-500/10"
          iconColor="text-cyan-400"
          positive
        />
        <StatCard
          label="Salidas este mes"
          value={formatMoney(totalOutThisMonth)}
          icon={ArrowDownRight}
          gradient="from-rose-500/20 to-orange-500/10"
          iconColor="text-rose-400"
        />
      </div>

      {/* Cash flow summary */}
      {(incomeThisMonth > 0 || totalOutThisMonth > 0) && (
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="section-title">Flujo de dinero — este mes</h3>
            <span className={cn("font-mono text-sm font-bold", netCashFlow >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {netCashFlow >= 0 ? "+" : ""}{formatMoney(netCashFlow)} neto
            </span>
          </div>

          {/* Visual flow bar */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-[10px] text-surface-500 mb-1">
                  <span>Entradas</span>
                  <span className="font-mono text-emerald-400">{formatMoney(incomeThisMonth)}</span>
                </div>
                <div className="h-2 bg-surface-300/40 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: "100%" }} />
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-surface-400 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-[10px] text-surface-500 mb-1">
                  <span>Salidas</span>
                  <span className="font-mono text-rose-400">{formatMoney(totalOutThisMonth)}</span>
                </div>
                <div className="h-2 bg-surface-300/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-400 rounded-full"
                    style={{ width: `${incomeThisMonth > 0 ? Math.min((totalOutThisMonth / incomeThisMonth) * 100, 100) : 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          {totalOutThisMonth > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {expensesThisMonth > 0 && (
                <span className="text-[11px] text-surface-500">
                  Gastos: <span className="font-mono text-surface-700">{formatMoney(expensesThisMonth)}</span>
                </span>
              )}
              {ccPaidThisMonth > 0 && (
                <span className="text-[11px] text-surface-500">
                  Tarjetas: <span className="font-mono text-surface-700">{formatMoney(ccPaidThisMonth)}</span>
                </span>
              )}
              {loansPaidThisMonth > 0 && (
                <span className="text-[11px] text-surface-500">
                  Préstamos: <span className="font-mono text-surface-700">{formatMoney(loansPaidThisMonth)}</span>
                </span>
              )}
            </div>
          )}

          {incomeThisMonth === 0 && totalOutThisMonth === 0 && (
            <p className="text-xs text-surface-500 text-center py-2">
              Registra ingresos o gastos para ver el flujo mensual.
            </p>
          )}
        </div>
      )}

      {/* Accounts table */}
      <AccountsTable summaries={accountSummaries} institutionSummaries={institutionSummaries} />

      {/* Mini projection chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Crecimiento proyectado</h3>
          <span className="text-xs text-surface-500 font-mono">
            +{formatMoney(proj12 - totalBalance)} en 12 meses
          </span>
        </div>
        <ProjectionsChart projections={projections} accounts={accounts} height={260} />
      </div>
    </motion.div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

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
            {positive && <ArrowUpRight className="w-3 h-3 text-accent-emerald" />}
            <span className={positive ? "text-accent-emerald" : "text-surface-500"}>{subValue}</span>
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Balance Correction Modal ─────────────────────────────────────────────────

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
            <label className="text-xs font-medium text-surface-600 mb-1 block">Saldo proyectado actual</label>
            <p className="font-mono text-sm text-surface-700">{formatMoney(currentBalance)}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Saldo real</label>
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
