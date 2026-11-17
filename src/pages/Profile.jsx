import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'sonner';
import { ArrowRight, Award, Check, Copy, ExternalLink, Flame, History, Link2, Lock, ShieldCheck, Unlink } from 'lucide-react';
import { api } from '../lib/api';
import { tierFor, tierProgress } from '../lib/rank';
import { achievementsFor, practiceOf, titleFor } from '../lib/progression';
import RankEmblem from '../components/game/RankEmblem';
import { CountUp, XpBar } from '../components/game/fx';
import { FriendButton } from '../components/social/FriendBits';
import { timeAgo, ordinal } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { Avatar, EmptyState, PageLoader, Spinner, VerifiedBadge } from '../components/ui';
import { ProblemMix } from '../components/match/MatchCard';

function LeetCodeSettings() {
  const { user, setUser } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(null);
  const lc = user.leetcode;
  const returnTo = location.state?.from;

  const run = async (key, fn, success) => {
    setBusy(key);
    try {
      const { user: next } = await fn();
      setUser(next);
      if (success) toast.success(success);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Link2 className="h-5 w-5 text-brand-400" />
        <p className="section-title">LeetCode account</p>
      </div>

      {!lc ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run('link', () => api.users.linkLeetCode(username.trim()), 'LeetCode linked. You can compete now.');
          }}
          className="space-y-3"
        >
          <p className="text-sm text-ink-400">
            Battles are scored from your public LeetCode accepted submissions. Enter the username from your profile URL
            (leetcode.com/u/<span className="text-ink-200">username</span>).
          </p>
          <div className="flex gap-2">
            <input className="input" placeholder="your-leetcode-username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <button className="btn-primary shrink-0" disabled={!username.trim() || !!busy}>
              {busy === 'link' && <Spinner className="h-4 w-4" />} Link account
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <a href={`https://leetcode.com/u/${lc.username}/`} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-mono text-white hover:underline">
              @{lc.username} <ExternalLink className="h-3.5 w-3.5 text-ink-400" />
            </a>
            <div className="flex items-center gap-2">
              {lc.verified ? (
                <span className="chip border-neon-500/40 text-neon-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified owner
                </span>
              ) : (
                <span className="chip border-medium/40 text-medium">Not verified</span>
              )}
              <button className="btn-ghost btn-sm" disabled={!!busy} onClick={() => window.confirm('Unlink this LeetCode account?') && run('unlink', api.users.unlinkLeetCode, 'Unlinked')}>
                <Unlink className="h-3.5 w-3.5" /> Unlink
              </button>
            </div>
          </div>

          {!lc.verified && user.leetcodeVerifyToken && (
            <div className="rounded-xl border border-ink-700 bg-ink-950/50 p-4 text-sm">
              <p className="font-semibold text-white">Prove it's you (recommended)</p>
              <p className="mt-1 text-ink-400">
                Verified players get a <ShieldCheck className="inline h-3.5 w-3.5 text-neon-400" /> badge on scoreboards. Add this code anywhere in your{' '}
                <a href="https://leetcode.com/profile/" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">
                  LeetCode profile summary
                </a>
                , save, then press verify. You can remove it afterwards.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <code className="rounded-lg border border-ink-700 bg-ink-900 px-3 py-1.5 font-mono text-neon-400">{user.leetcodeVerifyToken}</code>
                <button
                  className="btn-ghost btn-sm"
                  onClick={() => navigator.clipboard.writeText(user.leetcodeVerifyToken).then(() => toast.success('Copied'))}
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
                <button className="btn-secondary btn-sm ml-auto" disabled={!!busy} onClick={() => run('verify', api.users.verifyLeetCode, 'Ownership verified!')}>
                  {busy === 'verify' ? <Spinner className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />} Verify now
                </button>
              </div>
            </div>
          )}

          {returnTo && (
            <Link to={returnTo} className="btn-primary">
              Back to the battle <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function NameEditor() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [busy, setBusy] = useState(false);
  const changed = name.trim() && name.trim() !== user.name;
  return (
    <div className="card p-6">
      <p className="section-title mb-4">Display name</p>
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const { user: next } = await api.users.updateMe({ name });
            setUser(next);
            toast.success('Name updated');
          } catch (err) {
            toast.error(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <input className="input" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-secondary shrink-0" disabled={!changed || busy}>
          Save
        </button>
      </form>
      <p className="mt-2 text-xs text-ink-500">Shown on scoreboards for future battles.</p>
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
    setData(null);
    setError(null);
    api.users
      .get(targetId)
      .then(setData)
      .catch(setError);
  }, [targetId, user?.stats?.rating, user?.leetcode?.verified]);

  useEffect(() => {
    if (data) document.title = `${data.player.name} · League of Coders`;
  }, [data]);

  if (id === 'me' && !authLoading && !user) return <Navigate to="/login" replace state={{ from: '/u/me' }} />;
  if (error) return <EmptyState title="Player not found" />;
  if (!data) return <PageLoader />;

  const { player, history } = data;
  const s = player.stats;
  const tier = tierFor(s.rating);
  const promo = tierProgress(s.rating);
  const lvl = practiceOf(player);
  const badges = achievementsFor(isMe ? { ...player, solvedCount: user.solvedCount } : player);
  const unlocked = badges.filter((b) => b.unlocked).length;
  const stats = [
    ['Rating', s.rating, 'text-brand-400'],
    ['Battles', s.matches],
    ['Wins', s.wins],
    ['Win rate', s.matches ? Math.round((s.wins / s.matches) * 100) : 0, null, '%'],
    ['Problems solved', s.solved],
    ['Total points', s.points],
    ['Best streak', lvl.bestStreak, 'text-orange-400'],
  ];

  return (
    <div className="space-y-6">
      <div className="hud-panel relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="relative">
            <Avatar name={player.name} src={player.avatar} size={88} />
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink-950 px-2 py-0.5 font-mono text-xs font-bold text-brand-400 ring-1 ring-brand-500/60">
              Lv {lvl.level}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="flex flex-wrap items-center gap-2 font-display text-3xl font-black text-white">
              {player.name} <VerifiedBadge verified={player.leetcode?.verified} />
            </h1>
            <p className="text-sm text-ink-400">
              {titleFor(lvl.level)} · {player.leetcode ? `@${player.leetcode.username} on LeetCode` : 'No LeetCode linked'} · joined {timeAgo(player.createdAt)}
            </p>
            <div className="mt-3 max-w-sm">
              <p className="mb-1 flex justify-between text-[11px] text-ink-500">
                <span>{lvl.xp} XP</span>
                <span>{lvl.nextLevelXp} XP for level {lvl.level + 1}</span>
              </p>
              <XpBar pct={lvl.pct} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <FriendButton playerId={player.id} />
              {lvl.streak > 0 && (
                <span className="chip border-orange-500/40 text-orange-400">
                  <Flame className="h-3.5 w-3.5 animate-flicker" /> {lvl.streak} day streak
                </span>
              )}
            </div>
          </div>
          <div className="text-center">
            <RankEmblem tier={tier} size={110} />
            <p className={clsx('mt-1 font-display text-lg font-black uppercase tracking-wider', tier.color)}>{tier.name}</p>
            {promo.next && <p className="text-[11px] text-ink-500">{promo.toGo} to {promo.next.name}</p>}
          </div>
        </div>
        <div className="relative mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {stats.map(([label, value, color, suffix]) => (
            <div key={label} className="rounded-xl border border-ink-800 bg-ink-950/40 p-4">
              <p className={clsx('font-display text-2xl font-bold', color || 'text-white')}>
                <CountUp value={value} />
                {suffix}
              </p>
              <p className="text-xs uppercase tracking-wider text-ink-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="hud-panel p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-white">
          <Award className="h-5 w-5 text-medium" /> Achievements
          <span className="font-mono text-sm text-ink-500">
            {unlocked}/{badges.length}
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {badges.map((b, i) => (
            <div
              key={b.id}
              title={b.desc}
              className={clsx(
                'animate-rise-in rounded-xl border p-3 text-center transition',
                b.unlocked ? 'lift shine border-ink-700 bg-ink-950/50' : 'border-dashed border-ink-800 opacity-50 grayscale'
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className={clsx('mx-auto flex h-11 w-11 items-center justify-center rounded-full', b.unlocked ? 'bg-ink-800 shadow-glow' : 'bg-ink-900')}>
                {b.unlocked ? <b.icon className={clsx('h-5 w-5', b.color)} /> : <Lock className="h-4 w-4 text-ink-600" />}
              </span>
              <p className="mt-2 text-xs font-bold text-white">{b.name}</p>
              <p className="text-[10px] leading-4 text-ink-500">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {isMe && (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <LeetCodeSettings />
          <NameEditor />
        </div>
      )}

      <div>
        <h2 className="section-title mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-ink-400" /> Battle history
        </h2>
        {history.length ? (
          <div className="card divide-y divide-ink-800/70">
            {history.map((m) => (
              <Link key={m.code} to={`/m/${m.code}`} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-ink-850/60">
                <span
                  className={clsx(
                    'flex h-10 w-10 items-center justify-center rounded-xl font-display font-bold',
                    m.result.rank === 1 ? 'bg-medium/15 text-medium' : 'bg-ink-800 text-ink-300'
                  )}
                >
                  {ordinal(m.result.rank)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{m.name}</p>
                  <p className="flex items-center gap-2 text-xs text-ink-500">
                    of {m.result.of} · <ProblemMix settings={m.settings} /> · {timeAgo(m.finishedAt)}
                  </p>
                </div>
                <span className="font-mono text-sm text-ink-300">
                  {m.result.solved}/{m.result.problems} solved
                </span>
                <span className="w-20 text-right font-mono font-bold text-white">{m.result.score} pts</span>
                <span className={clsx('w-12 text-right font-mono text-sm', m.result.ratingDelta > 0 ? 'text-easy' : m.result.ratingDelta < 0 ? 'text-hard' : 'text-ink-500')}>
                  {m.result.ratingDelta > 0 ? `+${m.result.ratingDelta}` : m.result.ratingDelta || '±0'}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon={History} title="No battles yet" action={isMe && <Link to="/new" className="btn-primary btn-sm">Start one</Link>} />
        )}
      </div>
    </div>
  );
}
