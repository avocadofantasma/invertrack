"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  DollarSign,
  Briefcase,
  Gift,
  ShoppingBag,
  MoreHorizontal,
  Edit3,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { formatMoney, formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import type { IncomeCategory, IncomeSource, IncomeEntry } from "@/lib/types";

const CATEGORY_CONFIG: Record<
  IncomeCategory,
  { label: string; icon: typeof DollarSign; color: string }
> = {
  salary: { label: "Salario", icon: DollarSign, color: "text-emerald-400" },
  business: { label: "Negocio", icon: Briefcase, color: "text-cyan-400" },
  bonus: { label: "Bono", icon: Gift, color: "text-amber-400" },
  sale: { label: "Venta", icon: ShoppingBag, color: "text-violet-400" },
  other: { label: "Otro", icon: MoreHorizontal, color: "text-surface-400" },
};

export function IncomeTab() {
  const store = useStore();
  const { incomeSources, incomeEntries } = store;
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);

  const totalConfigured = incomeSources
    .filter((s) => s.enabled)
    .reduce((sum, s) => sum + s.amount * (s.timesPerMonth || (s.frequency === "biweekly" ? 2 : 1)), 0);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthEntries = incomeEntries.filter((e) => e.date.startsWith(currentMonth));
  const totalThisMonth = thisMonthEntries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5">
          <p className="stat-label">Ingreso mensual configurado</p>
          <p className="stat-value text-surface-950 mt-2">{formatMoney(totalConfigured)}</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-cyan-500/10 to-violet-500/5">
          <p className="stat-label">Ingreso este mes</p>
          <p className="stat-value text-surface-950 mt-2">{formatMoney(totalThisMonth)}</p>
        </div>
      </div>

      {/* Income Sources */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-surface-300/30 flex items-center justify-between">
          <h3 className="section-title">Fuentes de ingreso</h3>
          <button
            onClick={() => {
              setEditingSource(null);
              setShowSourceForm(true);
            }}
            className="btn-primary text-sm py-2"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>

        {incomeSources.length === 0 ? (
          <div className="p-8 text-center text-surface-500 text-sm">
            No hay fuentes de ingreso configuradas
          </div>
        ) : (
          <div className="divide-y divide-surface-200/50">
            {incomeSources.map((source) => {
              const config = CATEGORY_CONFIG[source.type];
              const Icon = config.icon;
              return (
                <div key={source.id} className="flex items-center gap-4 px-4 py-3 hover:bg-surface-200/30 transition-colors">
                  <div className={`w-8 h-8 rounded-lg bg-surface-200/50 flex items-center justify-center ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900">{source.name}</p>
                    <p className="text-xs text-surface-500">
                      {config.label}
                      {(source.timesPerMonth || 1) > 1 ? ` · ${source.timesPerMonth}x/mes` : " · Mensual"}
                      {source.dayOfMonth ? ` · Día ${source.dayOfMonth}` : ""}
                      {(source.timesPerMonth || 1) > 1 && (
                        <span className="text-surface-400"> · Total: {formatMoney(source.amount * (source.timesPerMonth || 1))}/mes</span>
                      )}
                    </p>
                  </div>
                  <p className="font-mono text-sm font-medium text-surface-900">
                    {formatMoney(source.amount)}
                  </p>
                  <div className={`w-2 h-2 rounded-full ${source.enabled ? "bg-emerald-400" : "bg-surface-400"}`} />
                  <button
                    onClick={() => {
                      setEditingSource(source);
                      setShowSourceForm(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-surface-300/50 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-surface-500" />
                  </button>
                  <button
                    onClick={() => {
                      store.deleteIncomeSource(source.id);
                      toast.success("Fuente eliminada");
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

      {/* Register income entry */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-surface-300/30 flex items-center justify-between">
          <h3 className="section-title">Ingresos registrados</h3>
          <button onClick={() => setShowEntryForm(true)} className="btn-primary text-sm py-2">
            <Plus className="w-4 h-4" />
            Registrar ingreso
          </button>
        </div>

        {incomeEntries.length === 0 ? (
          <div className="p-8 text-center text-surface-500 text-sm">
            No hay ingresos registrados
          </div>
        ) : (
          <div className="divide-y divide-surface-200/50 max-h-96 overflow-y-auto scrollbar-thin">
            {[...incomeEntries]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((entry) => {
                const config = CATEGORY_CONFIG[entry.category];
                const Icon = config.icon;
                return (
                  <div key={entry.id} className="flex items-center gap-4 px-4 py-3 hover:bg-surface-200/30 transition-colors">
                    <div className={`w-8 h-8 rounded-lg bg-surface-200/50 flex items-center justify-center ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900">{entry.description}</p>
                      <p className="text-xs text-surface-500">{config.label} · {formatDate(entry.date)}</p>
                    </div>
                    <p className="font-mono text-sm font-medium text-accent-emerald">
                      +{formatMoney(entry.amount)}
                    </p>
                    <button
                      onClick={() => {
                        store.deleteIncomeEntry(entry.id);
                        toast.success("Ingreso eliminado");
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

      {/* Source Form Modal */}
      {showSourceForm && (
        <IncomeSourceForm
          source={editingSource}
          onClose={() => setShowSourceForm(false)}
          onSave={(data) => {
            if (editingSource) {
              store.updateIncomeSource(editingSource.id, data);
              toast.success("Fuente actualizada");
            } else {
              store.addIncomeSource(data);
              toast.success("Fuente agregada");
            }
            setShowSourceForm(false);
          }}
        />
      )}

      {/* Entry Form Modal */}
      {showEntryForm && (
        <IncomeEntryForm
          sources={incomeSources}
          onClose={() => setShowEntryForm(false)}
          onSave={(entry) => {
            store.addIncomeEntry(entry);
            toast.success("Ingreso registrado");
            setShowEntryForm(false);
          }}
        />
      )}
    </motion.div>
  );
}

function IncomeSourceForm({
  source,
  onClose,
  onSave,
}: {
  source: IncomeSource | null;
  onClose: () => void;
  onSave: (data: Omit<IncomeSource, "id">) => void;
}) {
  const [name, setName] = useState(source?.name ?? "");
  const [type, setType] = useState<IncomeCategory>(source?.type ?? "salary");
  const [amount, setAmount] = useState(source?.amount?.toString() ?? "");
  const [frequency, setFrequency] = useState<"monthly" | "biweekly" | "one-time">(
    source?.frequency ?? "monthly"
  );
  const [dayOfMonth, setDayOfMonth] = useState(source?.dayOfMonth?.toString() ?? "");
  const [timesPerMonth, setTimesPerMonth] = useState(
    (source?.timesPerMonth ?? (source?.frequency === "biweekly" ? 2 : 1)).toString()
  );
  const [enabled, setEnabled] = useState(source?.enabled ?? true);
  const [notes, setNotes] = useState(source?.notes ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;
    onSave({
      name,
      type,
      amount: parseFloat(amount),
      frequency,
      dayOfMonth: dayOfMonth ? parseInt(dayOfMonth) : undefined,
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
          {source ? "Editar fuente" : "Nueva fuente de ingreso"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Ej: Salario principal" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value as IncomeCategory)} className="input-field">
                {Object.entries(CATEGORY_CONFIG).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Frecuencia</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value as typeof frequency)} className="input-field">
                <option value="monthly">Mensual</option>
                <option value="biweekly">Quincenal</option>
                <option value="one-time">Único</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Monto por pago</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" placeholder="0" min="0" step="0.01" required />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Veces al mes</label>
              <select value={timesPerMonth} onChange={(e) => setTimesPerMonth(e.target.value)} className="input-field">
                <option value="1">1 vez</option>
                <option value="2">2 veces (quincenal)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Día del mes</label>
              <input type="number" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} className="input-field" placeholder="15" min="1" max="31" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Notas</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" placeholder="Opcional" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="enabled" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="rounded" />
            <label htmlFor="enabled" className="text-sm text-surface-700">Activo</label>
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

function IncomeEntryForm({
  sources,
  onClose,
  onSave,
}: {
  sources: IncomeSource[];
  onClose: () => void;
  onSave: (entry: Omit<IncomeEntry, "id">) => void;
}) {
  const [sourceId, setSourceId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<IncomeCategory>("salary");
  const [description, setDescription] = useState("");

  // Auto-fill from source
  const handleSourceChange = (id: string) => {
    setSourceId(id);
    const source = sources.find((s) => s.id === id);
    if (source) {
      setAmount(source.amount.toString());
      setCategory(source.type);
      setDescription(source.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    onSave({
      sourceId: sourceId || undefined,
      date,
      amount: parseFloat(amount),
      category,
      description,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card-elevated p-6 w-full max-w-md"
      >
        <h3 className="section-title mb-4">Registrar ingreso</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {sources.length > 0 && (
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Fuente (opcional)</label>
              <select value={sourceId} onChange={(e) => handleSourceChange(e.target.value)} className="input-field">
                <option value="">— Sin fuente —</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
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
            <select value={category} onChange={(e) => setCategory(e.target.value as IncomeCategory)} className="input-field">
              {Object.entries(CATEGORY_CONFIG).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Descripción</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" placeholder="Ej: Quincena marzo" required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Registrar</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
