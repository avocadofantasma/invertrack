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
  Plus,
  Edit3,
  Trash2,
  X,
  ChevronsUpDown,
} from "lucide-react";
import type { AccountSummary, InstitutionSummary, AlertType, Account, LimitType } from "@/lib/types";
import { formatMoney, formatPercent, cn } from "@/lib/utils";
import { INSTITUTION_COLORS, LIMIT_TYPES } from "@/lib/types";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

interface Props {
  summaries: AccountSummary[];
  institutionSummaries: InstitutionSummary[];
}

export function AccountsTable({ summaries, institutionSummaries }: Props) {
  const store = useStore();
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(institutionSummaries.map((i) => i.institution))
  );
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showAccountForm, setShowAccountForm] = useState(false);

  const toggle = (inst: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(inst)) next.delete(inst);
      else next.add(inst);
      return next;
    });
  };

  const allExpanded = expanded.size === institutionSummaries.length;
  const toggleAll = () => {
    if (allExpanded) {
      setExpanded(new Set());
    } else {
      setExpanded(new Set(institutionSummaries.map((i) => i.institution)));
    }
  };

  return (
    <>
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-surface-300/30 flex items-center justify-between">
          <h3 className="section-title">Detalle por cuenta</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-500 font-mono">
              {summaries.length} sub-cuentas
            </span>
            <button
              onClick={toggleAll}
              className="p-1.5 rounded-lg hover:bg-surface-300/50 transition-colors"
              title={allExpanded ? "Colapsar todas" : "Expandir todas"}
            >
              <ChevronsUpDown className="w-4 h-4 text-surface-500" />
            </button>
            <button
              onClick={() => {
                setEditingAccount(null);
                setShowAccountForm(true);
              }}
              className="btn-primary text-sm py-2"
            >
              <Plus className="w-4 h-4" />
              Nueva cuenta
            </button>
          </div>
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
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {institutionSummaries.map((inst) => (
                <InstitutionGroup
                  key={inst.institution}
                  institution={inst}
                  isExpanded={expanded.has(inst.institution)}
                  onToggle={() => toggle(inst.institution)}
                  onEdit={(account) => {
                    setEditingAccount(account);
                    setShowAccountForm(true);
                  }}
                  onDelete={(id) => {
                    store.deleteAccount(id);
                    toast.success("Cuenta eliminada");
                  }}
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
                <td className="px-3 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {showAccountForm && (
        <AccountFormModal
          account={editingAccount}
          onClose={() => setShowAccountForm(false)}
          onSave={(data) => {
            if (editingAccount) {
              store.updateAccount(editingAccount.id, data);
              toast.success("Cuenta actualizada");
            } else {
              store.addAccount(data);
              toast.success("Cuenta agregada");
            }
            setShowAccountForm(false);
          }}
        />
      )}
    </>
  );
}

function InstitutionGroup({
  institution,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  institution: InstitutionSummary;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
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
        <td className="px-3 py-3" />
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
              className="table-row group"
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
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(summary.account); }}
                    className="p-1.5 rounded-lg hover:bg-surface-300/50 transition-colors"
                    title="Editar cuenta"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-surface-500" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(summary.account.id); }}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                    title="Eliminar cuenta"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                </div>
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

const ACCOUNT_TYPES = ["SOFIPO", "Banco", "Casa de Bolsa", "Crypto/Fintech", "Otro"];
const PAYMENT_FREQUENCIES = ["Diario", "Mensual", "Variable"];
const PRESET_COLORS = [
  "#8B5CF6", "#A78BFA", "#F43F5E", "#FB923C", "#FBBF24",
  "#34D399", "#10B981", "#38BDF8", "#22D3EE", "#6EE7B7",
  "#F472B6", "#94A3B8",
];

