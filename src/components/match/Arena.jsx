import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { CheckCircle2, Code2, Eye, FileText, Flag, Radar, Square, Timer, Users } from 'lucide-react';
import { api } from '../../lib/api';
import { clock } from '../../lib/format';
import { useTicker } from '../../hooks/useMatchRoom';
import { DifficultyBadge, Spinner } from '../ui';
import useProblem from '../problem/useProblem';
import ProblemStatement from '../problem/ProblemStatement';
import CodePad from '../problem/CodePad';
import ChatPanel from './ChatPanel';
import Scoreboard, { letter } from './Scoreboard';

const SPEED_BONUS = 0.5;
const FIRST_SOLVE = 25;

function worthNow(problem, match, nowMs, anyoneSolved) {
  const start = new Date(match.startedAt).getTime();
  const end = new Date(match.endsAt).getTime();
  const remaining = Math.min(1, Math.max(0, (end - nowMs) / (end - start)));
  return problem.basePoints + Math.round(problem.basePoints * SPEED_BONUS * remaining) + (anyoneSolved ? 0 : FIRST_SOLVE);
}

function Countdown({ ms }) {
  const n = Math.max(1, Math.ceil(ms / 1000));
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink-950/90 backdrop-blur">
      <p className="text-sm uppercase tracking-[0.4em] text-ink-400">Battle starts in</p>
      <p key={n} className="animate-pop-in font-display text-[10rem] font-bold leading-none text-white">
        {n}
      </p>
      <p className="text-ink-400">Problems unlock for everyone at the same moment</p>
    </div>
  );
}

