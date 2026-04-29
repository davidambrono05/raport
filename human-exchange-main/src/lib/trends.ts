// Google Trends — versiune fara CORS
// Nu putem accesa Google Trends direct din browser
// Folosim Wikipedia ca proxy pentru interes public

export type TrendsData = {
  interestScore: number;
  trend: "rising" | "stable" | "falling";
};

// Impact continuu: scor 50 = 0%, scor 100 = +1.5%, scor 0 = -1.5%
// Inlocuieste zona moarta anterioara (30-70 = 0)
export function trendsImpact(interestScore: number): number {
  return +((interestScore - 50) / 50 * 1.5).toFixed(2);
}

// Scor de interes determinist bazat pe Wikipedia pageviews
// Scala log10: 10 views→17, 100→33, 1k→50, 10k→67, 100k→83, 1M→95
// Fara Math.random() — aceeasi personalitate da acelasi scor la fiecare rulare
export async function fetchInterestScore(
  _name: string,
  wikiPageviews: number,
): Promise<TrendsData> {
  let interestScore: number;

  if (wikiPageviews <= 0) {
    // Nu exista date Wikipedia — personalitate necunoscuta, nu inexistenta
    interestScore = 20;
  } else {
    interestScore = Math.round(Math.log10(wikiPageviews) * 16.67);
    interestScore = Math.max(10, Math.min(95, interestScore));
  }

  return {
    interestScore,
    trend: interestScore >= 60 ? "rising" : interestScore >= 40 ? "stable" : "falling",
  };
}

export function formatInterestScore(score: number): string {
  if (score >= 80) return "Very High";
  if (score >= 60) return "High";
  if (score >= 40) return "Medium";
  if (score >= 20) return "Low";
  return "Very Low";
}
