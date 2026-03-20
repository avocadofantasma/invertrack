import type { MarketData } from "./types";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

// Common crypto IDs for CoinGecko
const CRYPTO_IDS: Record<string, string> = {
  bitcoin: "bitcoin",
  btc: "bitcoin",
  ethereum: "ethereum",
  eth: "ethereum",
  usdt: "tether",
  usdc: "usd-coin",
  solana: "solana",
  sol: "solana",
};

/**
 * Fetch crypto market data from CoinGecko (free, no API key needed)
 */
export async function fetchCryptoData(
  coinId: string
): Promise<MarketData | null> {
  const id = CRYPTO_IDS[coinId.toLowerCase()] || coinId.toLowerCase();

  try {
    const res = await fetch(
      `${COINGECKO_BASE}/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false`
    );
    if (!res.ok) return null;

    const data = await res.json();
    const marketCap = data.market_data;

    return {
      ticker: coinId,
      name: data.name,
      price: marketCap.current_price.usd,
      change24h: (marketCap.price_change_percentage_24h ?? 0) / 100,
      change7d: (marketCap.price_change_percentage_7d ?? 0) / 100,
      change30d: (marketCap.price_change_percentage_30d ?? 0) / 100,
      change1y: (marketCap.price_change_percentage_1y ?? 0) / 100,
      avgAnnualReturn: (marketCap.price_change_percentage_1y ?? 0) / 100,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`Failed to fetch crypto data for ${coinId}:`, err);
    return null;
  }
}

/**
 * Fetch stock/ETF data using our API route (proxies to Yahoo Finance)
 */
export async function fetchStockData(
  ticker: string
): Promise<MarketData | null> {
  try {
    const res = await fetch(`/api/market?ticker=${encodeURIComponent(ticker)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`Failed to fetch stock data for ${ticker}:`, err);
    return null;
  }
}

/**
 * Auto-detect ticker type and fetch accordingly
 */
export async function fetchMarketData(
  ticker: string,
  type: "stock" | "etf" | "crypto"
): Promise<MarketData | null> {
  if (type === "crypto") {
    return fetchCryptoData(ticker);
  }
  return fetchStockData(ticker);
}

/**
 * Fallback estimated returns when APIs are unavailable
 */
export const FALLBACK_RETURNS: Record<string, number> = {
  // ETFs
  VOO: 0.1, // S&P 500 ~10% historical
  VTI: 0.1,
  QQQ: 0.15, // Nasdaq ~15%
  IVVPESO: 0.1, // iShares S&P 500 MXN
  NAFTRAC: 0.08, // IPC Mexico ~8%

  // Crypto
  bitcoin: 0.5, // BTC very volatile, ~50% avg
  ethereum: 0.4,

  // Stocks (conservative estimates)
  AAPL: 0.2,
  MSFT: 0.2,
  GOOGL: 0.18,
  AMZN: 0.2,
  NVDA: 0.4,
  TSLA: 0.3,
};

export function getFallbackReturn(ticker: string): number {
  return FALLBACK_RETURNS[ticker.toUpperCase()] ?? FALLBACK_RETURNS[ticker.toLowerCase()] ?? 0.1;
}
