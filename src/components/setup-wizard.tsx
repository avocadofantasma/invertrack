"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  TrendingUp,
  Building2,
  Sparkles,
} from "lucide-react";
import { useStore, initializeDefaultAccounts, type Store } from "@/lib/store";
import { DEFAULT_ACCOUNTS, type Account, type LimitType } from "@/lib/types";
import { formatMoney, formatPercent, generateId, toISODate } from "@/lib/utils";

const STEPS = [
  { id: "welcome", title: "Bienvenido" },
  { id: "accounts", title: "Tus cuentas" },
  { id: "balances", title: "Saldos iniciales" },
  { id: "done", title: "¡Listo!" },
];

export function SetupWizard() {
  const [step, setStep] = useState(0);
  const store = useStore();

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-grid-pattern bg-grid">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-cyan/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="relative w-full max-w-2xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono transition-all duration-300 ${
                  i <= step
                    ? "bg-brand-500 text-white"
                    : "bg-surface-300 text-surface-600"
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-12 h-0.5 transition-colors duration-300 ${
                    i < step ? "bg-brand-500" : "bg-surface-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && <WelcomeStep key="welcome" onNext={next} store={store} />}
          {step === 1 && (
            <AccountsStep key="accounts" onNext={next} onPrev={prev} store={store} />
          )}
          {step === 2 && (
            <BalancesStep key="balances" onNext={next} onPrev={prev} store={store} />
          )}
          {step === 3 && <DoneStep key="done" store={store} />}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function StepWrapper({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className={`glass-card-elevated p-8 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function WelcomeStep({ onNext, store }: { onNext: () => void; store: Store }) {
  return (
    <StepWrapper className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center"
      >
        <TrendingUp className="w-10 h-10 text-white" />
      </motion.div>

      <h1 className="font-display text-3xl font-bold text-surface-950 mb-3">
        Inver<span className="text-gradient">track</span>
      </h1>
      <p className="text-surface-600 mb-8 max-w-md mx-auto leading-relaxed">
        Controla tus inversiones en SOFIPOs, bancos y casas de bolsa.
        Proyecciones, alertas de límite y datos de mercado en tiempo real.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Building2, label: "SOFIPOs y Bancos" },
          { icon: TrendingUp, label: "Proyecciones" },
          { icon: Sparkles, label: "Datos en vivo" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="p-4 rounded-xl bg-surface-200/50 border border-surface-300/30"
          >
            <Icon className="w-5 h-5 text-brand-400 mx-auto mb-2" />
            <p className="text-xs text-surface-700">{label}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          initializeDefaultAccounts(store);
          onNext();
        }}
        className="btn-primary w-full"
      >
        Comenzar con cuentas predefinidas
        <ArrowRight className="w-4 h-4" />
      </button>

      <button
        onClick={onNext}
        className="btn-ghost w-full mt-3 text-surface-500"
      >
        Empezar desde cero
      </button>
    </StepWrapper>
  );
}

function AccountsStep({
  onNext,
  onPrev,
  store,
}: {
  onNext: () => void;
  onPrev: () => void;
  store: Store;
}) {
  const accounts = store.accounts;

  return (
    <StepWrapper>
      <h2 className="section-title mb-1">Tus cuentas</h2>
      <p className="text-surface-500 text-sm mb-6">
        Revisa, edita o agrega sub-cuentas. Puedes modificar esto después.
      </p>

      <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin mb-6">
        {accounts.length === 0 && (
          <div className="text-center py-8 text-surface-500 text-sm">
            No hay cuentas. Agrega una para continuar.
          </div>
        )}
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-surface-200/30 hover:bg-surface-200/50 transition-colors group"
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: account.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-900 truncate">
                {account.institution}{" "}
                <span className="text-surface-500">—</span>{" "}
                {account.subAccount}
              </p>
              <p className="text-xs text-surface-500">
                {account.isVariable
                  ? `Variable (${account.ticker || "sin ticker"})`
                  : formatPercent(account.annualRate ?? 0)}
                {account.maxAmount
                  ? ` · Máx: ${formatMoney(account.maxAmount)}`
                  : ""}
              </p>
            </div>
            <button
              onClick={() => store.deleteAccount(account.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-surface-300/50 text-surface-500 hover:text-rose-400 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <QuickAddAccount store={store} />

      <div className="flex gap-3 mt-6">
        <button onClick={onPrev} className="btn-secondary flex-1">
          <ArrowLeft className="w-4 h-4" />
          Atrás
        </button>
        <button
          onClick={onNext}
          className="btn-primary flex-1"
          disabled={accounts.length === 0}
        >
          Siguiente
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </StepWrapper>
  );
}

function QuickAddAccount({ store }: { store: Store }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    institution: "",
    subAccount: "",
    annualRate: "",
    maxAmount: "",
    reducedRate: "",
    limitType: "none" as LimitType,
    isVariable: false,
    ticker: "",
  });

  const handleAdd = () => {
    if (!form.institution || !form.subAccount) return;
    store.addAccount({
      institution: form.institution,
      subAccount: form.subAccount,
      type: "Otro",
      annualRate: form.isVariable ? null : parseFloat(form.annualRate) / 100 || 0,
      maxAmount: form.maxAmount ? parseFloat(form.maxAmount) : null,
      reducedRate: form.reducedRate ? parseFloat(form.reducedRate) / 100 : null,
      limitType: form.limitType,
      paymentFrequency: "Mensual",
      minAmount: 0,
      notes: "",
      color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`,
      isVariable: form.isVariable,
      ticker: form.ticker || undefined,
      tickerType: form.isVariable ? "etf" : undefined,
    });
    setForm({
      institution: "",
      subAccount: "",
      annualRate: "",
      maxAmount: "",
      reducedRate: "",
      limitType: "none",
      isVariable: false,
      ticker: "",
    });
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-ghost w-full text-brand-400 border border-dashed border-surface-400 hover:border-brand-500/50"
      >
        <Plus className="w-4 h-4" />
        Agregar cuenta
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="p-4 rounded-xl border border-surface-300/50 bg-surface-200/30 space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="Institución"
          className="input-field"
          value={form.institution}
          onChange={(e) => setForm({ ...form, institution: e.target.value })}
        />
        <input
          placeholder="Sub-cuenta"
          className="input-field"
          value={form.subAccount}
          onChange={(e) => setForm({ ...form, subAccount: e.target.value })}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-surface-700">
        <input
          type="checkbox"
          checked={form.isVariable}
          onChange={(e) => setForm({ ...form, isVariable: e.target.checked })}
          className="rounded"
        />
        Tasa variable (acciones, ETFs, crypto)
      </label>

      {form.isVariable ? (
        <input
          placeholder="Ticker (ej: VOO, AAPL, bitcoin)"
          className="input-field"
          value={form.ticker}
          onChange={(e) => setForm({ ...form, ticker: e.target.value })}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Tasa anual (%)"
            type="number"
            className="input-field"
            value={form.annualRate}
            onChange={(e) => setForm({ ...form, annualRate: e.target.value })}
          />
          <input
            placeholder="Monto máximo (opcional)"
            type="number"
            className="input-field"
            value={form.maxAmount}
            onChange={(e) => setForm({ ...form, maxAmount: e.target.value })}
          />
        </div>
      )}

      {form.maxAmount && (
        <div className="grid grid-cols-2 gap-3">
          <select
            className="input-field"
            value={form.limitType}
            onChange={(e) =>
              setForm({ ...form, limitType: e.target.value as LimitType })
            }
          >
            <option value="none">Sin límite</option>
            <option value="hard_cap">Tope duro</option>
            <option value="reduce_rate">Tope + Reduce tasa</option>
          </select>
          {form.limitType === "reduce_rate" && (
            <input
              placeholder="Tasa reducida (%)"
              type="number"
              className="input-field"
              value={form.reducedRate}
              onChange={(e) =>
                setForm({ ...form, reducedRate: e.target.value })
              }
            />
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="btn-ghost flex-1">
          Cancelar
        </button>
        <button onClick={handleAdd} className="btn-primary flex-1">
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>
    </motion.div>
  );
}

function BalancesStep({
  onNext,
  onPrev,
  store,
}: {
  onNext: () => void;
  onPrev: () => void;
  store: Store;
}) {
  const accounts = store.accounts;
  const [balances, setBalances] = useState<
    Record<string, { balance: string; accrued: string }>
  >({});

  const saveAndNext = () => {
    const today = toISODate(new Date());
    for (const account of accounts) {
      const vals = balances[account.id];
      const bal = parseFloat(vals?.balance || "0");
      const accrued = parseFloat(vals?.accrued || "0");
      if (bal > 0 || accrued > 0) {
        store.setInitialBalance({
          accountId: account.id,
          balance: bal,
          accruedReturn: accrued,
          date: today,
        });
      }
    }
    onNext();
  };

  return (
    <StepWrapper>
      <h2 className="section-title mb-1">Saldos iniciales</h2>
      <p className="text-surface-500 text-sm mb-6">
        ¿Cuánto tienes hoy en cada cuenta? Opcional: rendimiento ya generado.
      </p>

      <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin mb-6">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="p-4 rounded-xl bg-surface-200/30 border border-surface-300/30"
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: account.color }}
              />
              <span className="text-sm font-medium text-surface-900">
                {account.institution} — {account.subAccount}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-surface-500 mb-1 block">
                  Saldo actual ($)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  className="input-field font-mono"
                  value={balances[account.id]?.balance ?? ""}
                  onChange={(e) =>
                    setBalances({
                      ...balances,
                      [account.id]: {
                        ...balances[account.id],
                        balance: e.target.value,
                        accrued: balances[account.id]?.accrued ?? "",
                      },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-surface-500 mb-1 block">
                  Rendimiento previo ($)
                </label>
                <input
                  type="number"
                  placeholder="0 (opcional)"
                  className="input-field font-mono"
                  value={balances[account.id]?.accrued ?? ""}
                  onChange={(e) =>
                    setBalances({
                      ...balances,
                      [account.id]: {
                        ...balances[account.id],
                        balance: balances[account.id]?.balance ?? "",
                        accrued: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={onPrev} className="btn-secondary flex-1">
          <ArrowLeft className="w-4 h-4" />
          Atrás
        </button>
        <button onClick={saveAndNext} className="btn-primary flex-1">
          Siguiente
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </StepWrapper>
  );
}

function DoneStep({ store }: { store: Store }) {
  return (
    <StepWrapper className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-brand-500 to-accent-emerald flex items-center justify-center"
      >
        <Check className="w-10 h-10 text-white" />
      </motion.div>

      <h2 className="font-display text-2xl font-bold text-surface-950 mb-2">
        ¡Todo listo!
      </h2>
      <p className="text-surface-500 mb-8">
        Tu tracker de inversiones está configurado. Puedes agregar movimientos,
        ver proyecciones y configurar abonos mensuales.
      </p>

      <button
        onClick={() => store.completeSetup()}
        className="btn-primary w-full"
      >
        <Sparkles className="w-4 h-4" />
        Ir al dashboard
      </button>
    </StepWrapper>
  );
}
