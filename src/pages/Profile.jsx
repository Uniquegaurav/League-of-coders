import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'sonner';
import { ArrowRight, Check, Copy, ExternalLink, GraduationCap, Pencil, ShieldCheck, Swords } from 'lucide-react';
import { api } from '../lib/api';
import { track } from '../lib/analytics';
import { BADGES } from '../lib/badges';
import { directUrl, imageUrl, profileHandle, shareUrl } from '../lib/share';
import ShareButtons from '../components/share/ShareButtons';
import { tierFor } from '../lib/rank';
import { timeAgo, ordinal } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { Avatar, EmptyState, InfoTip, PageLoader, ProgressBar, Spinner, Toggle, VerifiedBadge } from '../components/ui';
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

// One-line editable field (username, college). `suggest` returns name suggestions for a datalist.
function EditableField({ id, label, value, placeholder, help, prefix, maxLength = 60, onSave, suggest }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value || '');
  const [busy, setBusy] = useState(false);
  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (!editing || !suggest || text.trim().length < 2) return undefined;
    const t = setTimeout(() => suggest(text.trim()).then(setOptions).catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [editing, suggest, text]);

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="label mb-0.5">{label}</p>
          <p className={clsx('truncate text-sm', value ? 'text-white' : 'text-ink-500')}>{value ? `${prefix || ''}${value}` : placeholder}</p>
        </div>
        <button
          className="btn-ghost btn-sm"
          onClick={() => {
            setText(value || '');
            setEditing(true);
          }}
        >
          <Pencil className="h-3.5 w-3.5" /> {value ? 'Edit' : 'Add'}
        </button>
      </div>
    );
  }
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        if (await onSave(text.trim())) setEditing(false);
        setBusy(false);
      }}
    >
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <div className="flex gap-2">
        <input id={id} className="input py-2" maxLength={maxLength} value={text} onChange={(e) => setText(e.target.value)} autoFocus list={suggest ? `${id}-options` : undefined} placeholder={placeholder} />
        {suggest && (
          <datalist id={`${id}-options`}>
            {options.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        )}
        <button className="btn-primary btn-sm shrink-0" disabled={busy || text.trim() === (value || '')}>
          {busy && <Spinner className="h-3.5 w-3.5" />} Save
        </button>
        <button type="button" className="btn-ghost btn-sm shrink-0" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </div>
      {help && <p className="mt-1.5 text-xs text-ink-500">{help}</p>}
    </form>
  );
}

function ProfileFields() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [, run] = useSave();
  return (
    <>
      <EditableField
        id="username"
        label="Username"
        prefix="@"
        value={user.username}
        maxLength={30}
        help="Your profile link becomes /u/username. Letters, numbers, - and _."
        onSave={async (username) => {
          let saved = null;
          const ok = await run('username', async () => {
            const res = await api.users.updateMe({ username });
            saved = res.user?.username || null;
            if (saved !== username.toLowerCase()) throw new Error('Usernames are not available yet. Try again after the next update.');
            return res;
          }, 'Username updated');
          if (ok && saved) navigate(`/u/${saved}`, { replace: true });
          return ok;
        }}
      />
      <EditableField
        id="college"
        label="College"
        value={user.college}
        placeholder="Not set"
        maxLength={80}
        help="Puts you on your college's leaderboard. Leave empty to remove."
        suggest={(q) => api.users.colleges(q).then((r) => r.colleges.map((c) => c.name))}
        onSave={(college) => run('college', () => api.users.updateMe({ college }), college ? 'College saved' : 'College removed')}
      />
    </>
  );
}

