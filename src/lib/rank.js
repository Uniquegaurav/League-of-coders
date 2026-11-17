// Elo bands, styled after a ranked ladder. Everyone starts at 1200 (Gold).
// `hue` drives the SVG rank emblem; `gems` is how many pips the emblem shows.
const TIERS = [
  { min: 2000, name: 'Challenger', color: 'text-medium', hue: ['#fde68a', '#f59e0b', '#7c2d12'], gems: 5 },
  { min: 1800, name: 'Master', color: 'text-fuchsia-300', hue: ['#f5d0fe', '#c026d3', '#4a044e'], gems: 4 },
  { min: 1600, name: 'Diamond', color: 'text-sky-300', hue: ['#e0f2fe', '#38bdf8', '#0c4a6e'], gems: 4 },
  { min: 1400, name: 'Platinum', color: 'text-teal-300', hue: ['#ccfbf1', '#2dd4bf', '#134e4a'], gems: 3 },
  { min: 1200, name: 'Gold', color: 'text-amber-300', hue: ['#fef3c7', '#fbbf24', '#78350f'], gems: 3 },
  { min: 1100, name: 'Silver', color: 'text-ink-200', hue: ['#f1f5f9', '#94a3b8', '#1e293b'], gems: 2 },
  { min: 1000, name: 'Bronze', color: 'text-orange-400', hue: ['#fed7aa', '#ea580c', '#431407'], gems: 1 },
  { min: 0, name: 'Recruit', color: 'text-ink-400', hue: ['#cbd5e1', '#64748b', '#0f172a'], gems: 0 },
];

export function tierFor(rating) {
  const n = Number(rating) || 0;
  return TIERS.find((t) => n >= t.min) || TIERS[TIERS.length - 1];
}

// Progress toward the next tier, for "promotion" bars.
export function tierProgress(rating) {
  const n = Number(rating) || 0;
  const idx = TIERS.findIndex((t) => n >= t.min);
  const current = TIERS[idx];
  const next = idx > 0 ? TIERS[idx - 1] : null;
  if (!next) return { current, next: null, pct: 100, toGo: 0 };
  const span = next.min - current.min;
  return { current, next, pct: Math.round(((n - current.min) / span) * 100), toGo: next.min - n };
}
