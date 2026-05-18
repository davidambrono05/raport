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
    "worst",
    "hate",
    "sad",
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
    "great",
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

// ============================================================
// SISTEM SENTIMENT — detectie precisa cu granita de cuvant
// ============================================================

// Verifica daca un cuvant face parte din lista (granita stricta)
// "winning" → "win" (radacina), "windows" → NU se potriveste cu "win"
const COMMON_SUFFIXES = ["ing", "s", "ed", "er", "est", "ly", "es", "ned", "ning", "red", "med", "sed", "ted", "ner", "rer", "der", "ter", "ing", "red"];
function wordMatches(word: string, list: string[]): boolean {
  if (list.includes(word)) return true;
  for (const entry of list) {
    if (word.startsWith(entry)) {
      const rest = word.slice(entry.length);
      // Fara nimic dupa radacina (ex: "win" in "win")
      if (!rest) return true;
      // Urmatorul caracter nu e litera → nu e o continuare (ex: "win!" → "win")
      if (!/[a-z]/.test(rest[0])) return true;
      // Sufixe comune: -ing, -s, -ed, -er, -est, -ly, -ning, etc.
      if (COMMON_SUFFIXES.some(s => rest.startsWith(s))) return true;
    }
  }
  return false;
}

// Verifica daca o fraza exista in text CU granita de cuvant
// "not at the level" nu se potriveste in "not at the level of..."
// (verificam doar inceputul sau daca e intre spatii)
function phraseInText(text: string, phrase: string): boolean {
  const idx = text.indexOf(phrase);
  if (idx === -1) return false;
  // Verifica granita la inceput
  if (idx > 0 && /[a-z]/.test(text[idx - 1])) return false;
  // Verifica granita la sfarsit
  const end = idx + phrase.length;
  if (end < text.length && /[a-z]/.test(text[end])) return false;
  return true;
}

// Intensificatori — scaleaza impactul unui cuvant cu 1.5x sau 2x
const boosters = ["very", "extremely", "highly", "incredibly", "really"];
const weakener = ["slightly", "somewhat", "rather", "fairly", "kind of", "sort of"];

// Detecteaza negatia: verifica cuvantul anterior + 2 pozitii inapoi
function isNegatedAt(words: string[], index: number): boolean {
  const negators = ["not", "no", "never", "without", "despite", "hardly", "barely"];
  const prev1 = words[index - 1]?.replace(/[^a-z]/g, "") ?? "";
  if (negators.includes(prev1)) return true;
  const prev2 = words[index - 2]?.replace(/[^a-z]/g, "") ?? "";
  if (prev2 && negators.includes(prev2)) return true;
  return false;
}

// Detecteaza daca cuvantul de la index e intre "but" si virgula/final
// "Great player but injured" → "injured" e DUPA but, ramane negativ
// "Great player but struggled" → "struggled" e DUPA but, ramane negativ
// "Great but controversial" → "controversial" e DUPA but, ramane negativ
// "but great" → "great" e DUPA but → se slabeste (pozitivul e contrazis)
function isAfterBut(words: string[], index: number): boolean {
  // Cauta "but" inainte de indexul curent
  for (let i = index - 1; i >= 0; i--) {
    const w = words[i].replace(/[^a-z]/g, "");
    if (w === "but") return true;
    if (w === "." || w === ";" || w === "!") break; // altă propoziție
  }
  return false;
}

// Returneaza multiplicatorul de intensitate bazat pe cuvintele dinainte
function getIntensityMultiplier(words: string[], index: number): number {
  const prev1 = words[index - 1]?.replace(/[^a-z]/g, "") ?? "";
  const prev2 = words[index - 2]?.replace(/[^a-z]/g, "") ?? "";
  if (boosters.includes(prev1) || boosters.includes(prev2)) return 2.0;
  if (["very", "extremely"].includes(prev1)) return 2.5;
  if (weakener.some(w => w === prev1 || w === prev2)) return 0.5;
  return 1.0;
}

