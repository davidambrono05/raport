type Props = {
  points: number[];
  width?: number;
  height?: number;
  positive?: boolean;
  className?: string;
};

export function Sparkline({ points, width = 120, height = 36, positive = true, className }: Props) {
  if (!points.length) return <svg width={width} height={height} className={className} />;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = width / Math.max(points.length - 1, 1);
  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = height - ((p - min) / range) * height;
    return [x, y] as const;
  });
  const d = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const areaD = `${d} L${width},${height} L0,${height} Z`;
  const stroke = positive ? "var(--bull)" : "var(--bear)";
  const fill = positive ? "color-mix(in oklab, var(--bull) 18%, transparent)" : "color-mix(in oklab, var(--bear) 18%, transparent)";
  const gradId = `spark-${positive ? "u" : "d"}`;

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={d} stroke={stroke} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="2" fill={stroke} />
      {fill && null}
    </svg>
  );
}
