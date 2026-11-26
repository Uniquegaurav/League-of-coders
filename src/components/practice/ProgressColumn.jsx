import { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { CalendarDays, Flame } from 'lucide-react';
import { streakOf } from '../../lib/progression';
import { DifficultyBadge, ProgressBar } from '../ui';
import { DIFF_BAR, DIFF_SHORT, DIFF_TEXT, StatusSwitch } from './bits';

const DIFFS = ['Easy', 'Medium', 'Hard'];

function Ring({ solved, total }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  // Open at the bottom like a gauge: 300 of 360 degrees.
  const arc = c * (300 / 360);
  const pct = total ? Math.min(1, solved / total) : 0;
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 128 128" className="h-full w-full rotate-[120deg]">
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="7" strokeLinecap="round" className="stroke-white/[0.08]" strokeDasharray={`${arc} ${c}`} />
        {pct > 0 && (
          <circle
            cx="64"
            cy="64"
            r={r}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            className="stroke-brand-400 transition-[stroke-dasharray] duration-700"
            strokeDasharray={`${arc * pct} ${c}`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-display text-3xl font-bold leading-none text-white">
          {solved}
          <span className="text-base font-medium text-ink-500">/{total}</span>
        </p>
        <p className="mt-1.5 text-xs text-ink-400">Solved</p>
      </div>
    </div>
  );
}

export function ProgressCard({ title, breakdown, user, signedIn }) {
  const totals = DIFFS.reduce((a, d) => ({ solved: a.solved + (breakdown?.[d]?.solved || 0), total: a.total + (breakdown?.[d]?.total || 0) }), { solved: 0, total: 0 });
  const { streak, best } = streakOf(user);
  return (
    <section className="panel p-5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="section-title">Progress</h2>
        <p className="truncate text-xs text-ink-500" title={title}>
          {title}
        </p>
      </div>
      {!breakdown ? (
        <div className="h-36 animate-pulse rounded-2xl bg-white/[0.03]" />
      ) : (
        <div className="flex items-center gap-4">
          <Ring solved={signedIn ? totals.solved : 0} total={totals.total} />
          <div className="min-w-0 flex-1 space-y-2">
            {DIFFS.map((d) => {
              const v = breakdown[d] || { solved: 0, total: 0 };
              return (
                <div key={d} className="rounded-xl bg-white/[0.03] px-3 py-2">
                  <p className="flex items-baseline justify-between text-xs">
                    <span className={clsx('font-semibold', DIFF_TEXT[d])}>{DIFF_SHORT[d]}</span>
                    <span className="font-mono text-ink-300">
                      {signedIn ? v.solved : '–'}
                      <span className="text-ink-500">/{v.total}</span>
                    </span>
                  </p>
                  <ProgressBar value={signedIn ? v.solved : 0} max={v.total} className="mt-1.5 h-1" barClassName={DIFF_BAR[d]} />
                </div>
              );
            })}
          </div>
        </div>
      )}
      {signedIn ? (
        <p className="mt-4 flex items-center gap-1.5 border-t border-white/[0.06] pt-3 text-xs text-ink-400">
          <Flame className="h-3.5 w-3.5 text-fire" />
          <span className="font-semibold text-ink-200">
            {streak} day{streak === 1 ? '' : 's'}
          </span>
          streak
          <span className="text-ink-600">·</span> best {best}
        </p>
      ) : (
        <p className="mt-4 border-t border-white/[0.06] pt-3 text-xs text-ink-400">
          <Link to="/login" state={{ from: '/practice' }} className="text-brand-400 hover:underline">
            Sign in
          </Link>{' '}
          to track what you solve.
        </p>
      )}
    </section>
  );
}

export function DailyCard({ daily, done, busy, onToggle }) {
  if (!daily?.problem) return null;
  const p = daily.problem;
  return (
    <section className="panel p-5">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
        <CalendarDays className="h-3.5 w-3.5" /> Problem of the day
      </p>
      <Link to={`/problems/${p.slug}`} className="block font-medium leading-snug text-white hover:underline">
        {p.frontendId && <span className="text-ink-500">{p.frontendId}. </span>}
        {p.title}
      </Link>
      <div className="mt-3 flex items-center justify-between gap-2">
        <DifficultyBadge difficulty={p.difficulty} />
        {onToggle && (
          <label className="flex items-center gap-2 text-xs text-ink-400">
            {done ? <span className="text-easy">Solved</span> : 'Solved?'}
            <StatusSwitch checked={done} busy={busy} onChange={onToggle} label={done ? 'Mark as not solved' : 'Mark as solved'} />
          </label>
        )}
      </div>
    </section>
  );
}

export function TopicsCard({ progress, activeTopic, onTopic }) {
  const [all, setAll] = useState(false);
  if (!progress?.topics?.length) return null;
  const topics = all ? progress.topics : progress.topics.slice(0, 6);
  return (
    <section className="panel p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="section-title">Topics</h2>
        <p className="text-xs text-ink-500">Interview classics</p>
      </div>
      <div className="space-y-2.5">
        {topics.map((t) => (
          <button key={t.topic} type="button" onClick={() => onTopic(activeTopic === t.topic ? '' : t.topic)} className="group block w-full text-left">
            <p className="mb-1 flex justify-between text-xs">
              <span className={activeTopic === t.topic ? 'font-semibold text-white' : 'text-ink-300 group-hover:text-white'}>{t.topic}</span>
              <span className="font-mono text-ink-500">
                {t.solved}/{t.total}
              </span>
            </p>
            <ProgressBar value={t.solved} max={t.total} className="h-1" barClassName={activeTopic === t.topic ? 'bg-brand-400' : 'bg-brand-500/60'} />
          </button>
        ))}
      </div>
      {progress.topics.length > 6 && (
        <button type="button" className="mt-3 text-xs text-ink-400 hover:text-white" onClick={() => setAll((a) => !a)}>
          {all ? 'Show fewer' : `Show all ${progress.topics.length}`}
        </button>
      )}
    </section>
  );
}
