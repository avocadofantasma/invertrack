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
    subAccount: "Cuenta Inteligente",
    type: "SOFIPO",
    annualRate: 0.15,
    maxAmount: null,
    reducedRate: null,
    limitType: "none",
    paymentFrequency: "Diario",
    minAmount: 1,
    notes: "Rendimiento base",
    color: "#8B5CF6",
    isVariable: false,
  },
  {
    institution: "Nu",
    subAccount: "Cajita Turbo",
    type: "SOFIPO",
    annualRate: 0.17,
    maxAmount: 50000,
    reducedRate: null,
    limitType: "hard_cap",
    paymentFrequency: "Diario",
    minAmount: 1,
    notes: "Límite $50k por cajita",
    color: "#A78BFA",
    isVariable: false,
  },
  {
    institution: "Didi",
    subAccount: "Cuenta Principal",
    type: "SOFIPO",
    annualRate: 0.15,
    maxAmount: 100000,
    reducedRate: 0.05,
    limitType: "reduce_rate",
    paymentFrequency: "Diario",
    minAmount: 1,
    notes: "Arriba de $100k baja a 5%",
    color: "#FB923C",
    isVariable: false,
  },
  {
    institution: "Mercado Pago",
    subAccount: "Fondo Rendimiento",
    type: "SOFIPO",
    annualRate: 0.14,
    maxAmount: 50000,
    reducedRate: 0.03,
    limitType: "reduce_rate",
    paymentFrequency: "Diario",
    minAmount: 1,
    notes: "Arriba de $50k baja a 3%",
    color: "#38BDF8",
    isVariable: false,
  },
  {
    institution: "Openbank",
    subAccount: "Cuenta Open",
    type: "Banco",
    annualRate: 0.12,
    maxAmount: 250000,
    reducedRate: 0.06,
    limitType: "reduce_rate",
    paymentFrequency: "Mensual",
    minAmount: 1000,
    notes: "Arriba de $250k baja a 6%",
    color: "#F43F5E",
    isVariable: false,
  },
  {
    institution: "GBM+",
    subAccount: "Smart Cash",
    type: "Casa de Bolsa",
    annualRate: 0.1125,
    maxAmount: null,
    reducedRate: null,
    limitType: "none",
    paymentFrequency: "Diario",
    minAmount: 100,
    notes: "Liquidez inmediata",
    color: "#10B981",
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
    notes: "Rendimiento variable",
    color: "#34D399",
    isVariable: true,
    ticker: "VOO",
    tickerType: "etf",
  },
  {
    institution: "GBM+",
    subAccount: "Acciones",
    type: "Casa de Bolsa",
    annualRate: null,
    maxAmount: null,
    reducedRate: null,
    limitType: "none",
    paymentFrequency: "Variable",
    minAmount: 100,
    notes: "Rendimiento variable",
    color: "#6EE7B7",
    isVariable: true,
    ticker: "AAPL",
    tickerType: "stock",
  },
  {
    institution: "Bitso",
    subAccount: "Bitso+",
    type: "Crypto/Fintech",
    annualRate: null,
    maxAmount: null,
    reducedRate: null,
    limitType: "none",
    paymentFrequency: "Semanal",
    minAmount: 500,
    notes: "Stablecoins",
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
