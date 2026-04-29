// RSS News — fara API key, fara limita de cereri
// Folosim Google News RSS prin rss2json proxy

const RSS2JSON_BASE = "https://api.rss2json.com/v1/api.json";
const RSS2JSON_API_KEY = ""; // gratuit fara key, dar limitat la 10req/min

export type NewsArticle = {
  title: string;
  description: string | null;
  url: string;
  publishedAt: string;
  source: { name: string };
  sentiment: "positive" | "negative" | "neutral";
  intensity: number; // -1.0 to +1.0, deterministic
};

const POSITIVE_WORDS = [
  "win", "wins", "winner", "record", "award", "success", "growth",
  "best", "top", "great", "amazing", "breakthrough", "achievement",
  "deal", "profit", "launch", "praised", "historic", "milestone",
  "champion", "victory", "celebrates", "gains", "rises", "leads",
  "partnership", "iconic", "legend", "inspired", "honored",
  "superstar", "greatest", "loved", "signs", "joins",
  "final", "reach", "reaches", "qualifies", "through", "advances",
  "dominates", "scores", "goal", "hat-trick", "trophy", "titles",
  "impact", "thrives", "major", "return", "comeback", "brilliant",
  "acquittal", "acquitted", "cleared", "innocent", "vindicated",
  "boosts", "boosting", "hopes", "shines", "defies", "overcomes",
  "selected", "chosen", "nominated", "praised", "lauded",
];

const NEGATIVE_WORDS = [
  "loss", "loses", "scandal", "arrest", "fired", "controversy",
  "lawsuit", "accused", "banned", "crash", "fail", "worst",
  "drama", "conflict", "suspended", "allegations", "backlash",
  "drops", "falls", "criticised", "investigated", "fined",
  "retire", "retiring", "quit", "leaving", "sacked", "injured", "injury",
  "divorce", "cheating", "fraud", "corrupt", "shame", "slammed",
  "trophyless", "concern", "doubt", "crisis", "flop", "failure",
  "disappoints", "struggles", "rejected", "dropped", "benched",
  "questions", "questions his", "not at the level", "past his prime",
  "overrated", "washed", "declining", "poor form", "out of form",
];

const POSITIVE_PHRASES = [
  "reach final", "reaches final", "wins title", "breaks record",
  "signs deal", "major deal", "new contract", "comeback",
  "champions league", "world cup", "golden ball", "best player",
  "makes history", "historic win", "cleared of", "acquitted of",
  "upholds acquittal", "court rules in favor", "opens door",
  "boosting hopes", "shines for", "defies age", "back to form",
];

const NEGATIVE_PHRASES = [
  "bubble burst", "trophyless spell", "made it hard",
  "concern over", "doubt about", "crisis at", "set to leave",
  "could leave", "might retire", "facing ban", "under investigation",
  "not at the level", "questions his presence", "questions neymar",
  "past his prime", "fraud case", "court case", "legal trouble",
  "without him", "world cup door", "hamstring", "out of form",
];

// --- FRAZE NEGATIVE CLARE (cel mai mare priority) ---
const hardNegative = [
  "shoot and kill", "orders military", "calls him a traitor", "cooling on",
  "fraud case", "under arrest", "indicted", "convicted", "guilty",
  "scandal", "abuse", "violence", "attack", "ban", "suspended",
  "lawsuit", "sued", "allegations", "accused of", "charged with",
  "not at the level", "questions his presence", "past his prime",
  "bubble burst", "trophyless", "relegated", "sacked", "fired",
  "crash", "injury", "injured", "hamstring", "torn", "surgery",
  "gets into feud", "calls for resignation", "protests against",
  "overrated", "washed up", "declining", "controversy",
  "backlash", "criticised", "slammed", "blasted",
  "keeps quiet", "makes it hard", "without him",
];

// --- FRAZE POZITIVE CLARE ---
const hardPositive = [
  "acquittal", "acquitted", "cleared", "innocent", "vindicated",
  "wins title", "wins trophy", "breaks record", "new record",
  "champions league", "world cup winner", "gold medal",
  "signs deal", "new contract", "partnership",
  "reaches final", "qualifies", "advances",
  "makes history", "historic win", "milestone",
  "comeback", "return to form", "comeback trail",
  "boosting hopes", "opens door", "shines for",
  "defies age", "inspires", "praised",
  "billion", "billionaire", "richest",
];

// --- CUVINTE POZITIVE cu greutate ---
const posWords = [
  "win", "wins", "winner", "won", "victory", "champion", "championship",
  "award", "prize", "trophy", "medal", "title",
  "record", "best", "greatest", "legend", "iconic",
  "success", "achievement", "milestone", "breakthrough",
  "praised", "honored", "celebrated", "loved",
  "deal", "launch", "signs", "joins", "leads",
  "goal", "hat-trick", "scores", "dominates",
  "thriving", "rising", "growing", "healthy",
  "selected", "chosen", "nominated", "appointed",
  "support", "fans", "popular", "trending",
  "profit", "revenue", "growth", "surge",
];

