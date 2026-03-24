import type {
  CreditCard,
  CreditCardStatement,
  Loan,
  FixedExpense,
  Reminder,
  IncomeEntry,
  ExpenseEntry,
  MonthlyBudget,
  BudgetLineItem,
  IncomeSource,
} from "./types";

export interface CCCategorySpending {
  category: string;
  total: number;
  count: number;
  transactions: import("./types").CreditCardTransaction[];
}
import { generateId } from "./utils";

/**
 * Get the next occurrence of a day-of-month from today
 */
function nextDateForDay(day: number): Date {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), day);
  if (thisMonth >= now) return thisMonth;
  // Next month
  return new Date(now.getFullYear(), now.getMonth() + 1, day);
}

/**
 * Generate all active reminders
 */
export function generateReminders(
  creditCards: CreditCard[],
  creditCardStatements: CreditCardStatement[],
  loans: Loan[],
  fixedExpenses: FixedExpense[],
  reminderDaysBefore: number,
  dismissedReminders: string[]
): Reminder[] {
  const reminders: Reminder[] = [];
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + reminderDaysBefore);

  // Credit card cut dates and payment due dates
  for (const card of creditCards) {
    if (!card.enabled) continue;

    const cutDate = nextDateForDay(card.cutDay);
    const cutId = `cc-cut-${card.id}-${cutDate.toISOString().slice(0, 7)}`;
    if (cutDate <= cutoff && !dismissedReminders.includes(cutId)) {
      reminders.push({
        id: cutId,
        type: "credit_card_cut",
        title: `Fecha de corte: ${card.name}`,
        description: `${card.bank} — corta el día ${card.cutDay}`,
        dueDate: cutDate.toISOString().split("T")[0],
        sourceId: card.id,
        dismissed: false,
      });
    }

    const dueDate = nextDateForDay(card.paymentDueDay);
    const dueId = `cc-due-${card.id}-${dueDate.toISOString().slice(0, 7)}`;
    if (dueDate <= cutoff && !dismissedReminders.includes(dueId)) {
      // Check if latest statement for this card is unpaid
      const latestStatement = creditCardStatements
        .filter((s) => s.cardId === card.id)
        .sort((a, b) => b.month.localeCompare(a.month))[0];

      if (!latestStatement || !latestStatement.paid) {
        reminders.push({
          id: dueId,
          type: "credit_card_due",
          title: `Pago TDC: ${card.name}`,
          description: latestStatement
            ? `Saldo: $${latestStatement.totalBalance.toLocaleString()} — vence día ${card.paymentDueDay}`
            : `Vence día ${card.paymentDueDay}`,
          dueDate: dueDate.toISOString().split("T")[0],
          sourceId: card.id,
          dismissed: false,
        });
      }
    }
  }

  // Loan payment due dates
  for (const loan of loans) {
    if (!loan.enabled || loan.remainingBalance <= 0) continue;

    const dueDate = nextDateForDay(loan.paymentDueDay);
    const id = `loan-${loan.id}-${dueDate.toISOString().slice(0, 7)}`;
    if (dueDate <= cutoff && !dismissedReminders.includes(id)) {
      reminders.push({
        id,
        type: "loan_due",
        title: `Pago: ${loan.name}`,
        description: `${loan.institution} — $${loan.monthlyPayment.toLocaleString()} — día ${loan.paymentDueDay}`,
        dueDate: dueDate.toISOString().split("T")[0],
        sourceId: loan.id,
        dismissed: false,
      });
    }
  }

  // Fixed expense due dates
  for (const expense of fixedExpenses) {
    if (!expense.enabled || !expense.dueDay) continue;

    const dueDate = nextDateForDay(expense.dueDay);
    const id = `expense-${expense.id}-${dueDate.toISOString().slice(0, 7)}`;
    if (dueDate <= cutoff && !dismissedReminders.includes(id)) {
      reminders.push({
        id,
        type: "expense_due",
        title: `Gasto: ${expense.name}`,
        description: `$${expense.expectedAmount.toLocaleString()} — día ${expense.dueDay}`,
        dueDate: dueDate.toISOString().split("T")[0],
        sourceId: expense.id,
        dismissed: false,
      });
    }
  }

  // Sort by due date
  reminders.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return reminders;
}

