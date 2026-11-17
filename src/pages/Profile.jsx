import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'sonner';
import { ArrowRight, Check, Copy, ExternalLink, Pencil, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { tierFor } from '../lib/rank';
import { timeAgo, ordinal } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { Avatar, EmptyState, PageLoader, ProgressBar, Spinner, VerifiedBadge } from '../components/ui';
import { ProblemMix } from '../components/match/MatchCard';
import { FriendButton } from '../components/social/FriendBits';
import { milestonesFor, streakOf } from '../lib/progression';

/* ---------------- Account (own profile only) ---------------- */

function useSave() {
  const { setUser } = useAuth();
  const [busy, setBusy] = useState(null);
  const run = async (key, fn, success) => {
    setBusy(key);
    try {
      const { user: next } = await fn();
      setUser(next);
      if (success) toast.success(success);
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setBusy(null);
    }
  };
  return [busy, run];
}

function DisplayName() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [busy, run] = useSave();
  const changed = name.trim() && name.trim() !== user.name;

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="label mb-0.5">Display name</p>
          <p className="truncate text-sm text-white">{user.name}</p>
        </div>
        <button className="btn-ghost btn-sm" onClick={() => setEditing(true)}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      </div>
    );
  }
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (await run('name', () => api.users.updateMe({ name }), 'Name updated')) setEditing(false);
      }}
    >
      <label className="label" htmlFor="display-name">
        Display name
      </label>
      <div className="flex gap-2">
        <input id="display-name" className="input py-2" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <button className="btn-primary btn-sm shrink-0" disabled={!changed || !!busy}>
          {busy && <Spinner className="h-3.5 w-3.5" />} Save
        </button>
        <button
          type="button"
          className="btn-ghost btn-sm shrink-0"
          onClick={() => {
            setName(user.name);
            setEditing(false);
          }}
        >
          Cancel
        </button>
      </div>
      <p className="mt-1.5 text-xs text-ink-500">Shown on scoreboards for future battles.</p>
    </form>
  );
}

function CopyCode({ code }) {
  return (
    <div className="flex items-center gap-2">
      <code className="rounded-lg border border-ink-700 bg-ink-900 px-3 py-1.5 font-mono text-sm text-neon-400">{code}</code>
      <button
        type="button"
        className="btn-ghost btn-sm"
        onClick={() => navigator.clipboard.writeText(code).then(() => toast.success('Code copied'))}
      >
        <Copy className="h-3.5 w-3.5" /> Copy
      </button>
    </div>
  );
}

// Ownership steps shared by a new claim and an older unverified link.
function VerifySteps({ username, code, busy, onVerify, onCancel, cancelLabel }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="label mb-0.5">LeetCode account</p>
        <p className="text-sm text-ink-300">
          Confirm that <span className="font-mono text-white">@{username}</span> is yours. Only you can edit its profile summary, so that is how we check.
        </p>
      </div>
      <ol className="space-y-3 rounded-xl border border-ink-700 bg-ink-950/50 p-4 text-sm text-ink-300">
        <li>
          <p className="mb-2">
            <span className="mr-2 font-mono text-ink-500">1</span>Copy this code
          </p>
          <CopyCode code={code} />
        </li>
        <li>
          <span className="mr-2 font-mono text-ink-500">2</span>Paste it into your{' '}
          <a href="https://leetcode.com/profile/" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">
            LeetCode profile summary
          </a>{' '}
          and save
        </li>
        <li>
          <span className="mr-2 font-mono text-ink-500">3</span>Come back and press Verify. You can remove the code afterwards.
        </li>
      </ol>
      <div className="flex gap-2">
        <button className="btn-primary btn-sm" disabled={!!busy} onClick={onVerify}>
          {busy === 'verify' ? <Spinner className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />} Verify
        </button>
        <button className="btn-ghost btn-sm" disabled={!!busy} onClick={onCancel}>
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}

