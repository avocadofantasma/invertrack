"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMarketData, getFallbackReturn } from "@/lib/market-data";
import { useStore } from "@/lib/store";
import { useEffect } from "react";
import type { Account } from "@/lib/types";

export function useMarketData(account: Account) {
  const setMarketData = useStore((s) => s.setMarketData);

  const query = useQuery({
    queryKey: ["market", account.ticker, account.tickerType],
    queryFn: () =>
      fetchMarketData(account.ticker!, account.tickerType!),
    enabled: !!account.isVariable && !!account.ticker && !!account.tickerType,
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchInterval: 1000 * 60 * 60, // Refresh every hour
    retry: 2,
  });

  useEffect(() => {
    if (query.data && account.ticker) {
      setMarketData(account.ticker, query.data);
    }
  }, [query.data, account.ticker, setMarketData]);

  return query;
}

export function useAllMarketData(accounts: Account[]) {
  const variableAccounts = accounts.filter(
    (a) => a.isVariable && a.ticker && a.tickerType
  );

  const queries = variableAccounts.map((account) => ({
    account,
    // eslint-disable-next-line react-hooks/rules-of-hooks
    query: useMarketData(account),
  }));

  return queries;
}

export function useMarketReturn(account: Account): number {
  const marketData = useStore((s) => s.marketData);

  if (!account.isVariable) return account.annualRate ?? 0;

  if (account.ticker && marketData[account.ticker]) {
    return marketData[account.ticker].avgAnnualReturn;
  }

  if (account.ticker) {
    return getFallbackReturn(account.ticker);
  }

  return 0;
}
