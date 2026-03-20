"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  ArrowRightCircle,
} from "lucide-react";
import type { Account, Movement, InitialBalance } from "@/lib/types";
import { getRunningBalance } from "@/lib/calculations";
import { formatMoney, formatDate, cn } from "@/lib/utils";

interface Props {
  movements: Movement[];
  accounts: Account[];
  initialBalances: InitialBalance[];
  onAdd: () => void;
  onDelete: (id: string) => void;
}

const typeIcons = {
  deposit: ArrowUpCircle,
  withdrawal: ArrowDownCircle,
  reinvestment: RefreshCw,
  transfer: ArrowRightCircle,
};

const typeLabels = {
  deposit: "Depósito",
  withdrawal: "Retiro",
  reinvestment: "Reinversión",
  transfer: "Transferencia",
};

const typeColors = {
  deposit: "text-accent-emerald",
  withdrawal: "text-accent-rose",
  reinvestment: "text-accent-cyan",
  transfer: "text-accent-amber",
};

export function MovementsList({
  movements,
  accounts,
  initialBalances,
  onAdd,
  onDelete,
}: Props) {
  const sorted = useMemo(
    () =>
      [...movements].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [movements]
  );

  const accountMap = useMemo(() => {
    const map = new Map<string, Account>();
    accounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  // Build running balances for each account
  const runningBalances = useMemo(() => {
    const map = new Map<string, Map<string, { balanceBefore: number; balanceAfter: number }>>();
    accounts.forEach((a) => {
      const rb = getRunningBalance(a.id, movements, initialBalances);
      const movMap = new Map<string, { balanceBefore: number; balanceAfter: number }>();
      rb.forEach((r) => movMap.set(r.movementId, r));
      map.set(a.id, movMap);
    });
    return map;
  }, [accounts, movements, initialBalances]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="section-title">Movimientos</h3>
          <p className="text-sm text-surface-500">
            {movements.length} registro{movements.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={onAdd} className="btn-primary text-sm">
          <Plus className="w-4 h-4" />
          Registrar
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ArrowUpCircle className="w-12 h-12 text-surface-400 mx-auto mb-4" />
          <p className="text-surface-600 mb-2">No hay movimientos registrados</p>
          <p className="text-surface-500 text-sm mb-6">
            Registra tu primer depósito o retiro para comenzar el seguimiento.
          </p>
          <button onClick={onAdd} className="btn-primary">
            <Plus className="w-4 h-4" />
            Primer movimiento
          </button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-200/50 text-surface-600">
                  <th className="text-left px-4 py-3 font-medium">Fecha</th>
                  <th className="text-left px-3 py-3 font-medium">Cuenta</th>
                  <th className="text-left px-3 py-3 font-medium">Tipo</th>
                  <th className="text-right px-3 py-3 font-medium">Monto</th>
                  <th className="text-right px-3 py-3 font-medium">Saldo Ant.</th>
                  <th className="text-right px-3 py-3 font-medium">Saldo Nuevo</th>
                  <th className="text-left px-3 py-3 font-medium">Notas</th>
                  <th className="px-3 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((mov, idx) => {
                  const account = accountMap.get(mov.accountId);
                  const Icon = typeIcons[mov.type];
                  const rb = runningBalances
                    .get(mov.accountId)
                    ?.get(mov.id);

                  return (
                    <motion.tr
                      key={mov.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="table-row group"
                    >
                      <td className="px-4 py-2.5 font-mono text-surface-700 text-xs">
                        {formatDate(mov.date)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: account?.color ?? "#71717a",
                            }}
                          />
                          <span className="text-surface-800 truncate max-w-[180px]">
                            {account
                              ? `${account.institution} — ${account.subAccount}`
                              : "Cuenta eliminada"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`flex items-center gap-1.5 ${typeColors[mov.type]}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {typeLabels[mov.type]}
                        </span>
                      </td>
                      <td
                        className={cn(
                          "text-right px-3 py-2.5 font-mono font-medium",
                          mov.amount >= 0
                            ? "text-accent-emerald"
                            : "text-accent-rose"
                        )}
                      >
                        {mov.amount >= 0 ? "+" : ""}
                        {formatMoney(mov.amount)}
                      </td>
                      <td className="text-right px-3 py-2.5 font-mono text-surface-500 text-xs">
                        {rb ? formatMoney(rb.balanceBefore) : "—"}
                      </td>
                      <td className="text-right px-3 py-2.5 font-mono text-surface-700 text-xs">
                        {rb ? formatMoney(rb.balanceAfter) : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-surface-500 text-xs truncate max-w-[150px]">
                        {mov.notes || "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => onDelete(mov.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-surface-300/50 text-surface-500 hover:text-accent-rose transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
