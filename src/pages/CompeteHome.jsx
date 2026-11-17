import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRight, Clock, Link2, Swords, Timer, Trophy, UserPlus } from 'lucide-react';
import { api } from '../lib/api';
import { tierFor } from '../lib/rank';
import { streakOf } from '../lib/progression';
import { timeAgo } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import heroCoder from '../assets/hero-coder.png';
import usePolling from '../hooks/usePolling';
import MatchCard from '../components/match/MatchCard';
import JoinByCode from '../components/match/JoinByCode';
import ScoringRules from '../components/match/ScoringRules';
import { FriendsPanel } from '../components/social/FriendBits';
import { Avatar, DifficultyBadge, EmptyState, Spinner, VerifiedBadge } from '../components/ui';

function LinkLeetCodeBanner() {
  return (
    <div className="card flex flex-col items-start justify-between gap-4 border-medium/30 bg-medium/5 p-5 sm:flex-row sm:items-center">
      <div className="flex gap-3">
        <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-medium" />
        <div>
          <p className="font-semibold text-white">Link your LeetCode account to start competing</p>
          <p className="text-sm text-ink-400">We read your accepted submissions and score the match from those. Nothing to paste in.</p>
        </div>
      </div>
      <Link to="/u/me" className="btn-secondary shrink-0">
        Link LeetCode <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

const STEPS = [
  { icon: Link2, title: 'Link LeetCode', body: 'Connect your username once. Solves are read from your accepted submissions.' },
  { icon: Swords, title: 'Create or join', body: 'Pick the difficulty mix, topics, and duration, then share the invite link.' },
  { icon: Timer, title: 'Race the clock', body: 'Everyone gets the same shuffled set. Read it here, submit on LeetCode.' },
  { icon: Trophy, title: 'Climb the ranks', body: 'Live scoreboard, first-solve bonuses, and Elo after every rated battle.' },
];

const authed = (user, to) => (user ? { to } : { to: '/login', state: { from: to } });

function StatsCard({ user }) {
  const s = user.stats;
  const tier = tierFor(s.rating);
  const { streak } = streakOf(user);
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} src={user.avatar} size={44} />
        <div className="min-w-0">
          <Link to={`/u/${user.id}`} className="block truncate font-semibold text-white hover:underline">
            {user.name}
          </Link>
          <p className="text-sm">
            <span className={tier.color}>{tier.name}</span>
            <span className="font-mono text-ink-200"> {s.rating}</span>
          </p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          ['Battles', s.matches],
          ['Wins', s.wins],
          ['Win rate', `${s.matches ? Math.round((s.wins / s.matches) * 100) : 0}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-ink-800 bg-ink-950/40 py-2.5">
            <dd className="font-display text-lg font-bold text-white">{value}</dd>
            <dt className="text-[11px] uppercase tracking-wider text-ink-500">{label}</dt>
          </div>
        ))}
      </dl>
      {streak > 0 && (
        <p className="mt-3 text-sm text-ink-400">
          Practice streak: <span className="font-semibold text-ink-200">{streak} day{streak > 1 ? 's' : ''}</span>
        </p>
      )}
    </div>
  );
}

function DailyProblemCard({ daily }) {
  if (!daily?.problem) return null;
  const p = daily.problem;
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-title">Problem of the day</h2>
        {daily.done && <span className="text-xs font-semibold text-easy">Done</span>}
      </div>
      <Link to={`/problems/${p.slug}`} className="block font-medium text-ink-200 hover:text-white">
        {p.frontendId && <span className="text-ink-500">{p.frontendId}. </span>}
        {p.title}
      </Link>
      <div className="mt-2 flex items-center gap-2">
        <DifficultyBadge difficulty={p.difficulty} />
        <span className="truncate text-xs text-ink-500">{p.tags?.slice(0, 2).join(' · ')}</span>
      </div>
      <Link to="/practice" className="mt-3 inline-flex items-center gap-1 text-sm text-brand-400 hover:underline">
        Open in Practice <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function TopPlayers({ players }) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="section-title">Top players</h2>
        <Link to="/leaderboard" className="text-sm text-brand-400 hover:underline">
          Full leaderboard
        </Link>
      </div>
      {players?.length ? (
        <ol className="space-y-1">
          {players.map((p, i) => {
            const tier = tierFor(p.stats.rating);
            return (
              <li key={p.id}>
                <Link to={`/u/${p.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-ink-800">
                  <span className="w-5 text-center font-mono text-sm text-ink-400">{i + 1}</span>
                  <Avatar name={p.name} src={p.avatar} size={28} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-200">
                    {p.name} <VerifiedBadge verified={p.leetcode?.verified} />
                  </span>
                  <span className="text-right">
                    <span className={clsx('block text-[11px] font-semibold uppercase tracking-wider', tier.color)}>{tier.name}</span>
                    <span className="font-mono text-sm font-bold text-brand-400">{p.stats.rating}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-ink-400">Play a rated battle (2+ players) to appear here.</p>
      )}
    </div>
  );
}

