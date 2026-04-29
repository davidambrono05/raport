// Human Reality Score — algoritm avansat bazat pe date reale
import { fetchNewsForPersonality } from "./newsapi";
import { fetchWikipediaData } from "./wikipedia";
import { calculateHistoricalNewsScore } from "./newsHistory";

export type ReputationScore = {
  total: number;
  breakdown: {
    newsScore: number;
    interestScore: number;
    consistencyScore: number;
  };
  label: "Exceptional" | "Strong" | "Stable" | "Declining" | "Controversial";
  color: string;
  trend: "up" | "down" | "stable";
  newsPositive: number;
  newsNegative: number;
  newsNeutral: number;
  weeklyViews: number;
  viewsTrend: number;
  daysOfData: number;
  calculatedAt: string;
};

function scoreToLabel(score: number): ReputationScore["label"] {
  if (score >= 80) return "Exceptional";
  if (score >= 65) return "Strong";
  if (score >= 45) return "Stable";
  if (score >= 30) return "Declining";
  return "Controversial";
}

function scoreToColor(score: number): string {
  if (score >= 65) return "text-bull";
  if (score >= 45) return "text-gold";
  return "text-bear";
}

export async function calculateReputationScore(
  name: string,
  personalityId?: string,
  category?: string
): Promise<ReputationScore> {
  // 1. Fetch tot in paralel
  const [articles, wikiData, historical] = await Promise.all([
    fetchNewsForPersonality(name),
    fetchWikipediaData(name),
    personalityId ? calculateHistoricalNewsScore(personalityId) : Promise.resolve(null),
  ]);

  const weeklyViews = wikiData.pageviews;
  const viewsTrend = wikiData.pageviewsChange;

  // 2. Scor interes cu scala logaritmica
  let interestScore = 0;
  if (weeklyViews > 0) {
    interestScore = Math.min(100, Math.round(Math.log10(weeklyViews) * 16.67));
  }
  if (viewsTrend > 20) interestScore = Math.min(100, interestScore + 8);
  if (viewsTrend < -20) interestScore = Math.max(0, interestScore - 8);

  // 3. News score din sentimentele articolelor
  const recentPositive = articles.filter(a => a.sentiment === "positive").length;
  const recentNegative = articles.filter(a => a.sentiment === "negative").length;
  const recentNeutral = articles.filter(a => a.sentiment === "neutral").length;

  // Combina cu istoricul (istoricul are 50% greutate)
  let totalPositive = recentPositive;
  let totalNegative = recentNegative;
  let totalNeutral = recentNeutral;
  let daysOfData = 0;

  if (historical && historical.total > 0) {
    totalPositive += Math.round(historical.positive * 0.5);
    totalNegative += Math.round(historical.negative * 0.5);
    totalNeutral += Math.round(historical.neutral * 0.5);
    daysOfData = historical.daysOfData;
  }

  const totalArticles = totalPositive + totalNegative + totalNeutral || 1;
  const posRatio = totalPositive / totalArticles;
  const negRatio = totalNegative / totalArticles;

  // News score: 50 = neutru, diferentiere agresiva
  let newsScore = Math.round(50 + (posRatio - negRatio) * 60);
  newsScore = Math.max(0, Math.min(100, newsScore));

  // 4. Consistency score
  const balance = Math.abs(totalPositive - totalNegative) / totalArticles;
  let consistencyScore = totalPositive >= totalNegative
    ? Math.round(50 + balance * 35)
    : Math.round(50 - balance * 35);
  consistencyScore = Math.max(0, Math.min(100, consistencyScore));

  // 5. Scor total ponderat
  const total = Math.round(
    newsScore * 0.50 +
    interestScore * 0.30 +
    consistencyScore * 0.20
  );

  const trend: ReputationScore["trend"] =
    viewsTrend > 10 ? "up" : viewsTrend < -10 ? "down" : "stable";

  return {
    total: Math.max(0, Math.min(100, total)),
    breakdown: { newsScore, interestScore, consistencyScore },
    label: scoreToLabel(total),
    color: scoreToColor(total),
    trend,
    newsPositive: totalPositive,
    newsNegative: totalNegative,
    newsNeutral: totalNeutral,
    weeklyViews,
    viewsTrend,
    daysOfData,
    calculatedAt: new Date().toISOString(),
  };
}