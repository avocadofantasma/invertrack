import { create } from "zustand";
import type {
  Account,
  Movement,
  InitialBalance,
  MonthlyContribution,
  MarketData,
  AppState,
  IncomeSource,
  IncomeEntry,
  FixedExpense,
  ExpenseEntry,
  CreditCard,
  CreditCardStatement,
  Loan,
  LoanPayment,
  MonthlyBudget,
  FinanceSettings,
} from "./types";
import { DEFAULT_ACCOUNTS } from "./types";
import { generateId } from "./utils";

const STORAGE_KEY = "invertrack-data";

function loadFromStorage(): Partial<AppState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveToStorage(state: AppState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export interface Store extends AppState {
  // Account actions
  addAccount: (account: Omit<Account, "id">) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  // Movement actions
  addMovement: (movement: Omit<Movement, "id">) => void;
  updateMovement: (id: string, updates: Partial<Movement>) => void;
  deleteMovement: (id: string) => void;

  // Initial balance actions
  setInitialBalance: (balance: InitialBalance) => void;

  // Monthly contribution actions
  setMonthlyContribution: (contrib: MonthlyContribution) => void;
  removeMonthlyContribution: (id: string) => void;

  // Market data
  setMarketData: (ticker: string, data: MarketData) => void;

  // Setup
  completeSetup: () => void;

  // ── Finance actions ──────────────────────────────────────

  // Income
  addIncomeSource: (source: Omit<IncomeSource, "id">) => void;
  updateIncomeSource: (id: string, updates: Partial<IncomeSource>) => void;
  deleteIncomeSource: (id: string) => void;
  addIncomeEntry: (entry: Omit<IncomeEntry, "id">) => void;
  deleteIncomeEntry: (id: string) => void;

  // Expenses
  addFixedExpense: (expense: Omit<FixedExpense, "id">) => void;
  updateFixedExpense: (id: string, updates: Partial<FixedExpense>) => void;
  deleteFixedExpense: (id: string) => void;
  addExpenseEntry: (entry: Omit<ExpenseEntry, "id">) => void;
  deleteExpenseEntry: (id: string) => void;

  // Credit Cards
  addCreditCard: (card: Omit<CreditCard, "id">) => void;
  updateCreditCard: (id: string, updates: Partial<CreditCard>) => void;
  deleteCreditCard: (id: string) => void;
  addCreditCardStatement: (statement: Omit<CreditCardStatement, "id">) => void;
  updateCreditCardStatement: (id: string, updates: Partial<CreditCardStatement>) => void;
  deleteCreditCardStatement: (id: string) => void;

  // Loans
  addLoan: (loan: Omit<Loan, "id">) => void;
  updateLoan: (id: string, updates: Partial<Loan>) => void;
  deleteLoan: (id: string) => void;
  addLoanPayment: (payment: Omit<LoanPayment, "id">) => void;
  deleteLoanPayment: (id: string) => void;

  // Budget
  addMonthlyBudget: (budget: Omit<MonthlyBudget, "id">) => void;
  updateMonthlyBudget: (id: string, updates: Partial<MonthlyBudget>) => void;
  deleteMonthlyBudget: (id: string) => void;

  // Settings
  updateFinanceSettings: (settings: Partial<FinanceSettings>) => void;

  // Reminders
  dismissReminder: (reminderId: string) => void;
  clearDismissedReminders: () => void;

  // Import/Export
  exportData: () => string;
  importData: (json: string) => boolean;
  resetData: () => void;

  // Hydrate from localStorage
  hydrate: () => void;
}

const defaultFinanceSettings: FinanceSettings = {
  openaiApiKey: "",
  reminderDaysBefore: 7,
};

const defaultState: AppState = {
  accounts: [],
  movements: [],
  initialBalances: [],
  monthlyContributions: [],
  marketData: {},
  setupComplete: false,
  // Finance
  incomeSources: [],
  incomeEntries: [],
  fixedExpenses: [],
  expenseEntries: [],
  creditCards: [],
  creditCardStatements: [],
  loans: [],
  loanPayments: [],
  monthlyBudgets: [],
  financeSettings: defaultFinanceSettings,
  dismissedReminders: [],
};

// Helper to update state and persist
function update(set: (fn: (state: Store) => Partial<Store>) => void, updater: (state: Store) => Partial<AppState>) {
  set((state) => {
    const changes = updater(state);
    const next = { ...state, ...changes } as AppState;
    saveToStorage(next);
    return changes;
  });
}

export const useStore = create<Store>((set, get) => ({
  ...defaultState,

  hydrate: () => {
    const stored = loadFromStorage();
    if (stored) {
      // Merge with defaults for backwards compatibility
      set({
        ...defaultState,
        ...stored,
        financeSettings: { ...defaultFinanceSettings, ...stored.financeSettings },
      });
    }
  },

  // ── Investment actions (unchanged) ─────────────────────────

  addAccount: (account) => {
    const newAccount: Account = { ...account, id: generateId() };
    update(set, (state) => ({ accounts: [...state.accounts, newAccount] }));
  },

  updateAccount: (id, updates) => {
    update(set, (state) => ({
      accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  },

  deleteAccount: (id) => {
    update(set, (state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
      movements: state.movements.filter((m) => m.accountId !== id),
      initialBalances: state.initialBalances.filter((ib) => ib.accountId !== id),
      monthlyContributions: state.monthlyContributions.filter((mc) => mc.accountId !== id),
    }));
  },

  addMovement: (movement) => {
    const newMovement: Movement = { ...movement, id: generateId() };
    update(set, (state) => ({ movements: [...state.movements, newMovement] }));
  },

  updateMovement: (id, updates) => {
    update(set, (state) => ({
      movements: state.movements.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  },

  deleteMovement: (id) => {
    update(set, (state) => ({
      movements: state.movements.filter((m) => m.id !== id),
    }));
  },

  setInitialBalance: (balance) => {
    update(set, (state) => {
      const existing = state.initialBalances.findIndex((ib) => ib.accountId === balance.accountId);
      const newBalances =
        existing >= 0
          ? state.initialBalances.map((ib, i) => (i === existing ? balance : ib))
          : [...state.initialBalances, balance];
      return { initialBalances: newBalances };
    });
  },

  setMonthlyContribution: (contrib) => {
    update(set, (state) => {
      const existing = state.monthlyContributions.findIndex((mc) => mc.accountId === contrib.accountId);
      const newContribs =
        existing >= 0
          ? state.monthlyContributions.map((mc, i) => (i === existing ? contrib : mc))
          : [...state.monthlyContributions, contrib];
      return { monthlyContributions: newContribs };
    });
  },

  removeMonthlyContribution: (id) => {
    update(set, (state) => ({
      monthlyContributions: state.monthlyContributions.filter((mc) => mc.id !== id),
    }));
  },

  setMarketData: (ticker, data) => {
    update(set, (state) => ({
      marketData: { ...state.marketData, [ticker]: data },
    }));
  },

  completeSetup: () => {
    update(set, () => ({ setupComplete: true }));
  },

  // ── Income actions ──────────────────────────────────────────

  addIncomeSource: (source) => {
    const newSource: IncomeSource = { ...source, id: generateId() };
    update(set, (state) => ({ incomeSources: [...state.incomeSources, newSource] }));
  },

  updateIncomeSource: (id, updates) => {
    update(set, (state) => ({
      incomeSources: state.incomeSources.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  },

  deleteIncomeSource: (id) => {
    update(set, (state) => ({
      incomeSources: state.incomeSources.filter((s) => s.id !== id),
    }));
  },

  addIncomeEntry: (entry) => {
    const newEntry: IncomeEntry = { ...entry, id: generateId() };
    update(set, (state) => ({ incomeEntries: [...state.incomeEntries, newEntry] }));
  },

  deleteIncomeEntry: (id) => {
    update(set, (state) => ({
      incomeEntries: state.incomeEntries.filter((e) => e.id !== id),
    }));
  },

  // ── Expense actions ─────────────────────────────────────────

  addFixedExpense: (expense) => {
    const newExpense: FixedExpense = { ...expense, id: generateId() };
    update(set, (state) => ({ fixedExpenses: [...state.fixedExpenses, newExpense] }));
  },

  updateFixedExpense: (id, updates) => {
    update(set, (state) => ({
      fixedExpenses: state.fixedExpenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  },

  deleteFixedExpense: (id) => {
    update(set, (state) => ({
      fixedExpenses: state.fixedExpenses.filter((e) => e.id !== id),
    }));
  },

  addExpenseEntry: (entry) => {
    const newEntry: ExpenseEntry = { ...entry, id: generateId() };
    update(set, (state) => ({ expenseEntries: [...state.expenseEntries, newEntry] }));
  },

  deleteExpenseEntry: (id) => {
    update(set, (state) => ({
      expenseEntries: state.expenseEntries.filter((e) => e.id !== id),
    }));
  },

  // ── Credit Card actions ─────────────────────────────────────

  addCreditCard: (card) => {
    const newCard: CreditCard = { ...card, id: generateId() };
    update(set, (state) => ({ creditCards: [...state.creditCards, newCard] }));
  },

  updateCreditCard: (id, updates) => {
    update(set, (state) => ({
      creditCards: state.creditCards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },

  deleteCreditCard: (id) => {
    update(set, (state) => ({
      creditCards: state.creditCards.filter((c) => c.id !== id),
      creditCardStatements: state.creditCardStatements.filter((s) => s.cardId !== id),
    }));
  },

  addCreditCardStatement: (statement) => {
    const newStatement: CreditCardStatement = { ...statement, id: generateId() };
    update(set, (state) => ({
      creditCardStatements: [...state.creditCardStatements, newStatement],
    }));
  },

  updateCreditCardStatement: (id, updates) => {
    update(set, (state) => ({
      creditCardStatements: state.creditCardStatements.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    }));
  },

  deleteCreditCardStatement: (id) => {
    update(set, (state) => ({
      creditCardStatements: state.creditCardStatements.filter((s) => s.id !== id),
    }));
  },

  // ── Loan actions ────────────────────────────────────────────

  addLoan: (loan) => {
    const newLoan: Loan = { ...loan, id: generateId() };
    update(set, (state) => ({ loans: [...state.loans, newLoan] }));
  },

  updateLoan: (id, updates) => {
    update(set, (state) => ({
      loans: state.loans.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  },

  deleteLoan: (id) => {
    update(set, (state) => ({
      loans: state.loans.filter((l) => l.id !== id),
      loanPayments: state.loanPayments.filter((p) => p.loanId !== id),
    }));
  },

  addLoanPayment: (payment) => {
    const newPayment: LoanPayment = { ...payment, id: generateId() };
    update(set, (state) => {
      // Also update the loan's remaining balance and paid installments
      const loan = state.loans.find((l) => l.id === payment.loanId);
      const updatedLoans = loan
        ? state.loans.map((l) =>
            l.id === payment.loanId
              ? {
                  ...l,
                  remainingBalance: payment.remainingAfter,
                  paidInstallments: l.paidInstallments + 1,
                }
              : l
          )
        : state.loans;
      return {
        loanPayments: [...state.loanPayments, newPayment],
        loans: updatedLoans,
      };
    });
  },

  deleteLoanPayment: (id) => {
    update(set, (state) => ({
      loanPayments: state.loanPayments.filter((p) => p.id !== id),
    }));
  },

  // ── Budget actions ──────────────────────────────────────────

  addMonthlyBudget: (budget) => {
    const newBudget: MonthlyBudget = { ...budget, id: generateId() };
    update(set, (state) => ({ monthlyBudgets: [...state.monthlyBudgets, newBudget] }));
  },

  updateMonthlyBudget: (id, updates) => {
    update(set, (state) => ({
      monthlyBudgets: state.monthlyBudgets.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
  },

  deleteMonthlyBudget: (id) => {
    update(set, (state) => ({
      monthlyBudgets: state.monthlyBudgets.filter((b) => b.id !== id),
    }));
  },

  // ── Settings ────────────────────────────────────────────────

  updateFinanceSettings: (settings) => {
    update(set, (state) => ({
      financeSettings: { ...state.financeSettings, ...settings },
    }));
  },

  // ── Reminders ───────────────────────────────────────────────

  dismissReminder: (reminderId) => {
    update(set, (state) => ({
      dismissedReminders: [...state.dismissedReminders, reminderId],
    }));
  },

  clearDismissedReminders: () => {
    update(set, () => ({ dismissedReminders: [] }));
  },

  // ── Import/Export ───────────────────────────────────────────

  exportData: () => {
    const state = get();
    const exportObj: AppState = {
      accounts: state.accounts,
      movements: state.movements,
      initialBalances: state.initialBalances,
      monthlyContributions: state.monthlyContributions,
      marketData: state.marketData,
      setupComplete: state.setupComplete,
      incomeSources: state.incomeSources,
      incomeEntries: state.incomeEntries,
      fixedExpenses: state.fixedExpenses,
      expenseEntries: state.expenseEntries,
      creditCards: state.creditCards,
      creditCardStatements: state.creditCardStatements,
      loans: state.loans,
      loanPayments: state.loanPayments,
      monthlyBudgets: state.monthlyBudgets,
      financeSettings: state.financeSettings,
      dismissedReminders: state.dismissedReminders,
    };
    return JSON.stringify(exportObj, null, 2);
  },

  importData: (json: string) => {
    try {
      const data = JSON.parse(json) as Partial<AppState>;
      if (!data.accounts || !Array.isArray(data.accounts)) return false;
      const merged: AppState = { ...defaultState, ...data, financeSettings: { ...defaultFinanceSettings, ...data.financeSettings } };
      set(merged);
      saveToStorage(merged);
      return true;
    } catch {
      return false;
    }
  },

  resetData: () => {
    set(defaultState);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
}));

// Initialize default accounts helper
export function initializeDefaultAccounts(store: { addAccount: (account: Omit<Account, "id">) => void }) {
  for (const account of DEFAULT_ACCOUNTS) {
    store.addAccount(account);
  }
}
