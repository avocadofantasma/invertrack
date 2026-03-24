export type LimitType = "none" | "hard_cap" | "reduce_rate";

export interface Account {
  id: string;
  institution: string;
  subAccount: string;
  type: string;
  annualRate: number | null; // null = variable
  maxAmount: number | null; // null = no limit
  reducedRate: number | null; // rate after exceeding max (only for reduce_rate)
  limitType: LimitType;
  paymentFrequency: string;
  minAmount: number;
  notes: string;
  color: string; // hex color for charts
  isVariable: boolean;
  // For variable rate accounts
  ticker?: string; // e.g. "VOO", "BTC"
  tickerType?: "stock" | "etf" | "crypto";
}

export interface Movement {
  id: string;
  accountId: string;
  date: string; // ISO string
  type: "deposit" | "withdrawal" | "reinvestment" | "transfer";
  amount: number; // positive for deposits, negative for withdrawals
  notes: string;
}

export interface InitialBalance {
  accountId: string;
  balance: number;
  accruedReturn: number; // returns already generated before tracking
  date: string; // ISO string
}

export interface MonthlyContribution {
  id: string;
  accountId: string;
  amount: number;
  enabled: boolean;
}

export interface AccountSummary {
  account: Account;
  currentBalance: number;
  initialBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  nominalRate: number | null;
  effectiveRate: number;
  percentOccupied: number | null;
  alert: AlertType;
  monthlyReturn: number;
  annualReturn: number;
  projection6m: number;
  projection12m: number;
  accruedReturn: number;
}

export type AlertType =
  | "ok"
  | "near_limit"
  | "cap_reached"
  | "rate_reduced";

export interface InstitutionSummary {
  institution: string;
  totalBalance: number;
  weightedRate: number;
  monthlyReturn: number;
  annualReturn: number;
  projection6m: number;
  projection12m: number;
  accounts: AccountSummary[];
}

export interface ProjectionMonth {
  month: number;
  label: string;
  balances: Record<string, number>; // accountId -> balance
  total: number;
  totalReturn: number;
}

export interface WhatIfScenario {
  monthlyContributions: MonthlyContribution[];
  months: number;
  projections: ProjectionMonth[];
}

export interface MarketData {
  ticker: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  change30d: number;
  change1y: number;
  avgAnnualReturn: number;
  lastUpdated: string;
}

// ── Finance Types ──────────────────────────────────────────────

export type IncomeCategory = "salary" | "business" | "bonus" | "sale" | "other";
export type ExpenseCategory = "personal" | "business";

export interface IncomeSource {
  id: string;
  name: string;
  type: IncomeCategory;
  amount: number;
  frequency: "monthly" | "biweekly" | "one-time";
  dayOfMonth?: number;
  timesPerMonth: number; // 1 = monthly, 2 = biweekly/quincenal
  notes: string;
  enabled: boolean;
}

export interface IncomeEntry {
  id: string;
  sourceId?: string;
  date: string;
  amount: number;
  category: IncomeCategory;
  description: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  category: ExpenseCategory;
  expectedAmount: number;
  dueDay?: number;
  timesPerMonth: number; // 1 = once, 2 = twice (quincenal)
  notes: string;
  enabled: boolean;
}

export interface ExpenseEntry {
  id: string;
  fixedExpenseId?: string;
  date: string;
  amount: number;
  category: string;
  description: string;
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  creditLimit: number;
  cutDay: number;
  paymentDueDay: number;
  color: string;
  notes: string;
  enabled: boolean;
}

export interface CreditCardTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
  installment?: {
    current: number;
    total: number;
    remainingBalance: number;
  };
}

export interface CreditCardStatement {
  id: string;
  cardId: string;
  month: string; // YYYY-MM
  totalBalance: number;
  minimumPayment: number;
  cutDate: string;
  dueDate: string;
  transactions: CreditCardTransaction[];
  paid: boolean;
  paidAmount?: number;
  paidDate?: string;
}

export interface Loan {
  id: string;
  name: string;
  institution: string;
  type: "car" | "personal" | "other";
  totalAmount: number;
  remainingBalance: number;
  monthlyPayment: number;
  interestRate: number;
  paymentDueDay: number;
  startDate: string;
  endDate?: string;
  totalInstallments: number;
  paidInstallments: number;
  color: string;
  notes: string;
  enabled: boolean;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  date: string;
  amount: number;
  principal: number;
  interest: number;
  remainingAfter: number;
  notes: string;
}

export interface BudgetLineItem {
  id: string;
  name: string;
  category: string;
  budgeted: number;
  actual: number;
  timesPerMonth: number; // how many payments expected per month
  timesPaid: number; // how many payments made this month
}

export interface MonthlyBudget {
  id: string;
  month: string; // YYYY-MM
  incomeTargets: BudgetLineItem[];
  expenseLimits: BudgetLineItem[];
  notes: string;
}

export interface FinanceSettings {
  openaiApiKey: string;
  reminderDaysBefore: number;
}

// ── Reminders ──────────────────────────────────────────────────

export type ReminderType = "credit_card_cut" | "credit_card_due" | "loan_due" | "expense_due";

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  description: string;
  dueDate: string;
  sourceId: string;
  dismissed: boolean;
}

// ── App State ──────────────────────────────────────────────────

