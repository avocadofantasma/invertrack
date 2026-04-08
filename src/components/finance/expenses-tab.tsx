"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Zap,
  Wifi,
  Droplets,
  Home,
  Users,
  Gift,
  Edit3,
  Briefcase,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { formatMoney, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { FixedExpense, ExpenseEntry, ExpenseCategory, Account, Movement, InitialBalance } from "@/lib/types";

const EXPENSE_ICONS: Record<string, typeof Zap> = {
  Electricidad: Zap,
  Luz: Zap,
  Agua: Droplets,
  Internet: Wifi,
  Renta: Home,
  Nómina: Users,
  Bono: Gift,
  default: Briefcase,
};

function getExpenseIcon(name: string) {
  for (const [key, icon] of Object.entries(EXPENSE_ICONS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return EXPENSE_ICONS.default;
}

export function ExpensesTab() {
  const store = useStore();
  const { fixedExpenses, expenseEntries, accounts, movements, initialBalances } = store;
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  const [filterCategory, setFilterCategory] = useState<"all" | ExpenseCategory>("all");

  const personalExpenses = fixedExpenses.filter((e) => e.category === "personal");
  const businessExpenses = fixedExpenses.filter((e) => e.category === "business");

  const totalPersonal = personalExpenses
    .filter((e) => e.enabled)
    .reduce((sum, e) => sum + e.expectedAmount, 0);
  const totalBusiness = businessExpenses
    .filter((e) => e.enabled)
    .reduce((sum, e) => sum + e.expectedAmount, 0);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthEntries = expenseEntries.filter((e) => e.date.startsWith(currentMonth));
  const totalSpentThisMonth = thisMonthEntries.reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses =
    filterCategory === "all"
      ? fixedExpenses
      : fixedExpenses.filter((e) => e.category === filterCategory);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="glass-card p-5 bg-gradient-to-br from-rose-500/10 to-orange-500/5">
          <p className="stat-label">Gastos personales/mes</p>
          <p className="stat-value text-surface-950 mt-2">{formatMoney(totalPersonal)}</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-cyan-500/10 to-violet-500/5">
          <p className="stat-label">Gastos negocio/mes</p>
          <p className="stat-value text-surface-950 mt-2">{formatMoney(totalBusiness)}</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-amber-500/10 to-rose-500/5">
          <p className="stat-label">Gastado este mes</p>
          <p className="stat-value text-surface-950 mt-2">{formatMoney(totalSpentThisMonth)}</p>
        </div>
      </div>

      {/* Fixed Expenses */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-surface-300/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="section-title">Gastos fijos</h3>
            <div className="flex gap-1">
              {(["all", "personal", "business"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filterCategory === cat
                      ? "bg-brand-500/20 text-brand-400"
                      : "text-surface-500 hover:bg-surface-200/50"
                  }`}
                >
                  {cat === "all" ? "Todos" : cat === "personal" ? "Personal" : "Negocio"}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              setEditingExpense(null);
              setShowExpenseForm(true);
            }}
            className="btn-primary text-sm py-2"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-surface-500 text-sm">
            No hay gastos fijos configurados
          </div>
        ) : (
          <div className="divide-y divide-surface-200/50">
            {filteredExpenses.map((expense) => {
              const Icon = getExpenseIcon(expense.name);
              return (
                <div
                  key={expense.id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-surface-200/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-surface-200/50 flex items-center justify-center text-surface-600">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900">{expense.name}</p>
                    <p className="text-xs text-surface-500">
                      {expense.category === "personal" ? "Personal" : "Negocio"}
                      {(expense.timesPerMonth || 1) > 1 ? ` · ${expense.timesPerMonth}x/mes` : ""}
                      {expense.dueDay ? ` · Día ${expense.dueDay}` : ""}
                      {expense.notes ? ` · ${expense.notes}` : ""}
                    </p>
                  </div>
                  <p className="font-mono text-sm font-medium text-surface-900">
                    {formatMoney(expense.expectedAmount)}
                  </p>
                  <div className={`w-2 h-2 rounded-full ${expense.enabled ? "bg-emerald-400" : "bg-surface-400"}`} />
                  <button
                    onClick={() => {
                      setEditingExpense(expense);
                      setShowExpenseForm(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-surface-300/50 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-surface-500" />
                  </button>
                  <button
                    onClick={() => {
                      store.deleteFixedExpense(expense.id);
                      toast.success("Gasto eliminado");
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expense Entries */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-surface-300/30 flex items-center justify-between">
          <h3 className="section-title">Gastos registrados</h3>
          <button onClick={() => setShowEntryForm(true)} className="btn-primary text-sm py-2">
            <Plus className="w-4 h-4" />
            Registrar gasto
          </button>
        </div>

        {expenseEntries.length === 0 ? (
          <div className="p-8 text-center text-surface-500 text-sm">
            No hay gastos registrados
          </div>
        ) : (
          <div className="divide-y divide-surface-200/50 max-h-96 overflow-y-auto scrollbar-thin">
            {[...expenseEntries]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((entry) => {
                const Icon = getExpenseIcon(entry.description);
                return (
                  <div key={entry.id} className="flex items-center gap-4 px-4 py-3 hover:bg-surface-200/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-surface-200/50 flex items-center justify-center text-surface-600">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900">{entry.description}</p>
                      <p className="text-xs text-surface-500">
                        {entry.category} · {formatDate(entry.date)}
                      </p>
                    </div>
                    <p className="font-mono text-sm font-medium text-accent-rose">
                      -{formatMoney(entry.amount)}
                    </p>
                    <button
                      onClick={() => {
                        store.deleteExpenseEntry(entry.id);
                        toast.success("Gasto eliminado");
                      }}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <FixedExpenseForm
          expense={editingExpense}
          onClose={() => setShowExpenseForm(false)}
          onSave={(data) => {
            if (editingExpense) {
              store.updateFixedExpense(editingExpense.id, data);
              toast.success("Gasto actualizado");
            } else {
              store.addFixedExpense(data);
              toast.success("Gasto agregado");
            }
            setShowExpenseForm(false);
          }}
        />
      )}

      {/* Entry Form Modal */}
      {showEntryForm && (
        <ExpenseEntryForm
          fixedExpenses={fixedExpenses}
          accounts={accounts}
          movements={movements}
          initialBalances={initialBalances}
          onClose={() => setShowEntryForm(false)}
          onSave={(entry, withdrawAccountId) => {
            store.addExpenseEntry(entry);
            if (withdrawAccountId) {
              store.addMovement({
                accountId: withdrawAccountId,
                date: entry.date,
                type: "withdrawal",
                amount: -entry.amount,
                notes: `Gasto: ${entry.description}`,
              });
            }
            toast.success("Gasto registrado");
            setShowEntryForm(false);
          }}
        />
      )}
    </motion.div>
  );
}

function FixedExpenseForm({
  expense,
  onClose,
  onSave,
}: {
  expense: FixedExpense | null;
  onClose: () => void;
  onSave: (data: Omit<FixedExpense, "id">) => void;
}) {
  const [name, setName] = useState(expense?.name ?? "");
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? "personal");
  const [expectedAmount, setExpectedAmount] = useState(expense?.expectedAmount?.toString() ?? "");
  const [dueDay, setDueDay] = useState(expense?.dueDay?.toString() ?? "");
  const [timesPerMonth, setTimesPerMonth] = useState(
    (expense?.timesPerMonth ?? 1).toString()
  );
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [enabled, setEnabled] = useState(expense?.enabled ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !expectedAmount) return;
    onSave({
      name,
      category,
      expectedAmount: parseFloat(expectedAmount),
      dueDay: dueDay ? parseInt(dueDay) : undefined,
      timesPerMonth: parseInt(timesPerMonth) || 1,
      notes,
      enabled,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card-elevated p-6 w-full max-w-md"
      >
        <h3 className="section-title mb-4">
          {expense ? "Editar gasto fijo" : "Nuevo gasto fijo"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Ej: Electricidad, Nómina Juan" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Categoría</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className="input-field">
                <option value="personal">Personal</option>
                <option value="business">Negocio</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Monto total/mes</label>
              <input type="number" value={expectedAmount} onChange={(e) => setExpectedAmount(e.target.value)} className="input-field" placeholder="0" min="0" step="0.01" required />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Veces al mes</label>
              <select value={timesPerMonth} onChange={(e) => setTimesPerMonth(e.target.value)} className="input-field">
                <option value="1">1 vez</option>
                <option value="2">2 veces (quincenal)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Día de vencimiento</label>
              <input type="number" value={dueDay} onChange={(e) => setDueDay(e.target.value)} className="input-field" placeholder="15" min="1" max="31" />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Notas</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" placeholder="Opcional" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="expense-enabled" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="rounded" />
            <label htmlFor="expense-enabled" className="text-sm text-surface-700">Activo</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Guardar</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ExpenseEntryForm({
  fixedExpenses,
  accounts,
  movements,
  initialBalances,
  onClose,
  onSave,
}: {
  fixedExpenses: FixedExpense[];
  accounts: Account[];
  movements: Movement[];
  initialBalances: InitialBalance[];
  onClose: () => void;
  onSave: (entry: Omit<ExpenseEntry, "id">, withdrawAccountId?: string) => void;
}) {
  const [fixedExpenseId, setFixedExpenseId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("personal");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState("");

  const selectedAccountBalance = accountId
    ? (() => {
        const initial = initialBalances.find((ib) => ib.accountId === accountId)?.balance ?? 0;
        const total = movements
          .filter((m) => m.accountId === accountId)
          .reduce((sum, m) => sum + m.amount, 0);
        return initial + total;
      })()
    : null;

  const handleFixedChange = (id: string) => {
    setFixedExpenseId(id);
    const expense = fixedExpenses.find((e) => e.id === id);
    if (expense) {
      setAmount(expense.expectedAmount.toString());
      setCategory(expense.category);
      setDescription(expense.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    onSave(
      {
        fixedExpenseId: fixedExpenseId || undefined,
        accountId: accountId || undefined,
        date,
        amount: parseFloat(amount),
        category,
        description,
      },
      accountId || undefined
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card-elevated p-6 w-full max-w-md"
      >
        <h3 className="section-title mb-4">Registrar gasto</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fixedExpenses.length > 0 && (
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Gasto fijo (opcional)</label>
              <select value={fixedExpenseId} onChange={(e) => handleFixedChange(e.target.value)} className="input-field">
                <option value="">— Gasto libre —</option>
                {fixedExpenses.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} ({e.category})</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Fecha</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Monto</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" placeholder="0" min="0" step="0.01" required />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Categoría</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
              <option value="personal">Personal</option>
              <option value="business">Negocio</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Descripción</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" placeholder="Ej: Recibo de luz marzo" required />
          </div>
          {accounts.length > 0 && (
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">
                Pagar desde cuenta
              </label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="input-field">
                <option value="">— No asignar —</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.institution} — {a.subAccount}
                  </option>
                ))}
              </select>
              {accountId && selectedAccountBalance !== null && (
                <p className="text-[11px] text-surface-500 mt-1">
                  Disponible: <span className={selectedAccountBalance < 0 ? "text-rose-400" : "text-cyan-400"}>{formatMoney(selectedAccountBalance)}</span>
                  {" · "}Se registrará un retiro automático.
                </p>
              )}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Registrar</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
