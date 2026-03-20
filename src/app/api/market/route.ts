import { NextResponse } from "next/server";
import type { MarketData } from "@/lib/types";
import { getFallbackReturn } from "@/lib/market-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }

  try {
    // Try Yahoo Finance v8 API (no key needed for basic quotes)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      ticker
    )}?range=1y&interval=1mo`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status}`);

    const data = await res.json();
    const result = data.chart?.result?.[0];

    if (!result) throw new Error("No chart data");

    const meta = result.meta;
    const closes = result.indicators?.quote?.[0]?.close ?? [];
    const validCloses = closes.filter((c: number | null) => c !== null);

    const currentPrice = meta.regularMarketPrice;
    const firstClose = validCloses[0] ?? currentPrice;
    const sixMonthClose =
      validCloses[Math.floor(validCloses.length / 2)] ?? firstClose;

    const change1y =
      firstClose > 0 ? (currentPrice - firstClose) / firstClose : 0;
    const change6m =
      sixMonthClose > 0
        ? (currentPrice - sixMonthClose) / sixMonthClose
        : 0;

    const prevClose = meta.chartPreviousClose ?? currentPrice;
    const change24h =
      prevClose > 0 ? (currentPrice - prevClose) / prevClose : 0;

    const marketData: MarketData = {
      ticker,
      name: meta.shortName || meta.symbol || ticker,
      price: currentPrice,
      change24h,
      change7d: change6m / 26, // rough weekly from 6mo
      change30d: change1y / 12, // rough monthly from 1y
      change1y,
      avgAnnualReturn: change1y || getFallbackReturn(ticker),
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(marketData);
  } catch (err) {
    // Return fallback data
    const fallbackReturn = getFallbackReturn(ticker);
    const fallbackData: MarketData = {
      ticker,
      name: ticker.toUpperCase(),
      price: 0,
      change24h: 0,
      change7d: 0,
      change30d: 0,
      change1y: fallbackReturn,
      avgAnnualReturn: fallbackReturn,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(fallbackData);
  }
}
