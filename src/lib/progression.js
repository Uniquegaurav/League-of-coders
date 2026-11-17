// Practice streak and milestone helpers. The backend still tracks XP, but the UI only shows streaks and milestones.

export function streakOf(player) {
  const p = player?.practice || {};
  return { streak: p.streak || 0, best: p.bestStreak || 0, dailyDone: !!p.dailyDone };
}

// Milestones are derived from stats, so they need no storage. Each reports progress toward its target.
const MILESTONES = [
  { name: 'First battle', target: 1, value: (s) => s.matches },
  { name: 'First win', target: 1, value: (s) => s.wins },
  { name: '10 wins', target: 10, value: (s) => s.wins },
  { name: '25 battles', target: 25, value: (s) => s.matches },
  { name: '50 problems solved', target: 50, value: (s, x) => Math.max(s.solved, x.solvedCount) },
  { name: '100 problems solved', target: 100, value: (s, x) => Math.max(s.solved, x.solvedCount) },
  { name: '7-day practice streak', target: 7, value: (s, x) => x.best },
  { name: 'Reach Platinum (1400)', target: 1400, value: (s) => s.rating },
];

export function milestonesFor(player) {
  const s = { matches: 0, wins: 0, solved: 0, rating: 0, ...(player?.stats || {}) };
  const x = { solvedCount: player?.solvedCount || 0, best: streakOf(player).best };
  return MILESTONES.map((m) => {
    const value = Math.min(m.target, m.value(s, x) || 0);
    return { name: m.name, value, target: m.target, done: value >= m.target };
  });
}