function scoreText(text: string): number {
  const lower = text.toLowerCase();
  let raw = 0;

  // 1. Fraze hard (3 puncte) — cu granita de cuvant
  for (const p of hardNegative) {
    if (phraseInText(lower, p)) raw -= 3;
  }
  for (const p of hardPositive) {
    if (phraseInText(lower, p)) raw += 3;
  }

  // 2. Fraze soft (2 puncte) — cu granita de cuvant
  for (const p of NEGATIVE_PHRASES) {
    if (phraseInText(lower, p)) raw -= 2;
  }
  for (const p of POSITIVE_PHRASES) {
    if (phraseInText(lower, p)) raw += 2;
  }

  // 3. Cuvinte individuale — procesate pe bucati separate de "but"
  // "X but Y" → X se slabeste (contrast), Y se subliniaza
  const butChunks = lower.split(" but ");
  for (let chunkIdx = 0; chunkIdx < butChunks.length; chunkIdx++) {
    const chunk = butChunks[chunkIdx];
    const isAfterBut = chunkIdx > 0; // e in partea "Y" din "X but Y"
    const words = chunk.split(/\s+/);

    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[^a-z]/g, "");
      if (!word) continue;

      const negated = isNegatedAt(words, i);
      const multiplier = getIntensityMultiplier(words, i);

      if (wordMatches(word, posWords)) {
        let score = 1 * multiplier;
        if (negated) score = -1.5 * multiplier;
        else if (isAfterBut) score *= 0.5; // "but great" → pozitiv slabit
        raw += score;
      }
      if (wordMatches(word, negWords)) {
        let score = -1 * multiplier;
        if (negated) score = 0.5 * multiplier; // dubla negatie
        else if (isAfterBut) score *= 1.5; // "but injured" → negativ accentuat
        raw += score;
      }
    }
  }

  return raw;
}

// Emoji sentiment mapping
const POSITIVE_EMOJIS = ["😊","😄","🎉","🏆","🥇","👍","❤️","♥️","💚","🌟","⭐","✨","🔥","💪","🚀","👏","🙌","🎊","💯"];
const NEGATIVE_EMOJIS = ["😡","😢","💔","👎","😠","🤮","💀","😰","😱","📉","❌","⚠️","🤬","😤","🖕"];

// Detecteaza ALL-CAPS (cuvant scris complet mare = emphasizat 2x)
function isAllCaps(word: string): boolean {
  return word.length >= 3 && /^[A-Z]{3,}$/.test(word);
}

// Calculeaza puncte din emoji-uri in text
function emojiScore(text: string): number {
  let score = 0;
  for (const e of POSITIVE_EMOJIS) { if (text.includes(e)) score += 1; }
  for (const e of NEGATIVE_EMOJIS) { if (text.includes(e)) score -= 1; }
  return Math.max(-2, Math.min(2, score));
}

// Sentiment Analysis determinist cu intensitate
// Analizeaza titlul (full weight) + description (0.6x weight) + emoji + ALL-CAPS
// Returneaza atat label-ul, cat si intensitatea normalizata in [-1, +1]
function analyzeSentiment(
  title: string,
  description: string | null
): { sentiment: "positive" | "negative" | "neutral"; intensity: number } {
  const titleScore = scoreText(title);
  const titleEmoji = emojiScore(title);
  const titleCaps = title.split(/\s+/).filter(isAllCaps).length * 0.3;
  // Description are 0.6x weight (continut mai lung, mai multe detalii)
  const descScore = description ? scoreText(description) * 0.6 : 0;
  const descEmoji = description ? emojiScore(description) * 0.6 : 0;

  const rawScore = titleScore + titleEmoji + titleCaps + descScore + descEmoji;

  // Normalizare: divizam la numarul de "unitati" pentru a evita
  // ca titlurile lungi sa aiba intensitate articial mare
  const wordCount = (title + " " + (description ?? "")).split(/\s+/).length;
  const normalizedBase = wordCount > 0 ? rawScore / Math.max(1, wordCount / 5) : rawScore;

  // Normalizare simpla: divizam la 8 pentru sensibilitate optima
  const intensity = Math.max(-1, Math.min(1, rawScore / 8));

  let sentiment: "positive" | "negative" | "neutral";
  if (intensity > 0.15) sentiment = "positive";
  else if (intensity < -0.15) sentiment = "negative";
  else sentiment = "neutral";

  return { sentiment, intensity: +intensity.toFixed(3) };
}

