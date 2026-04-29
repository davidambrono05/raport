// Algorithm Engine — Human Reality Score
// Combina toate sursele de date intr-o singura miscare de pret

import { fetchNewsForPersonality, sentimentToImpact } from "./newsapi";
import { fetchWikipediaData } from "./wikipedia";
import { fetchInterestScore, trendsImpact } from "./trends";
import { supabase } from "@/integrations/supabase/client";

export type PriceMovement = {
  delta: number;
  breakdown: {
    news: number;
    wikipedia: number;
    youtube: number;
    base: number; // pastrat pentru compatibilitate, mereu 0
    trends: number;
  };
  sources: string[];
};

// Calculeaza impactul din Wikipedia
function wikipediaImpact(pageviewsChange: number): number {
  const impact = (pageviewsChange / 50) * 0.4;
  return Math.max(-0.4, Math.min(0.4, impact));
}

// Calculeaza impactul din stiri
async function newsImpact(name: string): Promise<{ impact: number; sources: string[] }> {
  try {
    const articles = await fetchNewsForPersonality(name);
    if (articles.length === 0) return { impact: 0, sources: [] };

    let totalImpact = 0;
    const sources: string[] = [];

    for (const article of articles.slice(0, 3)) {
      const impact = sentimentToImpact(article);
      totalImpact += impact;
      if (Math.abs(impact) > 0.1) {
        sources.push(`${article.sentiment === "positive" ? "+" : ""}${impact.toFixed(2)}% — ${article.title.slice(0, 60)}`);
      }
    }

    const avgImpact = totalImpact / articles.length;
    return {
      impact: Math.max(-1, Math.min(1, avgImpact)),
      sources,
    };
  } catch {
    return { impact: 0, sources: [] };
  }
}

// FUNCTIA PRINCIPALA
export async function calculatePriceMovement(
  personalityName: string,
  personalityId: string
): Promise<PriceMovement> {
  const sources: string[] = [];

  // 1. Wikipedia impact (20%)
  let wikiImpact = 0;
  let wikiPageviews = 0;
  try {
    const wikiData = await fetchWikipediaData(personalityName);
    wikiImpact = wikipediaImpact(wikiData.pageviewsChange);
    wikiPageviews = wikiData.pageviews;
    if (Math.abs(wikiImpact) > 0.1) {
      sources.push(`Wikipedia: ${wikiData.pageviewsChange > 0 ? "+" : ""}${wikiData.pageviewsChange}% views`);
    }
  } catch { wikiImpact = 0; }

  // 2. News impact (30%)
  const { impact: nImpact, sources: newsSources } = await newsImpact(personalityName);
  sources.push(...newsSources);

  // 3. Trends impact (20%)
  let gTrendsImpact = 0;
  try {
    const trendsData = await fetchInterestScore(personalityName, wikiPageviews);
    gTrendsImpact = trendsImpact(trendsData.interestScore) * 0.3;
    if (Math.abs(gTrendsImpact) > 0.1) {
      sources.push(`Interest: ${trendsData.interestScore}/100 (${trendsData.trend})`);
    }
  } catch { gTrendsImpact = 0; }

  // 4. Mean reversion (20%) — cel mai important pentru stabilitate
  let reversionImpact = 0;
  try {
    const { data: p } = await supabase
      .from("personalities")
      .select("current_price")
      .eq("id", personalityId)
      .maybeSingle();

    if (p?.current_price) {
      const price = Number(p.current_price);
      // Preturi initiale aproximative per personalitate
      const initialPrice = 450;

      if (price > initialPrice * 1.2) {
        // Pret prea mare — scade
        reversionImpact = -((price - initialPrice * 1.2) / initialPrice) * 0.8;
        sources.push(`Market correction: overvalued`);
      } else if (price < initialPrice * 0.8) {
        // Pret prea mic — creste
        reversionImpact = ((initialPrice * 0.8 - price) / initialPrice) * 0.8;
        sources.push(`Market recovery: undervalued`);
      }
    }
  } catch { reversionImpact = 0; }

  // Formula finala — fara zgomot aleatoriu
  const delta =
    wikiImpact * 0.25 +
    nImpact * 0.35 +
    gTrendsImpact * 0.20 +
    reversionImpact * 0.20;

  // Limiteaza la ±1.2% per ciclu
  const clampedDelta = Math.max(-1.2, Math.min(1.2, delta));

  return {
    delta: +clampedDelta.toFixed(2),
    breakdown: {
      news: +nImpact.toFixed(2),
      wikipedia: +wikiImpact.toFixed(2),
      youtube: +reversionImpact.toFixed(2),
      base: 0,
      trends: +gTrendsImpact.toFixed(2),
    },
    sources,
  };
}

// Aplica miscarea pretului prin tick_market_with_delta
export async function applyPriceMovement(
  personalityId: string,
  currentPrice: number,
  movement: PriceMovement
): Promise<number> {
  const newPrice = currentPrice * (1 + movement.delta / 100);
  const clampedPrice = Math.max(10, newPrice);

  try {
    await (supabase.rpc as any)("tick_market_with_delta", {
      p_personality_id: personalityId,
      p_delta_pct: movement.delta,
    });
  } catch {
    try {
      await (supabase.rpc as any)("tick_market");
    } catch { /* esec silentios */ }
  }

  return clampedPrice;
}
