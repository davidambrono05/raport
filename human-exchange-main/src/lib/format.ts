export function formatHmx(n: number | string | null | undefined, decimals = 2) {
  const v = Number(n ?? 0);
  return v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatPct(n: number | string | null | undefined) {
  const v = Number(n ?? 0);
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}