/**
 * Get current month string in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Get a readable month label
 */
export function getMonthDisplayLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 1);
  return date.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

/**
 * Generate a budget template from configured sources and expenses
 */
export function generateBudgetTemplate(
  month: string,
  incomeSources: IncomeSource[],
  fixedExpenses: FixedExpense[]
): Omit<MonthlyBudget, "id"> {
  const incomeTargets: BudgetLineItem[] = incomeSources
    .filter((s) => s.enabled)
    .map((s) => {
      const times = s.timesPerMonth || (s.frequency === "biweekly" ? 2 : 1);
      return {
        id: generateId(),
        name: s.name,
        category: s.type,
        budgeted: s.amount * times,
        actual: 0,
        timesPerMonth: times,
        timesPaid: 0,
      };
    });

  const expenseLimits: BudgetLineItem[] = fixedExpenses
    .filter((e) => e.enabled)
    .map((e) => ({
      id: generateId(),
      name: e.name,
      category: e.category,
      budgeted: e.expectedAmount,
      actual: 0,
      timesPerMonth: e.timesPerMonth || 1,
      timesPaid: 0,
    }));

  return {
    month,
    incomeTargets,
    expenseLimits,
    notes: "",
  };
}

/**
 * Calculate budget summary for a month.
 * Matches entries to budget items by name first, then by sourceId/fixedExpenseId.
 */
export function calculateBudgetActuals(
  budget: MonthlyBudget,
  incomeEntries: IncomeEntry[],
  expenseEntries: ExpenseEntry[],
  month: string
): MonthlyBudget {
  const monthStart = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const monthEnd = `${nextMonth}-01`;

  const monthIncome = incomeEntries.filter(
    (e) => e.date >= monthStart && e.date < monthEnd
  );
  const monthExpenses = expenseEntries.filter(
    (e) => e.date >= monthStart && e.date < monthEnd
  );

  // Match income entries to budget items by name (exact match on description)
  const updatedIncome = budget.incomeTargets.map((target) => {
    const matched = monthIncome.filter((e) => e.description === target.name);
    const actual = matched.reduce((sum, e) => sum + e.amount, 0);
    const timesPaid = matched.length;
    return {
      ...target,
      actual,
      timesPaid,
      timesPerMonth: target.timesPerMonth || 1,
    };
  });

  // Match expense entries to budget items by name (exact match on description)
  const updatedExpenses = budget.expenseLimits.map((limit) => {
    // If marked as paid via CC, use the CC amount directly
    if (limit.paidViaCC) {
      return {
        ...limit,
        actual: limit.paidViaCCAmount ?? limit.budgeted,
        timesPaid: 1,
        timesPerMonth: limit.timesPerMonth || 1,
      };
    }
    const matched = monthExpenses.filter((e) => e.description === limit.name);
    const actual = matched.reduce((sum, e) => sum + e.amount, 0);
    const timesPaid = matched.length;
    return {
      ...limit,
      actual,
      timesPaid,
      timesPerMonth: limit.timesPerMonth || 1,
    };
  });

  return {
    ...budget,
    incomeTargets: updatedIncome,
    expenseLimits: updatedExpenses,
  };
}

/**
 * Aggregate credit card transaction spending by category for a given month.
 * Uses transaction date (not statement month) so Feb purchases go in Feb's budget.
 */
export function getCCSpendingByCategory(
  creditCardStatements: CreditCardStatement[],
  month: string
): CCCategorySpending[] {
  const monthStart = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const monthEnd = `${nextMonth}-01`;

  const totals: Record<string, { total: number; count: number; transactions: import("./types").CreditCardTransaction[] }> = {};

  for (const statement of creditCardStatements) {
    for (const tx of statement.transactions) {
      if (tx.date >= monthStart && tx.date < monthEnd) {
        const cat = tx.category || "other";
        if (!totals[cat]) totals[cat] = { total: 0, count: 0, transactions: [] };
        totals[cat].total += tx.amount;
        totals[cat].count += 1;
        totals[cat].transactions.push(tx);
      }
    }
  }

  return Object.entries(totals)
    .map(([category, { total, count, transactions }]) => ({ category, total, count, transactions }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Days until a date
 */
export function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
