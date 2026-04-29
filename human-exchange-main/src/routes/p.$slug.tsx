import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PriceChart } from "@/components/PriceChart";
import { PersonalityAvatar } from "@/components/PersonalityAvatar";
import { formatHmx, formatPct } from "@/lib/format";
import { toast } from "sonner";
import { fetchNewsForPersonality, type NewsArticle } from "@/lib/newsapi";
import { fetchWikipediaData, formatViews, type WikipediaData } from "@/lib/wikipedia";
import { filterNewArticles, calculateNewsImpact, applyNewsImpact } from "@/lib/newsProcessor";
import { calculateReputationScore, type ReputationScore } from "@/lib/reputationScore";
import { applyDailyPriceUpdate, isPriceUpdatedToday } from "@/lib/dailyPrice";
import { fetchAndSaveNews } from "@/lib/newsHistory";

export const Route = createFileRoute("/p/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — HUMANEX` },
      { name: "description", content: `Trade ${params.slug.replace(/-/g, " ")} on HUMANEX.` },
    ],
  }),
  component: ProfilePage,
});

type Personality = {
  id: string;
  slug: string;
  name: string;
  category: string;
  bio: string | null;
  current_price: number;
  change_pct: number;
  avatar_url: string | null;
};

type Event = { id: string; headline: string; impact: number; occurred_at: string };

const categoryStyles: Record<string, string> = {
  Sport: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  Entertainment: "bg-pink-500/10 text-pink-300 border-pink-500/20",
  Tech: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  Politics: "bg-amber-500/10 text-amber-300 border-amber-500/20",
};

