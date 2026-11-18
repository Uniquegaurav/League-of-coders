import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { Gauge, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { tierFor } from '../lib/rank';
import usePolling from '../hooks/usePolling';
import { useAuth } from '../context/AuthContext';
import Ranking from '../components/tournaments/Ranking';
import { InfoTip } from '../components/ui';

// The two boards, described in a line each so players know what moves them.
const BOARDS = {
  rating: {
    icon: Gauge,
    title: 'Rating',
    line: 'Skill. Moves only in tournaments.',
    ring: 'ring-brand-500/60',
    glow: 'rgba(124,92,255,0.25)',
    iconTone: 'bg-brand-500/15 text-brand-300',
  },
  xp: {
    icon: Sparkles,
    title: 'XP',
    line: 'Effort. Earned from every solve and battle.',
    ring: 'ring-neon-400/60',
    glow: 'rgba(94,234,212,0.2)',
    iconTone: 'bg-neon-500/15 text-neon-400',
  },
};

function BoardPicker({ board, onPick }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2" role="tablist" aria-label="Leaderboard">
      {Object.entries(BOARDS).map(([key, b]) => {
        const Icon = b.icon;
        const active = board === key;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={active}
            onClick={() => onPick(key)}
            className={clsx('panel flex items-center gap-4 p-5 text-left transition', active ? `ring-2 ${b.ring}` : 'opacity-70 hover:opacity-100')}
            style={active ? { backgroundImage: `radial-gradient(ellipse at 0% 0%, ${b.glow}, transparent 70%)` } : undefined}
          >
            <span className={clsx('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', b.iconTone)}>
              <Icon className="h-6 w-6" />
            </span>
            <span>
              <span className="block font-display text-xl font-bold text-white">{b.title}</span>
              <span className="block text-sm text-ink-300">{b.line}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Where the signed-in player stands on each board.
function Standing({ user }) {
  const { data } = usePolling(
    () =>
      Promise.all([
        api.users.leaderboard(1, { board: 'rating' }),
        api.users.leaderboard(1, { board: 'xp', period: 'week' }),
        api.users.leaderboard(1, { board: 'xp', period: 'all' }),
      ]).then(([r, w, a]) => ({ rating: r.me, week: w.me, all: a.me })),
    60000,
    [user.id]
  );
  const tier = tierFor(user.stats.rating);
  const rows = [
    ['Rating', `${user.stats.rating}`, tier.name, data?.rating?.rank],
    ['XP this week', (user.practice?.weekXp ?? 0).toLocaleString(), 'Resets Monday', data?.week?.rank],
    ['XP all time', (user.practice?.xp ?? 0).toLocaleString(), `Level ${user.practice?.level ?? 1}`, data?.all?.rank],
  ];
  return (
    <section className="panel p-5">
      <h2 className="section-title mb-4">Your standing</h2>
      <ul className="space-y-3">
        {rows.map(([label, value, sub, rank]) => (
          <li key={label} className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-ink-500">{label}</p>
              <p className="font-mono text-lg font-semibold text-white">
                {value} <span className="font-sans text-xs font-normal text-ink-400">{sub}</span>
              </p>
            </div>
            <span className="font-mono text-sm text-ink-300">{rank ? `#${rank}` : '–'}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Rules({ board }) {
  const rating = [
    'Changes only in tournaments: battle hour, Sunday Cup, planned events',
    'Multiplayer Elo: beating stronger players gains more',
    'Your first 10 tournaments move it faster',
    'Battles you host with friends never change it',
  ];
  const xp = [
    'Verified solves in battles and solo tests: Easy 15, Medium 30, Hard 60',
    'Finish 1st +40, top half +15. Tournaments give 1.5x',
    'Practice ticks 10 / 20 / 40, up to 150 a day',
    '+10 a day once your streak reaches 3 days',
  ];
  return (
    <section className="panel p-5">
      <h2 className="section-title mb-3">How {board === 'xp' ? 'XP' : 'rating'} works</h2>
      <ul className="space-y-2 text-sm text-ink-300">
        {(board === 'xp' ? xp : rating).map((line) => (
          <li key={line} className="flex gap-2">
            <span className={clsx('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', board === 'xp' ? 'bg-neon-400' : 'bg-brand-400')} />
            {line}
          </li>
        ))}
      </ul>
      {board === 'rating' && (
        <Link to="/tournaments" className="mt-4 inline-block text-sm text-brand-400 hover:underline">
          See upcoming tournaments
        </Link>
      )}
    </section>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const board = params.get('board') === 'xp' ? 'xp' : 'rating';

  useEffect(() => {
    document.title = 'Leaderboard · League of Coders';
  }, []);

  const pick = (key) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (key === 'rating') next.delete('board');
      else next.set('board', key);
      if (key === 'xp' && next.get('scope') === 'colleges') next.delete('scope');
      next.delete('period');
      return next;
    });

  return (
    <div className="space-y-8 pb-6">
      <header className="pt-6 sm:pt-12">
        <h1 className="flex items-center gap-2 font-display text-4xl font-bold tracking-tight text-white drop-shadow sm:text-5xl">
          Leaderboard
          <InfoTip label="About the leaderboard">
            Two boards. Rating is skill and only moves in tournaments. XP is effort and grows with every solve, battle and practice day. Filter either one by
            friends or college.
          </InfoTip>
        </h1>
        <p className="mt-2 text-lg text-ink-200">Who is on top, by skill and by effort.</p>
      </header>

      <BoardPicker board={board} onPick={pick} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Ranking />
        <aside className="space-y-5">
          {user && <Standing user={user} />}
          <Rules board={board} />
        </aside>
      </div>
    </div>
  );
}