function FriendActivity({ user }) {
  const feed = usePolling(() => (user ? api.friends.activity().then((r) => r.activity) : Promise.resolve([])), 60000, [user?.id]);
  if (!user || !feed.data?.length) return null;
  return (
    <div className="card p-5">
      <h2 className="section-title mb-3">Friend activity</h2>
      <ul className="space-y-3">
        {feed.data.slice(0, 5).map((a, i) => (
          <li key={`${a.match.code}-${a.user.id}-${i}`} className="text-sm">
            <p className="text-ink-300">
              <Link to={`/u/${a.user.id}`} className="font-medium text-white hover:underline">
                {a.user.name}
              </Link>{' '}
              {a.result.rank === 1 && a.result.of > 1 ? 'won' : `placed ${a.result.rank} of ${a.result.of} in`}{' '}
              <Link to={`/m/${a.match.code}`} className="text-ink-200 hover:underline">
                {a.match.name}
              </Link>
            </p>
            <p className="text-xs text-ink-500">
              {a.result.score} pts
              {a.result.ratingDelta ? (
                <span className={a.result.ratingDelta > 0 ? 'text-easy' : 'text-hard'}>
                  {' '}
                  · {a.result.ratingDelta > 0 ? '+' : ''}
                  {a.result.ratingDelta}
                </span>
              ) : null}{' '}
              · {timeAgo(a.at)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CompeteHome() {
  const { user } = useAuth();
  useEffect(() => {
    document.title = 'League of Coders';
  }, []);

  const open = usePolling(() => api.matches.open().then((r) => r.matches), 8000);
  const recent = usePolling(() => api.matches.recent(6).then((r) => r.matches), 60000);
  const top = usePolling(() => api.users.leaderboard(5).then((r) => r.players), 60000);
  const daily = usePolling(() => api.problems.daily().catch(() => null), 300000, [user?.id]);
  const mine = usePolling(() => (user ? api.matches.mine().then((r) => r.matches) : Promise.resolve([])), 15000, [user?.id]);

  const mineCodes = new Set((mine.data || []).map((m) => m.code));
  const others = (open.data || []).filter((m) => !mineCodes.has(m.code));
  const live = others.filter((m) => m.status !== 'lobby');
  const lobbies = others.filter((m) => m.status === 'lobby');
  const myLobby = (mine.data || []).find((m) => m.status === 'lobby' && !m.settings.solo);

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 items-center overflow-hidden rounded-3xl border border-ink-700 bg-ink-900 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]">
        <div className="px-6 py-10 sm:px-10 sm:py-14">
          <h1 className="max-w-xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl">Code. Compete.</h1>
          <p className="mt-4 max-w-xl text-lg text-ink-300">
            Open a lobby, send the invite link, and race the same LeetCode problems. Scores come from accepted submissions.
          </p>
          {user && (
            <p className="mt-4 text-sm text-ink-300">
              You are <span className={tierFor(user.stats.rating).color}>{tierFor(user.stats.rating).name}</span>
              <span className="font-mono text-ink-200"> {user.stats.rating}</span>
              <span className="text-ink-500"> · {user.stats.wins} wins in {user.stats.matches} rated battles</span>
            </p>
          )}
          <div className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
            <Link {...authed(user, '/new?mode=battle')} className="btn-primary px-6 py-3 text-base">
              <Swords className="h-5 w-5" /> Start a battle
            </Link>
            <div className="flex-1">
              <JoinByCode />
            </div>
          </div>
        </div>
        <img src={heroCoder} alt="" className="hero-art mx-auto h-auto w-full min-w-0 max-w-full object-contain px-6 pb-6 lg:px-4 lg:py-6 lg:pr-8" />
      </section>

      {user && !user.leetcode && <LinkLeetCodeBanner />}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-10">
          {mine.data?.length > 0 && (
            <section>
              <h2 className="section-title mb-4">Your active battles</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {mine.data.map((m) => (
                  <MatchCard key={m.code} match={m} joined />
                ))}
              </div>
            </section>
          )}

          <section className="card flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <div className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-medium/10 text-medium">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-white">Solo timed test</h2>
                <p className="mt-1 max-w-xl text-sm text-ink-400">
                  Pick how many easy, medium, and hard problems you want. The clock is set from that mix: 10, 20, and 35 minutes. It is private and does not change your rating.
                </p>
              </div>
            </div>
            <Link {...authed(user, '/new?mode=solo')} className="btn-secondary shrink-0">
              Start a solo test <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          <section className="overflow-hidden rounded-2xl border border-ink-700">
            <div className="flex items-center justify-between border-b border-ink-700 bg-ink-900 px-5 py-3">
              <div>
                <h2 className="section-title">Lobby</h2>
                <p className="text-sm text-ink-400">Public battles waiting for someone to join</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-ink-400">
                {live.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-hard">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-hard" /> {live.length} live
                  </span>
                )}
                {open.loading && <Spinner className="h-4 w-4 text-ink-500" />}
              </div>
            </div>
            {lobbies.length ? (
              <div className="grid gap-4 p-4 sm:grid-cols-2">
                {lobbies.map((m) => (
                  <div key={m.code} className="room-card">
                    <MatchCard match={m} />
                  </div>
                ))}
              </div>
            ) : (
              !open.loading && (
                <EmptyState
                  icon={UserPlus}
                  title="No open lobbies right now"
                  action={
                    <Link {...authed(user, '/new?mode=battle')} className="btn-primary btn-sm">
                      Host the first one
                    </Link>
                  }
                >
                  Create a public lobby and it shows up here. Private rooms stay off this list. Share the invite link instead.
                </EmptyState>
              )
            )}
          </section>

          {live.length > 0 && (
            <section>
              <h2 className="section-title mb-4">Live now</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {live.map((m) => (
                  <MatchCard key={m.code} match={m} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="section-title mb-4">Recent results</h2>
            {recent.data?.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {recent.data.map((m) => (
                  <MatchCard key={m.code} match={m} />
                ))}
              </div>
            ) : (
              <EmptyState icon={Trophy} title="No finished battles yet">
                Results of public battles will appear here.
              </EmptyState>
            )}
          </section>

          <section>
            <h2 className="section-title mb-4">How it works</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <div key={title} className="card p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-xs text-ink-500">0{i + 1}</span>
                  </div>
                  <p className="mt-4 font-semibold text-white">{title}</p>
                  <p className="mt-1 text-sm text-ink-400">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="section-title mb-4">How scoring works</h2>
            <ScoringRules />
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {user && <StatsCard user={user} />}
          <DailyProblemCard daily={daily.data} />
          <FriendsPanel lobbyCode={myLobby?.code} />
          <TopPlayers players={top.data} />
          <FriendActivity user={user} />
        </aside>
      </div>
    </div>
  );
}
