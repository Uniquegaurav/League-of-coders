import { Award, Crown, Flame, Gauge, Medal, Swords, Target, Trophy, UserPlus, Zap, Gem, CalendarCheck } from 'lucide-react';

// Mirrors the server's badge list (League_of_coders_backend/src/services/badges.js). Keep keys in sync.
export const BADGES = [
  { key: 'first-battle', name: 'First battle', description: 'Finish your first battle', icon: Swords },
  { key: 'first-win', name: 'First win', description: 'Win a rated battle', icon: Trophy },
  { key: 'wins-10', name: '10 wins', description: 'Win 10 rated battles', icon: Medal },
  { key: 'wins-50', name: '50 wins', description: 'Win 50 rated battles', icon: Crown },
  { key: 'streak-7', name: '7-day streak', description: 'Practise or battle 7 days in a row', icon: Flame },
  { key: 'streak-30', name: '30-day streak', description: 'Practise or battle 30 days in a row', icon: CalendarCheck },
  { key: 'solved-100', name: '100 solved', description: 'Solve 100 problems on League of Coders', icon: Target },
  { key: 'platinum', name: 'Platinum', description: 'Reach a 1400 rating', icon: Gem },
  { key: 'giant-slayer', name: 'Giant slayer', description: 'Finish above someone rated 200+ higher', icon: Zap },
  { key: 'speed-demon', name: 'Speed demon', description: 'Solve a Hard within 15 minutes in a battle', icon: Gauge },
  { key: 'sunday-cup', name: 'Cup contender', description: 'Play in a Sunday Cup', icon: Award },
  { key: 'recruiter', name: 'Recruiter', description: 'Bring 3 friends who finish a battle', icon: UserPlus },
];

export const badgeByKey = new Map(BADGES.map((b) => [b.key, b]));
