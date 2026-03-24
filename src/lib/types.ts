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

export interface AppState {
  accounts: Account[];
  movements: Movement[];
  initialBalances: InitialBalance[];
  monthlyContributions: MonthlyContribution[];
  marketData: Record<string, MarketData>;
  setupComplete: boolean;
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
