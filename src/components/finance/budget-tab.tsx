"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Target,
  PiggyBank,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { formatMoney } from "@/lib/utils";
import {
  getCurrentMonth,
  getMonthDisplayLabel,
  generateBudgetTemplate,
  calculateBudgetActuals,
} from "@/lib/finance-utils";
import { toast } from "sonner";
import type { MonthlyBudget, BudgetLineItem } from "@/lib/types";

export function BudgetTab() {
  const store = useStore();
  const {
    monthlyBudgets,
    incomeSources,
    fixedExpenses,
    incomeEntries,
    expenseEntries,
    creditCardStatements,
    loanPayments,
    loans,
  } = store;

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const budget = useMemo(() => {
    const existing = monthlyBudgets.find((b) => b.month === selectedMonth);
    if (existing) {
      return calculateBudgetActuals(existing, incomeEntries, expenseEntries, selectedMonth);
    }
    return null;
  }, [monthlyBudgets, selectedMonth, incomeEntries, expenseEntries]);

  const handleCreateBudget = () => {
    const template = generateBudgetTemplate(selectedMonth, incomeSources, fixedExpenses);
    store.addMonthlyBudget(template);
    toast.success("Presupuesto generado");
  };

  const navigateMonth = (direction: number) => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + direction);
    setSelectedMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  // Calculate totals including debts for the month
  const monthPrefix = selectedMonth;
  const debtPaymentsThisMonth = loanPayments
    .filter((p) => p.date.startsWith(monthPrefix))
    .reduce((sum, p) => sum + p.amount, 0);

  const creditCardPaymentsThisMonth = creditCardStatements
    .filter((s) => s.month === selectedMonth && s.paid && s.paidAmount)
    .reduce((sum, s) => sum + (s.paidAmount || 0), 0);

  const totalBudgetedIncome = budget
    ? budget.incomeTargets.reduce((sum, t) => sum + t.budgeted, 0)
    : 0;
  const totalActualIncome = budget
    ? budget.incomeTargets.reduce((sum, t) => sum + t.actual, 0)
    : 0;
  const totalBudgetedExpenses = budget
    ? budget.expenseLimits.reduce((sum, t) => sum + t.budgeted, 0)
    : 0;
  const totalActualExpenses = budget
    ? budget.expenseLimits.reduce((sum, t) => sum + t.actual, 0)
    : 0;

  const totalAllExpenses = totalActualExpenses + debtPaymentsThisMonth + creditCardPaymentsThisMonth;
  const netBalance = totalActualIncome - totalAllExpenses;

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
        <div className="glass-card p-8 text-center space-y-4">
          <Target className="w-12 h-12 text-surface-400 mx-auto" />
          <div>
            <p className="text-surface-700 font-medium">
              No hay presupuesto para {getMonthDisplayLabel(selectedMonth)}
            </p>
            <p className="text-sm text-surface-500 mt-1">
              Genera uno automáticamente desde tus fuentes de ingreso y gastos fijos configurados.
            </p>
          </div>
          <button onClick={handleCreateBudget} className="btn-primary">
            <Sparkles className="w-4 h-4" />
            Generar presupuesto
          </button>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              label="Ingreso presupuestado"
              value={formatMoney(totalBudgetedIncome)}
              icon={Target}
              gradient="from-emerald-500/10 to-cyan-500/5"
              iconColor="text-emerald-400"
            />
            <SummaryCard
              label="Ingreso real"
              value={formatMoney(totalActualIncome)}
              icon={TrendingUp}
              gradient="from-cyan-500/10 to-violet-500/5"
              iconColor="text-cyan-400"
              diff={totalActualIncome - totalBudgetedIncome}
            />
            <SummaryCard
              label="Gastos presupuestados"
              value={formatMoney(totalBudgetedExpenses)}
              icon={Target}
              gradient="from-rose-500/10 to-orange-500/5"
              iconColor="text-rose-400"
            />
            <SummaryCard
              label="Gastos reales"
              value={formatMoney(totalAllExpenses)}
              icon={TrendingDown}
              gradient="from-amber-500/10 to-rose-500/5"
              iconColor="text-amber-400"
              diff={-(totalAllExpenses - totalBudgetedExpenses)}
            />
          </div>

          {/* Net balance */}
          <div
            className={`glass-card p-5 bg-gradient-to-br ${
              netBalance >= 0
                ? "from-emerald-500/10 to-brand-500/5"
                : "from-rose-500/10 to-amber-500/5"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Balance neto del mes</p>
                <p className="stat-value text-surface-950 mt-2">{formatMoney(netBalance)}</p>
              </div>
              <PiggyBank
                className={`w-8 h-8 ${netBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}
              />
            </div>
            {debtPaymentsThisMonth + creditCardPaymentsThisMonth > 0 && (
              <p className="text-xs text-surface-500 mt-2">
                Incluye {formatMoney(debtPaymentsThisMonth)} en préstamos y{" "}
                {formatMoney(creditCardPaymentsThisMonth)} en tarjetas
              </p>
            )}
          </div>

          {/* Income breakdown */}
          <BudgetSection
            title="Ingresos"
            items={budget.incomeTargets}
            type="income"
            onUpdateItem={(itemId, updates) => {
              const updatedTargets = budget.incomeTargets.map((t) =>
                t.id === itemId ? { ...t, ...updates } : t
              );
              store.updateMonthlyBudget(budget.id, { incomeTargets: updatedTargets });
            }}
            onAddItem={(item) => {
              store.updateMonthlyBudget(budget.id, {
                incomeTargets: [...budget.incomeTargets, item],
              });
            }}
            onDeleteItem={(itemId) => {
              store.updateMonthlyBudget(budget.id, {
                incomeTargets: budget.incomeTargets.filter((t) => t.id !== itemId),
              });
            }}
          />

          {/* Expense breakdown */}
          <BudgetSection
            title="Gastos"
            items={budget.expenseLimits}
            type="expense"
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
          />

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

function SummaryCard({
  label,
  value,
  icon: Icon,
  gradient,
  iconColor,
  diff,
}: {
  label: string;
  value: string;
  icon: typeof Target;
  gradient: string;
  iconColor: string;
  diff?: number;
}) {
  return (
    <div className={`glass-card p-4 bg-gradient-to-br ${gradient}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="stat-label text-[10px]">{label}</span>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <p className="font-mono text-lg font-semibold text-surface-950">{value}</p>
      {diff !== undefined && diff !== 0 && (
        <p className={`text-xs mt-1 font-mono ${diff >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
          {diff >= 0 ? "+" : ""}
          {formatMoney(diff)} vs presupuesto
        </p>
      )}
    </div>
  );
}

function BudgetSection({
  title,
  items,
  type,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
}: {
  title: string;
  items: BudgetLineItem[];
  type: "income" | "expense";
  onUpdateItem: (id: string, updates: Partial<BudgetLineItem>) => void;
  onAddItem: (item: BudgetLineItem) => void;
  onDeleteItem: (id: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBudgeted, setNewBudgeted] = useState("");
  const [newCategory, setNewCategory] = useState(type === "income" ? "salary" : "personal");

  const totalBudgeted = items.reduce((sum, i) => sum + i.budgeted, 0);
  const totalActual = items.reduce((sum, i) => sum + i.actual, 0);

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-surface-300/30 flex items-center justify-between">
        <div>
          <h3 className="section-title">{title}</h3>
          <p className="text-xs text-surface-500 mt-0.5">
            {formatMoney(totalActual)} de {formatMoney(totalBudgeted)} presupuestado
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="btn-ghost text-sm"
        >
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
          const pct = item.budgeted > 0 ? (item.actual / item.budgeted) * 100 : 0;
          const isOver = pct > 100;
          const times = item.timesPerMonth || 1;
          const paid = item.timesPaid || 0;
          const barColor =
            type === "income"
              ? isOver
                ? "bg-emerald-400"
                : "bg-cyan-400"
              : isOver
                ? "bg-rose-400"
                : "bg-amber-400";

          return (
            <div key={item.id} className="px-4 py-3 hover:bg-surface-200/30 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-surface-900">{item.name}</span>
                  {times > 1 && (
                    <span className={`badge text-[10px] ${
                      paid >= times ? "badge-ok" : paid > 0 ? "badge-warning" : "badge-info"
                    }`}>
                      {paid}/{times} pagos
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-surface-500">{item.category}</span>
                  <span className="font-mono text-xs text-surface-600">
                    {formatMoney(item.actual)} / {formatMoney(item.budgeted)}
                  </span>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1 rounded hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                  </button>
                </div>
              </div>
              <div className="w-full h-1.5 bg-surface-300/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor} transition-all`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              {isOver && type === "expense" && (
                <p className="text-[10px] text-rose-400 mt-0.5">
                  Excedido por {formatMoney(item.actual - item.budgeted)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
