import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Sparkline } from "./Sparkline";
import { PersonalityAvatar } from "./PersonalityAvatar";
import { formatHmx, formatPct } from "@/lib/format";

type Props = {
  slug: string;
  name: string;
  category: string;
  price: number;
  changePct: number;
  history: number[];
  avatarUrl?: string | null;
};

const categoryStyles: Record<string, string> = {
  Sport: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  Entertainment: "bg-pink-500/10 text-pink-300 border-pink-500/20",
  Tech: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  Politics: "bg-amber-500/10 text-amber-300 border-amber-500/20",
};

export function PersonalityCard({ slug, name, category, price, changePct, history, avatarUrl }: Props) {
  const positive = changePct >= 0;
  const prevPrice = useRef(price);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (price === prevPrice.current) return;
    const dir: "up" | "down" = price > prevPrice.current ? "up" : "down";
    prevPrice.current = price;
    setFlash(dir);
    const t = window.setTimeout(() => setFlash(null), 1200);
    return () => window.clearTimeout(t);
  }, [price]);

  return (
    <Link
      to="/p/$slug"
      params={{ slug }}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-xl border border-border/70 gradient-surface p-5 shadow-card transition-all hover:border-gold/40 hover:shadow-glow"
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <PersonalityAvatar name={name} avatarUrl={avatarUrl} size={48} />
          <div className="flex flex-col">
            <span className="font-display text-sm font-semibold leading-tight">{name}</span>
            <span className={`mt-1 inline-flex w-fit items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${categoryStyles[category] ?? "bg-muted text-muted-foreground"}`}>
              {category}
            </span>
          </div>
        </div>
        <div className={`rounded-md px-2 py-1 text-xs font-semibold ticker-mono ${positive ? "bg-bull-soft text-bull" : "bg-bear-soft text-bear"}`}>
          {formatPct(changePct)}
        </div>
      </div>

      {/* Price + sparkline */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Last price</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className={`ticker-mono text-2xl font-bold text-foreground px-1 ${
                flash === "up" ? "flash-up" : flash === "down" ? "flash-down" : ""
              }`}
            >
              {formatHmx(price)}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">HMX</span>
          </div>
        </div>
        <Sparkline points={history} positive={positive} width={110} height={40} />
      </div>
    </Link>
  );
}