export interface AppState {
  // Investment tracker
  accounts: Account[];
  movements: Movement[];
  initialBalances: InitialBalance[];
  monthlyContributions: MonthlyContribution[];
  marketData: Record<string, MarketData>;
  setupComplete: boolean;
  // Finance tracker
  incomeSources: IncomeSource[];
  incomeEntries: IncomeEntry[];
  fixedExpenses: FixedExpense[];
  expenseEntries: ExpenseEntry[];
  creditCards: CreditCard[];
  creditCardStatements: CreditCardStatement[];
  loans: Loan[];
  loanPayments: LoanPayment[];
  monthlyBudgets: MonthlyBudget[];
  financeSettings: FinanceSettings;
  dismissedReminders: string[]; // reminder IDs
}

// Default accounts for Mexican market
export const DEFAULT_ACCOUNTS: Omit<Account, "id">[] = [
  {
    institution: "Nu",
    subAccount: "Fondo de emergencia",
    type: "SOFIPO",
    annualRate: 0.07,
    maxAmount: null,
    reducedRate: null,
    limitType: "none",
    paymentFrequency: "Diario",
    minAmount: 1,
    notes: "",
    color: "#8B5CF6",
    isVariable: false,
  },
  {
    institution: "Nu",
    subAccount: "Cajita Turbo",
    type: "SOFIPO",
    annualRate: 0.15,
    maxAmount: 25000,
    reducedRate: null,
    limitType: "hard_cap",
    paymentFrequency: "Diario",
    minAmount: 1,
    notes: "",
    color: "#A78BFA",
    isVariable: false,
  },
  {
    institution: "Nu",
    subAccount: "Ventas",
    type: "SOFIPO",
    annualRate: 0.07,
    maxAmount: null,
    reducedRate: null,
    limitType: "hard_cap",
    paymentFrequency: "Diario",
    minAmount: 1,
    notes: "",
    color: "#C4B5FD",
    isVariable: false,
  },
  {
    institution: "Nu",
    subAccount: "Dofus",
    type: "SOFIPO",
    annualRate: 0.07,
    maxAmount: null,
    reducedRate: null,
    limitType: "none",
    paymentFrequency: "Diario",
    minAmount: 1,
    notes: "",
    color: "#DDD6FE",
    isVariable: false,
  },
  {
    institution: "Didi",
    subAccount: "Cuenta Principal",
    type: "SOFIPO",
    annualRate: 0.15,
    maxAmount: 10000,
    reducedRate: 0.08,
    limitType: "reduce_rate",
    paymentFrequency: "Diario",
    minAmount: 1,
    notes: "",
    color: "#FB923C",
    isVariable: false,
  },
  {
    institution: "Mercado Pago",
    subAccount: "Fondo Rendimiento",
    type: "SOFIPO",
    annualRate: 0.13,
    maxAmount: 25000,
    reducedRate: 0.07,
    limitType: "reduce_rate",
    paymentFrequency: "Diario",
    minAmount: 1,
    notes: "",
    color: "#38BDF8",
    isVariable: false,
  },
  {
    institution: "Openbank",
    subAccount: "Cuenta Open",
    type: "Banco",
    annualRate: 0.13,
    maxAmount: 40000,
    reducedRate: 0.09,
    limitType: "reduce_rate",
    paymentFrequency: "Mensual",
    minAmount: 1000,
    notes: "",
    color: "#F43F5E",
    isVariable: false,
  },
  {
    institution: "GBM+",
    subAccount: "Trading Acciones",
    type: "Casa de Bolsa",
    annualRate: 0.10,
    maxAmount: null,
    reducedRate: null,
    limitType: "none",
    paymentFrequency: "Diario",
    minAmount: 100,
    notes: "",
    color: "#10B981",
    isVariable: false,
  },
  {
    institution: "GBM+",
    subAccount: "Leo",
    type: "Casa de Bolsa",
    annualRate: 0.10,
    maxAmount: null,
    reducedRate: null,
    limitType: "none",
    paymentFrequency: "Diario",
    minAmount: 100,
    notes: "",
    color: "#34D399",
    isVariable: false,
  },
  {
    institution: "GBM+",
    subAccount: "ETFs",
    type: "Casa de Bolsa",
    annualRate: null,
    maxAmount: null,
    reducedRate: null,
    limitType: "none",
    paymentFrequency: "Variable",
    minAmount: 100,
    notes: "",
    color: "#6EE7B7",
    isVariable: true,
    ticker: "VOO",
    tickerType: "etf",
  },
  {
    institution: "Bitso",
    subAccount: "Bitso+",
    type: "Crypto/Fintech",
    annualRate: null,
    maxAmount: null,
    reducedRate: null,
    limitType: "none",
    paymentFrequency: "Variable",
    minAmount: 500,
    notes: "",
    color: "#22D3EE",
    isVariable: true,
    ticker: "bitcoin",
    tickerType: "crypto",
  },
];

export const INSTITUTION_COLORS: Record<string, string> = {
  Nu: "#8B5CF6",
  Didi: "#FB923C",
  "Mercado Pago": "#38BDF8",
  Openbank: "#F43F5E",
  "GBM+": "#10B981",
  Bitso: "#22D3EE",
};

export const MOVEMENT_TYPES = [
  { value: "deposit", label: "Depósito", icon: "plus" },
  { value: "withdrawal", label: "Retiro", icon: "minus" },
  { value: "reinvestment", label: "Reinversión", icon: "refresh" },
  { value: "transfer", label: "Transferencia", icon: "arrow-right" },
] as const;

export const LIMIT_TYPES = [
  { value: "none", label: "Sin límite" },
  { value: "hard_cap", label: "Tope duro" },
  { value: "reduce_rate", label: "Tope + Reduce tasa" },
] as const;
