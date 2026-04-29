import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PersonalityCard } from "@/components/PersonalityCard";
import { formatHmx, formatPct } from "@/lib/format";
import { useMarketSimulation } from "@/lib/useMarketSimulation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Market — HUMANEX" },
      { name: "description", content: "Live market feed for HUMANEX. Trade public figures with HMX coins." },
    ],
  }),
  component: MarketPage,
});

type Personality = {
  id: string;
  slug: string;
  name: string;
  category: string;
  current_price: number;
  change_pct: number;
  avatar_url: string | null;
};

type Row = Personality & { history: number[] };

const CATEGORIES = ["All", "Sport", "Entertainment", "Tech", "Politics"] as const;

function MarketPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("All");

  useMarketSimulation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: pers } = await supabase
        .from("personalities")
        .select("id,slug,name,category,current_price,change_pct,avatar_url")
        .order("current_price", { ascending: false });
      if (!pers || !mounted) return;

      const ids = pers.map((p) => p.id);
      const { data: hist } = await supabase
        .from("price_history")
        .select("personality_id,price,recorded_at")
        .in("personality_id", ids)
        .order("recorded_at", { ascending: true });

      const map = new Map<string, number[]>();
      (hist ?? []).forEach((h) => {
        const arr = map.get(h.personality_id) ?? [];
        arr.push(Number(h.price));
        map.set(h.personality_id, arr);
      });

      if (mounted) {
        setRows(
          pers.map((p) => ({
            ...p,
            current_price: Number(p.current_price),
            change_pct: Number(p.change_pct),
            history: map.get(p.id) ?? [],
          }))
        );
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Realtime: apply live price updates to the in-memory rows
  useEffect(() => {
    const ch = supabase
      .channel("market-personalities")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "personalities" },
        (payload) => {
          const row = payload.new as { id: string; current_price: number | string; change_pct: number | string };
          setRows((prev) =>
            prev
              ? prev.map((r) =>
                  r.id === row.id
                    ? {
                        ...r,
                        current_price: Number(row.current_price),
                        change_pct: Number(row.change_pct),
                        history: [...r.history, Number(row.current_price)].slice(-60),
                      }
                    : r
                )
              : prev
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const [showAll, setShowAll] = useState(false);
  const INITIAL_COUNT = 12;

  const filtered = rows?.filter((r) => filter === "All" || r.category === filter) ?? null;
  const visible = filtered ? (showAll ? filtered : filtered.slice(0, INITIAL_COUNT)) : null;

  // Market stats
  const stats = rows ? {
    total: rows.length,
    avgPrice: rows.reduce((s, r) => s + r.current_price, 0) / rows.length,
    gainers: rows.filter((r) => r.change_pct > 0).length,
    losers: rows.filter((r) => r.change_pct < 0).length,
  } : null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Hero */}
      <section className="mb-10">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: "var(--bull)" }} />
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Market open</span>
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          The Human Stock Exchange
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Trade public figures like assets. Prices move with reality — performances, scandals, viral moments.
        </p>

        {/* Stats strip */}
        {stats && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Listed" value={String(stats.total)} />
            <StatCard label="Avg price" value={`${formatHmx(stats.avgPrice)} HMX`} />
            <StatCard label="Gainers" value={String(stats.gainers)} accent="bull" />
            <StatCard label="Losers" value={String(stats.losers)} accent="bear" />
          </div>
        )}
      </section>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider transition ${
              filter === c
                ? "border-gold bg-gold-soft text-gold"
                : "border-border bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      {!filtered ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[160px] animate-pulse rounded-xl border border-border/70 bg-surface" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No listings in this category.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible!.map((p) => (
              <PersonalityCard
                key={p.id}
                slug={p.slug}
                name={p.name}
                category={p.category}
                price={p.current_price}
                changePct={p.change_pct}
                history={p.history}
                avatarUrl={p.avatar_url}
              />
            ))}
          </div>
          {filtered!.length > INITIAL_COUNT && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-6 w-full rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-gold transition-colors"
            >
              {showAll
                ? `Show less ↑`
                : `See ${filtered!.length - INITIAL_COUNT} more personalities ↓`}
            </button>
          )}
        </>
      )}

      <div className="mt-12 rounded-xl border border-border/70 gradient-surface p-6 text-sm text-muted-foreground sm:p-8">
        <p>
          New here? <Link to="/auth" className="font-medium text-gold hover:underline">Open an account</Link> and receive
          {" "}<span className="ticker-mono font-semibold text-gold">10,000 HMX</span> to start trading.
        </p>
      </div>
    </main>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: "bull" | "bear" }) {
  const color = accent === "bull" ? "text-bull" : accent === "bear" ? "text-bear" : "text-foreground";
  return (
    <div className="rounded-lg border border-border/70 gradient-surface p-4 shadow-card">
      <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 ticker-mono text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}
