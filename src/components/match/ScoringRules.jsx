import { Flame, Gauge, ShieldCheck, Zap } from 'lucide-react';

export const BASE_POINTS = { Easy: 100, Medium: 200, Hard: 300 };

export default function ScoringRules({ compact }) {
  const rows = [
    { icon: Gauge, title: 'Base points', body: 'Easy 100 · Medium 200 · Hard 300' },
    { icon: Zap, title: 'Speed bonus', body: 'Up to +50% of base, shrinking linearly until the buzzer' },
    { icon: Flame, title: 'First solve', body: '+25 for the first accepted submission on a problem' },
    { icon: ShieldCheck, title: 'Verified', body: 'Only LeetCode submissions accepted during the match count' },
  ];
  return (
    <div className={compact ? 'space-y-3' : 'grid gap-3 sm:grid-cols-2'}>
      {rows.map(({ icon: Icon, title, body }) => (
        <div key={title} className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-xs leading-5 text-ink-400">{body}</p>
          </div>
        </div>
      ))}
      {!compact && (
        <p className="text-xs text-ink-500 sm:col-span-2">
          Ties are broken by problems solved, then by who finished their last solve first. Tournaments (battle hour, Sunday Cup and
          planned events) move your rating. Every battle and solo test earns XP for each verified solve, plus a placement bonus.
        </p>
      )}
    </div>
  );
}
