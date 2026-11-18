import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'sonner';
import { ArrowDown, ArrowRight, Link2, Plus, Swords, Timer, TrendingUp, UserPlus, Zap } from 'lucide-react';
import { api } from '../lib/api';
import { track } from '../lib/analytics';
import { SoloArt } from '../components/home/ModeArt';
import { tierFor } from '../lib/rank';
import { streakOf } from '../lib/progression';
import { timeAgo } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import heroCoder from '../assets/hero-coder.png';
import usePolling from '../hooks/usePolling';
import MatchCard, { ProblemMix, StatusPill } from '../components/match/MatchCard';
import JoinByCode from '../components/match/JoinByCode';
import ScoringRules from '../components/match/ScoringRules';
import { FriendsPanel } from '../components/social/FriendBits';
import { Avatar, DifficultyBadge, EmptyState, InfoTip, Spinner } from '../components/ui';

function LinkLeetCodeBanner({ linked }) {
  return (
    <div className="card flex flex-col items-start justify-between gap-4 border-warn/30 bg-warn/5 p-5 sm:flex-row sm:items-center">
      <div className="flex gap-3">
        <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
        <div>
          <p className="font-semibold text-white">{linked ? 'Verify your LeetCode account to keep competing' : 'Link your LeetCode account to start competing'}</p>
          <p className="text-sm text-ink-400">
            {linked
              ? 'Battles now require a verified account, so nobody can compete as someone else. It takes about a minute.'
              : 'We read your accepted submissions and score the match from those. You confirm the account is yours once.'}
          </p>
        </div>
      </div>
      <Link to="/u/me" className="btn-secondary shrink-0">
        {linked ? 'Verify' : 'Link LeetCode'} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

const STEPS = [
  { icon: Link2, title: 'Link LeetCode', body: 'Connect your username once. Solves are read from your accepted submissions.' },
  { icon: Swords, title: 'Create or join', body: 'Pick the difficulty mix, topics, and duration, then share the invite link.' },
  { icon: Timer, title: 'Race the clock', body: 'Everyone gets the same shuffled set. Read it here, submit on LeetCode.' },
  { icon: TrendingUp, title: 'Climb the ranks', body: 'Every battle earns XP. Tournaments move your rating.' },
];

const SNAKE_STEP_S = 2; // seconds each card holds the light; 4 cards = 8s cycle

function StepCard({ step, n }) {
  const { icon: Icon, title, body } = step;
  return (
    <div className="card card-hover snake relative z-10 h-full p-5" style={{ '--snake-delay': `${(n - 1) * SNAKE_STEP_S}s`, '--snake-cycle': `${4 * SNAKE_STEP_S}s` }}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
          <Icon className="h-5 w-5" />
        </span>
        <span className="snake-num font-mono text-xs text-ink-500">0{n}</span>
      </div>
      <p className="mt-3 font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-ink-400">{body}</p>
    </div>
  );
}

// The four steps sit on a ring around the illustration, read clockwise: 1 top, 2 right, 3 bottom, 4 left.
// On a 3x3 grid with equal tracks, the ring's edges pass exactly through the middle of each card.
function HowItWorks() {
  const [s1, s2, s3, s4] = STEPS;
  return (
    <div className="relative grid gap-4 md:grid-cols-3 md:grid-rows-3 md:gap-x-5 md:gap-y-4">
      <svg aria-hidden className="pointer-events-none absolute inset-[16.6%] hidden h-[66.8%] w-[66.8%] overflow-visible md:block" preserveAspectRatio="none" viewBox="0 0 100 100">
        <ellipse cx="50" cy="50" rx="50" ry="50" fill="none" stroke="rgba(124,92,255,0.35)" strokeWidth="2" strokeDasharray="6 10" vectorEffect="non-scaling-stroke" className="ring-flow" />
      </svg>
      <div className="order-1 flex items-center justify-center md:col-start-2 md:row-start-2">
        <span aria-hidden className="absolute h-40 w-40 rounded-full bg-brand-500/15 blur-3xl" />
        <img src={heroCoder} alt="" className="hero-art relative w-40 md:w-[85%] md:max-w-[220px]" />
      </div>
      <div className="order-2 md:col-start-2 md:row-start-1">
        <StepCard step={s1} n={1} />
      </div>
      <div className="order-3 md:col-start-3 md:row-start-2">
        <StepCard step={s2} n={2} />
      </div>
      <div className="order-4 md:col-start-2 md:row-start-3">
        <StepCard step={s3} n={3} />
      </div>
      <div className="order-5 md:col-start-1 md:row-start-2">
        <StepCard step={s4} n={4} />
      </div>
    </div>
  );
}

const authed = (user, to) => (user ? { to } : { to: '/login', state: { from: to } });

function StatsCard({ user }) {
  const s = user.stats;
  const tier = tierFor(s.rating);
  const { streak } = streakOf(user);
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} src={user.avatar} size={44} />
        <div className="min-w-0">
          <Link to={`/u/${user.username || user.id}`} className="block truncate font-semibold text-white hover:underline">
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
          ['Level', user.practice?.level ?? 1],
          ['XP this week', (user.practice?.weekXp ?? 0).toLocaleString()],
          ['Wins', s.wins],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white/[0.04] py-2.5">
            <dd className="font-display text-lg font-bold text-white">{value}</dd>
            <dt className="text-[11px] uppercase tracking-wider text-ink-500">{label}</dt>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-ink-400">
          {streak > 0 ? (
            <>
              Streak <span className="font-semibold text-ink-200">{streak} day{streak > 1 ? 's' : ''}</span>
            </>
          ) : (
            'No streak yet'
          )}
        </span>
        <Link to="/leaderboard" className="text-brand-400 hover:underline">
          Your rank
        </Link>
      </div>
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
              <Link to={`/u/${a.user.username || a.user.id}`} className="font-medium text-white hover:underline">
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

// Both play cards use the same button so the two rows line up.
const PLAY_CTA = 'btn-secondary w-full justify-between';

// Drops the player into the fullest open public lobby (scheduled events first), or opens a new one.
function QuickPlay({ user, lobbies }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const go = async () => {
    const candidates = (lobbies || [])
      .filter((m) => !m.settings.solo && m.players < m.maxPlayers)
      .sort((a, b) => Number(!!b.event) - Number(!!a.event) || b.players - a.players);
    const pick = candidates[0];
    track('quick_play', { found: !!pick, event: pick?.event?.kind || null });
    if (!pick) {
      navigate(user ? '/new?mode=battle' : '/login', { state: user ? undefined : { from: '/new?mode=battle' } });
      return;
    }
    if (!user || !user.leetcode?.verified) {
      navigate(`/m/${pick.code}`);
      return;
    }
    setBusy(true);
    try {
      await api.matches.join(pick.code);
      track('match_joined', { via: 'quick_play', event: pick.event?.kind || null });
      navigate(`/m/${pick.code}`);
    } catch (err) {
      toast.error(err.message);
      navigate(`/m/${pick.code}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button className="btn-primary shrink-0" onClick={go} disabled={busy}>
      {busy ? <Spinner className="h-4 w-4" /> : <Zap className="h-4 w-4" />} Quick join
    </button>
  );
}

function DailyProblemCard({ daily }) {
  if (!daily?.problem) return null;
  const p = daily.problem;
  return (
    <section className="panel p-5">
      <h2 className="section-title mb-3">Problem of the day</h2>
      <Link to={`/problems/${p.slug}`} className="block font-medium text-ink-100 hover:text-white">
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
    </section>
  );
}

// Battles you are in, as compact rows: one line each, whatever the count.
function ActiveBattles({ matches }) {
  return (
    <section className="panel p-5 sm:p-6">
      <h2 className="mb-3 font-display text-lg font-semibold text-white">Your active battles</h2>
      <ul className="divide-y divide-white/5">
        {matches.map((m) => {
          const lobby = m.status === 'lobby';
          return (
            <li key={m.code} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <StatusPill status={m.status} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{m.name}</p>
                <p className="flex items-center gap-2 text-xs text-ink-500">
                  {m.settings.solo ? 'Solo test' : `${m.players}/${m.maxPlayers} players`} · {m.settings.durationMin} min · <ProblemMix settings={m.settings} />
                </p>
              </div>
              <span className="hidden rounded-lg bg-white/[0.05] px-2 py-1 font-mono text-xs tracking-widest text-ink-300 sm:inline">{m.code}</span>
              <Link to={`/m/${m.code}`} className="btn-primary btn-sm w-full justify-center sm:w-auto">
                {lobby ? 'Return to lobby' : 'Back to the arena'} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// A way to play, as one full-width row: art on the left, then the title and one line, then the button.
function ModeRow({ art, title, info, body, action }) {
  return (
    <section className="panel group flex flex-col overflow-hidden sm:flex-row sm:items-stretch">
      <div className="sm:w-56 sm:shrink-0">{art}</div>
      <div className="flex flex-1 flex-col justify-center gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
            {title}
            <InfoTip label={`About ${title.toLowerCase()}`}>{info}</InfoTip>
          </h2>
          <p className="mt-1 text-sm text-ink-300">{body}</p>
        </div>
        <div className="sm:w-52 sm:shrink-0">{action}</div>
      </div>
    </section>
  );
}

const OPEN_SHOWN = 4; // on Compete; "Show all" opens the full list across the page

// Battle hour first, then the fullest lobbies, then battles already running (to watch).
export const orderBattles = (lobbies, live) => [
  ...[...lobbies].sort((a, b) => Number(!!b.event) - Number(!!a.event) || b.players - a.players),
  ...live,
];

// The last tile of a battle grid: start your own.
function HostTile({ user }) {
  return (
    <Link
      {...authed(user, '/new?mode=battle')}
      className="flex min-h-[10rem] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 p-5 text-center text-ink-300 transition hover:border-brand-500/60 hover:bg-white/[0.03] hover:text-white"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/15 text-brand-300">
        <Plus className="h-5 w-5" />
      </span>
      <span className="font-semibold">Host a battle</span>
      <span className="text-xs text-ink-500">Pick the problems, share the link</span>
    </Link>
  );
}

function OpenBattles({ user, lobbies, live, loading, nextEvent, expanded, onExpand }) {
  const list = orderBattles(lobbies, live);
  const shown = list.slice(0, OPEN_SHOWN);
  // Keep the 2-column grid even: an odd count gets the host tile as its partner.
  const withHost = shown.length % 2 === 1;
  return (
    <section className="panel">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
            Open battles
            <InfoTip label="About open battles">
              Public lobbies waiting for players, and battles already running that you can watch. Quick join puts you in the fullest open lobby, with the
              battle hour and tournaments first. If none is open, it starts a new battle for you to share. Private rooms never show here.
            </InfoTip>
          </h2>
          <p className="mt-1 text-sm text-ink-300">
            {list.length ? `${lobbies.length} open${live.length ? ` · ${live.length} live` : ''}` : 'Public lobbies and live battles show up here'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Spinner className="h-4 w-4 text-ink-500" />}
          {/* With nothing open, the empty state below carries the single "Host a battle" action. */}
          {list.length > 0 && (
            <>
              <Link {...authed(user, '/new?mode=battle')} className="btn-secondary">
                <Plus className="h-4 w-4" /> Host
              </Link>
              <QuickPlay user={user} lobbies={lobbies} />
            </>
          )}
        </div>
      </div>
      {list.length && expanded ? (
        <p className="px-5 pb-5 pt-3 text-sm text-ink-400 sm:px-6">
          All {list.length} battles are listed below.{' '}
          <button className="text-brand-400 hover:underline" onClick={onExpand}>
            Collapse
          </button>
        </p>
      ) : list.length ? (
        <div className="p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {shown.map((m) => (
              <MatchCard key={m.code} match={m} />
            ))}
            {withHost && <HostTile user={user} />}
          </div>
          {list.length > OPEN_SHOWN && (
            <button className="mt-4 text-sm text-brand-400 hover:underline" onClick={onExpand}>
              Show all {list.length} battles
            </button>
          )}
        </div>
      ) : (
        !loading && (
          <EmptyState
            bare
            icon={UserPlus}
            title="No open battles right now"
            action={
              <Link {...authed(user, '/new?mode=battle')} className="btn-primary">
                <Plus className="h-4 w-4" /> Host a battle
              </Link>
            }
          >
            {nextEvent
              ? `Host one and share the link, or join ${nextEvent.name} at ${new Date(nextEvent.startsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`
              : 'Host one and share the link with friends.'}
          </EmptyState>
        )
      )}
    </section>
  );
}

// Every open battle, across the full page width, once "Show all" is pressed.
function AllBattles({ user, lobbies, live, onClose }) {
  const list = orderBattles(lobbies, live);
  return (
    <section id="all-battles" className="panel scroll-mt-24 p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-white">All open battles · {list.length}</h2>
        <button className="text-sm text-brand-400 hover:underline" onClick={onClose}>
          Hide
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((m) => (
          <MatchCard key={m.code} match={m} />
        ))}
        <HostTile user={user} />
      </div>
    </section>
  );
}

// Top 5 by XP this week (what Compete earns), falling back to all time early in the week.
function TopThisWeek() {
  const { data } = usePolling(async () => {
    const week = await api.users.leaderboard(5, { board: 'xp', period: 'week' });
    if (week.players?.length) return { players: week.players, period: 'week' };
    const all = await api.users.leaderboard(5, { board: 'xp', period: 'all' });
    return { players: all.players || [], period: 'all' };
  }, 60000);
  if (!data?.players?.length) return null;
  return (
    <section className="panel p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="section-title">{data.period === 'week' ? 'Top this week' : 'Top players'}</h2>
        <Link to={`/leaderboard?board=xp${data.period === 'all' ? '&period=all' : ''}`} className="text-sm text-brand-400 hover:underline">
          Leaderboard
        </Link>
      </div>
      <ol className="space-y-1">
        {data.players.map((p, i) => (
          <li key={p.id}>
            <Link to={`/u/${p.username || p.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.04]">
              <span className="w-4 text-center font-mono text-sm text-ink-500">{i + 1}</span>
              <Avatar name={p.name} src={p.avatar} size={28} />
              <span className="min-w-0 flex-1 truncate text-sm text-ink-100">{p.name}</span>
              <span className="font-mono text-xs text-neon-400">{(p.value ?? p.practice?.xp ?? 0).toLocaleString()} XP</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

// Finished public battles, compact, for the sidebar. The winner's avatar leads each row.
function RecentResults({ matches }) {
  if (!matches?.length) return null;
  return (
    <section className="panel p-5">
      <h2 className="section-title mb-3">Recent results</h2>
      <ul className="space-y-1">
        {matches.map((m) => (
          <li key={m.code}>
            <Link to={`/m/${m.code}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.04]">
              <Avatar name={m.winner?.name || m.name} src={m.winner?.avatar} size={30} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink-300">
                  <span className="font-medium text-white">{m.winner?.name || 'No winner'}</span> {m.winner ? 'won' : 'in'} {m.name}
                </p>
                <p className="text-xs text-ink-500">
                  {m.players} players · {timeAgo(m.finishedAt)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const scrollToHow = (e) => {
  e.preventDefault();
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('how-it-works')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
};

export default function CompeteHome() {
  const { user } = useAuth();
  useEffect(() => {
    document.title = 'League of Coders';
  }, []);

  const open = usePolling(() => api.matches.open().then((r) => r.matches), 8000);
  const recent = usePolling(() => api.matches.recent(5).then((r) => r.matches), 60000);
  // Signed-out visitors have no stats card, so the sidebar leads with today's problem instead.
  const daily = usePolling(() => (user ? Promise.resolve(null) : api.problems.daily().catch(() => null)), 300000, [user?.id]);
  const mine = usePolling(() => (user ? api.matches.mine().then((r) => r.matches) : Promise.resolve([])), 15000, [user?.id]);
  const events = usePolling(() => api.events.list().then((r) => r.upcoming).catch(() => []), 60000);
  const nextEvent = events.data?.[0];

  const [allOpen, setAllOpen] = useState(false);
  const mineCodes = new Set((mine.data || []).map((m) => m.code));
  const others = (open.data || []).filter((m) => !mineCodes.has(m.code));
  const live = others.filter((m) => m.status !== 'lobby');
  const lobbies = others.filter((m) => m.status === 'lobby');
  const myLobby = (mine.data || []).find((m) => m.status === 'lobby' && !m.settings.solo);

  return (
    <div className="space-y-10">
      <section className="flex items-center pt-6 sm:pt-16 lg:min-h-[540px]">
        <div>
          <h1 className="max-w-xl font-display text-5xl font-bold leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-7xl">
            Code.
            <br />
            <span className="shimmer-text bg-gradient-to-r from-neon-400 via-brand-400 via-fuchsia-400 to-neon-400 bg-clip-text text-transparent">Compete.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink-200">
            Open a lobby, send the invite link, and race the same LeetCode problems. Scores come from accepted submissions.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link {...authed(user, '/new?mode=battle')} className="btn-primary glow-pulse px-6 py-3 text-base">
              <Swords className="h-5 w-5" /> Start a battle
            </Link>
            <a href="#how-it-works" onClick={scrollToHow} className="btn-ghost px-4 py-3 text-base text-ink-200">
              How it works <ArrowDown className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-4 max-w-xl">
            <JoinByCode onImage />
          </div>
        </div>
      </section>

      {user && !user.leetcode?.verified && <LinkLeetCodeBanner linked={!!user.leetcode} />}


      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-10">
          {mine.data?.length > 0 && <ActiveBattles matches={mine.data} />}

          <ModeRow
            art={<SoloArt />}
            title="Solo test"
            info="Choose how many easy, medium and hard problems you want. Each adds time to the clock: 10 minutes for easy, 20 for medium and 35 for hard. Solo tests are private, earn XP and never change your rating."
            body="Race the clock at your own pace."
            action={
              <Link {...authed(user, '/new?mode=solo')} className={PLAY_CTA}>
                Start a solo test <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />

          <OpenBattles
            user={user}
            lobbies={lobbies}
            live={live}
            loading={open.loading && !open.data}
            nextEvent={nextEvent}
            expanded={allOpen}
            onExpand={() => {
              setAllOpen((v) => !v);
              // Bring the full list into view once it renders.
              requestAnimationFrame(() => document.getElementById('all-battles')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
            }}
          />
        </div>

        <aside className="space-y-5">
          {user ? <StatsCard user={user} /> : <DailyProblemCard daily={daily.data} />}
          <TopThisWeek />
          <RecentResults matches={recent.data} />
          <FriendsPanel lobbyCode={myLobby?.code} />
          <FriendActivity user={user} />
        </aside>
      </div>

      {allOpen && <AllBattles user={user} lobbies={lobbies} live={live} onClose={() => setAllOpen(false)} />}

      {/* Reference material sits at the bottom, full width, reached from the "How it works" link in the hero. */}
      <section id="how-it-works" className="scroll-mt-24 pt-4">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <h2 className="section-title text-2xl">How it works</h2>
            <div className="mx-auto mt-12 max-w-2xl">
              <HowItWorks />
            </div>
          </div>
          <div className="lg:pt-20">
            <div className="panel p-5">
              <h2 className="section-title mb-4">How scoring works</h2>
              <ScoringRules compact />
              <p className="mt-4 text-xs leading-5 text-ink-500">
                Ties go to whoever solved more, then to the earlier last solve. Tournaments move your rating. Every battle and solo test earns XP.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
