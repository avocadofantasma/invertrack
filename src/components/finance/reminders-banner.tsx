"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CreditCard, Car, Zap, X, Bell } from "lucide-react";
import { useStore } from "@/lib/store";
import { generateReminders, daysUntil } from "@/lib/finance-utils";
import type { ReminderType } from "@/lib/types";

const ICON_MAP: Record<ReminderType, typeof CreditCard> = {
  credit_card_cut: CreditCard,
  credit_card_due: CreditCard,
  loan_due: Car,
  expense_due: Zap,
};

const COLOR_MAP: Record<ReminderType, string> = {
  credit_card_cut: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  credit_card_due: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  loan_due: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  expense_due: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
};

export function RemindersBanner() {
  const store = useStore();
  const {
    creditCards,
    creditCardStatements,
    loans,
    fixedExpenses,
    financeSettings,
    dismissedReminders,
  } = store;

  const reminders = useMemo(
    () =>
      generateReminders(
        creditCards,
        creditCardStatements,
        loans,
        fixedExpenses,
        financeSettings.reminderDaysBefore,
        dismissedReminders
      ),
    [creditCards, creditCardStatements, loans, fixedExpenses, financeSettings.reminderDaysBefore, dismissedReminders]
  );

  if (reminders.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2 mb-1">
        <Bell className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-medium uppercase tracking-widest text-surface-600">
          Recordatorios ({reminders.length})
        </span>
      </div>

      <AnimatePresence>
        {reminders.map((reminder) => {
          const Icon = ICON_MAP[reminder.type];
          const colors = COLOR_MAP[reminder.type];
          const days = daysUntil(reminder.dueDate);
          const urgency =
            days <= 1
              ? "text-rose-400"
              : days <= 3
                ? "text-amber-400"
                : "text-surface-500";

          return (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colors}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 truncate">
                  {reminder.title}
                </p>
                <p className="text-xs text-surface-500 truncate">
                  {reminder.description}
                </p>
              </div>
              <span className={`text-xs font-mono font-medium whitespace-nowrap ${urgency}`}>
                {days === 0
                  ? "Hoy"
                  : days === 1
                    ? "Mañana"
                    : `${days} días`}
              </span>
              <button
                onClick={() => store.dismissReminder(reminder.id)}
                className="p-1 rounded-lg hover:bg-surface-300/30 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-surface-500" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
