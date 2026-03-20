import type {
  Account,
  Movement,
  InitialBalance,
  MonthlyContribution,
  AccountSummary,
  InstitutionSummary,
  AlertType,
  ProjectionMonth,
  MarketData,
} from "./types";
import { getMonthLabel } from "./utils";

/**
 * Calculate the effective interest rate considering limits
 */
export function calculateEffectiveRate(
  account: Account,
  balance: number
): number {
  if (account.isVariable || account.annualRate === null) return 0;

  const rate = account.annualRate;

  if (
    account.limitType === "reduce_rate" &&
    account.maxAmount !== null &&
    account.reducedRate !== null &&
    balance > account.maxAmount &&
    account.maxAmount > 0
  ) {
    // Blended rate: max*rate + (balance-max)*reducedRate / balance
    const normalPortion = account.maxAmount * rate;
    const reducedPortion = (balance - account.maxAmount) * account.reducedRate;
    return (normalPortion + reducedPortion) / balance;
  }

  return rate;
}

/**
 * Determine alert type for an account
 */
export function getAlert(account: Account, balance: number): AlertType {
  if (account.maxAmount === null || account.maxAmount === 0) return "ok";

  if (account.limitType === "hard_cap" && balance >= account.maxAmount) {
    return "cap_reached";
  }

  if (account.limitType === "reduce_rate" && balance > account.maxAmount) {
    return "rate_reduced";
  }

  if (balance >= account.maxAmount * 0.8) {
    return "near_limit";
  }

  return "ok";
}

/**
 * Calculate compound interest projection
 */
export function compoundProjection(
  principal: number,
  annualRate: number,
  months: number
): number {
  if (principal === 0 || annualRate === 0) return principal;
  return principal * Math.pow(1 + annualRate / 12, months);
}

/**
 * Build complete account summary from movements
 */
export function buildAccountSummary(
  account: Account,
  movements: Movement[],
  initialBalances: InitialBalance[],
  marketData: Record<string, MarketData>
): AccountSummary {
  const accountMovements = movements.filter(
    (m) => m.accountId === account.id
  );
  const initial = initialBalances.find((ib) => ib.accountId === account.id);

  const initialBal = initial?.balance ?? 0;
  const accruedReturn = initial?.accruedReturn ?? 0;

  const totalDeposits = accountMovements
    .filter((m) => m.amount > 0)
    .reduce((sum, m) => sum + m.amount, 0);

  const totalWithdrawals = accountMovements
    .filter((m) => m.amount < 0)
    .reduce((sum, m) => sum + m.amount, 0);

  const currentBalance =
    initialBal + accountMovements.reduce((sum, m) => sum + m.amount, 0);

  // For variable rate accounts, try to use market data
  let effectiveRate = calculateEffectiveRate(account, currentBalance);
  if (
    account.isVariable &&
    account.ticker &&
    marketData[account.ticker]
  ) {
    effectiveRate = marketData[account.ticker].avgAnnualReturn;
  }

  const alert = getAlert(account, currentBalance);
  const monthlyReturn =
    currentBalance > 0 ? (currentBalance * effectiveRate) / 12 : 0;
  const annualReturn = currentBalance > 0 ? currentBalance * effectiveRate : 0;
  const projection6m = compoundProjection(currentBalance, effectiveRate, 6);
  const projection12m = compoundProjection(currentBalance, effectiveRate, 12);

  const percentOccupied =
    account.maxAmount !== null && account.maxAmount > 0
      ? currentBalance / account.maxAmount
      : null;

  return {
    account,
    currentBalance,
    initialBalance: initialBal,
    totalDeposits,
    totalWithdrawals,
    nominalRate: account.annualRate,
    effectiveRate,
    percentOccupied,
    alert,
    monthlyReturn,
    annualReturn,
    projection6m,
    projection12m,
    accruedReturn,
  };
}

/**
 * Build institution-level summaries
 */
export function buildInstitutionSummaries(
  summaries: AccountSummary[]
): InstitutionSummary[] {
  const groups = new Map<string, AccountSummary[]>();

  for (const s of summaries) {
    const inst = s.account.institution;
    if (!groups.has(inst)) groups.set(inst, []);
    groups.get(inst)!.push(s);
  }

  return Array.from(groups.entries()).map(([institution, accounts]) => {
    const totalBalance = accounts.reduce(
      (sum, a) => sum + a.currentBalance,
      0
    );
    const weightedRate =
      totalBalance > 0
        ? accounts.reduce(
            (sum, a) => sum + a.currentBalance * a.effectiveRate,
            0
          ) / totalBalance
        : 0;

    return {
      institution,
      totalBalance,
      weightedRate,
      monthlyReturn: accounts.reduce((sum, a) => sum + a.monthlyReturn, 0),
      annualReturn: accounts.reduce((sum, a) => sum + a.annualReturn, 0),
      projection6m: accounts.reduce((sum, a) => sum + a.projection6m, 0),
      projection12m: accounts.reduce((sum, a) => sum + a.projection12m, 0),
      accounts,
    };
  });
}

/**
 * Generate month-by-month projections
 */
export function generateProjections(
  summaries: AccountSummary[],
  months: number = 12,
  monthlyContributions: MonthlyContribution[] = []
): ProjectionMonth[] {
  const projections: ProjectionMonth[] = [];
  // Current balances as starting point
  const balances: Record<string, number> = {};
  for (const s of summaries) {
    balances[s.account.id] = s.currentBalance;
  }

  const initialTotal = Object.values(balances).reduce((a, b) => a + b, 0);

  for (let m = 0; m <= months; m++) {
    const monthBalances: Record<string, number> = {};
    let total = 0;

    for (const s of summaries) {
      const id = s.account.id;
      let bal = balances[id];

      if (m > 0) {
        // Apply monthly interest
        const rate = s.effectiveRate;
        bal = bal * (1 + rate / 12);

        // Apply monthly contribution if any
        const contrib = monthlyContributions.find(
          (c) => c.accountId === id && c.enabled
        );
        if (contrib) {
          bal += contrib.amount;
        }
      }

      balances[id] = bal;
      monthBalances[id] = bal;
      total += bal;
    }

    projections.push({
      month: m,
      label: m === 0 ? "Hoy" : getMonthLabel(m),
      balances: monthBalances,
      total,
      totalReturn: total - initialTotal,
    });
  }

  return projections;
}

/**
 * Calculate what-if scenario with monthly contributions
 */
export function calculateWhatIf(
  summaries: AccountSummary[],
  contributions: MonthlyContribution[],
  months: number
): ProjectionMonth[] {
  return generateProjections(summaries, months, contributions);
}

/**
 * Calculate the running balance for an account at each movement
 */
export function getRunningBalance(
  accountId: string,
  movements: Movement[],
  initialBalances: InitialBalance[]
): { movementId: string; balanceBefore: number; balanceAfter: number }[] {
  const initial = initialBalances.find(
    (ib) => ib.accountId === accountId
  );
  let balance = initial?.balance ?? 0;

  return movements
    .filter((m) => m.accountId === accountId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((m) => {
      const before = balance;
      balance += m.amount;
      return {
        movementId: m.id,
        balanceBefore: before,
        balanceAfter: balance,
      };
    });
}