function EmailPrefs() {
  const { user } = useAuth();
  const [busy, run] = useSave();
  const prefs = user.emailPrefs || {};
  const set = (key) => (value) => run(key, () => api.users.updateMe({ emailPrefs: { [key]: value } }));
  return (
    <div className="space-y-3">
      <p className="label mb-0">Emails</p>
      <Toggle checked={prefs.streak !== false} disabled={!!busy} onChange={set('streak')} label="Streak reminders" description="One evening email when your streak is about to break." />
      <Toggle checked={prefs.challenges !== false} disabled={!!busy} onChange={set('challenges')} label="Challenges" description="When someone challenges you to a 1v1." />
      <Toggle checked={prefs.weekly !== false} disabled={!!busy} onChange={set('weekly')} label="Weekly recap" description="Monday summary of your battles and rating." />
    </div>
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
          Confirm that <span className="font-mono text-white">@{username}</span> is yours. Only you can edit its profile ReadMe, so that is how we check.
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
          <span className="mr-2 font-mono text-ink-500">2</span>Open your{' '}
          <a href="https://leetcode.com/profile/" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">
            LeetCode profile settings
          </a>
          . Under <span className="text-white">General</span> you will see a <span className="text-white">ReadMe</span> option. Click it, add the code there
          (or append it to what is already written) and save.
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
  const verify = async () => {
    if (await run('verify', api.users.verifyLeetCode, 'LeetCode account verified and linked')) track('leetcode_linked');
  };

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
        <ProfileFields />
        <div className="border-t border-ink-800 pt-5">
          <LeetCodeAccount />
        </div>
        <div className="border-t border-ink-800 pt-5">
          <EmailPrefs />
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

/* ---------------- Badges and invites ---------------- */

function Badges({ player }) {
  const earned = new Map((player.badges || []).map((b) => [b.key, b]));
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="section-title">Badges</h2>
        <span className="font-mono text-xs text-ink-500">
          {earned.size}/{BADGES.length}
        </span>
      </div>
      <ul className="grid grid-cols-3 gap-3">
        {BADGES.map(({ key, name, description, icon: Icon }) => {
          const got = earned.get(key);
          return (
            <li key={key} title={`${name}: ${description}`} className={clsx('flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center', got ? 'border-brand-500/40 bg-brand-500/10' : 'border-ink-800 opacity-45')}>
              <Icon className={clsx('h-5 w-5', got ? 'text-brand-400' : 'text-ink-500')} />
              <span className={clsx('text-[11px] leading-tight', got ? 'text-white' : 'text-ink-400')}>{name}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function InviteCard({ user }) {
  return (
    <section className="card space-y-3 p-5">
      <h2 className="section-title flex items-center gap-2">
        Invite friends
        <InfoTip label="About invites" align="right">
          When a friend signs up through your link and finishes their first battle, you both get 100 XP. Bring 3 and you earn the Recruiter badge.
        </InfoTip>
      </h2>
      <p className="text-sm text-ink-400">
        Friends you brought: <span className="font-mono font-semibold text-white">{user.referralCount || 0}</span>
      </p>
      <ShareButtons kind="invite" compact url={shareUrl.app(user)} copyUrl={directUrl.app(user)} text="I battle friends on LeetCode problems on League of Coders. Join me:" />
    </section>
  );
}

function ChallengeButton({ player }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  if (!user) {
    return (
      <Link to="/login" state={{ from: location.pathname }} className="btn-primary btn-sm">
        <Swords className="h-3.5 w-3.5" /> Challenge
      </Link>
    );
  }
  if (!user.leetcode?.verified) {
    return (
      <Link to="/u/me" state={{ from: location.pathname }} className="btn-primary btn-sm" title="Verify your LeetCode account to challenge players">
        <Swords className="h-3.5 w-3.5" /> Challenge
      </Link>
    );
  }
  return (
    <button
      className="btn-primary btn-sm"
      disabled={busy}
      title="Opens a private 30-minute 1v1 lobby and invites them"
      onClick={async () => {
        setBusy(true);
        try {
          const { matchCode } = await api.users.challenge(profileHandle(player));
          track('direct_challenge_sent');
          toast.success(`Challenge sent to ${player.name.split(' ')[0]}`);
          navigate(`/m/${matchCode}`);
        } catch (err) {
          toast.error(err.message);
          setBusy(false);
        }
      }}
    >
      {busy ? <Spinner className="h-3.5 w-3.5" /> : <Swords className="h-3.5 w-3.5" />} Challenge
    </button>
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
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  // Profiles open by username (/u/aditi) or, for older links, by id.
  const targetId = id === 'me' ? user?.username || user?.id : id;
  const matches = (p) => !!p && !!targetId && (p.id === targetId || p.username === targetId.toLowerCase());
  const isMe = !!user && (targetId === user.id || targetId?.toLowerCase() === user.username || (data && matches(data.player) && data.player.id === user.id));

  useEffect(() => {
    if (!targetId) return;
    setError(null);
    api.users
      .get(targetId)
      .then(setData)
      .catch(setError);
  }, [targetId, user?.stats?.rating, user?.leetcode?.verified, user?.leetcode?.username, user?.name]);

  useEffect(() => {
    if (!data) return;
    document.title = `${data.player.name} · League of Coders`;
    // Old id links and /u/me settle on the readable /u/username address.
    if (data.player.username && id !== data.player.username && matches(data.player)) {
      navigate(`/u/${data.player.username}${window.location.search}`, { replace: true, state: window.history.state?.usr });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (id === 'me' && !authLoading && !user) return <Navigate to="/login" replace state={{ from: '/u/me' }} />;
  if (error) return <EmptyState title="Player not found" />;
  if (!data || !matches(data.player)) return <PageLoader />;

  const { player, history } = data;
  const s = player.stats;
  const tier = tierFor(s.rating);
  const { streak } = streakOf(player);
  const winRate = s.matches ? Math.round((s.wins / s.matches) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className={clsx('grid grid-cols-1 items-end gap-6', isMe && 'lg:grid-cols-[minmax(0,1fr)_380px]')}>
        <section className="min-w-0 pt-6 sm:pt-14">
          <div className="flex flex-wrap items-end gap-5">
            <span className="rounded-full ring-4 ring-ink-950/70 shadow-2xl">
              <Avatar name={player.name} src={player.avatar} size={104} />
            </span>
            <div className="min-w-0 flex-1">
              <p className={clsx('text-xs font-semibold uppercase tracking-[0.2em]', tier.color)}>{tier.name}</p>
              <h1 className="mt-1 flex items-center gap-2 font-display text-4xl font-bold tracking-tight text-white drop-shadow sm:text-5xl">
                {player.name} <VerifiedBadge verified={player.leetcode?.verified} />
              </h1>
              <p className="mt-2 text-sm text-ink-300">
                {player.username && (
                  <>
                    <span className="text-ink-200">@{player.username}</span>
                    <span className="text-ink-500"> · </span>
                  </>
                )}
                {player.college && (
                  <>
                    <Link to={`/league?tab=colleges&college=${encodeURIComponent(player.college)}`} className="inline-flex items-center gap-1 hover:text-white hover:underline">
                      <GraduationCap className="h-3.5 w-3.5" /> {player.college}
                    </Link>
                    <span className="text-ink-500"> · </span>
                  </>
                )}
                {player.leetcode ? (
                  <a href={`https://leetcode.com/u/${player.leetcode.username}/`} target="_blank" rel="noreferrer" className="hover:text-white hover:underline">
                    LeetCode @{player.leetcode.username}
                  </a>
                ) : (
                  'No LeetCode linked'
                )}
                <span className="text-ink-500"> · </span>joined {timeAgo(player.createdAt)}
                {streak > 0 && (
                  <>
                    <span className="text-ink-500"> · </span>
                    {streak}-day practice streak
                  </>
                )}
              </p>
            </div>
            <div className="flex items-end gap-4">
              {!isMe && <ChallengeButton player={player} />}
              <FriendButton playerId={player.id} />
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-ink-400">Rating</p>
                <p className="font-mono text-4xl font-bold text-white drop-shadow">{s.rating}</p>
              </div>
            </div>
          </div>
          <div className="card mt-8 grid grid-cols-2 divide-ink-800 sm:grid-cols-5 sm:divide-x">
            <Stat label="Battles" value={s.matches} />
            <Stat label="Wins" value={s.wins} />
            <Stat label="Win rate" value={`${winRate}%`} />
            <Stat label="Solved in battles" value={s.solved} />
            <Stat label="Points" value={s.points.toLocaleString()} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">{isMe ? 'Share your profile' : 'Share'}</span>
            <ShareButtons
              kind="profile"
              compact
              url={shareUrl.profile(profileHandle(player), user)}
              copyUrl={directUrl.profile(profileHandle(player), user)}
              text={
                isMe
                  ? `My League of Coders profile: ${tier.name}, rating ${s.rating}, ${s.wins} wins. Challenge me:`
                  : `${player.name} is ${tier.name} (${s.rating}) on League of Coders.`
              }
              image={imageUrl.profile(profileHandle(player))}
              imageName={`league-of-coders-${profileHandle(player)}.png`}
            />
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
                          won ? 'bg-gold/15 text-gold' : 'bg-ink-800 text-ink-300'
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

        <aside className="space-y-6">
          {isMe && <InviteCard user={user} />}
          <Badges player={player} />
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
