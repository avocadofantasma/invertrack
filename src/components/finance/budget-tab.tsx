"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Target,
  Sparkles,
  CreditCard,
  X,
  ChevronRight as ChevronRightSm,
  Check,
  Search,
  Link2,
  Link2Off,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { formatMoney } from "@/lib/utils";
import {
  getCurrentMonth,
  getMonthDisplayLabel,
  generateBudgetTemplate,
  calculateBudgetActuals,
  getCCSpendingByCategory,
} from "@/lib/finance-utils";
import { toast } from "sonner";
import type { MonthlyBudget, BudgetLineItem, CreditCard as CreditCardData, CreditCardStatement, IncomeSource, FixedExpense, Loan, CCLinkedTransaction } from "@/lib/types";
import type { CCCategorySpending } from "@/lib/finance-utils";

export function BudgetTab() {
  const store = useStore();
  const {
    monthlyBudgets,
    incomeSources,
    fixedExpenses,
    incomeEntries,
    expenseEntries,
    creditCards,
    creditCardStatements,
    loanPayments,
    loans,
  } = store;

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  // Auto-generate budget for any month that doesn't have one yet
  useEffect(() => {
    const exists = monthlyBudgets.some((b) => b.month === selectedMonth);
    if (!exists) {
      const template = generateBudgetTemplate(selectedMonth, incomeSources, fixedExpenses);
      store.addMonthlyBudget(template);
    }
  }, [selectedMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync fixedExpenses changes into the existing budget for the selected month.
  // Preserves manually-added items, CC links, and actual spending data.
  useEffect(() => {
    const existing = monthlyBudgets.find((b) => b.month === selectedMonth);
    if (!existing) return;

    // Update budgeted amount / timesPerMonth for items that match a fixedExpense by name
    let synced = existing.expenseLimits.map((limit) => {
      const match = fixedExpenses.find((e) => e.name === limit.name);
      if (!match) return limit;
      return {
        ...limit,
        budgeted: match.expectedAmount,
        timesPerMonth: match.timesPerMonth || 1,
        category: match.category,
      };
    });

    // Add fixedExpenses that are enabled but have no matching limit yet
    const existingNames = new Set(existing.expenseLimits.map((l) => l.name));
    for (const expense of fixedExpenses.filter((e) => e.enabled)) {
      if (!existingNames.has(expense.name)) {
        synced = [
          ...synced,
          {
            id: crypto.randomUUID(),
            name: expense.name,
            category: expense.category,
            budgeted: expense.expectedAmount,
            actual: 0,
            timesPerMonth: expense.timesPerMonth || 1,
            timesPaid: 0,
          },
        ];
      }
    }

    // Only persist if something actually changed
    if (JSON.stringify(synced) !== JSON.stringify(existing.expenseLimits)) {
      store.updateMonthlyBudget(existing.id, { expenseLimits: synced });
    }
  }, [fixedExpenses, selectedMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  const budget = useMemo(() => {
    const existing = monthlyBudgets.find((b) => b.month === selectedMonth);
    if (existing) {
      return calculateBudgetActuals(existing, incomeEntries, expenseEntries, selectedMonth);
    }
    return null;
  }, [monthlyBudgets, selectedMonth, incomeEntries, expenseEntries]);

  const navigateMonth = (direction: number) => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + direction);
    setSelectedMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const debtPaymentsThisMonth = loanPayments
    .filter((p) => p.date.startsWith(selectedMonth))
    .reduce((sum, p) => sum + p.amount, 0);

  const ccSpendingByCategory = useMemo(
    () => getCCSpendingByCategory(creditCardStatements, selectedMonth),
    [creditCardStatements, selectedMonth]
  );
  const totalCCSpending = ccSpendingByCategory.reduce((sum, c) => sum + c.total, 0);

  const totalBudgetedIncome = incomeSources
    .filter((s) => s.enabled)
    .reduce((sum, s) => {
      const times = s.timesPerMonth || (s.frequency === "biweekly" ? 2 : 1);
      return sum + s.amount * times;
    }, 0);

  const selectedMonthStart = `${selectedMonth}-01`;
  const [smY, smM] = selectedMonth.split("-").map(Number);
  const selectedMonthEnd = smM === 12
    ? `${smY + 1}-01-01`
    : `${smY}-${String(smM + 1).padStart(2, "0")}-01`;
  const totalActualIncome = incomeEntries
    .filter((e) => e.date >= selectedMonthStart && e.date < selectedMonthEnd)
    .reduce((sum, e) => sum + e.amount, 0);
  const totalBudgetedExpenses = budget
    ? budget.expenseLimits.reduce((sum, t) => sum + t.budgeted, 0)
    : 0;
  const totalActualExpenses = budget
    ? budget.expenseLimits.reduce((sum, t) => sum + t.actual, 0)
    : 0;

  // Deduct CC-covered fixed expenses from CC total to avoid double-counting
  const ccCoveredByFixed = budget
    ? budget.expenseLimits
        .filter((item) => item.paidViaCC)
        .reduce((sum, item) => sum + (item.paidViaCCAmount ?? item.budgeted), 0)
    : 0;
  const netCCSpending = Math.max(totalCCSpending - ccCoveredByFixed, 0);

  const totalAllExpenses = totalActualExpenses + debtPaymentsThisMonth + netCCSpending;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigateMonth(-1)} className="btn-ghost">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <h3 className="section-title capitalize">
            {getMonthDisplayLabel(selectedMonth)}
          </h3>
          {selectedMonth === getCurrentMonth() && (
            <span className="text-xs text-brand-400 font-medium">Mes actual</span>
          )}
        </div>
        <button onClick={() => navigateMonth(1)} className="btn-ghost">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {!budget ? (
        <div className="glass-card p-8 text-center">
          <Sparkles className="w-8 h-8 text-surface-400 mx-auto animate-pulse" />
        </div>
      ) : (
        <>
          {/* Overview */}
          <BudgetOverview
            totalBudgetedIncome={totalBudgetedIncome}
            totalActualIncome={totalActualIncome}
            totalBudgetedExpenses={totalBudgetedExpenses}
            totalAllExpenses={totalAllExpenses}
            totalActualExpenses={totalActualExpenses}
            debtPaymentsThisMonth={debtPaymentsThisMonth}
            totalCCSpending={netCCSpending}
          />

          {/* Projection Pie */}
          <BudgetProjectionPie
            incomeSources={incomeSources}
            expenseLimits={budget.expenseLimits}
            loans={loans}
          />

          {/* Expense breakdown */}
          <BudgetSection
            title="Gastos fijos"
            items={budget.expenseLimits}
            type="expense"
            creditCards={creditCards}
            creditCardStatements={creditCardStatements}
            selectedMonth={selectedMonth}
            onUpdateItem={(itemId, updates) => {
              const updatedLimits = budget.expenseLimits.map((t) =>
                t.id === itemId ? { ...t, ...updates } : t
              );
              store.updateMonthlyBudget(budget.id, { expenseLimits: updatedLimits });
            }}
            onAddItem={(item) => {
              store.updateMonthlyBudget(budget.id, {
                expenseLimits: [...budget.expenseLimits, item],
              });
            }}
            onDeleteItem={(itemId) => {
              store.updateMonthlyBudget(budget.id, {
                expenseLimits: budget.expenseLimits.filter((t) => t.id !== itemId),
              });
            }}
            onMarkCCPaid={(itemId, amount, cardId, transactionId, transactionDesc) => {
              const updatedLimits = budget.expenseLimits.map((t) => {
                if (t.id !== itemId) return t;
                const existing = t.ccTransactions ?? [];
                // Avoid duplicates
                if (existing.some((tx) => tx.transactionId === transactionId)) return t;
                const newTx: CCLinkedTransaction = {
                  transactionId: transactionId!,
                  cardId: cardId!,
                  transactionDesc: transactionDesc!,
                  amount,
                };
                const ccTransactions = [...existing, newTx];
                return {
                  ...t,
                  paidViaCC: true,
                  paidViaCCAmount: ccTransactions.reduce((s, tx) => s + tx.amount, 0),
                  ccTransactions,
                };
              });
              store.updateMonthlyBudget(budget.id, { expenseLimits: updatedLimits });
            }}
            onUnmarkCCPaid={(itemId, txId) => {
              const updatedLimits = budget.expenseLimits.map((t) => {
                if (t.id !== itemId) return t;
                if (!txId) {
                  // Clear all
                  return {
                    ...t,
                    paidViaCC: false,
                    paidViaCCAmount: undefined,
                    paidViaCCCardId: undefined,
                    paidViaCCTransactionId: undefined,
                    paidViaCCTransactionDesc: undefined,
                    ccTransactions: [],
                  };
                }
                // Remove specific transaction
                const ccTransactions = (t.ccTransactions ?? []).filter(
                  (tx) => tx.transactionId !== txId
                );
                return {
                  ...t,
                  paidViaCC: ccTransactions.length > 0,
                  paidViaCCAmount: ccTransactions.reduce((s, tx) => s + tx.amount, 0) || undefined,
                  ccTransactions,
                };
              });
              store.updateMonthlyBudget(budget.id, { expenseLimits: updatedLimits });
            }}
          />

          {/* Credit card payment status */}
          <CCPaymentStatusSection
            creditCards={creditCards}
            creditCardStatements={creditCardStatements}
            selectedMonth={selectedMonth}
          />

          {/* Credit card spending breakdown */}
          {ccSpendingByCategory.length > 0 && (
            <CCSpendingSection items={ccSpendingByCategory} expenseLimits={budget.expenseLimits} />
          )}

          {/* Delete budget */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                store.deleteMonthlyBudget(budget.id);
                toast.success("Presupuesto eliminado");
              }}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Eliminar presupuesto
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────

function DonutGauge({
  value,
  max,
  color,
  label,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
}) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const data = [{ v: pct }, { v: 1 - pct }];
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-28 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={52}
              startAngle={90}
              endAngle={-270}
              dataKey="v"
              strokeWidth={0}
            >
              <Cell fill={color} />
              <Cell fill="rgba(255,255,255,0.06)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color }}>
            {Math.round(pct * 100)}%
          </span>
        </div>
      </div>
      <p className="text-[11px] font-medium text-surface-600 text-center">{label}</p>
    </div>
  );
}

function BudgetOverview({
  totalBudgetedIncome,
  totalActualIncome,
  totalBudgetedExpenses,
  totalAllExpenses,
  totalActualExpenses,
  debtPaymentsThisMonth,
  totalCCSpending,
}: {
  totalBudgetedIncome: number;
  totalActualIncome: number;
  totalBudgetedExpenses: number;
  totalAllExpenses: number;
  totalActualExpenses: number;
  debtPaymentsThisMonth: number;
  totalCCSpending: number;
}) {
  const balance = totalActualIncome - totalAllExpenses;
  // Compare expenses vs total expected income (end-of-month view)
  const expensePct = totalBudgetedIncome > 0 ? totalAllExpenses / totalBudgetedIncome : 0;
  const expenseColor =
    expensePct >= 1 ? "#f87171" : expensePct >= 0.8 ? "#fb923c" : "#fbbf24";

  const pendingIncome = totalBudgetedIncome - totalActualIncome;

  // Stacked bar
  const barTotal = totalAllExpenses || 1;
  const fixedPct = (totalActualExpenses / barTotal) * 100;
  const loanPct = (debtPaymentsThisMonth / barTotal) * 100;
  const ccPct = (totalCCSpending / barTotal) * 100;

  return (
    <div className="glass-card p-5 space-y-5">
      <div className="grid grid-cols-3 gap-2 items-center">
        {/* Income gauge */}
        <div className="flex flex-col items-center gap-1">
          <DonutGauge
            value={totalActualIncome}
            max={totalBudgetedIncome}
            color="#34d399"
            label="Ingreso cobrado"
          />
          <p className="font-mono text-sm font-semibold text-surface-900">
            {formatMoney(totalActualIncome)}
          </p>
          <p className="text-[11px] text-surface-500">de {formatMoney(totalBudgetedIncome)}</p>
        </div>

        {/* Balance center */}
        <div className="flex flex-col items-center gap-1.5 text-center px-2">
          <p className="text-[9px] uppercase tracking-widest text-surface-500 font-medium">
            Balance disponible
          </p>
          <p
            className={`font-mono text-2xl font-bold leading-none ${
              balance >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatMoney(balance)}
          </p>
          <p className="text-[10px] text-surface-500">ingresos − gastos</p>
          {pendingIncome > 0 && (
            <div className="mt-1 rounded-lg bg-surface-200/40 px-2.5 py-1.5 w-full">
              <p className="text-[9px] uppercase tracking-wider text-surface-500">
                Pendiente cobrar
              </p>
              <p className="font-mono text-xs font-semibold text-cyan-400">
                +{formatMoney(pendingIncome)}
              </p>
            </div>
          )}
        </div>

        {/* Expense gauge */}
        <div className="flex flex-col items-center gap-1">
          <DonutGauge
            value={totalAllExpenses}
            max={totalBudgetedIncome}
            color={expenseColor}
            label="Del ingreso total gastado"
          />
          <p className="font-mono text-sm font-semibold text-surface-900">
            {formatMoney(totalAllExpenses)}
          </p>
          <p className="text-[11px] text-surface-500">
            de {formatMoney(totalBudgetedIncome)} esperado
          </p>
        </div>
      </div>

      {/* Expense composition bar */}
      {totalAllExpenses > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-wider text-surface-500 mb-2">
            Composición de gastos
          </p>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
            {totalActualExpenses > 0 && (
              <div
                className="bg-amber-400"
                style={{ width: `${fixedPct}%` }}
              />
            )}
            {debtPaymentsThisMonth > 0 && (
              <div
                className="bg-rose-400"
                style={{ width: `${loanPct}%` }}
              />
            )}
            {totalCCSpending > 0 && (
              <div
                className="bg-violet-400"
                style={{ width: `${ccPct}%` }}
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            {totalActualExpenses > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="text-[10px] text-surface-500">
                  Fijos {formatMoney(totalActualExpenses)}
                </span>
              </div>
            )}
            {debtPaymentsThisMonth > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                <span className="text-[10px] text-surface-500">
                  Préstamos {formatMoney(debtPaymentsThisMonth)}
                </span>
              </div>
            )}
            {totalCCSpending > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                <span className="text-[10px] text-surface-500">
                  Tarjetas {formatMoney(totalCCSpending)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CC Payment Status ────────────────────────────────────────────────────────

function CCPaymentStatusSection({
  creditCards,
  creditCardStatements,
  selectedMonth,
}: {
  creditCards: CreditCardData[];
  creditCardStatements: CreditCardStatement[];
  selectedMonth: string;
}) {
  const monthStatements = creditCardStatements.filter(
    (s) => s.month === selectedMonth
  );
  if (monthStatements.length === 0) return null;

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-surface-300/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-violet-400" />
          <h3 className="section-title">Tarjetas de crédito — {selectedMonth}</h3>
        </div>
        <p className="text-[11px] text-surface-500">Paga en Egresos → Deudas</p>
      </div>
      <div className="divide-y divide-surface-200/50">
        {monthStatements.map((stmt) => {
          const card = creditCards.find((c) => c.id === stmt.cardId);
          const isPartial =
            stmt.paid &&
            stmt.paidAmount !== undefined &&
            stmt.paidAmount < stmt.totalBalance;
          return (
            <div key={stmt.id} className="flex items-center gap-4 px-4 py-3">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: card?.color ?? "#71717a" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900">{card?.name ?? stmt.cardId}</p>
                <p className="text-xs text-surface-500">
                  Vence: {stmt.dueDate} · Mín: {formatMoney(stmt.minimumPayment)}
                </p>
                {isPartial && (
                  <p className="text-[11px] text-amber-400">
                    Pago parcial: {formatMoney(stmt.paidAmount!)} · Restante: {formatMoney(stmt.totalBalance - stmt.paidAmount!)}
                  </p>
                )}
              </div>
              <p className="font-mono text-sm font-semibold text-surface-900 shrink-0">
                {formatMoney(stmt.totalBalance)}
              </p>
              {stmt.paid ? (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 shrink-0">
                  <Check className="w-3 h-3" />
                  {isPartial ? "Parcial" : "Pagada"}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 shrink-0">
                  Pendiente
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CC Section with drawer ───────────────────────────────────────────────────

const CC_CATEGORY_LABELS: Record<string, string> = {
  food: "Comida",
  health: "Salud",
  shopping: "Compras",
  entertainment: "Entretenimiento",
  transport: "Transporte",
  services: "Servicios",
  other: "Otros",
};

function CCSpendingSection({ items, expenseLimits }: { items: CCCategorySpending[]; expenseLimits: BudgetLineItem[] }) {
  const [drawerCategory, setDrawerCategory] = useState<string | null>(null);
  const total = items.reduce((sum, i) => sum + i.total, 0);
  const max = items[0]?.total ?? 1;
  const drawerItem = items.find((i) => i.category === drawerCategory) ?? null;

  // Build a map of transactionId → expense name for quick lookup
  const txToExpense = useMemo(() => {
    const map = new Map<string, string>();
    for (const limit of expenseLimits) {
      for (const tx of limit.ccTransactions ?? []) {
        map.set(tx.transactionId, limit.name);
      }
      // Legacy single-tx support
      if (limit.paidViaCCTransactionId && !map.has(limit.paidViaCCTransactionId)) {
        map.set(limit.paidViaCCTransactionId, limit.name);
      }
    }
    return map;
  }, [expenseLimits]);

  return (
    <>
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-surface-300/30">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-violet-400" />
            <h3 className="section-title">Tarjetas de Crédito</h3>
          </div>
          <p className="text-xs text-surface-500 mt-0.5">
            {formatMoney(total)} en{" "}
            {items.reduce((n, i) => n + i.count, 0)} transacciones este mes
          </p>
        </div>
        <div className="divide-y divide-surface-200/50">
          {items.map((item) => {
            const pct = (item.total / max) * 100;
            const label = CC_CATEGORY_LABELS[item.category] ?? item.category;
            return (
              <button
                key={item.category}
                onClick={() => setDrawerCategory(item.category)}
                className="w-full px-4 py-3 hover:bg-surface-200/30 transition-colors text-left"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-surface-900">{label}</span>
                    <span className="badge badge-info text-[10px]">{item.count} txn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-surface-600">
                      {formatMoney(item.total)}
                    </span>
                    <ChevronRightSm className="w-3.5 h-3.5 text-surface-400" />
                  </div>
                </div>
                <div className="w-full h-1.5 bg-surface-300/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-400 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {drawerCategory && drawerItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setDrawerCategory(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl overflow-hidden"
              style={{ background: "var(--color-surface-100, #1a1a2e)", maxHeight: "70vh" }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-surface-400/40" />
              </div>

              {/* Header */}
              <div className="px-5 pb-3 pt-1 border-b border-surface-300/20 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-surface-900">
                    {CC_CATEGORY_LABELS[drawerItem.category] ?? drawerItem.category}
                  </h3>
                  <p className="text-xs text-surface-500">
                    {drawerItem.count} transacciones ·{" "}
                    <span className="font-mono font-semibold text-violet-400">
                      {formatMoney(drawerItem.total)}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setDrawerCategory(null)}
                  className="btn-ghost p-1.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Transaction list */}
              <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 100px)" }}>
                <div className="divide-y divide-surface-200/30">
                  {[...drawerItem.transactions]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((tx) => {
                      const linkedExpense = txToExpense.get(tx.id);
                      return (
                        <div
                          key={tx.id}
                          className="px-5 py-3.5 flex items-center justify-between"
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-sm font-medium text-surface-900 truncate">
                              {tx.description}
                            </p>
                            <p className="text-xs text-surface-500 mt-0.5">{tx.date}</p>
                            {tx.installment && (
                              <p className="text-[10px] text-violet-400 mt-0.5">
                                MSI {tx.installment.current}/{tx.installment.total}
                              </p>
                            )}
                            {linkedExpense && (
                              <div className="flex items-center gap-1 mt-1">
                                <Link2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                                <span className="text-[10px] text-emerald-400 font-medium truncate">
                                  {linkedExpense}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="font-mono text-sm font-semibold text-rose-400">
                              {formatMoney(tx.amount)}
                            </span>
                            {linkedExpense && (
                              <span className="badge text-[9px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                                ligado
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Budget Projection Pie ────────────────────────────────────────────────────

const PIE_COLORS = {
  personal: "#fb7185",   // rose-400
  business: "#22d3ee",   // cyan-400
  loans:    "#f97316",   // orange-400
  surplus:  "#34d399",   // emerald-400
};

function BudgetProjectionPie({
  incomeSources,
  expenseLimits,
  loans,
}: {
  incomeSources: IncomeSource[];
  expenseLimits: BudgetLineItem[];
  loans: Loan[];
}) {
  const totalIncome = incomeSources
    .filter((s) => s.enabled)
    .reduce((sum, s) => {
      const times = s.timesPerMonth || (s.frequency === "biweekly" ? 2 : 1);
      return sum + s.amount * times;
    }, 0);

  const personalTotal = expenseLimits
    .filter((e) => e.category === "personal")
    .reduce((sum, e) => sum + e.budgeted, 0);

  const businessTotal = expenseLimits
    .filter((e) => e.category === "business")
    .reduce((sum, e) => sum + e.budgeted, 0);

  const loansTotal = loans
    .filter((l) => l.enabled)
    .reduce((sum, l) => sum + l.monthlyPayment, 0);

  const totalExpenses = personalTotal + businessTotal + loansTotal;
  const surplus = Math.max(totalIncome - totalExpenses, 0);
  const deficit = totalExpenses > totalIncome ? totalExpenses - totalIncome : 0;

  const slices = [
    { key: "personal", label: "G. Personales", value: personalTotal, color: PIE_COLORS.personal },
    { key: "business", label: "G. Negocio",    value: businessTotal, color: PIE_COLORS.business },
    { key: "loans",    label: "Préstamos",     value: loansTotal,    color: PIE_COLORS.loans    },
    { key: "surplus",  label: "Disponible",    value: surplus,       color: PIE_COLORS.surplus  },
  ].filter((s) => s.value > 0);

  if (totalIncome === 0 && totalExpenses === 0) return null;

  const pieTotal = slices.reduce((s, d) => s + d.value, 0) || 1;
  const pctStr = (v: number) => `${Math.round((v / pieTotal) * 100)}%`;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-brand-400" />
        <h3 className="section-title">Proyección mensual</h3>
      </div>

      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative shrink-0" style={{ width: 140, height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={62}
                startAngle={90}
                endAngle={-270}
                strokeWidth={0}
              >
                {slices.map((s) => (
                  <Cell key={s.key} fill={s.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[9px] uppercase tracking-wider text-surface-500">Ingreso</p>
            <p className="font-mono text-xs font-bold text-surface-900 leading-tight">
              {formatMoney(totalIncome)}
            </p>
          </div>
        </div>

        {/* Legend + amounts */}
        <div className="flex-1 space-y-2">
          {slices.map((s) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-surface-600 flex-1">{s.label}</span>
              <span className="font-mono text-xs font-semibold text-surface-900">{formatMoney(s.value)}</span>
              <span className="text-[10px] text-surface-500 w-8 text-right">{pctStr(s.value)}</span>
            </div>
          ))}
          {deficit > 0 && (
            <div className="mt-2 rounded-lg bg-rose-500/10 px-2.5 py-1.5">
              <p className="text-[10px] text-rose-400 font-medium">
                Déficit proyectado: {formatMoney(deficit)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Budget section ───────────────────────────────────────────────────────────

function BudgetSection({
  title,
  items,
  type,
  creditCards,
  creditCardStatements,
  selectedMonth,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
  onMarkCCPaid,
  onUnmarkCCPaid,
}: {
  title: string;
  items: BudgetLineItem[];
  type: "income" | "expense";
  creditCards?: CreditCardData[];
  creditCardStatements?: CreditCardStatement[];
  selectedMonth?: string;
  onUpdateItem: (id: string, updates: Partial<BudgetLineItem>) => void;
  onAddItem: (item: BudgetLineItem) => void;
  onDeleteItem: (id: string) => void;
  onMarkCCPaid?: (id: string, amount: number, cardId?: string, transactionId?: string, transactionDesc?: string) => void;
  onUnmarkCCPaid?: (id: string, txId?: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBudgeted, setNewBudgeted] = useState("");
  const [newCategory] = useState(type === "income" ? "salary" : "personal");
  const [ccPickerFor, setCCPickerFor] = useState<string | null>(null);
  const [ccSearch, setCCSearch] = useState("");
  const [ccFilterCard, setCCFilterCard] = useState<string | null>(null);
  const [ccFilterCategory, setCCFilterCategory] = useState<string | null>(null);

  const totalBudgeted = items.reduce((sum, i) => sum + i.budgeted, 0);
  const totalActual = items.reduce((sum, i) => sum + i.actual, 0);

  // Build flat list of all transactions in the selected month across all CC statements
  const allTransactions = useMemo(() => {
    if (!creditCardStatements || !selectedMonth) return [];
    return creditCardStatements
      .filter((s) => s.month === selectedMonth)
      .flatMap((s) =>
        s.transactions.map((tx) => ({
          ...tx,
          cardId: s.cardId,
          cardName: creditCards?.find((c) => c.id === s.cardId)?.name ?? s.cardId,
          cardColor: creditCards?.find((c) => c.id === s.cardId)?.color ?? "#71717a",
        }))
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [creditCardStatements, creditCards, selectedMonth]);

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-surface-300/30 flex items-center justify-between">
        <div>
          <h3 className="section-title">{title}</h3>
          <p className="text-xs text-surface-500 mt-0.5">
            {formatMoney(totalActual)} de {formatMoney(totalBudgeted)} presupuestado
          </p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-ghost text-sm">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showAdd && (
        <div className="p-4 bg-surface-200/20 border-b border-surface-300/30 flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-surface-600 mb-1 block">Nombre</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input-field"
              placeholder="Ej: Freelance"
            />
          </div>
          <div className="w-32">
            <label className="text-xs font-medium text-surface-600 mb-1 block">Monto</label>
            <input
              type="number"
              value={newBudgeted}
              onChange={(e) => setNewBudgeted(e.target.value)}
              className="input-field"
              placeholder="0"
              min="0"
            />
          </div>
          <button
            onClick={() => {
              if (newName && newBudgeted) {
                onAddItem({
                  id: crypto.randomUUID(),
                  name: newName,
                  category: newCategory,
                  budgeted: parseFloat(newBudgeted),
                  actual: 0,
                  timesPerMonth: 1,
                  timesPaid: 0,
                });
                setNewName("");
                setNewBudgeted("");
                setShowAdd(false);
              }
            }}
            className="btn-primary py-2.5"
          >
            Agregar
          </button>
        </div>
      )}

      <div className="divide-y divide-surface-200/50">
        {items.map((item) => {
          // Normalise: migrate legacy single-tx fields into ccTransactions array
          const linkedTxs: CCLinkedTransaction[] =
            item.ccTransactions && item.ccTransactions.length > 0
              ? item.ccTransactions
              : item.paidViaCC && item.paidViaCCTransactionId
              ? [
                  {
                    transactionId: item.paidViaCCTransactionId,
                    cardId: item.paidViaCCCardId ?? "",
                    transactionDesc: item.paidViaCCTransactionDesc ?? "",
                    amount: item.paidViaCCAmount ?? item.budgeted,
                  },
                ]
              : [];

          const linkedIds = new Set(linkedTxs.map((t) => t.transactionId));
          const linkedTotal = linkedTxs.reduce((s, tx) => s + tx.amount, 0);

          const pct = item.budgeted > 0 ? (item.actual / item.budgeted) * 100 : 0;
          const isOver = pct > 100;
          const times = item.timesPerMonth || 1;
          const paid = item.timesPaid || 0;
          const barColor =
            type === "income"
              ? "bg-cyan-400"
              : item.paidViaCC
                ? "bg-violet-400"
                : isOver
                  ? "bg-rose-400"
                  : "bg-amber-400";

          // Picker: filter out already-linked transactions, then apply search + chips
          const availableTransactions = allTransactions.filter(
            (tx) => !linkedIds.has(tx.id)
          );
          // Unique cards & categories for filter chips
          const pickerCards = Array.from(
            new Map(availableTransactions.map((tx) => [tx.cardId, { id: tx.cardId, name: tx.cardName, color: tx.cardColor }])).values()
          );
          const pickerCategories = Array.from(
            new Set(availableTransactions.map((tx) => tx.category).filter(Boolean))
          ) as string[];
          const filteredAvailable = availableTransactions.filter((tx) => {
            const matchesSearch =
              !ccSearch.trim() ||
              tx.description.toLowerCase().includes(ccSearch.toLowerCase()) ||
              tx.cardName.toLowerCase().includes(ccSearch.toLowerCase());
            const chipActive = ccFilterCard || ccFilterCategory;
            const matchesChip =
              !chipActive ||
              (ccFilterCard ? tx.cardId === ccFilterCard : false) ||
              (ccFilterCategory ? tx.category === ccFilterCategory : false);
            return matchesSearch && matchesChip;
          });

          return (
            <div key={item.id} className="transition-colors">
              {/* Main row */}
              <div className="flex items-center justify-between px-4 py-3 hover:bg-surface-200/30">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-surface-900 truncate">{item.name}</span>
                  {item.paidViaCC && linkedTxs.length > 0 && (
                    <span className="badge text-[10px] bg-violet-500/20 text-violet-300 border-violet-500/30 shrink-0 flex items-center gap-1">
                      <Link2 className="w-2.5 h-2.5" />
                      {linkedTxs.length > 1 ? `${linkedTxs.length} TDC` : "TDC"}
                    </span>
                  )}
                  {!item.paidViaCC && times > 1 && (
                    <span
                      className={`badge text-[10px] shrink-0 ${
                        paid >= times ? "badge-ok" : paid > 0 ? "badge-warning" : "badge-info"
                      }`}
                    >
                      {paid}/{times} pagos
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-xs text-surface-600">
                    {formatMoney(item.actual)} / {formatMoney(item.budgeted)}
                  </span>
                  {type === "expense" && onMarkCCPaid && onUnmarkCCPaid && (
                    <>
                      {item.paidViaCC && (
                        <button
                          onClick={() => onUnmarkCCPaid(item.id)}
                          className="p-1 rounded hover:bg-rose-500/10"
                          title="Quitar todos los cargos TDC"
                        >
                          <Link2Off className="w-3 h-3 text-violet-400 hover:text-rose-400 transition-colors" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setCCPickerFor(ccPickerFor === item.id ? null : item.id);
                          setCCSearch("");
                          setCCFilterCard(null);
                          setCCFilterCategory(null);
                        }}
                        className="p-1 rounded hover:bg-violet-500/10"
                        title="Ligar cargo de TDC"
                      >
                        <CreditCard
                          className={`w-3 h-3 transition-colors ${
                            ccPickerFor === item.id
                              ? "text-violet-400"
                              : "text-surface-500 hover:text-violet-400"
                          }`}
                        />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1 rounded hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                  </button>
                </div>
              </div>

              {/* Linked transactions list */}
              {linkedTxs.length > 0 && (
                <div className="mx-4 mb-2 -mt-1 space-y-0.5">
                  {linkedTxs.map((tx) => (
                    <div key={tx.transactionId} className="flex items-center gap-1.5 text-[10px] text-violet-400">
                      <Link2 className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate flex-1">{tx.transactionDesc}</span>
                      <span className="shrink-0 font-mono">{formatMoney(tx.amount)}</span>
                      <button
                        onClick={() => onUnmarkCCPaid?.(item.id, tx.transactionId)}
                        className="shrink-0 p-0.5 rounded hover:text-rose-400 transition-colors"
                        title="Desligar este cargo"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  {linkedTxs.length > 1 && (
                    <div className="flex items-center gap-1.5 text-[10px] text-surface-500 pt-0.5 border-t border-violet-500/20">
                      <span className="flex-1 font-medium">Total ligado</span>
                      <span className="font-mono font-semibold text-violet-300">{formatMoney(linkedTotal)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Progress bar */}
              <div className="px-4 pb-3">
                <div className="w-full h-1.5 bg-surface-300/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor} transition-all`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                {isOver && type === "expense" && !item.paidViaCC && (
                  <p className="text-[10px] text-rose-400 mt-0.5">
                    Excedido por {formatMoney(item.actual - item.budgeted)}
                  </p>
                )}
              </div>

              {/* CC Transaction Picker */}
              {ccPickerFor === item.id && (
                <div className="mx-4 mb-3 rounded-xl border border-violet-500/30 bg-violet-500/5 overflow-hidden">
                  <div className="p-3 border-b border-violet-500/20 flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <span className="text-xs font-medium text-violet-300">
                      {linkedTxs.length > 0 ? "Agregar otro cargo" : "Ligar cargo de tarjeta"}
                    </span>
                    {linkedTxs.length > 0 && (
                      <span className="badge text-[10px] bg-violet-500/20 text-violet-300 border-violet-500/30">
                        {linkedTxs.length} ligado{linkedTxs.length > 1 ? "s" : ""}
                      </span>
                    )}
                    <button
                      onClick={() => setCCPickerFor(null)}
                      className="ml-auto p-0.5 text-surface-500 hover:text-surface-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {allTransactions.length === 0 ? (
                    <p className="p-4 text-xs text-surface-500 text-center">
                      No hay cargos de TDC en este mes
                    </p>
                  ) : (
                    <>
                      <div className="p-2 border-b border-violet-500/20 flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-surface-500 shrink-0" />
                        <input
                          autoFocus
                          value={ccSearch}
                          onChange={(e) => setCCSearch(e.target.value)}
                          placeholder="Buscar cargo..."
                          className="flex-1 bg-transparent text-xs text-surface-900 placeholder:text-surface-500 outline-none"
                        />
                        {ccSearch && (
                          <button onClick={() => setCCSearch("")} className="text-surface-500 hover:text-surface-300">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {(pickerCards.length > 1 || pickerCategories.length > 0) && (
                        <div className="px-2 py-1.5 border-b border-violet-500/20 flex flex-wrap gap-1">
                          {pickerCards.map((card) => (
                            <button
                              key={card.id}
                              onClick={() => setCCFilterCard(ccFilterCard === card.id ? null : card.id)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                                ccFilterCard === card.id
                                  ? "bg-violet-500/30 border-violet-400 text-violet-200"
                                  : "bg-surface-300/20 border-surface-400/30 text-surface-500 hover:border-violet-400/50"
                              }`}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: card.color }}
                              />
                              {card.name}
                            </button>
                          ))}
                          {pickerCategories.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setCCFilterCategory(ccFilterCategory === cat ? null : cat)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                                ccFilterCategory === cat
                                  ? "bg-violet-500/30 border-violet-400 text-violet-200"
                                  : "bg-surface-300/20 border-surface-400/30 text-surface-500 hover:border-violet-400/50"
                              }`}
                            >
                              {CC_CATEGORY_LABELS[cat] ?? cat}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="max-h-48 overflow-y-auto scrollbar-thin divide-y divide-violet-500/10">
                        {filteredAvailable.map((tx) => (
                          <button
                            key={tx.id}
                            onClick={() => {
                              onMarkCCPaid?.(item.id, tx.amount, tx.cardId, tx.id, `${tx.cardName} · ${tx.description}`);
                              setCCSearch("");
                              // Keep picker open, keep chips active to add more
                            }}
                            className="w-full px-3 py-2.5 hover:bg-violet-500/10 transition-colors text-left flex items-center gap-3"
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: tx.cardColor }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-surface-900 truncate">{tx.description}</p>
                              <p className="text-[10px] text-surface-500">{tx.cardName} · {tx.date}</p>
                            </div>
                            <span className="font-mono text-xs font-semibold text-rose-400 shrink-0">
                              {formatMoney(tx.amount)}
                            </span>
                          </button>
                        ))}
                        {filteredAvailable.length === 0 && (
                          <p className="p-3 text-xs text-surface-500 text-center">
                            {availableTransactions.length === 0
                              ? "Todos los cargos ya están ligados"
                              : "Sin resultados"}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
