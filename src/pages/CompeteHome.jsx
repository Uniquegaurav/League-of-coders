import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Crown,
  Flame,
  Gift,
  Link2,
  Radio,
  Sparkles,
  Swords,
  Timer,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import { api } from '../lib/api';
import { tierFor, tierProgress } from '../lib/rank';
import { practiceOf, titleFor, XP } from '../lib/progression';
import { timeAgo } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import heroCoder from '../assets/hero-coder.png';
import usePolling from '../hooks/usePolling';
import MatchCard from '../components/match/MatchCard';
import JoinByCode from '../components/match/JoinByCode';
import ScoringRules from '../components/match/ScoringRules';
import RankEmblem from '../components/game/RankEmblem';
import { BattleArt, PracticeArt, QuestArt, SoloArt } from '../components/game/ModeArt';
import { CountUp, XpBar } from '../components/game/fx';
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

function SectionHead({ icon: Icon, title, sub, right, accent = 'text-brand-400' }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-white">
          {Icon && <Icon className={clsx('h-5 w-5', accent)} />} {title}
        </h2>
        {sub && <p className="text-sm text-ink-400">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* ---------------- Hero ---------------- */

function Hero({ user, stats }) {
  return (
    <section className="relative grid grid-cols-1 items-center overflow-hidden rounded-3xl border border-ink-700 bg-ink-900/80 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/3 h-48 w-48 rounded-full bg-neon-500/10 blur-3xl" />
      <div className="relative px-6 py-10 sm:px-10 sm:py-14">
        <span className="inline-flex animate-rise-in items-center gap-2 rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-400">
          <Sparkles className="h-3.5 w-3.5" /> Ranked season is live
        </span>
        <h1 className="mt-4 max-w-xl animate-rise-in font-display text-4xl font-black leading-tight text-white [animation-delay:80ms] sm:text-6xl">
          Code. <span className="gradient-text">Compete.</span>
          <br className="hidden sm:block" /> Conquer.
        </h1>
        <p className="mt-4 max-w-xl animate-rise-in text-lg text-ink-300 [animation-delay:160ms]">
          Open a lobby, send the invite link, and race the same LeetCode problems. Scores come from accepted submissions.
        </p>
        <div className="mt-8 flex max-w-xl animate-rise-in flex-col gap-3 [animation-delay:240ms] sm:flex-row sm:items-center">
          <Link {...authed(user, '/new?mode=battle')} className="btn-play px-6 py-3 text-base">
            <Swords className="h-5 w-5" /> Start a battle
          </Link>
          <div className="flex-1">
            <JoinByCode />
          </div>
        </div>
        <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
          {[
            ['Players', stats?.players, Users, 'text-brand-400'],
            ['Battles fought', stats?.matches, Swords, 'text-medium'],
            ['Live now', stats?.live, Radio, 'text-hard'],
          ].map(([label, n, Icon, color]) => (
            <div key={label} className="rounded-xl border border-ink-700/70 bg-ink-950/50 px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                <Icon className={clsx('h-3 w-3', color, label === 'Live now' && n > 0 && 'animate-pulse')} /> {label}
              </p>
              <p className="stat-num text-xl">{n == null ? '—' : <CountUp value={n} />}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="relative flex items-center justify-center px-6 pb-6 lg:px-4 lg:py-6 lg:pr-8">
        <div className="pointer-events-none absolute h-[80%] w-[80%] animate-spin-slow rounded-full border border-dashed border-brand-500/30" />
        <div className="pointer-events-none absolute h-[62%] w-[62%] animate-spin-slow rounded-full border border-neon-400/20 [animation-direction:reverse]" />
        <img src={heroCoder} alt="" className="hero-art relative mx-auto h-auto w-full min-w-0 max-w-full object-contain drop-shadow-[0_20px_40px_rgba(124,92,255,.35)]" />
        <span className="absolute left-6 top-10 hidden animate-float-slow rounded-lg border border-easy/40 bg-ink-950/80 px-2 py-1 font-mono text-xs text-easy shadow-lg sm:block">
          Accepted ✓
        </span>
        <span className="absolute bottom-12 right-8 hidden animate-float-slow rounded-lg border border-medium/40 bg-ink-950/80 px-2 py-1 font-mono text-xs text-medium shadow-lg [animation-delay:-2s] sm:block">
          +250 pts · first solve
        </span>
      </div>
    </section>
  );
}

/* ---------------- Winners ticker ---------------- */

function WinnersTicker({ matches }) {
  const items = (matches || []).filter((m) => m.winner);
  if (!items.length) return null;
  const loop = [...items, ...items];
  return (
    <div className="relative overflow-hidden rounded-xl border border-ink-800 bg-ink-950/60 py-2 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="flex w-max animate-ticker gap-8 hover:[animation-play-state:paused]">
        {loop.map((m, i) => (
          <Link key={`${m.code}-${i}`} to={`/m/${m.code}`} className="flex shrink-0 items-center gap-2 text-xs text-ink-400 hover:text-white">
            <Trophy className="h-3.5 w-3.5 text-medium" />
            <span className="font-semibold text-ink-200">{m.winner.name}</span> won
            <span className="text-ink-300">{m.name}</span>
            <span className="font-mono text-medium">{m.winner.score} pts</span>
            <span className="text-ink-600">·</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Game modes ---------------- */

function GameModes({ user, daily }) {
  const modes = [
    {
      key: 'battle',
      title: 'Ranked Battle',
      tag: 'PvP · up to 8',
      body: 'Same problems, live scoreboard, Elo on the line.',
      art: BattleArt,
      link: authed(user, '/new?mode=battle'),
      grad: 'from-brand-600/40 via-fuchsia-600/20 to-transparent',
      ring: 'hover:border-brand-500/70',
      cta: 'Queue up',
    },
    {
      key: 'solo',
      title: 'Solo Trial',
      tag: 'Timed · private',
      body: 'Pick your mix, beat the clock. No rating risk.',
      art: SoloArt,
      link: authed(user, '/new?mode=solo'),
      grad: 'from-amber-500/30 via-orange-500/10 to-transparent',
      ring: 'hover:border-medium/70',
      cta: 'Start trial',
    },
    {
      key: 'practice',
      title: 'Training Grounds',
      tag: 'Earn XP · streaks',
      body: 'Grind the problem bank, level up, master topics.',
      art: PracticeArt,
      link: { to: '/practice' },
      grad: 'from-emerald-500/30 via-teal-500/10 to-transparent',
      ring: 'hover:border-easy/70',
      cta: 'Train',
    },
    {
      key: 'daily',
      title: 'Daily Quest',
      tag: daily?.done ? 'Completed today' : '2× XP reward',
      body: daily?.problem ? daily.problem.title : 'A new problem every day. Double XP.',
      art: QuestArt,
      link: { to: daily?.problem ? `/problems/${daily.problem.slug}` : '/practice' },
      grad: 'from-fuchsia-500/30 via-purple-500/10 to-transparent',
      ring: 'hover:border-fuchsia-400/70',
      cta: daily?.done ? 'View' : 'Claim',
    },
  ];
  return (
    <section>
      <SectionHead icon={Swords} title="Choose your mode" sub="Every mode feeds your profile: rating, XP, streaks and badges." />
      <div className="grid gap-4 sm:grid-cols-2">
        {modes.map((m, i) => (
          <Link
            key={m.key}
            {...m.link}
            className={clsx('shine lift group relative flex min-h-[176px] animate-rise-in flex-col overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/80 p-5', m.ring)}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className={clsx('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80 transition group-hover:opacity-100', m.grad)} />
            <m.art className="pointer-events-none absolute -right-2 top-1/2 h-36 w-36 -translate-y-1/2 transition duration-500 group-hover:scale-110" />
            <div className="relative mt-auto max-w-[62%]">
              <span className="rounded-full bg-ink-950/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-ink-300">{m.tag}</span>
              <p className="mt-2 font-display text-xl font-black text-white">{m.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-ink-300">{m.body}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-white">
                {m.cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Sidebar: player card ---------------- */

function PlayerCard({ user }) {
  if (!user) {
    return (
      <div className="hud-panel neon-ring p-5 text-center">
        <RankEmblem rating={1200} size={84} className="mx-auto" />
        <p className="mt-3 font-display text-lg font-bold text-white">Create your player</p>
        <p className="mt-1 text-sm text-ink-400">Start at Gold 1200, earn XP, unlock badges and climb the ladder.</p>
        <Link to="/login" state={{ from: '/' }} className="btn-play mt-4 w-full">
          Sign in to play
        </Link>
      </div>
    );
  }
  const s = user.stats;
  const tier = tierFor(s.rating);
  const promo = tierProgress(s.rating);
  const lvl = practiceOf(user);
  return (
    <div className="hud-panel neon-ring p-5">
      <div className="flex items-center gap-4">
        <RankEmblem tier={tier} size={76} />
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold text-white">{user.name}</p>
          <p className={clsx('font-display text-sm font-bold uppercase tracking-wider', tier.color)}>{tier.name}</p>
          <p className="stat-num text-2xl">
            <CountUp value={s.rating} />
          </p>
        </div>
      </div>
      {promo.next && (
        <div className="mt-4">
          <p className="mb-1 flex justify-between text-[11px] text-ink-400">
            <span>Promotion to {promo.next.name}</span>
            <span className="font-mono">{promo.toGo} to go</span>
          </p>
          <div className="xp-track h-1.5">
            <div className="h-full rounded-full bg-gradient-to-r from-medium to-orange-400 transition-[width] duration-700" style={{ width: `${promo.pct}%` }} />
          </div>
        </div>
      )}
      <div className="mt-4 rounded-xl border border-ink-800 bg-ink-950/50 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-300">
            <span className="font-display text-sm font-bold text-white">Lv {lvl.level}</span> · {titleFor(lvl.level)}
          </p>
          {lvl.streak > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-400">
              <Flame className="h-4 w-4 animate-flicker" /> {lvl.streak} day streak
            </span>
          ) : (
            <span className="text-[11px] text-ink-500">No streak yet</span>
          )}
        </div>
        <XpBar pct={lvl.pct} className="mt-2" />
        <p className="mt-1 text-right font-mono text-[10px] text-ink-500">
          {lvl.xp} / {lvl.nextLevelXp} XP
        </p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          ['Battles', s.matches],
          ['Wins', s.wins],
          ['Win %', s.matches ? Math.round((s.wins / s.matches) * 100) : 0],
        ].map(([l, v]) => (
          <div key={l} className="rounded-lg bg-ink-950/40 py-2">
            <p className="stat-num text-lg">
              <CountUp value={v} />
            </p>
            <p className="text-[10px] uppercase tracking-wider text-ink-500">{l}</p>
          </div>
        ))}
      </div>
      <Link to={`/u/${user.id}`} className="btn-ghost btn-sm mt-3 w-full">
        View profile & badges <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function DailyQuestCard({ daily }) {
  if (!daily?.problem) return null;
  const p = daily.problem;
  const reward = (XP[p.difficulty] || 10) * 2;
  return (
    <Link to={`/problems/${p.slug}`} className="hud-panel shine lift block p-5">
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-fuchsia-500/20 blur-2xl" />
      <p className="hud-title">
        <Gift className="h-4 w-4 text-fuchsia-300" /> Daily quest
      </p>
      <p className="mt-3 font-semibold text-white">{p.title}</p>
      <div className="mt-2 flex items-center gap-2">
        <DifficultyBadge difficulty={p.difficulty} />
        <span className="chip border-brand-500/40 text-brand-400">+{reward} XP</span>
      </div>
      {daily.done ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-easy">
          <CheckCircle2 className="h-4 w-4" /> Quest complete
        </p>
      ) : (
        <p className="mt-3 text-xs text-ink-400">Solve it, then mark it in Practice to claim double XP. Resets at 00:00 UTC.</p>
      )}
    </Link>
  );
}

function TopPlayers({ players }) {
  return (
    <div className="hud-panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="hud-title">
          <Crown className="h-4 w-4 text-medium" /> Top players
        </p>
        <Link to="/leaderboard" className="text-xs text-brand-400 hover:underline">
          Full ladder
        </Link>
      </div>
      {players?.length ? (
        <ol className="space-y-1">
          {players.map((p, i) => {
            const tier = tierFor(p.stats.rating);
            return (
              <li key={p.id}>
                <Link to={`/u/${p.id}`} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-ink-800">
                  <span className={clsx('w-5 text-center font-mono text-sm font-bold', ['text-medium', 'text-ink-200', 'text-amber-600'][i] || 'text-ink-500')}>{i + 1}</span>
                  <Avatar name={p.name} src={p.avatar} size={28} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-200">
                    {p.name} <VerifiedBadge verified={p.leetcode?.verified} />
                  </span>
                  <RankEmblem tier={tier} size={24} animated={false} />
                  <span className="w-11 text-right font-mono text-sm font-bold text-brand-400">{p.stats.rating}</span>
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
    <div className="hud-panel p-5">
      <p className="hud-title mb-3">
        <Activity className="h-4 w-4 text-easy" /> Squad activity
      </p>
      <ul className="space-y-3">
        {feed.data.slice(0, 6).map((a, i) => (
          <li key={`${a.match.code}-${a.user.id}-${i}`} className="flex gap-3 text-sm">
            <Avatar name={a.user.name} src={a.user.avatar} size={28} />
            <div className="min-w-0">
              <p className="text-ink-300">
                <Link to={`/u/${a.user.id}`} className="font-semibold text-white hover:underline">
                  {a.user.name}
                </Link>{' '}
                {a.result.rank === 1 && a.result.of > 1 ? <span className="text-medium">won</span> : <>placed #{a.result.rank} in</>}{' '}
                <Link to={`/m/${a.match.code}`} className="text-ink-200 hover:underline">
                  {a.match.name}
                </Link>
              </p>
              <p className="text-[11px] text-ink-500">
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
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Field manual (how it works + scoring) ---------------- */

function FieldManual() {
  const [tab, setTab] = useState('how');
  return (
    <section className="hud-panel p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-white">
          <BookOpen className="h-5 w-5 text-neon-400" /> Field manual
        </h2>
        <div className="inline-flex rounded-xl border border-ink-700 bg-ink-950/60 p-1">
          {[
            ['how', 'How it works'],
            ['score', 'How scoring works'],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={clsx('rounded-lg px-3 py-1.5 text-sm font-medium transition', tab === k ? 'bg-ink-700 text-white' : 'text-ink-400 hover:text-white')}>
              {l}
            </button>
          ))}
        </div>
      </div>
      {tab === 'how' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="relative animate-rise-in rounded-xl border border-ink-800 bg-ink-950/40 p-4" style={{ animationDelay: `${i * 60}ms` }}>
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
      ) : (
        <ScoringRules />
      )}
    </section>
  );
}

/* ---------------- Page ---------------- */

export default function CompeteHome() {
  const { user } = useAuth();
  useEffect(() => {
    document.title = 'League of Coders';
  }, []);

  const open = usePolling(() => api.matches.open().then((r) => r.matches), 8000);
  const recent = usePolling(() => api.matches.recent(6).then((r) => r.matches), 60000);
  const top = usePolling(() => api.users.leaderboard(5).then((r) => r.players), 60000);
  const stats = usePolling(() => api.matches.stats(), 30000);
  const daily = usePolling(() => api.problems.daily().catch(() => null), 300000, [user?.id]);
  const mine = usePolling(() => (user ? api.matches.mine().then((r) => r.matches) : Promise.resolve([])), 15000, [user?.id]);

  const mineCodes = new Set((mine.data || []).map((m) => m.code));
  const others = (open.data || []).filter((m) => !mineCodes.has(m.code));
  const live = others.filter((m) => m.status !== 'lobby');
  const lobbies = others.filter((m) => m.status === 'lobby');
  const myLobby = (mine.data || []).find((m) => m.status === 'lobby' && !m.settings.solo);

  return (
    <div className="space-y-8">
      <Hero user={user} stats={stats.data} />
      <WinnersTicker matches={recent.data} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-10">
          {user && !user.leetcode && <LinkLeetCodeBanner />}

          {mine.data?.length > 0 && (
            <section>
              <SectionHead icon={Flame} accent="text-orange-400" title="Your active battles" sub="Jump back in before the clock runs out." />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {mine.data.map((m) => (
                  <div key={m.code} className="lift rounded-2xl">
                    <MatchCard match={m} joined />
                  </div>
                ))}
              </div>
            </section>
          )}

          <GameModes user={user} daily={daily.data} />

          {/* Lobbies */}
          <section className="hud-panel">
            <div className="flex items-center justify-between border-b border-ink-700 px-5 py-3">
              <div>
                <h2 className="flex items-center gap-2 font-display text-lg font-bold text-white">
                  <UserPlus className="h-5 w-5 text-easy" /> Lobby
                </h2>
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
              <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {lobbies.map((m) => (
                  <div key={m.code} className="room-card">
                    <MatchCard match={m} />
                  </div>
                ))}
              </div>
            ) : (
              !open.loading && (
                <div className="p-4">
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
                </div>
              )
            )}
          </section>

          {live.length > 0 && (
            <section>
              <SectionHead icon={Radio} accent="text-hard" title="Live now" sub="Spectate battles in progress." />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {live.map((m) => (
                  <MatchCard key={m.code} match={m} />
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionHead icon={Trophy} accent="text-medium" title="Recent results" />
            {recent.data?.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

          <FieldManual />
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <PlayerCard user={user} />
          <DailyQuestCard daily={daily.data} />
          <FriendsPanel lobbyCode={myLobby?.code} />
          <TopPlayers players={top.data} />
          <FriendActivity user={user} />
          {!user && (
            <div className="hud-panel p-5 text-sm text-ink-400">
              <Clock className="mb-2 h-5 w-5 text-medium" />
              Solo timed tests set the clock from your mix: 10, 20 and 35 minutes per easy, medium and hard.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
