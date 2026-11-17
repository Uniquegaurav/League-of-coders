import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Crown, Trophy } from 'lucide-react';
import { api } from '../lib/api';
import { tierFor } from '../lib/rank';
import usePolling from '../hooks/usePolling';
import { useAuth } from '../context/AuthContext';
import { Avatar, EmptyState, PageLoader, VerifiedBadge } from '../components/ui';
import RankEmblem from '../components/game/RankEmblem';
import { practiceOf } from '../lib/progression';

const PODIUM = [
  { place: 2, h: 'h-36', ring: 'ring-ink-300', glow: 'from-ink-300/25', text: 'text-ink-200' },
  { place: 1, h: 'h-44', ring: 'ring-medium', glow: 'from-medium/30', text: 'text-medium' },
  { place: 3, h: 'h-32', ring: 'ring-amber-700', glow: 'from-amber-700/25', text: 'text-amber-600' },
];

function Podium({ players }) {
  if (players.length < 2) return null;
  return (
    <div className="mx-auto grid max-w-3xl grid-cols-3 items-end gap-3 sm:gap-6">
      {PODIUM.map(({ place, h, ring, glow, text }) => {
        const p = players[place - 1];
        if (!p) return <div key={place} />;
        return (
          <Link key={p.id} to={`/u/${p.id}`} className="group flex animate-rise-in flex-col items-center text-center" style={{ animationDelay: `${(3 - place) * 120}ms` }}>
            {place === 1 && <Crown className="mb-1 h-7 w-7 animate-float-slow text-medium drop-shadow-[0_0_10px_rgba(251,191,36,.8)]" />}
            <span className={clsx('rounded-full ring-2 ring-offset-4 ring-offset-ink-950 transition group-hover:scale-105', ring)}>
              <Avatar name={p.name} src={p.avatar} size={place === 1 ? 72 : 56} />
            </span>
            <p className="mt-3 max-w-full truncate text-sm font-bold text-white">{p.name}</p>
            <p className="font-mono text-sm font-bold text-brand-400">{p.stats.rating}</p>
            <div className={clsx('mt-2 flex w-full flex-col items-center justify-start gap-1 rounded-t-2xl border border-b-0 border-ink-700 bg-gradient-to-b to-ink-900/40 pt-3', h, glow)}>
              <RankEmblem rating={p.stats.rating} size={place === 1 ? 56 : 44} />
              <span className={clsx('font-display text-3xl font-black', text)}>{place}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const { data, loading } = usePolling(() => api.users.leaderboard(100).then((r) => r.players), 60000);

  useEffect(() => {
    document.title = 'Leaderboard · League of Coders';
  }, []);

  if (loading && !data) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <p className="hud-title text-medium">Ranked ladder</p>
        <h1 className="font-display text-3xl font-black text-white sm:text-4xl">Leaderboard</h1>
        <p className="mt-1 text-ink-400">Everyone starts at 1200. Rated battles (2+ players) move your rating with multiplayer Elo.</p>
      </div>
      {data?.length > 1 && <Podium players={data} />}
      {data?.length ? (
        <div className="hud-panel overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
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
                <th className="px-5 py-3 text-right">Level</th>
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
                    <span className="inline-flex items-center gap-2">
                      <RankEmblem rating={p.stats.rating} size={26} animated={false} />
                      {tierFor(p.stats.rating).name}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-bold text-brand-400">{p.stats.rating}</td>
                  <td className="px-5 py-3 text-right font-mono text-ink-300">{p.stats.matches}</td>
                  <td className="px-5 py-3 text-right font-mono text-ink-300">{p.stats.wins}</td>
                  <td className="px-5 py-3 text-right font-mono text-ink-300">{p.stats.matches ? Math.round((p.stats.wins / p.stats.matches) * 100) : 0}%</td>
                  <td className="px-5 py-3 text-right font-mono text-ink-300">{p.stats.solved}</td>
                  <td className="px-5 py-3 text-right font-mono text-ink-300">{practiceOf(p).level}</td>
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