function CheckButton({ code }) {
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return undefined;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const check = async () => {
    setBusy(true);
    try {
      const { added } = await api.matches.check(code);
      if (added.length) toast.success(`Verified ${added.length} new solve${added.length > 1 ? 's' : ''}! 🎉`);
      else toast('No new accepted submissions yet', { description: 'Make sure you submitted on LeetCode and it was Accepted.' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      setCooldown(8);
    }
  };

  return (
    <button className="btn-secondary btn-sm" onClick={check} disabled={busy || cooldown > 0}>
      {busy ? <Spinner className="h-3.5 w-3.5" /> : <Radar className="h-3.5 w-3.5" />}
      {cooldown ? `Check again in ${cooldown}s` : 'Check my submissions'}
    </button>
  );
}

export default function Arena({ match, messages, me, user, now }) {
  useTicker(500);
  const nowMs = now();
  const startMs = new Date(match.startedAt).getTime();
  const endMs = new Date(match.endsAt).getTime();
  const remaining = endMs - nowMs;
  const isHost = user && match.host === user.id;
  const playing = me && !me.left;

  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState('statement');
  const [sidePanel, setSidePanel] = useState('board');
  const problem = match.problems[selected];
  const { problem: detail, loading, error } = useProblem(problem?.slug);

  const solvedBy = (slug) => match.participants.filter((p) => p.solves.some((s) => s.slug === slug));
  const mySolve = (slug) => me?.solves.find((s) => s.slug === slug);
  const myRank = me ? match.participants.findIndex((p) => p.id === me.id) + 1 : null;

  const forfeit = async () => {
    if (!window.confirm('Forfeit this battle? Your current score is kept but you can’t solve more.')) return;
    try {
      await api.matches.leave(match.code);
    } catch (err) {
      toast.error(err.message);
    }
  };
  const endEarly = async () => {
    if (!window.confirm('End the battle for everyone now?')) return;
    try {
      await api.matches.end(match.code);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (match.status === 'countdown' || nowMs < startMs) return <Countdown ms={startMs - nowMs} />;

  return (
    <div className="flex flex-col lg:h-[calc(100vh-4rem)]">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-ink-800 bg-ink-900/80 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-display font-semibold text-white">{match.name}</p>
          <p className="font-mono text-xs text-ink-500">{match.code}</p>
        </div>
        <div
          className={clsx(
            'flex items-center gap-2 rounded-xl border px-3 py-1.5 font-mono text-xl font-bold tabular-nums',
            remaining < 60000 ? 'animate-pulse border-hard/50 text-hard' : remaining < 5 * 60000 ? 'border-warn/40 text-warn' : 'border-ink-700 text-white'
          )}
        >
          <Timer className="h-5 w-5" /> {clock(remaining)}
        </div>
        {me ? (
          <div className="flex items-center gap-4 text-sm">
            <span>
              <span className="text-ink-400">Score </span>
              <span className="font-mono font-bold text-white">{me.score}</span>
            </span>
            <span>
              <span className="text-ink-400">Rank </span>
              <span className="font-mono font-bold text-white">
                #{myRank}/{match.participants.length}
              </span>
            </span>
            <span>
              <span className="text-ink-400">Solved </span>
              <span className="font-mono font-bold text-white">
                {me.solves.length}/{match.problems.length}
              </span>
            </span>
          </div>
        ) : (
          <span className="chip">
            <Eye className="h-3 w-3" /> Spectating
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {playing && <CheckButton code={match.code} />}
          {playing && (
            <button className="btn-ghost btn-sm" onClick={forfeit}>
              <Flag className="h-3.5 w-3.5" /> Forfeit
            </button>
          )}
          {isHost && (
            <button className="btn-danger btn-sm" onClick={endEarly}>
              <Square className="h-3.5 w-3.5" /> End battle
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Problem list */}
        <aside className="flex shrink-0 gap-2 overflow-x-auto border-b border-ink-800 p-3 lg:w-64 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r">
          {match.problems.map((p, i) => {
            const solved = mySolve(p.slug);
            const count = solvedBy(p.slug).length;
            return (
              <button
                key={p.slug}
                onClick={() => setSelected(i)}
                className={clsx(
                  'flex min-w-[200px] items-start gap-3 rounded-xl border p-3 text-left transition lg:min-w-0',
                  selected === i ? 'border-brand-500/60 bg-brand-500/10' : 'border-ink-800 hover:border-ink-600 hover:bg-ink-850'
                )}
              >
                <span
                  className={clsx(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold',
                    solved ? 'bg-easy text-ink-950' : 'bg-ink-800 text-ink-300'
                  )}
                >
                  {solved ? <CheckCircle2 className="h-4 w-4" /> : letter(i)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink-200">{p.title}</span>
                  <span className="mt-1 flex items-center gap-2">
                    <DifficultyBadge difficulty={p.difficulty} />
                    <span className="font-mono text-[11px] text-ink-400">
                      {solved ? `+${solved.points}` : `${worthNow(p, match, nowMs, count > 0)} pts`}
                    </span>
                  </span>
                  <span className="mt-1 flex items-center gap-1 text-[11px] text-ink-500">
                    <Users className="h-3 w-3" /> {count} solved
                  </span>
                </span>
              </button>
            );
          })}
          <p className="hidden px-1 pt-2 text-[11px] leading-4 text-ink-500 lg:block">
            Submit on LeetCode. Accepted submissions are picked up about every 20s, or hit “Check my submissions”.
          </p>
        </aside>

        {/* Problem + editor */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1 border-b border-ink-800 px-3 py-2 xl:hidden">
            {[
              ['statement', 'Problem', FileText],
              ['code', 'Code', Code2],
            ].map(([key, label, Icon]) => (
              <button key={key} onClick={() => setTab(key)} className={clsx('btn-sm btn', tab === key ? 'bg-ink-800 text-white' : 'text-ink-400')}>
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
          <div className="grid min-h-0 flex-1 xl:grid-cols-2">
            <div className={clsx('min-h-0 p-4 sm:p-6 lg:overflow-y-auto', tab !== 'statement' && 'hidden xl:block')}>
              {problem && (
                <ProblemStatement
                  slug={problem.slug}
                  problem={detail}
                  loading={loading}
                  error={error}
                  label={letter(selected)}
                  header={
                    mySolve(problem.slug) && (
                      <div className="mb-4 flex items-center gap-2 rounded-xl border border-easy/30 bg-easy/10 px-4 py-2.5 text-sm text-easy">
                        <CheckCircle2 className="h-4 w-4" /> Solved for +{mySolve(problem.slug).points} points
                        {mySolve(problem.slug).firstSolve && ' · first solve'}
                      </div>
                    )
                  }
                />
              )}
            </div>
            <div className={clsx('h-[70vh] min-h-0 p-3 lg:h-auto xl:border-l xl:border-ink-800', tab !== 'code' && 'hidden xl:block')}>
              {problem && detail && <CodePad slug={problem.slug} snippets={detail.snippets} storageScope={match.code} />}
            </div>
          </div>
        </section>

        {/* Scoreboard + chat */}
        <aside className="flex h-[480px] shrink-0 flex-col gap-3 border-t border-ink-800 p-3 lg:h-auto lg:w-80 lg:border-l lg:border-t-0">
          <div className="flex gap-1 2xl:hidden">
            {[
              ['board', 'Scoreboard'],
              ['chat', 'Chat'],
            ].map(([key, label]) => (
              <button key={key} onClick={() => setSidePanel(key)} className={clsx('btn btn-sm flex-1', sidePanel === key ? 'bg-ink-800 text-white' : 'text-ink-400')}>
                {label}
              </button>
            ))}
          </div>
          <Scoreboard match={match} userId={user?.id} className={clsx('min-h-0 overflow-y-auto 2xl:block', sidePanel !== 'board' && 'hidden')} />
          <ChatPanel code={match.code} messages={messages} className={clsx('min-h-0 flex-1 2xl:flex', sidePanel !== 'chat' && 'hidden')} />
        </aside>
      </div>
    </div>
  );
}