export async function fetchNewsForPersonality(name: string): Promise<NewsArticle[]> {
  try {
    // Genereaza variatii de query pentru acoperire maxima
    const nameParts = name.split(" ").filter(p => p.length > 2);
    const lastName = nameParts[nameParts.length - 1]; // ex: "Messi" din "Lionel Messi"
    const queries = [
      `"${name}"`,                     // Numele exact
      `${name} news`,                  // Stiri generale
      `${lastName} news`,              // Doar numele de familie
      `${name} update OR latest`,      // Actualizari
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

    // Combina rezultatele — dedublare pe URL (mai sigur decat titlu)
    const allItems: any[] = [];
    const seenUrls = new Set<string>();

    for (const result of results) {
      if (result.status === "fulfilled") {
        for (const item of result.value) {
          const url = (item.link ?? "").split("?")[0]; // Ignora UTM params
          if (url && !seenUrls.has(url)) {
            seenUrls.add(url);
            allItems.push(item);
          }
        }
      }
    }

    // Filtreaza: titlul trebuie sa contina o parte din nume (min 3 litere)
    const lowerName = name.toLowerCase();
    const filtered = allItems
      .filter((item: any) => {
        const title = (item.title ?? "").toLowerCase();
        // Numele complet SAU macar numele de familie (ultima parte)
        if (title.includes(lowerName)) return true;
        if (lastName && title.includes(lastName.toLowerCase())) return true;
        const matchedParts = nameParts.filter(p => title.includes(p.toLowerCase()));
        // Pentru nume scurte: 1 parta; pentru lungi: 2 parti
        if (nameParts.length <= 2) return matchedParts.length >= 1;
        return matchedParts.length >= 2;;
      })
      .slice(0, 15);

    // credibilitatea sursei (1.0 = standard, peste = mai credibil)
    const sourceCredibility: Record<string, number> = {
      "reuters": 1.3, "associated press": 1.3, "ap": 1.3,
      "bbc": 1.2, "cnn": 1.1, "the guardian": 1.2, "ny times": 1.2,
      "the washington post": 1.2, "bloomberg": 1.2, "ft": 1.2,
      "espn": 1.1, "sky sports": 1.0,
      "daily mail": 0.7, "the sun": 0.6, "tabloid": 0.6,
      "google news": 0.9,
    };
    function getSourceMult(sourceName: string): number {
      const low = sourceName.toLowerCase();
      for (const [k, v] of Object.entries(sourceCredibility)) {
        if (low.includes(k)) return v;
      }
      return 1.0;
    }

    const articles: NewsArticle[] = filtered.map((item: any) => {
      const sourceName = item.author || "Google News";
      const { sentiment, intensity } = analyzeSentiment(
        item.title ?? "",
        item.description ?? null
      );
      const mult = getSourceMult(sourceName);
      const adjustedIntensity = +(intensity * mult).toFixed(3);
      return {
        title: item.title?.replace(/\s*-\s*[\w\s]+$/, "") ?? "",
        description: item.description ?? null,
        url: item.link ?? "#",
        publishedAt: item.pubDate ?? new Date().toISOString(),
        source: { name: sourceName },
        sentiment,
        intensity: adjustedIntensity,
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
