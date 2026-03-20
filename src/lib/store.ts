import { create } from "zustand";
import type {
  Account,
  Movement,
  InitialBalance,
  MonthlyContribution,
  MarketData,
  AppState,
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

interface Store extends AppState {
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

  // Import/Export
  exportData: () => string;
  importData: (json: string) => boolean;
  resetData: () => void;

  // Hydrate from localStorage
  hydrate: () => void;
}

const defaultState: AppState = {
  accounts: [],
  movements: [],
  initialBalances: [],
  monthlyContributions: [],
  marketData: {},
  setupComplete: false,
};

export const useStore = create<Store>((set, get) => ({
  ...defaultState,

  hydrate: () => {
    const stored = loadFromStorage();
    if (stored) {
      set(stored);
    }
  },

  addAccount: (account) => {
    const newAccount: Account = { ...account, id: generateId() };
    set((state) => {
      const next = { ...state, accounts: [...state.accounts, newAccount] };
      saveToStorage(next);
      return next;
    });
  },

  updateAccount: (id, updates) => {
    set((state) => {
      const next = {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
      };
      saveToStorage(next);
      return next;
    });
  },

  deleteAccount: (id) => {
    set((state) => {
      const next = {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== id),
        movements: state.movements.filter((m) => m.accountId !== id),
        initialBalances: state.initialBalances.filter(
          (ib) => ib.accountId !== id
        ),
        monthlyContributions: state.monthlyContributions.filter(
          (mc) => mc.accountId !== id
        ),
      };
      saveToStorage(next);
      return next;
    });
  },

  addMovement: (movement) => {
    const newMovement: Movement = { ...movement, id: generateId() };
    set((state) => {
      const next = {
        ...state,
        movements: [...state.movements, newMovement],
      };
      saveToStorage(next);
      return next;
    });
  },

  updateMovement: (id, updates) => {
    set((state) => {
      const next = {
        ...state,
        movements: state.movements.map((m) =>
          m.id === id ? { ...m, ...updates } : m
        ),
      };
      saveToStorage(next);
      return next;
    });
  },

  deleteMovement: (id) => {
    set((state) => {
      const next = {
        ...state,
        movements: state.movements.filter((m) => m.id !== id),
      };
      saveToStorage(next);
      return next;
    });
  },

  setInitialBalance: (balance) => {
    set((state) => {
      const existing = state.initialBalances.findIndex(
        (ib) => ib.accountId === balance.accountId
      );
      const newBalances =
        existing >= 0
          ? state.initialBalances.map((ib, i) =>
              i === existing ? balance : ib
            )
          : [...state.initialBalances, balance];
      const next = { ...state, initialBalances: newBalances };
      saveToStorage(next);
      return next;
    });
  },

  setMonthlyContribution: (contrib) => {
    set((state) => {
      const existing = state.monthlyContributions.findIndex(
        (mc) => mc.accountId === contrib.accountId
      );
      const newContribs =
        existing >= 0
          ? state.monthlyContributions.map((mc, i) =>
              i === existing ? contrib : mc
            )
          : [...state.monthlyContributions, contrib];
      const next = { ...state, monthlyContributions: newContribs };
      saveToStorage(next);
      return next;
    });
  },

  removeMonthlyContribution: (id) => {
    set((state) => {
      const next = {
        ...state,
        monthlyContributions: state.monthlyContributions.filter(
          (mc) => mc.id !== id
        ),
      };
      saveToStorage(next);
      return next;
    });
  },

  setMarketData: (ticker, data) => {
    set((state) => {
      const next = {
        ...state,
        marketData: { ...state.marketData, [ticker]: data },
      };
      saveToStorage(next);
      return next;
    });
  },

  completeSetup: () => {
    set((state) => {
      const next = { ...state, setupComplete: true };
      saveToStorage(next);
      return next;
    });
  },

  exportData: () => {
    const state = get();
    const exportObj: AppState = {
      accounts: state.accounts,
      movements: state.movements,
      initialBalances: state.initialBalances,
      monthlyContributions: state.monthlyContributions,
      marketData: state.marketData,
      setupComplete: state.setupComplete,
    };
    return JSON.stringify(exportObj, null, 2);
  },

  importData: (json: string) => {
    try {
      const data = JSON.parse(json) as AppState;
      if (!data.accounts || !Array.isArray(data.accounts)) return false;
      set(data);
      saveToStorage(data);
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
export function initializeDefaultAccounts(store: Store) {
  for (const account of DEFAULT_ACCOUNTS) {
    store.addAccount(account);
  }
}
