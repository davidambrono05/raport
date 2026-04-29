type Point = { price: number; recorded_at: string };
type Props = { points: Point[]; height?: number };

export function PriceChart({ points, height = 280 }: Props) {
  // Filtreaza punctele duplicate si sorteaza cronologic
  const sorted = [...points]
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .filter((p, i, arr) => {
      if (i === 0) return true;
      // Pastreaza doar puncte la cel putin 10 minute distanta
      const prev = new Date(arr[i - 1].recorded_at).getTime();
      const curr = new Date(p.recorded_at).getTime();
      return curr - prev >= 10 * 60 * 1000;
    });

  if (sorted.length < 2) {
    return <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>No data yet — check back soon</div>;
  }
  const width = 800;
  const padX = 8;
  const padY = 16;
  const prices = sorted.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const stepX = (width - padX * 2) / (sorted.length - 1);
  const positive = prices[prices.length - 1] >= prices[0];
  const stroke = positive ? "var(--bull)" : "var(--bear)";

  const coords = sorted.map((p, i) => {
    const x = padX + i * stepX;
    const y = padY + (1 - (p.price - min) / range) * (height - padY * 2);
    return [x, y] as const;
  });
  const d = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const areaD = `${d} L${width - padX},${height - padY} L${padX},${height - padY} Z`;

  // Y-axis grid lines
  const gridY = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padY + t * (height - padY * 2),
    label: (max - t * range).toFixed(2),
  }));

  // X-axis date labels
  const dateLabels = sorted
    .filter((_, i) => i === 0 || i === Math.floor(sorted.length / 2) || i === sorted.length - 1)
    .map((p, i, arr) => ({
      x: padX + sorted.indexOf(p) * stepX,
      label: new Date(p.recorded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    }));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridY.map((g, i) => (
        <g key={i}>
          <line x1={padX} x2={width - padX} y1={g.y} y2={g.y} stroke="var(--border)" strokeDasharray="2 4" strokeWidth="0.5" />
          <text x={width - padX} y={g.y - 2} textAnchor="end" fontSize="10" fill="var(--muted-foreground)" className="ticker-mono">
            {g.label}
          </text>
        </g>
      ))}
      {dateLabels.map((dl, i) => (
        <text key={i} x={dl.x} y={height - 2} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
          {dl.label}
        </text>
      ))}
      <path d={areaD} fill="url(#chart-grad)" />
      <path d={d} stroke={stroke} strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
