// Wikipedia API — nu necesita API key, e complet gratuit si deschis

export type WikipediaData = {
  pageviews: number;
  pageviewsTrend: "up" | "down" | "stable";
  pageviewsChange: number; // procent schimbare fata de saptamana trecuta
  summary: string | null;
  thumbnail: string | null;
  url: string | null;
};

export type WikipediaScore = {
  score: number; // 0-100
  label: "viral" | "trending" | "stable" | "declining" | "unknown";
  weeklyViews: number;
  previousWeekViews: number;
};

// Preia pageviews zilnice pentru ultimele 14 zile
async function fetchPageviews(articleTitle: string): Promise<number[]> {
  try {
    const encoded = encodeURIComponent(articleTitle.replace(/ /g, "_"));
    const today = new Date();
    const endDate = today.toISOString().slice(0, 10).replace(/-/g, "");
    const startDate = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 10).replace(/-/g, "");

    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${encoded}/daily/${startDate}/${endDate}`;

    const res = await fetch(url, {
      headers: { "User-Agent": "HUMANEX/1.0 (contact@humanex.io)" }
    });

    if (!res.ok) return [];

    const data = await res.json();
    return (data.items ?? []).map((item: any) => item.views as number);
  } catch {
    return [];
  }
}

// Preia summary si thumbnail din Wikipedia
async function fetchWikiSummary(name: string): Promise<{ summary: string | null; thumbnail: string | null; url: string | null }> {
  try {
    const encoded = encodeURIComponent(name.replace(/ /g, "_"));
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;

    const res = await fetch(url, {
      headers: { "User-Agent": "HUMANEX/1.0 (contact@humanex.io)" }
    });

    if (!res.ok) return { summary: null, thumbnail: null, url: null };

    const data = await res.json();
    return {
      summary: data.extract ?? null,
      thumbnail: data.thumbnail?.source ?? null,
      url: data.content_urls?.desktop?.page ?? null,
    };
  } catch {
    return { summary: null, thumbnail: null, url: null };
  }
}

// Calculeaza scorul Wikipedia bazat pe pageviews
function calculateWikipediaScore(views: number[]): WikipediaScore {
  if (views.length < 7) {
    return { score: 50, label: "unknown", weeklyViews: 0, previousWeekViews: 0 };
  }

  const thisWeek = views.slice(-7).reduce((a, b) => a + b, 0);
  const lastWeek = views.slice(-14, -7).reduce((a, b) => a + b, 0);

  const changePercent = lastWeek > 0
    ? ((thisWeek - lastWeek) / lastWeek) * 100
    : 0;

  // Scor bazat pe volumul absolut si trendul
  let score = 50;

  // Volum absolut — referinta: 100k views/saptamana = scor 100
  const volumeScore = Math.min(100, (thisWeek / 100000) * 100);

  // Trend — crestere sau scadere
  const trendScore = Math.min(100, Math.max(0, 50 + changePercent));

  score = Math.round(volumeScore * 0.6 + trendScore * 0.4);

  let label: WikipediaScore["label"] = "stable";
  if (changePercent > 50) label = "viral";
  else if (changePercent > 15) label = "trending";
  else if (changePercent < -15) label = "declining";
  else label = "stable";

  return {
    score,
    label,
    weeklyViews: thisWeek,
    previousWeekViews: lastWeek,
  };
}

// Functia principala — preia tot despre o personalitate
export async function fetchWikipediaData(name: string): Promise<WikipediaData & { score: WikipediaScore }> {
  const [views, summary] = await Promise.all([
    fetchPageviews(name),
    fetchWikiSummary(name),
  ]);

  const score = calculateWikipediaScore(views);

  const thisWeek = views.slice(-7).reduce((a, b) => a + b, 0);
  const lastWeek = views.slice(-14, -7).reduce((a, b) => a + b, 0);
  const changePercent = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;

  return {
    pageviews: thisWeek,
    pageviewsTrend: changePercent > 5 ? "up" : changePercent < -5 ? "down" : "stable",
    pageviewsChange: Math.round(changePercent),
    summary: summary.summary,
    thumbnail: summary.thumbnail,
    url: summary.url,
    score,
  };
}

// Formateaza numarul de views pentru display
export function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return views.toString();
}
