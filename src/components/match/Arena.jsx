import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Eye,
  FileText,
  Flag,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Radar,
  Square,
  Timer,
  Trophy,
  Users,
} from 'lucide-react';
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

// Layout choices (panels open, split position) are remembered per browser.
function usePref(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      return saved ?? initial;
    } catch {
      return initial;
    }
  });
  const set = (next) => {
    setValue(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  };
  return [value, set];
}

const SPLIT_MIN = 20;
const SPLIT_MAX = 80;

// The line between the problem and the editor: drag it, or use the arrows to give one side the room.
function SplitHandle({ containerRef, split, onChange }) {
  const [dragging, setDragging] = useState(false);

  const startDrag = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    setDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const move = (ev) => {
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      onChange(Math.round(Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, pct))));
    };
    const up = () => {
      setDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const arrow = 'rounded-md border border-ink-700 bg-ink-900 p-0.5 text-ink-400 shadow transition hover:border-brand-500 hover:text-white';
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      title="Drag to resize, double-click to reset"
      onPointerDown={startDrag}
      onDoubleClick={() => onChange(50)}
      className="group relative hidden w-3 shrink-0 cursor-col-resize justify-center xl:flex"
    >
      <div className={clsx('h-full transition-all', dragging ? 'w-0.5 bg-brand-500' : 'w-px bg-ink-800 group-hover:w-0.5 group-hover:bg-brand-500')} />
      <div className="absolute top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1" onPointerDown={(e) => e.stopPropagation()}>
        {split > 0 && (
          <button type="button" className={arrow} title={split > 50 ? 'Even split' : 'Expand editor'} onClick={() => onChange(split > 50 ? 50 : 0)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
        {split < 100 && (
          <button type="button" className={arrow} title={split < 50 ? 'Even split' : 'Expand problem'} onClick={() => onChange(split < 50 ? 50 : 100)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

const panelToggle = 'btn-ghost hidden p-1.5 text-ink-400 hover:text-white lg:inline-flex';

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
  const [leftOpen, setLeftOpen] = usePref('loc.arena.left', true);
  const [rightOpen, setRightOpen] = usePref('loc.arena.right', true);
  const [split, setSplit] = usePref('loc.arena.split', 50);
  const splitRef = useRef(null);
  const openSide = (panel) => {
    setSidePanel(panel);
    setRightOpen(true);
  };
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
        <aside
          className={clsx(
            'flex shrink-0 gap-2 overflow-x-auto border-b border-ink-800 p-3 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r',
            leftOpen ? 'lg:w-64' : 'lg:w-16 lg:items-center lg:px-2'
          )}
        >
          <div className={clsx('hidden items-center lg:flex', leftOpen ? 'justify-between pl-1' : 'justify-center')}>
            {leftOpen && <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Problems</span>}
            <button className={panelToggle} onClick={() => setLeftOpen(!leftOpen)} title={leftOpen ? 'Collapse problems' : 'Expand problems'}>
              {leftOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
          </div>
          {match.problems.map((p, i) => {
            const solved = mySolve(p.slug);
            const count = solvedBy(p.slug).length;
            return (
              <button
                key={p.slug}
                onClick={() => setSelected(i)}
                title={leftOpen ? undefined : `${letter(i)}. ${p.title}`}
                className={clsx(
                  'flex min-w-[200px] items-start gap-3 rounded-xl border p-3 text-left transition lg:min-w-0',
                  !leftOpen && 'lg:p-1.5',
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
                <span className={clsx('min-w-0 flex-1', !leftOpen && 'lg:hidden')}>
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
          <p className={clsx('hidden px-1 pt-2 text-[11px] leading-4 text-ink-500', leftOpen && 'lg:block')}>
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
          <div ref={splitRef} className="flex min-h-0 flex-1 flex-col xl:flex-row" style={{ '--split': `${split}%` }}>
            <div
              className={clsx(
                'min-h-0 min-w-0 p-4 sm:p-6 lg:overflow-y-auto xl:w-[var(--split)] xl:shrink-0',
                tab !== 'statement' && 'hidden xl:block',
                split === 0 && 'xl:hidden'
              )}
            >
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
            <SplitHandle containerRef={splitRef} split={split} onChange={setSplit} />
            <div className={clsx('h-[70vh] min-h-0 min-w-0 flex-1 p-3 lg:h-auto', tab !== 'code' && 'hidden xl:block', split === 100 && 'xl:hidden')}>
              {problem && detail && <CodePad slug={problem.slug} snippets={detail.snippets} storageScope={match.code} />}
            </div>
          </div>
        </section>

        {/* Scoreboard + chat */}
        <aside
          className={clsx(
            'flex h-[480px] shrink-0 flex-col gap-3 border-t border-ink-800 p-3 lg:h-auto lg:border-l lg:border-t-0',
            rightOpen ? 'lg:w-80' : 'lg:w-14 lg:items-center lg:px-2'
          )}
        >
          {/* Collapsed rail: reopen straight into the scoreboard or the chat. */}
          {!rightOpen && (
            <div className="hidden flex-col items-center gap-2 lg:flex">
              <button className={panelToggle} onClick={() => setRightOpen(true)} title="Expand scoreboard and chat">
                <PanelRightOpen className="h-4 w-4" />
              </button>
              <button className={panelToggle} onClick={() => openSide('board')} title="Scoreboard">
                <Trophy className="h-4 w-4" />
              </button>
              <button className={panelToggle} onClick={() => openSide('chat')} title="Room chat">
                <MessageSquare className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className={clsx('flex min-h-0 flex-1 flex-col gap-3', !rightOpen && 'lg:hidden')}>
            <div className="flex items-center gap-1">
              <div className="flex flex-1 gap-1 2xl:hidden">
                {[
                  ['board', 'Scoreboard'],
                  ['chat', 'Chat'],
                ].map(([key, label]) => (
                  <button key={key} onClick={() => setSidePanel(key)} className={clsx('btn btn-sm flex-1', sidePanel === key ? 'bg-ink-800 text-white' : 'text-ink-400')}>
                    {label}
                  </button>
                ))}
              </div>
              <button className={clsx(panelToggle, 'ml-auto')} onClick={() => setRightOpen(false)} title="Collapse scoreboard and chat">
                <PanelRightClose className="h-4 w-4" />
              </button>
            </div>
            <Scoreboard match={match} userId={user?.id} className={clsx('min-h-0 overflow-y-auto 2xl:block', sidePanel !== 'board' && 'hidden')} />
            <ChatPanel code={match.code} messages={messages} className={clsx('min-h-0 flex-1 2xl:flex', sidePanel !== 'chat' && 'hidden')} />
          </div>
        </aside>
      </div>
    </div>
  );
}
