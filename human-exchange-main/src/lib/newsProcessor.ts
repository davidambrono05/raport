// News Processor — sistem cu memorie
// Detecteaza stiri noi si le proceseaza o singura data

import { fetchNewsForPersonality, sentimentToImpact, type NewsArticle } from "./newsapi";
import { supabase } from "@/integrations/supabase/client";

export type ProcessedNews = {
  article: NewsArticle;
  impact: number;
  isNew: boolean;
};

// Cheia pentru localStorage — stocam ID-urile stirilor procesate
const PROCESSED_KEY = "humanex:processed_news";
const MAX_STORED = 500; // maxim 500 de stiri stocate

// Genereaza un ID unic pentru o stire bazat pe titlu si data
function articleId(article: NewsArticle): string {
  return btoa(article.title.slice(0, 50) + article.publishedAt).replace(/[^a-zA-Z0-9]/g, "");
}

// Citeste stirile procesate din localStorage
function getProcessedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(PROCESSED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

// Salveaza stirile procesate in localStorage
function saveProcessedIds(ids: Set<string>): void {
  try {
    // Pastreaza doar ultimele MAX_STORED
    const arr = Array.from(ids).slice(-MAX_STORED);
    localStorage.setItem(PROCESSED_KEY, JSON.stringify(arr));
  } catch { /* esec silentios */ }
}

// Calculeaza ponderea recency pe baza vechimii articolului
function recencyWeight(publishedAt: string): number {
  const ageHours = (Date.now() - new Date(publishedAt).getTime()) / 3_600_000;
  if (ageHours < 6) return 2.5;
  if (ageHours < 24) return 2.0;
  if (ageHours < 72) return 1.3;
  return 1.0;
}

// Proceseaza stirile si returneaza doar cele noi
export function filterNewArticles(articles: NewsArticle[]): ProcessedNews[] {
  const processed = getProcessedIds();
  const results: ProcessedNews[] = [];
  const newIds = new Set(processed);

  for (const article of articles) {
    const id = articleId(article);
    const isNew = !processed.has(id);

    if (isNew) {
      newIds.add(id);
    }

    results.push({
      article,
      impact: sentimentToImpact(article),
      isNew,
    });
  }

  saveProcessedIds(newIds);
  return results;
}

// Calculeaza impactul total al stirilor noi
export function calculateNewsImpact(processedNews: ProcessedNews[]): {
  delta: number;
  newArticles: ProcessedNews[];
  sources: string[];
} {
  const newArticles = processedNews.filter((p) => p.isNew);
  const sources: string[] = [];

  if (newArticles.length === 0) {
    return { delta: 0, newArticles: [], sources: [] };
  }

  let totalImpact = 0;
  let totalWeight = 0;

  for (const item of newArticles) {
    const weight = recencyWeight(item.article.publishedAt);
    totalImpact += item.impact * weight;
    totalWeight += weight;
    if (Math.abs(item.impact) > 0.05) {
      const direction = item.impact > 0 ? "📈" : "📉";
      sources.push(
        `${direction} ${item.impact > 0 ? "+" : ""}${item.impact.toFixed(2)}% — ${item.article.title.slice(0, 70)}`
      );
    }
  }

  // Media ponderata cu recency a impactului stirilor noi
  const avgImpact = totalWeight > 0 ? totalImpact / totalWeight : 0;

  // Limiteaza la ±2% per batch de stiri noi (extins de la ±1%)
  const delta = Math.max(-2, Math.min(2, avgImpact));

  return { delta, newArticles, sources };
}

// Aplica impactul stirilor noi in Supabase
export async function applyNewsImpact(
  personalityId: string,
  delta: number
): Promise<void> {
  if (Math.abs(delta) < 0.01) return; // ignora miscari sub 0.01%

  try {
    await (supabase.rpc as any)("tick_market_with_delta", {
      p_personality_id: personalityId,
      p_delta_pct: delta,
    });
  } catch { /* esec silentios */ }
}
