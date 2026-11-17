// Elo bands, styled after a ranked ladder. Everyone starts at 1200 (Gold).
const TIERS = [
  { min: 2000, name: 'Challenger', color: 'text-medium' },
  { min: 1800, name: 'Master', color: 'text-fuchsia-300' },
  { min: 1600, name: 'Diamond', color: 'text-sky-300' },
  { min: 1400, name: 'Platinum', color: 'text-teal-300' },
  { min: 1200, name: 'Gold', color: 'text-amber-300' },
  { min: 1100, name: 'Silver', color: 'text-ink-200' },
  { min: 1000, name: 'Bronze', color: 'text-orange-400' },
  { min: 0, name: 'Recruit', color: 'text-ink-400' },
];

export function tierFor(rating) {
  const n = Number(rating) || 0;
  return TIERS.find((t) => n >= t.min) || TIERS[TIERS.length - 1];
}