// --- CUVINTE NEGATIVE cu greutate ---
const negWords = [
  "loss", "lose", "loses", "lost", "defeat", "eliminated",
  "fail", "failure", "flop", "disappoints", "disappointing",
  "crisis", "trouble", "problem", "issue", "concern",
  "retire", "retiring", "quit", "leaving", "departure",
  "divorce", "split", "separation", "cheating",
  "drop", "drops", "fell", "falls", "decline",
  "struggle", "struggles", "struggling", "difficult",
  "worry", "fears", "doubt", "uncertain",
  "miss", "misses", "absent", "benched", "dropped",
  "quiet", "silent", "refuses", "avoids",
  "feud", "fight", "clash", "conflict", "dispute",
];

// Calculeaza scorul raw pentru un text dat (titlu sau description)
// acumuleaza puncte pe baza frazelor si cuvintelor gasite
function scoreText(text: string): number {
  const lower = text.toLowerCase();
  let raw = 0;

  // Fraze hard (3 puncte fiecare)
  for (const p of hardNegative) {
    if (lower.includes(p)) raw -= 3;
  }
  for (const p of hardPositive) {
    if (lower.includes(p)) raw += 3;
  }

  // Fraze soft (2 puncte fiecare)
  for (const p of NEGATIVE_PHRASES) {
    if (lower.includes(p)) raw -= 2;
  }
  for (const p of POSITIVE_PHRASES) {
    if (lower.includes(p)) raw += 2;
  }

  // Cuvinte cu context — negatiile inverseaza si scaleaza
  const words = lower.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[^a-z]/g, "");
    const prev = words[i - 1]?.replace(/[^a-z]/g, "") ?? "";
    const isNegated = ["not", "no", "never", "without", "despite", "but"].includes(prev);

    if (posWords.includes(word)) {
      if (isNegated) raw -= 1.5;
      else raw += 1;
    }
    if (negWords.includes(word)) {
      if (isNegated) raw += 0.5;
      else raw -= 1;
    }
  }

  return raw;
}

// Sentiment Analysis determinist cu intensitate
// Analizeaza titlul (full weight) + description (0.4x weight)
// Returneaza atat label-ul, cat si intensitatea normalizata in [-1, +1]
function analyzeSentiment(
  title: string,
  description: string | null
): { sentiment: "positive" | "negative" | "neutral"; intensity: number } {
  const titleScore = scoreText(title);
  const descScore = description ? scoreText(description) * 0.4 : 0;
  const rawScore = titleScore + descScore;

  // soft clamp: scores sub 3 sunt mici, scoruri de 6+ sunt puternice
  const intensity = Math.max(-1, Math.min(1, rawScore / 4));

  let sentiment: "positive" | "negative" | "neutral";
  if (intensity > 0.2) sentiment = "positive";
  else if (intensity < -0.2) sentiment = "negative";
  else sentiment = "neutral";

  return { sentiment, intensity: +intensity.toFixed(3) };
}

export async function fetchNewsForPersonality(name: string): Promise<NewsArticle[]> {
  try {
    // Facem 3 cereri cu query-uri diferite pentru mai multe stiri
    const queries = [
      `"${name}"`,           // Numele exact
      `${name} news`,        // Stiri generale
      `${name} latest`,      // Cele mai recente
    ];

    const results = await Promise.allSettled(
      queries.map(async (q) => {
        const googleRss = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
        const url = `${RSS2JSON_BASE}?rss_url=${encodeURIComponent(googleRss)}&count=10`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return [];
        const data = await res.json();
        if (data.status !== "ok") return [];
        return data.items ?? [];
      })
    );

    // Combina toate rezultatele
    const allItems: any[] = [];
    const seenTitles = new Set<string>();

    for (const result of results) {
      if (result.status === "fulfilled") {
        for (const item of result.value) {
          const title = (item.title ?? "").slice(0, 50);
          if (!seenTitles.has(title)) {
            seenTitles.add(title);
            allItems.push(item);
          }
        }
      }
    }

    // Filtreaza si proceseaza
    const nameParts = name.toLowerCase().split(" ");
    const filtered = allItems
      .filter((item: any) => {
        const title = (item.title ?? "").toLowerCase();
        return nameParts.some((part) => part.length > 2 && title.includes(part));
      })
      .slice(0, 15);

    const articles: NewsArticle[] = filtered.map((item: any) => {
      const { sentiment, intensity } = analyzeSentiment(
        item.title ?? "",
        item.description ?? null
      );
      return {
        title: item.title?.replace(/\s*-\s*[\w\s]+$/, "") ?? "",
        description: item.description ?? null,
        url: item.link ?? "#",
        publishedAt: item.pubDate ?? new Date().toISOString(),
        source: { name: item.author || "Google News" },
        sentiment,
        intensity,
      };
    });

    return articles;
  } catch {
    return [];
  }
}

// Determinist: impactul deriva direct din intensitatea articolului
// Max impact per articol: ±0.5%
export function sentimentToImpact(article: NewsArticle): number {
  return +(article.intensity * 0.5).toFixed(3);
}
