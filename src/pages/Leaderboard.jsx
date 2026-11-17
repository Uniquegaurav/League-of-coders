import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Crown, Trophy } from 'lucide-react';
import { api } from '../lib/api';
import { tierFor } from '../lib/rank';
import usePolling from '../hooks/usePolling';
import { useAuth } from '../context/AuthContext';
import { Avatar, EmptyState, PageBanner, PageLoader, VerifiedBadge } from '../components/ui';

export default function Leaderboard() {
  const { user } = useAuth();
  const { data, loading } = usePolling(() => api.users.leaderboard(100).then((r) => r.players), 60000);

  useEffect(() => {
    document.title = 'Leaderboard · League of Coders';
  }, []);

  if (loading && !data) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageBanner
        title="Leaderboard"
        info={
          <>
            Everyone starts at 1200. Rated battles (2 or more players) move your rating using multiplayer Elo: beating higher-rated players gains more. Solo tests never change it.
          </>
        }
      >
        The top players across every rated battle.
      </PageBanner>
      {data?.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-ink-800 text-left text-xs uppercase tracking-wider text-ink-500">
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Player</th>
                <th className="px-5 py-3">Tier</th>
                <th className="px-5 py-3 text-right">Rating</th>
                <th className="px-5 py-3 text-right">Battles</th>
                <th className="px-5 py-3 text-right">Wins</th>
                <th className="px-5 py-3 text-right">Win rate</th>
                <th className="px-5 py-3 text-right">Solved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800/70">
              {data.map((p, i) => (
                <tr key={p.id} className={clsx('hover:bg-ink-850/60', p.id === user?.id && 'bg-brand-500/5')}>
                  <td className="px-5 py-3 font-mono font-bold text-ink-400">{i < 3 ? <Crown className={clsx('h-4 w-4', ['text-medium', 'text-ink-300', 'text-amber-600'][i])} /> : i + 1}</td>
                  <td className="px-5 py-3">
                    <Link to={`/u/${p.id}`} className="flex items-center gap-3 hover:underline">
                      <Avatar name={p.name} src={p.avatar} size={32} />
                      <span className="font-medium text-ink-200">{p.name}</span>
                      <VerifiedBadge verified={p.leetcode?.verified} />
                    </Link>
                  </td>
                  <td className={clsx('px-5 py-3 font-display text-xs font-semibold uppercase tracking-wider', tierFor(p.stats.rating).color)}>
                    {tierFor(p.stats.rating).name}
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-bold text-brand-400">{p.stats.rating}</td>
                  <td className="px-5 py-3 text-right font-mono text-ink-300">{p.stats.matches}</td>
                  <td className="px-5 py-3 text-right font-mono text-ink-300">{p.stats.wins}</td>
                  <td className="px-5 py-3 text-right font-mono text-ink-300">{p.stats.matches ? Math.round((p.stats.wins / p.stats.matches) * 100) : 0}%</td>
                  <td className="px-5 py-3 text-right font-mono text-ink-300">{p.stats.solved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={Trophy} title="No ranked players yet" action={<Link to="/new" className="btn-primary btn-sm">Start a battle</Link>}>
          Finish a battle to claim the top spot.
        </EmptyState>
      )}
    </div>
  );
}
