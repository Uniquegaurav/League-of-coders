import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { Crown, GraduationCap, Trophy, Users } from 'lucide-react';
import { api } from '../lib/api';
import { tierFor } from '../lib/rank';
import usePolling from '../hooks/usePolling';
import { useAuth } from '../context/AuthContext';
import { Avatar, EmptyState, PageBanner, PageLoader, VerifiedBadge } from '../components/ui';
import { TournamentsSection } from './Tournaments';

const TABS = [
  { key: 'week', label: 'This week' },
  { key: 'all', label: 'All time' },
  { key: 'friends', label: 'Friends' },
  { key: 'colleges', label: 'Colleges' },
];

const signed = (n) => (n > 0 ? `+${n}` : String(n));

function RankCell({ i }) {
  return i < 3 ? <Crown className={clsx('h-4 w-4', ['text-gold', 'text-ink-300', 'text-amber-600'][i])} /> : i + 1;
}

function PlayerCell({ p }) {
  return (
    <Link to={`/u/${p.username || p.id}`} className="flex items-center gap-3 hover:underline">
      <Avatar name={p.name} src={p.avatar} size={32} />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 font-medium text-ink-200">
          {p.name} <VerifiedBadge verified={p.leetcode?.verified} />
        </span>
        {p.college && <span className="block truncate text-xs text-ink-500">{p.college}</span>}
      </span>
    </Link>
  );
}

