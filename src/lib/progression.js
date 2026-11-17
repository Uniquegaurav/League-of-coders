import { Award, Crown, Flame, Medal, Rocket, Shield, Sparkles, Star, Swords, Target, Trophy, Zap } from 'lucide-react';

// Mirrors the backend progression service. Used as a fallback when the API omits `practice`.
export const XP = { Easy: 10, Medium: 25, Hard: 50 };

export function levelFor(xp = 0) {
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  return { level, levelXp: 50 * (level - 1) ** 2, nextLevelXp: 50 * level ** 2 };
}

export function practiceOf(player) {
  const p = player?.practice || {};
  const xp = p.xp || 0;
  const lv = p.level ? { level: p.level, levelXp: p.levelXp, nextLevelXp: p.nextLevelXp } : levelFor(xp);
  const span = Math.max(1, lv.nextLevelXp - lv.levelXp);
  return {
    xp,
    ...lv,
    pct: Math.min(100, Math.round(((xp - lv.levelXp) / span) * 100)),
    streak: p.streak || 0,
    bestStreak: p.bestStreak || 0,
    dailyDone: !!p.dailyDone,
  };
}

// Level titles, so a number feels like a role.
const TITLES = ['Rookie', 'Script Kiddie', 'Bug Hunter', 'Code Ninja', 'Algorithm Adept', 'Recursion Ranger', 'Graph Guardian', 'DP Sorcerer', 'Legend'];
export const titleFor = (level) => TITLES[Math.min(TITLES.length - 1, Math.floor((level - 1) / 3))];

// Achievements are derived from stats, so they need no storage.
export const ACHIEVEMENTS = [
  { id: 'first-blood', icon: Swords, name: 'First Blood', desc: 'Play your first rated battle', test: (s) => s.matches >= 1, color: 'text-hard' },
  { id: 'victor', icon: Trophy, name: 'Victor', desc: 'Win a battle', test: (s) => s.wins >= 1, color: 'text-medium' },
  { id: 'warlord', icon: Crown, name: 'Warlord', desc: 'Win 10 battles', test: (s) => s.wins >= 10, color: 'text-medium' },
  { id: 'solver', icon: Target, name: 'Problem Solver', desc: 'Solve 10 problems', test: (s, p) => Math.max(s.solved, p.solvedCount) >= 10, color: 'text-easy' },
  { id: 'centurion', icon: Shield, name: 'Centurion', desc: 'Solve 100 problems', test: (s, p) => Math.max(s.solved, p.solvedCount) >= 100, color: 'text-sky-300' },
  { id: 'on-fire', icon: Flame, name: 'On Fire', desc: '3-day practice streak', test: (s, p) => p.bestStreak >= 3, color: 'text-orange-400' },
  { id: 'unstoppable', icon: Zap, name: 'Unstoppable', desc: '7-day practice streak', test: (s, p) => p.bestStreak >= 7, color: 'text-fuchsia-300' },
  { id: 'rising', icon: Rocket, name: 'Rising Star', desc: 'Reach level 5', test: (s, p) => p.level >= 5, color: 'text-brand-400' },
  { id: 'veteran', icon: Medal, name: 'Veteran', desc: 'Play 25 battles', test: (s) => s.matches >= 25, color: 'text-teal-300' },
  { id: 'platinum', icon: Star, name: 'Platinum Mind', desc: 'Reach 1400 rating', test: (s) => s.rating >= 1400, color: 'text-teal-300' },
  { id: 'scholar', icon: Sparkles, name: 'Point Hoarder', desc: 'Earn 5,000 battle points', test: (s) => s.points >= 5000, color: 'text-neon-400' },
  { id: 'elite', icon: Award, name: 'Elite', desc: 'Reach Master tier', test: (s) => s.rating >= 1800, color: 'text-fuchsia-300' },
];

export function achievementsFor(player) {
  const s = player?.stats || {};
  const p = { ...practiceOf(player), solvedCount: player?.solvedCount || 0 };
  return ACHIEVEMENTS.map((a) => ({ ...a, unlocked: !!a.test({ matches: 0, wins: 0, solved: 0, points: 0, rating: 0, ...s }, p) }));
}