function AccountFormModal({
  account,
  onClose,
  onSave,
}: {
  account: Account | null;
  onClose: () => void;
  onSave: (data: Omit<Account, "id">) => void;
}) {
  const [institution, setInstitution] = useState(account?.institution ?? "");
  const [subAccount, setSubAccount] = useState(account?.subAccount ?? "");
  const [type, setType] = useState(account?.type ?? "SOFIPO");
  const [isVariable, setIsVariable] = useState(account?.isVariable ?? false);
  const [annualRate, setAnnualRate] = useState(
    account?.annualRate != null ? (account.annualRate * 100).toFixed(2) : ""
  );
  const [limitType, setLimitType] = useState<LimitType>(account?.limitType ?? "none");
  const [maxAmount, setMaxAmount] = useState(account?.maxAmount?.toString() ?? "");
  const [reducedRate, setReducedRate] = useState(
    account?.reducedRate != null ? (account.reducedRate * 100).toFixed(2) : ""
  );
  const [paymentFrequency, setPaymentFrequency] = useState(account?.paymentFrequency ?? "Mensual");
  const [minAmount, setMinAmount] = useState(account?.minAmount?.toString() ?? "0");
  const [ticker, setTicker] = useState(account?.ticker ?? "");
  const [tickerType, setTickerType] = useState<"stock" | "etf" | "crypto">(account?.tickerType ?? "etf");
  const [color, setColor] = useState(account?.color ?? PRESET_COLORS[0]);
  const [notes, setNotes] = useState(account?.notes ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!institution || !subAccount) return;
    onSave({
      institution,
      subAccount,
      type,
      isVariable,
      annualRate: isVariable ? null : (parseFloat(annualRate) / 100 || 0),
      limitType,
      maxAmount: limitType !== "none" && maxAmount ? parseFloat(maxAmount) : null,
      reducedRate: limitType === "reduce_rate" && reducedRate ? parseFloat(reducedRate) / 100 : null,
      paymentFrequency,
      minAmount: parseFloat(minAmount) || 0,
      ticker: isVariable ? ticker : undefined,
      tickerType: isVariable ? tickerType : undefined,
      color,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card-elevated p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">{account ? "Editar cuenta" : "Nueva cuenta"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-300/50 transition-colors">
            <X className="w-4 h-4 text-surface-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Institución</label>
              <input value={institution} onChange={(e) => setInstitution(e.target.value)} className="input-field" placeholder="Nu, GBM+, Bitso..." required />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Sub-cuenta</label>
              <input value={subAccount} onChange={(e) => setSubAccount(e.target.value)} className="input-field" placeholder="Cajita, ETFs..." required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
                {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Frecuencia de pago</label>
              <select value={paymentFrequency} onChange={(e) => setPaymentFrequency(e.target.value)} className="input-field">
                {PAYMENT_FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 py-1">
            <input type="checkbox" id="isVariable" checked={isVariable} onChange={(e) => setIsVariable(e.target.checked)} className="rounded" />
            <label htmlFor="isVariable" className="text-sm text-surface-700">Tasa variable (acciones / cripto)</label>
          </div>

          {isVariable ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-surface-600 mb-1 block">Ticker</label>
                <input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} className="input-field" placeholder="VOO, BTC..." />
              </div>
              <div>
                <label className="text-xs font-medium text-surface-600 mb-1 block">Tipo de ticker</label>
                <select value={tickerType} onChange={(e) => setTickerType(e.target.value as typeof tickerType)} className="input-field">
                  <option value="stock">Acción</option>
                  <option value="etf">ETF</option>
                  <option value="crypto">Cripto</option>
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Tasa anual (%)</label>
              <input type="number" value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} className="input-field" placeholder="15" min="0" max="100" step="0.01" />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Tipo de límite</label>
              <select value={limitType} onChange={(e) => setLimitType(e.target.value as LimitType)} className="input-field">
                {LIMIT_TYPES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            {limitType !== "none" && (
              <div>
                <label className="text-xs font-medium text-surface-600 mb-1 block">Monto máximo</label>
                <input type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} className="input-field" placeholder="25000" min="0" />
              </div>
            )}
            {limitType === "reduce_rate" && (
              <div>
                <label className="text-xs font-medium text-surface-600 mb-1 block">Tasa reducida (%)</label>
                <input type="number" value={reducedRate} onChange={(e) => setReducedRate(e.target.value)} className="input-field" placeholder="7" min="0" max="100" step="0.01" />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Monto mínimo</label>
            <input type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} className="input-field" placeholder="0" min="0" />
          </div>

          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Color</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn("w-6 h-6 rounded-full transition-all", color === c ? "ring-2 ring-white ring-offset-1 ring-offset-surface-200 scale-110" : "")}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-6 h-6 rounded-full cursor-pointer border-0 p-0 bg-transparent"
                title="Color personalizado"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Notas</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" placeholder="Opcional" />
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