function PlayersTable({ players, week, userId }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-ink-800 text-left text-xs uppercase tracking-wider text-ink-500">
            <th className="px-5 py-3">Rank</th>
            <th className="px-5 py-3">Player</th>
            <th className="px-5 py-3">Tier</th>
            {week ? (
              <>
                <th className="px-5 py-3 text-right">Rating gained</th>
                <th className="px-5 py-3 text-right">Battles</th>
                <th className="px-5 py-3 text-right">Wins</th>
                <th className="px-5 py-3 text-right">Rating</th>
              </>
            ) : (
              <>
                <th className="px-5 py-3 text-right">Rating</th>
                <th className="px-5 py-3 text-right">Battles</th>
                <th className="px-5 py-3 text-right">Wins</th>
                <th className="px-5 py-3 text-right">Win rate</th>
                <th className="px-5 py-3 text-right">Solved</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-800/70">
          {players.map((p, i) => (
            <tr key={p.id} className={clsx('hover:bg-ink-850/60', p.id === userId && 'bg-brand-500/5')}>
              <td className="px-5 py-3 font-mono font-bold text-ink-400">
                <RankCell i={i} />
              </td>
              <td className="px-5 py-3">
                <PlayerCell p={p} />
              </td>
              <td className={clsx('px-5 py-3 font-display text-xs font-semibold uppercase tracking-wider', tierFor(p.stats.rating).color)}>
                {tierFor(p.stats.rating).name}
              </td>
              {week ? (
                <>
                  <td className={clsx('px-5 py-3 text-right font-mono font-bold', (p.week?.gain ?? 0) >= 0 ? 'text-easy' : 'text-hard')}>{signed(p.week?.gain ?? 0)}</td>
                  <td className="px-5 py-3 text-right font-mono text-ink-300">{p.week?.battles ?? '–'}</td>
                  <td className="px-5 py-3 text-right font-mono text-ink-300">{p.week?.wins ?? '–'}</td>
                  <td className="px-5 py-3 text-right font-mono text-brand-400">{p.stats.rating}</td>
                </>
              ) : (
                <>
                  <td className="px-5 py-3 text-right font-mono font-bold text-brand-400">{p.stats.rating}</td>
                  <td className="px-5 py-3 text-right font-mono text-ink-300">{p.stats.matches}</td>
                  <td className="px-5 py-3 text-right font-mono text-ink-300">{p.stats.wins}</td>
                  <td className="px-5 py-3 text-right font-mono text-ink-300">{p.stats.matches ? Math.round((p.stats.wins / p.stats.matches) * 100) : 0}%</td>
                  <td className="px-5 py-3 text-right font-mono text-ink-300">{p.stats.solved}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CollegesTable({ colleges, onPick }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-ink-800 text-left text-xs uppercase tracking-wider text-ink-500">
            <th className="px-5 py-3">Rank</th>
            <th className="px-5 py-3">College</th>
            <th className="px-5 py-3 text-right">Score</th>
            <th className="px-5 py-3 text-right">Players</th>
            <th className="px-5 py-3 text-right">Wins</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-800/70">
          {colleges.map((c, i) => (
            <tr key={c.name} className="hover:bg-ink-850/60">
              <td className="px-5 py-3 font-mono font-bold text-ink-400">
                <RankCell i={i} />
              </td>
              <td className="px-5 py-3">
                <button className="flex items-center gap-2 text-left font-medium text-ink-200 hover:underline" onClick={() => onPick(c.name)}>
                  <GraduationCap className="h-4 w-4 shrink-0 text-ink-500" /> {c.name}
                </button>
              </td>
              <td className="px-5 py-3 text-right font-mono font-bold text-brand-400">{c.score}</td>
              <td className="px-5 py-3 text-right font-mono text-ink-300">{c.players}</td>
              <td className="px-5 py-3 text-right font-mono text-ink-300">{c.wins}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function YourRank({ me, tab, inList }) {
  if (!me || inList) return null;
  return (
    <div className="card flex items-center justify-between gap-3 border-brand-500/30 px-5 py-3 text-sm">
      <span className="text-ink-300">{tab === 'week' ? 'Your rank this week' : 'Your rank'}</span>
      <span className="flex items-center gap-4">
        {me.week && <span className={clsx('font-mono', me.week.gain >= 0 ? 'text-easy' : 'text-hard')}>{signed(me.week.gain)}</span>}
        <span className="font-mono text-lg font-bold text-white">#{me.rank}</span>
      </span>
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'week';
  const college = params.get('college');

  const view = `${tab}|${college || ''}`;
  const { data: raw, loading, error, reload } = usePolling(
    () => {
      if (tab === 'colleges' && !college) return api.users.colleges().then((r) => ({ colleges: r.colleges, view })).catch(() => ({ colleges: [], view }));
      const scope = tab === 'colleges' ? 'college' : tab;
      // An older server ignores `scope` and has no weekly numbers: then this week falls back to all-time.
      return api.users.leaderboard(100, { scope, college: college || undefined }).then((r) => ({ ...r, view, legacy: tab === 'week' && r.scope !== 'week' }));
    },
    60000,
    [view, user?.id]
  );
  // Ignore the previous tab's response while the new one loads.
  const data = raw?.view === view ? raw : null;

  useEffect(() => {
    document.title = 'League · League of Coders';
  }, []);

  const setTab = (key) => setParams({ tab: key });
  const players = data?.players || [];

  // Early in the week the weekly board can be empty; show all-time instead of an empty page.
  useEffect(() => {
    if (!TABS.some((t) => t.key === params.get('tab')) && tab === 'week' && data && !loading && (data.legacy || !data.players?.length)) setParams({ tab: 'all' }, { replace: true });
  }, [params, tab, data, loading, setParams]);
  const inList = data?.me && players.some((p) => p.id === user?.id);

  let body;
  if (!data && error && !loading) {
    body = (
      <EmptyState icon={Trophy} title="Could not load the leaderboard" action={<button className="btn-primary btn-sm" onClick={reload}>Try again</button>}>
        Check your connection and try again.
      </EmptyState>
    );
  } else if (!data) body = <PageLoader />;
  else if (tab === 'friends' && !user) {
    body = (
      <EmptyState icon={Users} title="Sign in to see your friends" action={<Link to="/login" state={{ from: '/league?tab=friends' }} className="btn-primary btn-sm">Sign in</Link>}>
        Compare ratings with the people you play with.
      </EmptyState>
    );
  } else if (tab === 'colleges' && !college) {
    body = data?.colleges?.length ? (
      <CollegesTable colleges={data.colleges} onPick={(name) => setParams({ tab: 'colleges', college: name })} />
    ) : (
      <EmptyState icon={GraduationCap} title="No colleges yet" action={user && <Link to="/u/me" className="btn-primary btn-sm">Add your college</Link>}>
        Add your college on your profile to put it on the board.
      </EmptyState>
    );
  } else if (players.length) {
    body = <PlayersTable players={players} week={tab === 'week' && !data.legacy} userId={user?.id} />;
  } else {
    body = (
      <EmptyState
        icon={Trophy}
        title={tab === 'week' ? 'No rated battles this week yet' : tab === 'friends' ? 'No friends yet' : 'No ranked players yet'}
        action={<Link to={tab === 'friends' ? '/community' : '/new'} className="btn-primary btn-sm">{tab === 'friends' ? 'Find friends' : 'Start a battle'}</Link>}
      >
        {tab === 'week' ? 'The board resets every Monday. Finish a rated battle to take the top spot.' : 'Finish a battle to claim the top spot.'}
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      <PageBanner
        title="League"
        info={
          <>
            Everyone starts at 1200. Rated battles (2 or more players) move your rating using multiplayer Elo: beating higher-rated players gains more. Solo
            tests never change it. "This week" ranks rating gained since Monday 00:00 UTC. Colleges are ranked by the average rating of their top 10 players.
          </>
        }
      >
        Tournaments and rankings, all in one place.
      </PageBanner>

      <TournamentsSection />

      <section className="space-y-4 border-t border-ink-800 pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="section-title flex items-center gap-2">
          <Crown className="h-5 w-5 text-brand-400" /> Leaderboard
        </h2>
        <p className="text-sm text-ink-400">{tab === 'week' ? 'Rating gained this week. Resets every Monday.' : tab === 'colleges' ? 'Colleges by the average rating of their top 10.' : 'Rating across every rated battle.'}</p>
      </div>
      <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={clsx('btn-sm shrink-0 rounded-full border px-4', tab === t.key ? 'border-brand-500 bg-brand-500/15 text-white' : 'border-ink-700 text-ink-300 hover:text-white')}
          >
            {t.label}
          </button>
        ))}
        {college && (
          <span className="chip ml-1">
            <GraduationCap className="h-3.5 w-3.5" /> {college}
            <button className="ml-1 text-ink-500 hover:text-white" aria-label="Back to all colleges" onClick={() => setParams({ tab: 'colleges' })}>
              ×
            </button>
          </span>
        )}
      </div>

      <YourRank me={data?.me} tab={tab} inList={inList} />
      {body}
      </section>
    </div>
  );
}