function LeetCodeAccount() {
  const { user } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [busy, run] = useSave();
  const lc = user.leetcode;
  const claim = user.leetcodeClaim;
  const returnTo = location.state?.from;
  const verify = () => run('verify', api.users.verifyLeetCode, 'LeetCode account verified and linked');

  // Mid-claim: show the steps.
  if (claim) {
    return (
      <VerifySteps
        username={claim.username}
        code={claim.token}
        busy={busy}
        onVerify={verify}
        onCancel={() => run('cancel', api.users.cancelLeetCodeClaim)}
        cancelLabel={lc ? 'Keep current account' : 'Use a different username'}
      />
    );
  }

  // Linked before verification was required.
  if (lc && !lc.verified && user.leetcodeVerifyToken) {
    return (
      <VerifySteps
        username={lc.username}
        code={user.leetcodeVerifyToken}
        busy={busy}
        onVerify={verify}
        onCancel={() => window.confirm('Unlink this LeetCode account?') && run('unlink', api.users.unlinkLeetCode, 'Unlinked')}
        cancelLabel="Unlink"
      />
    );
  }

  if (!lc) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run('link', () => api.users.linkLeetCode(username.trim()));
        }}
      >
        <label className="label" htmlFor="lc-username">
          LeetCode account
        </label>
        <div className="flex gap-2">
          <input id="lc-username" className="input py-2" placeholder="your-leetcode-username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <button className="btn-primary btn-sm shrink-0" disabled={!username.trim() || !!busy}>
            {busy === 'link' && <Spinner className="h-3.5 w-3.5" />} Continue
          </button>
        </div>
        <p className="mt-1.5 text-xs text-ink-500">
          Required to compete. Use the name from leetcode.com/u/<span className="text-ink-300">username</span>. Next you will confirm it is yours.
        </p>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="label mb-0.5">LeetCode account</p>
          <a href={`https://leetcode.com/u/${lc.username}/`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-mono text-sm text-white hover:underline">
            @{lc.username} <ExternalLink className="h-3 w-3 text-ink-500" />
          </a>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="chip border-neon-500/40 text-neon-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Verified
          </span>
          <button
            className="btn-ghost btn-sm text-ink-400"
            disabled={!!busy}
            onClick={() => window.confirm('Unlink this LeetCode account?') && run('unlink', api.users.unlinkLeetCode, 'Unlinked')}
          >
            Unlink
          </button>
        </div>
      </div>
      {returnTo && (
        <Link to={returnTo} className="btn-primary btn-sm">
          Back to the battle <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function AccountCard() {
  return (
    <section className="card p-5">
      <h2 className="section-title mb-4">Account</h2>
      <div className="space-y-5">
        <DisplayName />
        <div className="border-t border-ink-800 pt-5">
          <LeetCodeAccount />
        </div>
      </div>
    </section>
  );
}

/* ---------------- Rating trend ---------------- */

// Rebuilds the rating after each rated battle from the current rating and the per-battle deltas.
function ratingSeries(current, history) {
  const rated = history.filter((m) => m.result.of > 1);
  const points = [current];
  let r = current;
  rated.forEach((m) => {
    r -= m.result.ratingDelta || 0;
    points.push(r);
  });
  return points.reverse();
}

function RatingTrend({ rating, history }) {
  const series = ratingSeries(rating, history);
  if (series.length < 3) return null;
  const w = 600;
  const h = 120;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = Math.max(1, max - min);
  const pts = series.map((v, i) => [(i / (series.length - 1)) * w, h - 8 - ((v - min) / span) * (h - 16)]);
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const change = series[series.length - 1] - series[0];

  return (
    <section className="card p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="section-title">Rating</h2>
        <p className="text-sm text-ink-400">
          Last {series.length - 1} rated battles{' '}
          <span className={clsx('font-mono font-semibold', change > 0 ? 'text-easy' : change < 0 ? 'text-hard' : 'text-ink-300')}>
            {change > 0 ? `+${change}` : change}
          </span>
        </p>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-28 w-full" preserveAspectRatio="none" aria-label="Rating over recent battles">
        <defs>
          <linearGradient id="rating-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7c5cff" stopOpacity=".25" />
            <stop offset="1" stopColor="#7c5cff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,${h} ${line} ${w},${h}`} fill="url(#rating-fill)" />
        <polyline points={line} fill="none" stroke="#a18bff" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-500">
        <span>low {min}</span>
        <span>high {max}</span>
      </div>
    </section>
  );
}

/* ---------------- Page ---------------- */

function Stat({ label, value, className }) {
  return (
    <div className="px-4 py-3">
      <p className={clsx('font-display text-xl font-bold text-white', className)}>{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  );
}

export default function Profile() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const targetId = id === 'me' ? user?.id : id;
  const isMe = user && targetId === user.id;

  useEffect(() => {
    if (!targetId) return;
    setError(null);
    api.users
      .get(targetId)
      .then(setData)
      .catch(setError);
  }, [targetId, user?.stats?.rating, user?.leetcode?.verified, user?.leetcode?.username, user?.name]);

  useEffect(() => {
    if (data) document.title = `${data.player.name} · League of Coders`;
  }, [data]);

  if (id === 'me' && !authLoading && !user) return <Navigate to="/login" replace state={{ from: '/u/me' }} />;
  if (error) return <EmptyState title="Player not found" />;
  if (!data || data.player.id !== targetId) return <PageLoader />;

  const { player, history } = data;
  const s = player.stats;
  const tier = tierFor(s.rating);
  const { streak } = streakOf(player);
  const winRate = s.matches ? Math.round((s.wins / s.matches) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className={clsx('grid grid-cols-1 items-start gap-6', isMe && 'lg:grid-cols-[minmax(0,1fr)_380px]')}>
        <section className="card overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-brand-600/30 via-ink-850 to-neon-500/15" />
          <div className="px-6 pb-6">
            <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
              <span className="rounded-full ring-4 ring-ink-900">
                <Avatar name={player.name} src={player.avatar} size={84} />
              </span>
              <FriendButton playerId={player.id} />
            </div>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-white sm:text-3xl">
                  {player.name} <VerifiedBadge verified={player.leetcode?.verified} />
                </h1>
                <p className="mt-1 text-sm text-ink-400">
                  {player.leetcode ? (
                    <a href={`https://leetcode.com/u/${player.leetcode.username}/`} target="_blank" rel="noreferrer" className="hover:text-ink-200 hover:underline">
                      @{player.leetcode.username}
                    </a>
                  ) : (
                    'No LeetCode linked'
                  )}
                  <span className="text-ink-600"> · </span>joined {timeAgo(player.createdAt)}
                  {streak > 0 && (
                    <>
                      <span className="text-ink-600"> · </span>
                      {streak}-day practice streak
                    </>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className={clsx('text-xs font-semibold uppercase tracking-wider', tier.color)}>{tier.name}</p>
                <p className="font-mono text-3xl font-bold text-white">{s.rating}</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 divide-ink-800 rounded-xl border border-ink-800 bg-ink-950/40 sm:grid-cols-5 sm:divide-x">
              <Stat label="Battles" value={s.matches} />
              <Stat label="Wins" value={s.wins} />
              <Stat label="Win rate" value={`${winRate}%`} />
              <Stat label="Solved in battles" value={s.solved} />
              <Stat label="Points" value={s.points.toLocaleString()} />
            </div>
          </div>
        </section>
        {isMe && <AccountCard />}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <RatingTrend rating={s.rating} history={history} />

          <section>
            <h2 className="section-title mb-4">Battle history</h2>
            {history.length ? (
              <div className="card divide-y divide-ink-800/70">
                {history.map((m) => {
                  const won = m.result.rank === 1 && m.result.of > 1;
                  return (
                    <Link key={m.code} to={`/m/${m.code}`} className="flex flex-wrap items-center gap-4 px-5 py-3.5 hover:bg-ink-850/60">
                      <span
                        className={clsx(
                          'w-12 shrink-0 rounded-lg py-1 text-center font-mono text-sm font-bold',
                          won ? 'bg-medium/15 text-medium' : 'bg-ink-800 text-ink-300'
                        )}
                      >
                        {ordinal(m.result.rank)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">{m.name}</p>
                        <p className="flex items-center gap-2 text-xs text-ink-500">
                          {m.result.of > 1 ? `${m.result.of} players` : 'Solo'} · <ProblemMix settings={m.settings} /> · {timeAgo(m.finishedAt)}
                        </p>
                      </div>
                      <span className="hidden font-mono text-sm text-ink-400 sm:block">
                        {m.result.solved}/{m.result.problems}
                      </span>
                      <span className="w-20 text-right font-mono text-sm font-semibold text-white">{m.result.score} pts</span>
                      <span
                        className={clsx(
                          'w-12 text-right font-mono text-sm',
                          m.result.ratingDelta > 0 ? 'text-easy' : m.result.ratingDelta < 0 ? 'text-hard' : 'text-ink-500'
                        )}
                      >
                        {m.result.ratingDelta > 0 ? `+${m.result.ratingDelta}` : m.result.ratingDelta || '±0'}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No battles yet" action={isMe && <Link to="/new" className="btn-primary btn-sm">Start one</Link>}>
                Finished battles show up here with placement, score and rating change.
              </EmptyState>
            )}
          </section>
        </div>

        <aside>
          <section className="card p-5">
            <h2 className="section-title mb-4">Milestones</h2>
            <ul className="space-y-4">
              {milestonesFor(isMe ? { ...player, solvedCount: user.solvedCount } : player).map((m) => (
                <li key={m.name}>
                  <p className="mb-1.5 flex justify-between text-sm">
                    <span className={m.done ? 'text-white' : 'text-ink-400'}>{m.name}</span>
                    <span className={clsx('font-mono text-xs', m.done ? 'text-easy' : 'text-ink-500')}>{m.done ? 'Done' : `${m.value}/${m.target}`}</span>
                  </p>
                  <ProgressBar value={m.value} max={m.target} barClassName={m.done ? 'bg-easy' : 'bg-brand-500'} />
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
