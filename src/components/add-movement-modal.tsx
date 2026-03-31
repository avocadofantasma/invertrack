"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, ArrowUpCircle, ArrowDownCircle, RefreshCw, ArrowRightLeft } from "lucide-react";
import type { Account, Movement } from "@/lib/types";
import { formatMoney, toISODate, cn } from "@/lib/utils";

interface Props {
  accounts: Account[];
  onClose: () => void;
  onAdd: (movements: Omit<Movement, "id">[]) => void;
}

export function AddMovementModal({ accounts, onClose, onAdd }: Props) {
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [type, setType] = useState<Movement["type"] | "transfer">("deposit");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toISODate(new Date()));
  const [notes, setNotes] = useState("");

  const isTransfer = type === "transfer";
  const selectedAccount = accounts.find((a) => a.id === accountId);

  const handleSubmit = () => {
    if (!accountId || !amount) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount === 0) return;

    if (isTransfer) {
      if (!toAccountId || toAccountId === accountId) return;
      onAdd([
        {
          accountId,
          date,
          type: "withdrawal",
          amount: -Math.abs(numAmount),
          notes: notes || `Transferencia a ${accounts.find((a) => a.id === toAccountId)?.subAccount ?? "otra cuenta"}`,
        },
        {
          accountId: toAccountId,
          date,
          type: "deposit",
          amount: Math.abs(numAmount),
          notes: notes || `Transferencia desde ${accounts.find((a) => a.id === accountId)?.subAccount ?? "otra cuenta"}`,
        },
      ]);
    } else {
      onAdd([
        {
          accountId,
          date,
          type: type as Movement["type"],
          amount: type === "withdrawal" ? -Math.abs(numAmount) : Math.abs(numAmount),
          notes,
        },
      ]);
    }
  };

  const types: { value: Movement["type"] | "transfer"; label: string; icon: typeof ArrowUpCircle; color: string }[] = [
    { value: "deposit", label: "Depósito", icon: ArrowUpCircle, color: "text-accent-emerald border-accent-emerald/30 bg-accent-emerald/5" },
    { value: "withdrawal", label: "Retiro", icon: ArrowDownCircle, color: "text-accent-rose border-accent-rose/30 bg-accent-rose/5" },
    { value: "reinvestment", label: "Reinversión", icon: RefreshCw, color: "text-accent-cyan border-accent-cyan/30 bg-accent-cyan/5" },
    { value: "transfer", label: "Transferencia", icon: ArrowRightLeft, color: "text-violet-400 border-violet-400/30 bg-violet-400/5" },
  ];

  const canSubmit = isTransfer
    ? accountId && toAccountId && toAccountId !== accountId && !!amount
    : accountId && !!amount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative glass-card-elevated p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="section-title">Nuevo movimiento</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-300/50 text-surface-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Movement type */}
          <div>
            <label className="text-xs text-surface-500 mb-2 block">Tipo</label>
            <div className="grid grid-cols-4 gap-2">
              {types.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setType(value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-xs",
                    type === value
                      ? color
                      : "border-surface-300/30 text-surface-500 hover:border-surface-400"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Account selector(s) */}
          {isTransfer ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-surface-500 mb-2 block">Cuenta origen</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Seleccionar cuenta...</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id} disabled={a.id === toAccountId}>
                      {a.institution} — {a.subAccount}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-surface-300/30" />
                <ArrowRightLeft className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <div className="flex-1 h-px bg-surface-300/30" />
              </div>
              <div>
                <label className="text-xs text-surface-500 mb-2 block">Cuenta destino</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Seleccionar cuenta...</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id} disabled={a.id === accountId}>
                      {a.institution} — {a.subAccount}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs text-surface-500 mb-2 block">Cuenta</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="input-field"
              >
                <option value="">Seleccionar cuenta...</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.institution} — {a.subAccount}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="text-xs text-surface-500 mb-2 block">
              Monto ($)
            </label>
            <input
              type="number"
              placeholder="10,000"
              className="input-field font-mono text-lg"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="100"
            />
            {selectedAccount?.maxAmount && type === "deposit" && (
              <p className="text-xs text-surface-500 mt-1">
                Máximo: {formatMoney(selectedAccount.maxAmount)}
                {selectedAccount.limitType === "hard_cap" && " (tope duro)"}
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-surface-500 mb-2 block">Fecha</label>
            <input
              type="date"
              className="input-field font-mono"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-surface-500 mb-2 block">
              Notas (opcional)
            </label>
            <input
              type="text"
              placeholder="Descripción del movimiento..."
              className="input-field"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "btn-primary flex-1",
              !canSubmit && "opacity-50 cursor-not-allowed"
            )}
          >
            Registrar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