function ProfilePage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pers, setPers] = useState<Personality | null>(null);
  const [history, setHistory] = useState<{ price: number; recorded_at: string }[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [wikiData, setWikiData] = useState<(WikipediaData & { score: any }) | null>(null);
  const [priceMovement, setPriceMovement] = useState<any | null>(null);
  const [lastNewsImpact, setLastNewsImpact] = useState<{ delta: number; sources: string[] } | null>(null);
  const [reputation, setReputation] = useState<ReputationScore | null>(null);
  const [dailyUpdate, setDailyUpdate] = useState<{ updated: boolean; delta: number; reason: string } | null>(null);
  const persRef = useRef<Personality | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [shares, setShares] = useState("1");
  const [balance, setBalance] = useState<number>(0);
  const [holding, setHolding] = useState<{ shares: number; avg_cost: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const { data: p } = await supabase
      .from("personalities")
      .select("id,slug,name,category,bio,current_price,change_pct,avatar_url")
      .eq("slug", slug)
      .maybeSingle();
    if (!p) { setNotFound(true); setLoading(false); return; }
    const personality: Personality = { ...p, current_price: Number(p.current_price), change_pct: Number(p.change_pct) };
    setPers(personality);
    persRef.current = personality;

    const [{ data: hist }, { data: ev }] = await Promise.all([
      supabase.from("price_history").select("price,recorded_at").eq("personality_id", p.id).order("recorded_at", { ascending: true }),
      supabase.from("events").select("id,headline,impact,occurred_at").eq("personality_id", p.id).order("occurred_at", { ascending: false }).limit(10),
    ]);
    setHistory((hist ?? []).map((h) => ({ price: Number(h.price), recorded_at: h.recorded_at })));
    setEvents((ev ?? []).map((e) => ({ ...e, impact: Number(e.impact) })));

    if (user) {
      const { data: prof } = await supabase.from("profiles").select("balance").eq("id", user.id).single();
      if (prof) setBalance(Number(prof.balance));
      const { data: h } = await supabase.from("holdings").select("shares,avg_cost").eq("user_id", user.id).eq("personality_id", p.id).maybeSingle();
      setHolding(h ? { shares: Number(h.shares), avg_cost: Number(h.avg_cost) } : null);
    }

    // Fetch stiri + salveaza in Supabase + Wikipedia + Reputation Score
    setLoadingNews(true);
    const [newsResult, wiki, repScore] = await Promise.all([
      fetchAndSaveNews(p.id, p.name),
      fetchWikipediaData(p.name),
      calculateReputationScore(p.name, p.id, p.category),
    ]);
    setNews(newsResult.articles);
    setWikiData(wiki);
    setReputation(repScore);
    setLoadingNews(false);

    // Calculeaza si aplica actualizarea ZILNICA a pretului
    try {
      const update = await applyDailyPriceUpdate(p.id, repScore, personality.current_price);
      setDailyUpdate(update);

      if (update.updated && Math.abs(update.delta) >= 0.1) {
        // Reincarca pretul nou
        const { data: updated } = await supabase
          .from("personalities")
          .select("current_price,change_pct")
          .eq("id", p.id)
          .maybeSingle();
        if (updated) {
          const newPers = {
            ...personality,
            current_price: Number(updated.current_price),
            change_pct: Number(updated.change_pct),
          };
          setPers(newPers);
          persRef.current = newPers;

          toast(
            `${update.delta > 0 ? "📈" : "📉"} Daily update: ${update.delta > 0 ? "+" : ""}${update.delta.toFixed(2)}%`,
            { description: update.reason, duration: 5000 }
          );
        }
      }
    } catch { /* esec silentios */ }

    setLoading(false);
  }, [slug, user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Auto-refresh stiri la fiecare 5 minute — cu detectie stiri noi
  useEffect(() => {
    if (!pers) return;
    const interval = setInterval(async () => {
      const current = persRef.current;
      if (!current) return;
      try {
        // Trage stiri noi
        const articles = await fetchNewsForPersonality(current.name);
        setNews(articles);

        // Filtreaza stirile noi (nevazute anterior)
        const processed = filterNewArticles(articles);
        const { delta, newArticles, sources } = calculateNewsImpact(processed);

        if (newArticles.length > 0 && Math.abs(delta) > 0.01) {
          // Aplica impactul stirilor noi
          await applyNewsImpact(current.id, delta);
          setLastNewsImpact({ delta, sources });

          // Reincarca pretul
          const { data: updated } = await supabase
            .from("personalities")
            .select("current_price,change_pct")
            .eq("id", current.id)
            .maybeSingle();

          if (updated) {
            const newPers = {
              ...current,
              current_price: Number(updated.current_price),
              change_pct: Number(updated.change_pct),
            };
            setPers(newPers);
            persRef.current = newPers;

            // Notifica utilizatorul
            toast(
              `${delta > 0 ? "📈" : "📉"} ${current.name}: ${delta > 0 ? "+" : ""}${delta.toFixed(2)}% din stiri noi`,
              { duration: 4000 }
            );
          }
        }
      } catch { /* esec silentios */ }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [pers]);

  if (notFound) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Listing not found</h1>
        <Link to="/" className="mt-4 inline-block text-gold hover:underline">Back to market</Link>
      </main>
    );
  }
  if (loading || !pers) {
    return <main className="mx-auto max-w-7xl px-4 py-12"><div className="h-96 animate-pulse rounded-xl bg-surface" /></main>;
  }

  const positive = pers.change_pct >= 0;
  const sharesNum = Number(shares) || 0;
  const total = sharesNum * pers.current_price;

  const submitTrade = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (sharesNum <= 0) { toast.error("Enter a valid amount"); return; }
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + (session?.access_token ?? ""),
        },
        body: JSON.stringify({ personality_id: pers.id, side, shares: sharesNum }),
      });
      const result = await res.json();
      if (!res.ok) { toast.error(result.error ?? "Trade failed"); return; }
      toast.success(
        (side === "buy" ? "Bought" : "Sold") +
        " " + sharesNum + " share" + (sharesNum === 1 ? "" : "s") +
        " of " + pers.name,
      );
      setShares("1");
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Trade failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        ← Back to market
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-border/70 gradient-surface p-6 shadow-card sm:p-8">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <PersonalityAvatar name={pers.name} avatarUrl={pers.avatar_url} size={64} textClassName="text-xl" />
                <div>
                  <span className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${categoryStyles[pers.category] ?? ""}`}>
                    {pers.category}
                  </span>
                  <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight sm:text-3xl">{pers.name}</h1>
                  {pers.bio && <p className="mt-1 max-w-md text-sm text-muted-foreground">{pers.bio}</p>}
                </div>
              </div>
              <div className="flex items-end gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Current</div>
                  <div className="ticker-mono text-3xl font-bold">{formatHmx(pers.current_price)}</div>
                  <div className="text-[10px] text-muted-foreground">HMX</div>
                </div>
                <div className={`mb-1 rounded-md px-2 py-1 text-xs font-semibold ticker-mono ${positive ? "bg-bull-soft text-bull" : "bg-bear-soft text-bear"}`}>
                  {formatPct(pers.change_pct)}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border/70 gradient-surface p-6 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Price history · 30D</h2>
            </div>
            <PriceChart points={history} height={280} />
          </section>

          {/* Wikipedia Intelligence */}
          {wikiData && wikiData.pageviews > 0 && (
            <section className="rounded-xl border border-border/70 gradient-surface p-6 shadow-card">
              <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Wikipedia Intelligence
              </h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="rounded-lg border border-border bg-surface-elevated p-3 text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Weekly Views</div>
                  <div className="ticker-mono text-xl font-bold text-gold">{formatViews(wikiData.pageviews)}</div>
                </div>
                <div className="rounded-lg border border-border bg-surface-elevated p-3 text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Trend</div>
                  <div className={`ticker-mono text-xl font-bold ${
                    wikiData.pageviewsChange > 0 ? "text-bull" : wikiData.pageviewsChange < 0 ? "text-bear" : "text-muted-foreground"
                  }`}>
                    {wikiData.pageviewsChange > 0 ? "+" : ""}{wikiData.pageviewsChange}%
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface-elevated p-3 text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</div>
                  <div className={`text-sm font-bold capitalize ${
                    wikiData.score.label === "viral" ? "text-gold" :
                    wikiData.score.label === "trending" ? "text-bull" :
                    wikiData.score.label === "declining" ? "text-bear" : "text-muted-foreground"
                  }`}>
                    {wikiData.score.label}
                  </div>
                </div>
              </div>
              {wikiData.summary && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {wikiData.summary.slice(0, 300)}{wikiData.summary.length > 300 ? "..." : ""}
                </p>
              )}
              {wikiData.url && (
                <a href={wikiData.url} target="_blank" rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs text-gold hover:underline">
                  View on Wikipedia →
                </a>
              )}
            </section>
          )}

          {/* Last News Impact */}
          {lastNewsImpact && Math.abs(lastNewsImpact.delta) > 0.01 && (
            <section className="rounded-xl border border-border/70 gradient-surface p-4 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: lastNewsImpact.delta > 0 ? 'var(--bull)' : 'var(--bear)' }} />
                <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Live News Impact
                </h2>
                <span className={`ml-auto ticker-mono text-sm font-bold ${lastNewsImpact.delta > 0 ? 'text-bull' : 'text-bear'}`}>
                  {lastNewsImpact.delta > 0 ? '+' : ''}{lastNewsImpact.delta.toFixed(2)}%
                </span>
              </div>
              <div className="space-y-1.5">
                {lastNewsImpact.sources.map((source, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{source}</p>
                ))}
              </div>
            </section>
          )}

          {/* Human Reality Dashboard */}
          {reputation && (
            <section className="rounded-xl border border-border/70 gradient-surface p-6 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Human Reality Score
                </h2>
                <span className="text-xs text-muted-foreground">
                  Updated {new Date(reputation.calculatedAt).toLocaleTimeString()}
                </span>
              </div>

              {/* Scorul principal */}
              <div className="flex items-center gap-6 mb-6">
                <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-4 border-border bg-surface-elevated">
                  <span className={`text-3xl font-bold ticker-mono ${reputation.color}`}>
                    {reputation.total}
                  </span>
                  <span className="absolute bottom-2 text-xs text-muted-foreground">/ 100</span>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${reputation.color}`}>{reputation.label}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-sm ${reputation.trend === 'up' ? 'text-bull' : reputation.trend === 'down' ? 'text-bear' : 'text-muted-foreground'}`}>
                      {reputation.trend === 'up' ? '↑ Trending up' : reputation.trend === 'down' ? '↓ Trending down' : '→ Stable'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Based on {reputation.newsPositive + reputation.newsNegative + reputation.newsNeutral} articles · {reputation.daysOfData} days of data
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="rounded-lg border border-border bg-surface-elevated p-3 text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">News</div>
                  <div className={`ticker-mono text-lg font-bold ${reputation.breakdown.newsScore >= 50 ? 'text-bull' : 'text-bear'}`}>
                    {reputation.breakdown.newsScore}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {reputation.newsPositive}+ / {reputation.newsNegative}-
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface-elevated p-3 text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Interest</div>
                  <div className={`ticker-mono text-lg font-bold ${reputation.breakdown.interestScore >= 50 ? 'text-bull' : 'text-muted-foreground'}`}>
                    {reputation.breakdown.interestScore}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatViews(reputation.weeklyViews)}/week
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface-elevated p-3 text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Consistency</div>
                  <div className={`ticker-mono text-lg font-bold ${reputation.breakdown.consistencyScore >= 50 ? 'text-bull' : 'text-bear'}`}>
                    {reputation.breakdown.consistencyScore}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {reputation.viewsTrend > 0 ? '+' : ''}{reputation.viewsTrend}% views
                  </div>
                </div>
              </div>

              {/* Surse transparente */}
              <div className="text-xs text-muted-foreground border-t border-border pt-4">
                <p className="font-medium mb-1 text-foreground">Data sources:</p>
                <p>Google News RSS · Wikipedia Pageviews API · Sentiment Analysis</p>
                {dailyUpdate && (
                  <p className="mt-2 pt-2 border-t border-border">
                    <span className="font-medium text-foreground">Today's price update: </span>
                    {dailyUpdate.updated
                      ? <span className={dailyUpdate.delta >= 0 ? 'text-bull' : 'text-bear'}>
                          {dailyUpdate.delta >= 0 ? '+' : ''}{dailyUpdate.delta.toFixed(2)}% — {dailyUpdate.reason}
                        </span>
                      : <span className="text-muted-foreground">{dailyUpdate.reason}</span>
                    }
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Stiri reale de la NewsAPI */}
          <section className="rounded-xl border border-border/70 gradient-surface p-6 shadow-card">
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Live news · {pers.name}
            </h2>
            {loadingNews ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded bg-surface" />)}
              </div>
            ) : news.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent news found.</p>
            ) : (
              <NewsSection articles={news} />
            )}
          </section>

          {/* Evenimente din baza de date - ascunse temporar, contin date simulate
          {events.length > 0 && (
            <section className="rounded-xl border border-border/70 gradient-surface p-6 shadow-card">
              <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent events</h2>
              <ul className="divide-y divide-border/60">
                {events.map((e) => {
                  const up = e.impact >= 0;
                  return (
                    <li key={e.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm text-foreground">{e.headline}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{new Date(e.occurred_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p>
                      </div>
                      <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ticker-mono ${up ? "bg-bull-soft text-bull" : "bg-bear-soft text-bear"}`}>
                        {formatPct(e.impact)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          */}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border/70 gradient-surface p-6 shadow-card">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Trade</h2>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-border bg-surface-elevated p-1">
              <button
                onClick={() => setSide("buy")}
                className={`rounded-md py-2 text-sm font-semibold transition ${side === "buy" ? "bg-bull-soft text-bull" : "text-muted-foreground hover:text-foreground"}`}
              >Buy</button>
              <button
                onClick={() => setSide("sell")}
                className={`rounded-md py-2 text-sm font-semibold transition ${side === "sell" ? "bg-bear-soft text-bear" : "text-muted-foreground hover:text-foreground"}`}
              >Sell</button>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Shares</label>
              <input
                type="number"
                min="0"
                step="1"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="w-full rounded-md border border-border bg-input px-3 py-2.5 ticker-mono text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              />
            </div>

            <div className="mt-4 space-y-2 rounded-md border border-border bg-surface-elevated p-3 text-xs">
              <Row label="Price" value={`${formatHmx(pers.current_price)} HMX`} />
              <Row label="Total" value={`${formatHmx(total)} HMX`} highlight />
              {user && <Row label="Balance" value={`${formatHmx(balance)} HMX`} />}
              {user && holding && <Row label="You own" value={`${formatHmx(holding.shares, 4)} sh @ ${formatHmx(holding.avg_cost)}`} />}
            </div>

            <button
              onClick={submitTrade}
              disabled={submitting}
              className={`mt-4 w-full rounded-md py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                side === "buy" ? "gradient-gold text-primary-foreground shadow-glow" : "border border-bear text-bear hover:bg-bear-soft"
              }`}
              style={side === "sell" ? { borderColor: "var(--bear)" } : undefined}
            >
              {submitting ? "Processing..." : !user ? "Sign in to trade" : side === "buy" ? `Buy ${pers.name.split(" ")[0]}` : `Sell ${pers.name.split(" ")[0]}`}
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`ticker-mono ${highlight ? "font-bold text-gold" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

function NewsSection({ articles }: { articles: import("@/lib/newsapi").NewsArticle[] }) {
  const [showAll, setShowAll] = React.useState(false);
  const INITIAL_COUNT = 4;
  const visible = showAll ? articles : articles.slice(0, INITIAL_COUNT);

  return (
    <div>
      <ul className="divide-y divide-border/60">
        {visible.map((article, i) => {
          const up = article.sentiment === "positive";
          const neutral = article.sentiment === "neutral";
          return (
            <li key={i} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div className="flex-1">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground hover:text-gold transition-colors"
                >
                  {article.title}
                </a>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {article.source.name} · {new Date(article.publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ticker-mono ${
                neutral ? "bg-surface text-muted-foreground" : up ? "bg-bull-soft text-bull" : "bg-bear-soft text-bear"
              }`}>
                {neutral ? "neutral" : up ? "positive" : "negative"}
              </span>
            </li>
          );
        })}
      </ul>
      {articles.length > INITIAL_COUNT && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full rounded-md border border-border py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-gold transition-colors"
        >
          {showAll ? "Show less ↑" : `See ${articles.length - INITIAL_COUNT} more articles ↓`}
        </button>
      )}
    </div>
  );
}
