import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRight, Crown, Link2, Radio, Swords, Timer, Trophy, UserPlus } from 'lucide-react';
import { api } from '../lib/api';
import { tierFor } from '../lib/rank';
import { useAuth } from '../context/AuthContext';
import heroCoder from '../assets/hero-coder.png';
import usePolling from '../hooks/usePolling';
import MatchCard from '../components/match/MatchCard';
import JoinByCode from '../components/match/JoinByCode';
import ScoringRules from '../components/match/ScoringRules';
import { Avatar, EmptyState, Spinner, VerifiedBadge } from '../components/ui';

function Stat({ value, label }) {
  return (
    <div>
      <p className="font-display text-2xl font-bold text-white">{value ?? '—'}</p>
      <p className="text-xs uppercase tracking-wider text-ink-400">{label}</p>
    </div>
  );
}

function LinkLeetCodeBanner() {
  return (
    <div className="card flex flex-col items-start justify-between gap-4 border-medium/30 bg-medium/5 p-5 sm:flex-row sm:items-center">
      <div className="flex gap-3">
        <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-medium" />
        <div>
          <p className="font-semibold text-white">Link your LeetCode account to start competing</p>
          <p className="text-sm text-ink-400">We read your accepted submissions to score matches automatically — no copy-pasting.</p>
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
  { icon: Swords, title: 'Create or join', body: 'Pick difficulty mix, topics and duration. Share the invite link.' },
  { icon: Timer, title: 'Race the clock', body: 'Everyone gets the same shuffled set. Read it here, submit on LeetCode.' },
  { icon: Trophy, title: 'Climb the ranks', body: 'Live scoreboard, first-solve bonuses and Elo rating after every battle.' },
];

export default function CompeteHome() {
  const { user } = useAuth();
  useEffect(() => {
    document.title = 'League of Coders — Real-time coding battles';
  }, []);

  const stats = usePolling(() => api.matches.stats(), 30000);
  const open = usePolling(() => api.matches.open().then((r) => r.matches), 8000);
  const recent = usePolling(() => api.matches.recent(6).then((r) => r.matches), 60000);
  const top = usePolling(() => api.users.leaderboard(5).then((r) => r.players), 60000);
  const mine = usePolling(() => (user ? api.matches.mine().then((r) => r.matches) : Promise.resolve([])), 15000, [user?.id]);

  const mineCodes = new Set((mine.data || []).map((m) => m.code));
  const others = (open.data || []).filter((m) => !mineCodes.has(m.code));
  const live = others.filter((m) => m.status !== 'lobby');
  const lobbies = others.filter((m) => m.status === 'lobby');

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <span className="chip border-brand-500/40 bg-brand-500/10 text-brand-400">
            <Radio className="h-3 w-3" /> {stats.data?.live ? `${stats.data.live} battle(s) live right now` : 'Real-time coding battles'}
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight text-white sm:text-6xl">
            Code. Compete. <span className="gradient-text">Conquer.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-300">
            Spin up a lobby, invite your friends with a link, and race through the same set of LeetCode problems. Every
            accepted submission is verified and scored live.
          </p>
          <div className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <Link to={user ? '/new' : '/login'} state={user ? undefined : { from: '/new' }} className="btn-primary px-6 py-3 text-base">
              <Swords className="h-5 w-5" /> Start a battle
            </Link>
            <div className="flex-1">
              <JoinByCode />
            </div>
          </div>
          <div className="mt-10 flex gap-10">
            <Stat value={stats.data?.players} label="Players" />
            <Stat value={stats.data?.matches} label="Battles fought" />
            <Stat value={stats.data?.live} label="Live now" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-medium/30 bg-gradient-to-b from-[#221c4a] to-ink-900 p-3 shadow-[0_0_48px_-16px_rgba(251,191,36,0.45)]">
            <p className="px-2 pt-1 text-center font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-medium">
              Ranked queue
            </p>
            <img src={heroCoder} alt="A coder at a desk, ready to queue" className="mx-auto max-h-80 w-full object-contain" />
          </div>
          <div className="card p-5">
            <p className="section-title mb-4">How scoring works</p>
            <ScoringRules compact />
          </div>
        </div>
      </section>

      {user && !user.leetcode && <LinkLeetCodeBanner />}

      {mine.data?.length > 0 && (
        <section>
          <h2 className="section-title mb-4">Your active battles</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mine.data.map((m) => (
              <MatchCard key={m.code} match={m} joined />
            ))}
          </div>
        </section>
      )}

      {/* Lobbies */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="section-title">Open lobbies</h2>
            <p className="text-sm text-ink-400">Public battles waiting for challengers</p>
          </div>
          {open.loading && <Spinner className="h-4 w-4 text-ink-500" />}
        </div>
        {lobbies.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lobbies.map((m) => (
              <MatchCard key={m.code} match={m} />
            ))}
          </div>
        ) : (
          !open.loading && (
            <EmptyState
              icon={UserPlus}
              title="No open lobbies right now"
              action={
                <Link to={user ? '/new' : '/login'} className="btn-primary btn-sm">
                  Host the first one
                </Link>
              }
            >
              Create a public lobby and it will show up here for anyone to join — or make it private and share the invite link.
            </EmptyState>
          )
        )}
      </section>

      {live.length > 0 && (
        <section>
          <h2 className="section-title mb-4">Live now — spectate</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((m) => (
              <MatchCard key={m.code} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section>
        <h2 className="section-title mb-4">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="card p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-neon-500/10 text-brand-400">
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

      <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Top players</h2>
            <Link to="/leaderboard" className="text-sm text-brand-400 hover:underline">
              Full leaderboard
            </Link>
          </div>
          {top.data?.length ? (
            <ol className="space-y-2">
              {top.data.map((p, i) => {
                const tier = tierFor(p.stats.rating);
                return (
                <li key={p.id}>
                  <Link to={`/u/${p.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-ink-800">
                    <span className="w-5 text-center font-mono text-sm text-ink-400">{i === 0 ? <Crown className="h-4 w-4 text-medium" /> : i + 1}</span>
                    <Avatar name={p.name} src={p.avatar} size={30} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-200">
                      {p.name} <VerifiedBadge verified={p.leetcode?.verified} />
                    </span>
                    <span className="text-right">
                      <span className={clsx('block font-display text-[11px] font-semibold uppercase tracking-wider', tier.color)}>{tier.name}</span>
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
        <div>
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
        </div>
      </section>
    </div>
  );
}
