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

// --- HARD NEGATIVE PHRASES (3 pts, highest priority) ---
const hardNegative = [
  "shoot and kill", "orders military", "calls him a traitor",
  "fraud case", "under arrest", "indicted", "convicted", "guilty",
  "scandal", "abuse", "violence", "attack", "sexual assault",
  "ban", "suspended", "expelled", "fired", "sacked",
  "lawsuit", "sued", "allegations", "accused of", "charged with",
  "bubble burst", "trophyless", "relegated", "fired",
  "injury", "injured", "hamstring", "torn", "surgery", "cancer",
  "gets into feud", "calls for resignation", "protests against",
  "overrated", "washed up", "declining", "controversy",
  "backlash", "criticised", "slammed", "blasted",
  "sentenced to", "prison", "jail", "arrested",
  "found dead", "dies", "death", "killed", "shot",
  "tax evasion", "money laundering", "corruption", "bribery",
  "affair", "mistress", "caught cheating", "divorce",
  "bankrupt", "bankruptcy", "debt", "loses fortune",
  "flop", "disaster", "humiliated", "shameful",
];

// --- HARD POSITIVE PHRASES (3 pts) ---
const hardPositive = [
  "acquittal", "acquitted", "cleared", "innocent", "vindicated",
  "wins title", "wins trophy", "breaks record", "new record",
  "champions league", "world cup winner", "gold medal", "olympic",
  "signs deal", "new contract", "partnership", "billion dollar",
  "reaches final", "qualifies", "advances", "elected",
  "makes history", "historic win", "milestone", "first ever",
  "comeback", "return to form", "comeback trail",
  "boosting hopes", "opens door", "shines for",
  "defies age", "inspires", "praised", "lauded",
  "billion", "billionaire", "richest", "fortune",
  "awarded", "honored", "knighted", "hall of fame",
  "saves", "rescues", "donates", "charity", "philanthropy",
  "marries", "wedding", "new baby", "baby born",
  "promoted", "appoints", "hired", "joins top",
];

// --- SOFT NEGATIVE PHRASES (2 pts) ---
const NEGATIVE_PHRASES = [
  "bubble burst", "trophyless spell", "made it hard",
  "concern over", "doubt about", "crisis at", "set to leave",
  "could leave", "might retire", "facing ban", "under investigation",
  "not at the level", "questions his presence", "questions neymar",
  "past his prime", "fraud case", "court case", "legal trouble",
  "without him", "world cup door", "hamstring", "out of form",
  "underperforming", "poor results", "criticized", "under fire",
  "controversial statement", "apologizes for", "backlash over",
  "loses bid", "failed to", "misses out", "dropped from",
  "trade request", "wants out", "unhappy at", "clashes with",
];

// --- SOFT POSITIVE PHRASES (2 pts) ---
const POSITIVE_PHRASES = [
  "reach final", "reaches final", "wins title", "breaks record",
  "signs deal", "major deal", "new contract", "comeback",
  "champions league", "world cup", "golden ball", "best player",
  "makes history", "historic win", "cleared of", "acquitted of",
  "upholds acquittal", "court rules in favor", "opens door",
  "boosting hopes", "shines for", "defies age", "back to form",
  "top performer", "leading the way", "sets record", "clinches",
  "secures spot", "qualifies for", "advances to", "moves to",
  "agrees to", "signs new", "extends contract", "renewal",
  "donates to", "raises money", "helps children", "saves lives",
];

// --- WEIGHTED NEGATIVE WORDS (1 pt) ---
const negWords = [
  "loss", "loses", "losing", "lost", "defeat", "eliminated", "beaten",
  "fail", "fails", "failed", "failure", "flop", "flops", "flopped",
  "disappoints", "disappointing", "disappointed", "disappointment",
  "crisis", "trouble", "problem", "issue", "concern", "concerns",
  "retire", "retiring", "retired", "quit", "quitting", "leaving",
  "divorce", "split", "separation", "cheating", "affair",
  "drop", "drops", "dropped", "fell", "fallen", "falling", "decline",
  "struggle", "struggles", "struggling", "difficult", "terrible",
  "worry", "fears", "doubt", "uncertain", "unsure",
  "miss", "misses", "missed", "absent", "injured", "suspended",
  "quiet", "silent", "refuses", "avoids", "ignores",
  "feud", "fight", "clash", "conflict", "dispute", "argument",
  "scandal", "controversy", "backlash", "criticised", "slammed",
  "banned", "fined", "punished", "sanctioned",
  "lawsuit", "sued", "accused", "allegations",
  "fired", "sacked", "replaced", "dropped",
  "poor", "bad", "terrible", "horrible", "awful",
  "overrated", "washed", "washed up", "declining", "past prime",
  "weak", "injury", "injuries", "hamstring", "surgery",
  // politics/business
  "resigns", "resigned", "resignation", "ousted", "removed",
  "bankrupt", "bankruptcy", "debt", "losses", "losing money",
  "scandal", "investigation", "indicted", "trial", "convicted",
];

// --- WEIGHTED POSITIVE WORDS (1 pt) ---
const posWords = [
  "win", "wins", "winner", "won", "victory", "victories", "champion",
  "championship", "champions", "trophy", "trophies", "title", "titles",
  "record", "records", "best", "greatest", "legend", "legendary", "iconic",
  "success", "successful", "achievement", "achievements", "milestone",
  "breakthrough", "breakthroughs", "praised", "honored", "celebrated",
  "loved", "popular", "admired", "respected",
  "deal", "deals", "signs", "signed", "joins", "leads", "leading",
  "goal", "goals", "scores", "scored", "hat-trick", "dominates",
  "thriving", "rising", "growing", "healthy", "strong", "improving",
  "selected", "chosen", "nominated", "appointed", "elected",
  "support", "fans", "popular", "trending", "trending up",
  "profit", "profits", "revenue", "growth", "growing", "surge",
  "star", "superstar", "hero", "inspiration", "inspires",
  "brilliant", "outstanding", "exceptional", "remarkable",
  "return", "comeback", "recovered", "recovery",
  "donates", "charity", "philanthropy", "generous",
  "marries", "married", "wedding", "baby", "born",
  "promoted", "promotion", "hired", "appointed", "elected",
  "saves", "rescues", "helps", "supported",
  // politics/business
  "elected", "reelected", "wins election", "victory", "landslide",
  "passed", "approves", "signed bill", "new law", "reform",
  "profit", "record profit", "stock rises", "shares up", "market cap",
  "expansion", "hires", "grows", "acquires", "merger",
  "innovation", "innovative", " breakthrough", "disrupting",
];

// Calculeaza scorul raw pentru un text dat (titlu sau description)
// acumuleaza puncte pe baza frazelor si cuvintelor gasite
function wordMatches(word: string, list: string[]): boolean {
  // Verifica daca cuvantul sau radacina lui e in lista
  if (list.includes(word)) return true;
  // Verifica daca incepe cu un cuvant din lista (winning → win, loser → lose)
  for (const entry of list) {
    if (word.startsWith(entry) && word.length <= entry.length + 4) return true;
  }
  return false;
}

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

    if (wordMatches(word, posWords)) {
      if (isNegated) raw -= 1.5;
      else raw += 1;
    }
    if (wordMatches(word, negWords)) {
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
        const url = `${RSS2JSON_BASE}?rss_url=${encodeURIComponent(googleRss)}${RSS2JSON_API_KEY ? `&api_key=${RSS2JSON_API_KEY}&count=10` : ""}`;
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
