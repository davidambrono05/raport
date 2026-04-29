// News History — sistem de acumulare stiri in Supabase
// Salveaza fiecare stire procesata si calculeaza scorul din istoric

import { supabase } from "@/integrations/supabase/client";
import { fetchNewsForPersonality, type NewsArticle } from "./newsapi";

export type NewsHistoryEntry = {
  personality_id: string;
  title: string;
  url: string | null;
  source: string;
  sentiment: "positive" | "negative" | "neutral";
  published_at: string | null;
};

export type HistoricalNewsScore = {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  score: number; // 0-100
  daysOfData: number;
};

// Salveaza stirile noi in Supabase (ignora duplicatele prin UNIQUE index pe url)
export async function saveNewsToHistory(
  personalityId: string,
  articles: NewsArticle[]
): Promise<number> {
  if (articles.length === 0) return 0;

  const entries: NewsHistoryEntry[] = articles.map(article => ({
    personality_id: personalityId,
    title: article.title,
    url: article.url || null,
    source: article.source.name,
    sentiment: article.sentiment,
    published_at: article.publishedAt || null,
  }));

  try {
    const { data, error } = await supabase
      .from("news_history")
      .upsert(entries, {
        onConflict: "url",
        ignoreDuplicates: true,
      });

    if (error) throw error;
    return entries.length;
  } catch {
    return 0;
  }
}

// Calculeaza scorul din tot istoricul de stiri din Supabase
export async function calculateHistoricalNewsScore(
  personalityId: string
): Promise<HistoricalNewsScore> {
  try {
    const { data, error } = await supabase
      .from("news_history")
      .select("sentiment, processed_at")
      .eq("personality_id", personalityId)
      .order("processed_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return { total: 0, positive: 0, negative: 0, neutral: 0, score: 50, daysOfData: 0 };
    }

    // Numara sentimentele
    let positive = 0;
    let negative = 0;
    let neutral = 0;

    // Stirile recente au mai multa greutate
    for (let i = 0; i < data.length; i++) {
      const weight = Math.max(0.3, 1 - (i / data.length) * 0.7);
      if (data[i].sentiment === "positive") positive += weight;
      else if (data[i].sentiment === "negative") negative += weight;
      else neutral += weight;
    }

    const total = data.length;
    const weightedTotal = positive + negative + neutral;

    // Scor bazat pe ratio ponderat
    const positiveRatio = positive / weightedTotal;
    const negativeRatio = negative / weightedTotal;
    const score = Math.round(50 + (positiveRatio - negativeRatio) * 50);

    // Calculeaza zile de date
    const oldest = new Date(data[data.length - 1].processed_at);
    const newest = new Date(data[0].processed_at);
    const daysOfData = Math.max(1, Math.round((newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      total,
      positive: Math.round(positive),
      negative: Math.round(negative),
      neutral: Math.round(neutral),
      score: Math.max(0, Math.min(100, score)),
      daysOfData,
    };
  } catch {
    return { total: 0, positive: 0, negative: 0, neutral: 0, score: 50, daysOfData: 0 };
  }
}

// Fetch stiri noi si salveaza in Supabase
export async function fetchAndSaveNews(
  personalityId: string,
  personalityName: string
): Promise<{ articles: NewsArticle[]; saved: number; historicalScore: HistoricalNewsScore }> {
  const [articles, historicalScore] = await Promise.all([
    fetchNewsForPersonality(personalityName),
    calculateHistoricalNewsScore(personalityId),
  ]);

  const saved = await saveNewsToHistory(personalityId, articles);

  // Recalculeaza dupa salvare daca am adaugat stiri noi
  const updatedScore = saved > 0
    ? await calculateHistoricalNewsScore(personalityId)
    : historicalScore;

  return { articles, saved, historicalScore: updatedScore };
}
