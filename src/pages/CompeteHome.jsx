import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'sonner';
import { ArrowDown, ArrowRight, Link2, Swords, Timer, TrendingUp, UserPlus } from 'lucide-react';
import { api } from '../lib/api';
import { track } from '../lib/analytics';
import { QuickArt, SoloArt } from '../components/home/ModeArt';
import FeaturedCard from '../components/tournaments/FeaturedCard';
import { useNow } from '../components/match/EventCard';
import { clock } from '../lib/format';
import { tierFor } from '../lib/rank';
import { streakOf } from '../lib/progression';
import { timeAgo } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import heroCoder from '../assets/hero-coder.png';
import usePolling from '../hooks/usePolling';
import MatchCard, { ProblemMix } from '../components/match/MatchCard';
import JoinByCode from '../components/match/JoinByCode';
import ScoringRules from '../components/match/ScoringRules';
import { FriendsPanel } from '../components/social/FriendBits';
import { Avatar, DifficultyBadge, EmptyState, InfoTip, Spinner, VerifiedBadge } from '../components/ui';

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
        <Link to="/tournaments" className="text-sm text-brand-400 hover:underline">
          All rankings
        </Link>
      </div>
      {players?.length ? (
        <ol className="space-y-1">
          {players.map((p, i) => {
            const tier = tierFor(p.stats.rating);
            return (
              <li key={p.id}>
                <Link to={`/u/${p.username || p.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-ink-800">
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
    <button className={PLAY_CTA} onClick={go} disabled={busy}>
      Find a battle {busy ? <Spinner className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

// One of the three ways to play. Same shape for all three: art, title, one line, one button.
function ModeCard({ art, title, info, body, action }) {
  return (
    <section className="panel group flex flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5">
      {art}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex-1">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
            {title}
            <InfoTip label={`About ${title.toLowerCase()}`}>{info}</InfoTip>
          </h3>
          <p className="mt-1 text-sm text-ink-300">{body}</p>
        </div>
        {action}
      </div>
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

// The next scheduled tournament as a featured artwork card on Compete.
function NextTournament({ event }) {
  const now = useNow();
  if (!event) return null;
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="section-title">Next tournament</h2>
        <Link to="/tournaments" className="text-sm text-brand-400 hover:underline">
          All tournaments
        </Link>
      </div>
      <FeaturedCard event={event} now={now} />
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
  const top = usePolling(() => api.users.leaderboard(5).then((r) => r.players), 60000);
  const daily = usePolling(() => api.problems.daily().catch(() => null), 300000, [user?.id]);
  const mine = usePolling(() => (user ? api.matches.mine().then((r) => r.matches) : Promise.resolve([])), 15000, [user?.id]);
  const events = usePolling(() => api.events.list().then((r) => r.upcoming).catch(() => []), 60000);
  const nextEvent = events.data?.[0];

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
          {user && (
            <p className="mt-4 text-sm text-ink-300">
              You are <span className={tierFor(user.stats.rating).color}>{tierFor(user.stats.rating).name}</span>
              <span className="font-mono text-ink-200"> {user.stats.rating}</span>
              <span className="text-ink-500">
                {' '}· Level {user.practice?.level ?? 1} · {user.stats.wins} win{user.stats.wins === 1 ? '' : 's'} in {user.stats.matches} battle{user.stats.matches === 1 ? '' : 's'}
              </span>
            </p>
          )}
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

          <section>
            <h2 className="section-title mb-4">Choose how to play</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <ModeCard
                art={<SoloArt />}
                title="Solo test"
                info="Choose how many easy, medium and hard problems you want. Each adds time to the clock: 10 minutes for easy, 20 for medium and 35 for hard. Solo tests are private and never change your rating."
                body="Race the clock at your own pace."
                action={
                  <Link {...authed(user, '/new?mode=solo')} className={PLAY_CTA}>
                    Start a solo test <ArrowRight className="h-4 w-4" />
                  </Link>
                }
              />
              <ModeCard
                art={<QuickArt />}
                title="Quick play"
                info="Puts you in the fullest open public lobby, with the battle hour and tournaments first. If no lobby is open, it starts a new battle for you to share."
                body="Jump into an open public battle."
                action={<QuickPlay user={user} lobbies={open.data} />}
              />
            </div>
          </section>

          <NextTournament event={nextEvent} />

          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between px-5 pb-1 pt-5">
              <div>
                <h2 className="section-title">Open battles</h2>
                <p className="text-sm text-ink-400">Join a lobby, or spectate a battle that is already live</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-ink-400">
                {live.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold text-hard">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-hard" /> {live.length} live
                  </span>
                )}
                {open.loading && <Spinner className="h-4 w-4 text-ink-500" />}
              </div>
            </div>
            {lobbies.length || live.length ? (
              <div className="grid gap-4 p-4 sm:grid-cols-2">
                {[...lobbies, ...live].map((m) => (
                  <div key={m.code} className="room-card">
                    <MatchCard match={m} />
                  </div>
                ))}
              </div>
            ) : (
              !open.loading && (
                <EmptyState
                  icon={UserPlus}
                  title="No open battles right now"
                  action={
                    <div className="flex flex-wrap justify-center gap-2">
                      <Link {...authed(user, '/new?mode=battle')} className="btn-primary btn-sm">
                        Host one
                      </Link>
                      <Link to="/tournaments" className="btn-secondary btn-sm">
                        See the schedule
                      </Link>
                    </div>
                  }
                >
                  {nextEvent
                    ? `Next public battle: ${nextEvent.name}, ${new Date(nextEvent.startsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. The lobby opens 30 minutes before.`
                    : 'Create a public lobby and it shows up here. Private rooms stay off this list. Share the invite link instead.'}
                </EmptyState>
              )
            )}
          </section>


        </div>

        <aside className="space-y-5">
          {user && <StatsCard user={user} />}
          <DailyProblemCard daily={daily.data} />
          <RecentResults matches={recent.data} />
          <TopPlayers players={top.data} />
          <FriendsPanel lobbyCode={myLobby?.code} />
          <FriendActivity user={user} />
        </aside>
      </div>

      {/* Reference material sits at the bottom, full width, reached from the "How it works" link in the hero. */}
      <section id="how-it-works" className="scroll-mt-24 space-y-8 pt-4">
        <div>
          <h2 className="section-title mb-6 text-center text-2xl">How it works</h2>
          <div className="mx-auto max-w-5xl">
            <HowItWorks />
          </div>
        </div>
        <div className="panel mx-auto max-w-5xl p-6">
          <h2 className="section-title mb-4">How scoring works</h2>
          <ScoringRules />
        </div>
      </section>
    </div>
  );
}
