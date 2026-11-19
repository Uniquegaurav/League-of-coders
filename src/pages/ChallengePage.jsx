import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'sonner';
import { ArrowRight, Clock, Link2, SearchX, Target, Trophy } from 'lucide-react';
import { api } from '../lib/api';
import { track } from '../lib/analytics';
import { directUrl, imageUrl, shareUrl } from '../lib/share';
import { timeAgo, leetcodeUrl } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import usePolling from '../hooks/usePolling';
import ShareButtons from '../components/share/ShareButtons';
import { Avatar, DifficultyBadge, EmptyState, InfoTip, PageLoader, Spinner } from '../components/ui';
import { ProblemMix } from '../components/match/MatchCard';

function Action({ challenge, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const mine = challenge.mine;
  const isCreator = user && challenge.creator.id === user.id;

  const accept = async () => {
    setBusy(true);
    try {
      const { matchCode } = await api.challenges.attempt(challenge.code);
      track('challenge_attempt_started', { code: challenge.code });
      navigate(`/m/${matchCode}`);
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <Link to="/login" state={{ from: location.pathname }} className="btn-primary px-6 py-3 text-base">
        <Target className="h-5 w-5" /> Sign up to accept
      </Link>
    );
  }
  if (isCreator) return null;
  if (mine?.status === 'playing') {
    return (
      <Link to={`/m/${mine.matchCode}`} className="btn-primary px-6 py-3 text-base">
        Continue your attempt <ArrowRight className="h-5 w-5" />
      </Link>
    );
  }
  if (mine?.status === 'done') {
    const beat = mine.score > challenge.creator.score;
    return (
      <p className={clsx('rounded-xl border px-4 py-3 text-sm', beat ? 'border-easy/40 bg-easy/10 text-easy' : 'border-ink-700 bg-ink-900/70 text-ink-300')}>
        You scored <span className="font-mono font-bold">{mine.score}</span>.{' '}
        {beat ? `You beat ${challenge.creator.name.split(' ')[0]}.` : `${challenge.creator.name.split(' ')[0]} still leads.`}
      </p>
    );
  }
  if (!user.leetcode?.verified) {
    return (
      <Link to="/u/me#leetcode" state={{ from: location.pathname }} className="btn-primary px-6 py-3 text-base">
        <Link2 className="h-5 w-5" /> {user.leetcode ? 'Verify LeetCode to accept' : 'Link LeetCode to accept'}
      </Link>
    );
  }
  return (
    <button className="btn-primary px-6 py-3 text-base" disabled={busy} onClick={accept}>
      {busy ? <Spinner className="h-5 w-5" /> : <Target className="h-5 w-5" />} Accept challenge
    </button>
  );
}

export default function ChallengePage() {
  const { code: raw } = useParams();
  const code = raw.toUpperCase();
  const { user } = useAuth();
  const { data, error, loading } = usePolling(() => api.challenges.get(code).then((r) => r.challenge), 15000, [code, user?.id]);

  useEffect(() => {
    if (data) document.title = `Beat ${data.creator.name}'s ${data.creator.score} · League of Coders`;
  }, [data]);

  if (loading && !data) return <PageLoader />;
  if (error && !data) {
    return (
      <EmptyState icon={SearchX} title="Challenge not found" action={<Link to="/" className="btn-primary btn-sm">Back to Compete</Link>}>
        Check the link. Challenges are created from the results screen after a battle or solo test.
      </EmptyState>
    );
  }

  const c = data;
  const first = c.creator.name.split(' ')[0];

  return (
    <div className="space-y-8">
      <section className="grid items-end gap-8 pt-6 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">
            Beat my score
            <InfoTip label="How challenges work">
              Everyone gets the same problems and the same clock, and plays solo whenever they like. Solves are read from your accepted LeetCode
              submissions, scored like a solo test. Problem titles stay hidden until you finish your attempt. One attempt per player.
            </InfoTip>
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-white drop-shadow sm:text-5xl">
            {first} scored <span className="text-brand-400">{c.creator.score}</span>. Can you beat it?
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-300">
            <ProblemMix settings={c.mix} />
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-ink-500" /> {c.durationMin} min
            </span>
            <span className="text-ink-500">·</span>
            <span>
              {c.leaderboard.length} score{c.leaderboard.length === 1 ? '' : 's'}
              {c.playing > 0 && `, ${c.playing} playing now`}
            </span>
          </div>
          <div className="mt-8">
            <Action challenge={c} user={user} />
          </div>
        </div>
        <div className="card space-y-4 p-5">
          <img
            src={imageUrl.challenge(c.code)}
            alt=""
            className="aspect-[1200/630] w-full rounded-xl border border-ink-800 bg-ink-950 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div>
            <p className="section-title">Send it to friends</p>
            <p className="mt-1 text-sm text-ink-400">They can play any time. Nobody needs to be online together.</p>
          </div>
          <ShareButtons
            kind="challenge"
            url={shareUrl.challenge(c.code, user)}
            copyUrl={directUrl.challenge(c.code, user)}
            text={`${first} scored ${c.creator.score} on this LeetCode set. Can you beat it?`}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-w-0">
          <h2 className="section-title mb-4">Scores</h2>
          <div className="card divide-y divide-ink-800/70">
            {c.leaderboard.map((row) => (
              <div key={row.id} className={clsx('flex items-center gap-4 px-5 py-3.5', row.id === user?.id && 'bg-brand-500/5')}>
                <span className="w-6 text-center font-mono text-sm text-ink-400">{row.rank === 1 ? <Trophy className="mx-auto h-4 w-4 text-gold" /> : row.rank}</span>
                <Avatar name={row.name} src={row.avatar} size={32} />
                <div className="min-w-0 flex-1">
                  <Link to={`/u/${row.id}`} className="block truncate font-medium text-white hover:underline">
                    {row.name}
                  </Link>
                  <p className="text-xs text-ink-500">
                    {row.creator ? 'Set the score' : `Played ${timeAgo(row.finishedAt)}`} · {row.solved} solved
                  </p>
                </div>
                <span className="font-mono font-bold text-white">{row.score}</span>
              </div>
            ))}
          </div>
        </section>

        <aside>
          <section className="card p-5">
            <h2 className="section-title mb-3">Problems</h2>
            {c.problems.length ? (
              <ul className="space-y-2">
                {c.problems.map((p) => (
                  <li key={p.slug} className="flex items-center gap-3 text-sm">
                    <Link to={`/problems/${p.slug}`} className="min-w-0 flex-1 truncate text-ink-200 hover:underline">
                      {p.title}
                    </Link>
                    <DifficultyBadge difficulty={p.difficulty} />
                    <a href={leetcodeUrl(p.slug)} target="_blank" rel="noreferrer" className="text-xs text-ink-500 hover:text-white">
                      LC ↗
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-400">Hidden until you finish your attempt.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
