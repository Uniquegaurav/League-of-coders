import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { GraduationCap } from 'lucide-react';
import { api } from '../../lib/api';
import { tierFor } from '../../lib/rank';
import usePolling from '../../hooks/usePolling';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Spinner } from '../ui';

const SCOPES = [
  ['global', 'Global'],
  ['friends', 'Friends'],
  ['college', 'My college'],
  ['colleges', 'Colleges'],
];
const PERIODS = [
  ['week', 'This week'],
  ['all', 'All time'],
];
const MEDAL = ['ring-gold', 'ring-ink-300', 'ring-amber-700'];
const PODIUM_ORDER = [1, 0, 2]; // 2nd, 1st, 3rd from left to right

function Tabs({ value, options, onChange, size = 'md' }) {
  return (
    <div className="pill-tabs" role="tablist">
      {options.map(([key, label]) => (
        <button key={key} role="tab" aria-selected={value === key} onClick={() => onChange(key)} className={clsx('pill-tab', size === 'sm' && 'px-3 py-1 text-xs', value === key && 'pill-tab-active')}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Value({ board, player }) {
  if (board === 'xp') return <span className="font-mono text-sm text-neon-400">{(player.value ?? 0).toLocaleString()} XP</span>;
  const rating = player.value ?? player.stats.rating;
  const tier = tierFor(rating);
  return (
    <span className="text-right">
      <span className="block font-mono text-sm font-semibold text-white">{rating}</span>
      <span className={clsx('block text-[10px] font-semibold uppercase tracking-wider', tier.color)}>{tier.name}</span>
    </span>
  );
}

function Podium({ players, board }) {
  return (
    <div className="flex items-end justify-center gap-3 pb-2 pt-4 sm:gap-6">
      {PODIUM_ORDER.map((i) => {
        const p = players[i];
        if (!p) return <div key={i} className="w-24" />;
        const first = i === 0;
        return (
          <Link key={p.id} to={`/u/${p.username || p.id}`} className="group flex w-24 flex-col items-center sm:w-28">
            <span className={clsx('rounded-full ring-4 transition group-hover:scale-105', MEDAL[i], first && 'shadow-[0_0_32px_-4px_rgba(227,199,122,0.6)]')}>
              <Avatar name={p.name} src={p.avatar} size={first ? 76 : 60} />
            </span>
            <div className={clsx('mt-3 w-full rounded-2xl bg-white/[0.06] px-2 text-center', first ? 'py-4' : 'py-3')}>
              <p className={clsx('truncate text-sm font-semibold', first ? 'text-gold' : 'text-white')}>{p.name}</p>
              <p className="mt-0.5 font-mono text-xs text-ink-300">{board === 'xp' ? `${(p.value ?? 0).toLocaleString()} XP` : p.value ?? p.stats.rating}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/** Rankings list for the board chosen on the Leaderboard page (?board=rating|xp), with scope and period filters. */
export default function Ranking() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const board = params.get('board') === 'xp' ? 'xp' : 'rating';
  const scope = SCOPES.some(([k]) => k === params.get('scope')) ? params.get('scope') : 'global';
  const period = params.get('period') === 'all' ? 'all' : 'week';
  const college = params.get('college');
  const set = (patch) => setParams((prev) => {
    const next = new URLSearchParams(prev);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    return next;
  }, { replace: true });

  const view = `${board}|${scope}|${period}|${college || ''}|${user?.id || ''}`;
  const { data: raw, error, reload } = usePolling(
    () => {
      if (scope === 'colleges') return api.users.colleges().then((r) => ({ view, colleges: r.colleges })).catch(() => ({ view, colleges: [] }));
      return api.users
        .leaderboard(50, { board, scope, period: board === 'xp' ? period : undefined, college: college || undefined })
        .then((r) => ({ ...r, view }));
    },
    60000,
    [view]
  );
  const data = raw?.view === view ? raw : null;
  const [showAll, setShowAll] = useState(false);
  useEffect(() => setShowAll(false), [view]);
  const players = data?.players || [];
  const legacy = data && !data.board && scope !== 'colleges'; // the server has not been updated yet
  const inList = data?.me && players.some((p) => p.id === user?.id);

  let body;
  if (!data && error) {
    body = (
      <p className="py-10 text-center text-sm text-ink-400">
        Could not load rankings.{' '}
        <button className="text-brand-400 hover:underline" onClick={reload}>
          Try again
        </button>
      </p>
    );
  } else if (!data) {
    body = (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6 text-ink-500" />
      </div>
    );
  } else if (scope === 'colleges') {
    body = data.colleges.length ? (
      <ol className="space-y-1">
        {data.colleges.map((c, i) => (
          <li key={c.name}>
            <button onClick={() => set({ scope: 'college', college: c.name })} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.04]">
              <span className="w-6 font-mono text-sm text-ink-500">{i + 1}</span>
              <GraduationCap className="h-4 w-4 shrink-0 text-ink-500" />
              <span className="min-w-0 flex-1 truncate text-sm text-ink-200">{c.name}</span>
              <span className="text-xs text-ink-500">{c.players} players</span>
              <span className="w-12 text-right font-mono text-sm text-white">{c.score}</span>
            </button>
          </li>
        ))}
      </ol>
    ) : (
      <p className="py-10 text-center text-sm text-ink-400">Add your college on your profile to put it on the board.</p>
    );
  } else if (data.needsLogin) {
    body = (
      <p className="py-10 text-center text-sm text-ink-400">
        <Link to="/login" state={{ from: '/tournaments' }} className="text-brand-400 hover:underline">
          Sign in
        </Link>{' '}
        to compare with your friends.
      </p>
    );
  } else if (!players.length) {
    body = (
      <p className="py-10 text-center text-sm text-ink-400">
        {board === 'xp' && period === 'week'
          ? 'No XP earned yet this week. Solve a problem or finish a battle to take the top spot.'
          : scope === 'college' && !data.college
            ? 'Add your college on your profile to see your college board.'
            : 'Nobody here yet.'}
      </p>
    );
  } else {
    const rest = players.slice(3, showAll ? players.length : 10);
    body = (
      <>
        <Podium players={players} board={legacy ? 'rating' : board} />
        {rest.length > 0 && (
          <ol className="mt-4 space-y-0.5">
            {rest.map((p, i) => (
              <li key={p.id}>
                <Link to={`/u/${p.username || p.id}`} className={clsx('flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-white/[0.04]', p.id === user?.id && 'bg-brand-500/10')}>
                  <span className="w-6 font-mono text-sm text-ink-500">{i + 4}</span>
                  <Avatar name={p.name} src={p.avatar} size={30} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink-100">{p.name}</span>
                    {p.college && <span className="block truncate text-xs text-ink-500">{p.college}</span>}
                  </span>
                  <Value board={legacy ? 'rating' : board} player={p} />
                </Link>
              </li>
            ))}
          </ol>
        )}
        {players.length > 10 && (
          <button className="mt-2 px-3 text-sm text-brand-400 hover:underline" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Show top 10' : `Show all ${players.length}`}
          </button>
        )}
        {data.me && !inList && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-brand-500/10 px-3 py-2.5 text-sm">
            <span className="text-ink-300">You</span>
            <span className="font-mono text-white">
              #{data.me.rank}
              <span className="ml-3 text-ink-400">{board === 'xp' ? `${(data.me.value ?? 0).toLocaleString()} XP` : data.me.value}</span>
            </span>
          </div>
        )}
      </>
    );
  }

  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <Tabs
            size="sm"
            value={scope}
            options={board === 'xp' ? SCOPES.filter(([k]) => k !== 'colleges') : SCOPES}
            onChange={(s) => set({ scope: s === 'global' ? null : s, college: null })}
          />
        </div>
        {board === 'xp' && <Tabs size="sm" value={period} options={PERIODS} onChange={(p) => set({ period: p === 'week' ? null : p })} />}
      </div>
      {scope === 'college' && data?.college && <p className="mt-3 text-xs text-ink-500">{data.college}</p>}
      <div className="mt-2">{body}</div>
    </section>
  );
}
