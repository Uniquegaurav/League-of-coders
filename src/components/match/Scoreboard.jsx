import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Crown, Flame } from 'lucide-react';
import { Avatar, VerifiedBadge } from '../ui';

export const letter = (i) => String.fromCharCode(65 + i);

export default function Scoreboard({ match, userId, className }) {
  const problems = match.problems;
  return (
    <div className={clsx('card overflow-hidden', className)}>
      <div className="flex items-center justify-between border-b border-ink-800 px-4 py-3">
        <p className="text-sm font-semibold text-white">Scoreboard</p>
        <span className="text-xs text-ink-500">{match.participants.filter((p) => !p.left).length} playing</span>
      </div>
      <ol className="divide-y divide-ink-800/80">
        {match.participants.map((p, i) => {
          const solved = new Map(p.solves.map((s) => [s.slug, s]));
          return (
            <li key={p.id} className={clsx('flex items-center gap-3 px-4 py-2.5', p.id === userId && 'bg-brand-500/10', p.left && 'opacity-50')}>
              <span className="w-5 text-center font-mono text-sm font-bold text-ink-400">
                {i === 0 && p.score > 0 ? <Crown className="h-4 w-4 text-gold" /> : i + 1}
              </span>
              <Avatar name={p.name} src={p.avatar} size={28} online={p.online} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 truncate text-sm font-medium text-ink-200">
                  <Link to={`/u/${p.id}`} className="truncate hover:underline">
                    {p.id === userId ? 'You' : p.name}
                  </Link>
                  <VerifiedBadge verified={p.verified} />
                  {p.left && <span className="text-[10px] text-hard">left</span>}
                </p>
                {problems.length > 0 && (
                  <div className="mt-1 flex gap-1">
                    {problems.map((prob, idx) => {
                      const s = solved.get(prob.slug);
                      return (
                        <span
                          key={prob.slug}
                          title={s ? `${prob.title}: +${s.points}${s.firstSolve ? ' (first solve)' : ''}` : prob.title}
                          className={clsx(
                            'flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold',
                            s ? (s.firstSolve ? 'bg-fire text-ink-950' : 'bg-easy text-ink-950') : 'bg-ink-800 text-ink-500'
                          )}
                        >
                          {s?.firstSolve ? <Flame className="h-2.5 w-2.5" /> : letter(idx)}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <span className="font-mono text-sm font-bold text-white">{p.score}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
