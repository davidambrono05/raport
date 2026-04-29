// Daily Price System — pretul se schimba o data pe zi bazat pe Reality Score
// Compara scorul de azi cu scorul de ieri si aplica diferenta ca miscare de pret

import { supabase } from "@/integrations/supabase/client";
import { type ReputationScore } from "./reputationScore";

const SCORE_CACHE_KEY = "humanex:daily_scores";

type DailyScore = {
  personalityId: string;
  score: number;
  date: string; // YYYY-MM-DD
};

// Returneaza data de azi ca string
function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

// Citeste cache-ul de scoruri
function getScoreCache(): DailyScore[] {
  try {
    const raw = localStorage.getItem(SCORE_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// Salveaza in cache
function saveScoreCache(scores: DailyScore[]): void {
  try {
    // Pastreaza doar ultimele 30 de zile
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const filtered = scores.filter(s => new Date(s.date) >= cutoff);
    localStorage.setItem(SCORE_CACHE_KEY, JSON.stringify(filtered));
  } catch { /* esec silentios */ }
}

// Verifica daca pretul a fost deja actualizat azi
export function isPriceUpdatedToday(personalityId: string): boolean {
  const cache = getScoreCache();
  const today = todayStr();
  return cache.some(s => s.personalityId === personalityId && s.date === today);
}

// Aplica actualizarea zilnica a pretului bazata pe Reality Score
export async function applyDailyPriceUpdate(
  personalityId: string,
  currentScore: ReputationScore,
  currentPrice: number
): Promise<{ updated: boolean; delta: number; reason: string }> {
  const today = todayStr();
  const cache = getScoreCache();

  // Verifica daca am actualizat deja azi
  const todayEntry = cache.find(
    s => s.personalityId === personalityId && s.date === today
  );

  if (todayEntry) {
    return {
      updated: false,
      delta: 0,
      reason: "Price already updated today. Next update tomorrow.",
    };
  }

  // Gaseste scorul de ieri din Supabase
  const { data: personality } = await supabase
    .from("personalities")
    .select("last_reality_score, score_updated_at, current_price")
    .eq("id", personalityId)
    .maybeSingle();

  const yesterdayScore = personality?.last_reality_score
    ? Number(personality.last_reality_score)
    : 50;

  const scoreDiff = currentScore.total - yesterdayScore;

  // Calculeaza delta pretului bazat pe diferenta de scor
  // Fiecare punct de scor = 0.3% miscare de pret
  const rawDelta = scoreDiff * 0.3;

  // Limiteaza la ±5% per zi
  const delta = Math.max(-5, Math.min(5, rawDelta));

  // Aplica miscarea in Supabase
  try {
    // Actualizeaza pretul
    if (Math.abs(delta) >= 0.1) {
      await (supabase.rpc as any)("tick_market_with_delta", {
        p_personality_id: personalityId,
        p_delta_pct: delta,
      });
    }

    // Salveaza noul scor in personalities
    await supabase
      .from("personalities")
      .update({
        last_reality_score: currentScore.total,
        score_updated_at: new Date().toISOString(),
      })
      .eq("id", personalityId);

    // Salveaza in cache local
    const newCache = [...cache, {
      personalityId,
      score: currentScore.total,
      date: today,
    }];
    saveScoreCache(newCache);

    const reason = delta > 0
      ? `Score improved ${yesterdayScore} → ${currentScore.total} (+${scoreDiff.toFixed(1)} pts)`
      : delta < 0
      ? `Score declined ${yesterdayScore} → ${currentScore.total} (${scoreDiff.toFixed(1)} pts)`
      : `Score unchanged (${currentScore.total}/100)`;

    return { updated: true, delta, reason };
  } catch {
    return { updated: false, delta: 0, reason: "Update failed" };
  }
}
