import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'sonner';
import { Check, ChevronLeft, ChevronRight, Search, Swords } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { streakOf } from '../lib/progression';
import { DifficultyBadge, EmptyState, ProgressBar, Spinner } from '../components/ui';

const LIMIT = 30;
const TABS = [
  ['todo', 'To solve'],
  ['solved', 'Solved'],
  ['all', 'All'],
];

function Pager({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 border-t border-ink-800 px-4 py-3">
      <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft className="h-4 w-4" /> Prev
      </button>
      <span className="font-mono text-sm text-ink-400">
        {page} / {pages}
      </span>
      <button className="btn-secondary btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

const DIFF_BAR = { Easy: 'bg-easy', Medium: 'bg-medium', Hard: 'bg-hard' };

function ProgressPanel({ progress, user, activeTopic, onTopic }) {
  if (!progress) return null;
  const { streak, best } = streakOf(user);
  return (
    <section className="card p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="section-title">Your progress</h2>
        <p className="text-sm text-ink-400">
          Streak <span className="font-semibold text-ink-200">{streak} day{streak === 1 ? '' : 's'}</span>
          <span className="text-ink-600"> · </span>best {best}
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="space-y-3">
          {['Easy', 'Medium', 'Hard'].map((d) => {
            const v = progress.byDifficulty?.[d] || { solved: 0, total: 0 };
            return (
              <div key={d}>
                <p className="mb-1 flex justify-between text-xs">
                  <span className="text-ink-300">{d}</span>
                  <span className="font-mono text-ink-500">
                    {v.solved}/{v.total}
                  </span>
                </p>
                <ProgressBar value={v.solved} max={v.total} barClassName={DIFF_BAR[d]} />
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {progress.topics.map((t) => (
            <button key={t.topic} onClick={() => onTopic(activeTopic === t.topic ? '' : t.topic)} className="group text-left">
              <p className="mb-1 flex justify-between text-xs">
                <span className={activeTopic === t.topic ? 'font-semibold text-white' : 'text-ink-300 group-hover:text-white'}>{t.topic}</span>
                <span className="font-mono text-ink-500">
                  {t.solved}/{t.total}
                </span>
              </p>
              <ProgressBar value={t.solved} max={t.total} barClassName={activeTopic === t.topic ? 'bg-brand-400' : 'bg-brand-500/70'} />
            </button>
          ))}
        </div>
      </div>
      <p className="mt-4 text-xs text-ink-500">Counts cover the Interview classics set. Click a topic to filter the list below.</p>
    </section>
  );
}

function DailyProblem({ daily, done, onMark }) {
  if (!daily?.problem) return null;
  const p = daily.problem;
  return (
    <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="label mb-1">Problem of the day</p>
        <Link to={`/problems/${p.slug}`} className="font-semibold text-white hover:underline">
          {p.frontendId && <span className="text-ink-500">{p.frontendId}. </span>}
          {p.title}
        </Link>
        <div className="mt-1.5 flex items-center gap-2">
          <DifficultyBadge difficulty={p.difficulty} />
          <span className="truncate text-xs text-ink-500">{p.tags?.slice(0, 3).join(' · ')}</span>
        </div>
      </div>
      {done ? (
        <span className="text-sm font-semibold text-easy">Solved today</span>
      ) : (
        <div className="flex shrink-0 gap-2">
          <Link to={`/problems/${p.slug}`} className="btn-secondary">
            Open
          </Link>
          {onMark && (
            <button className="btn-primary" onClick={() => onMark(p.slug)}>
              Mark solved
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function SolvedCheckbox({ checked, disabled, busy, onClick, title }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={title}
      title={title}
      disabled={disabled || busy}
      onClick={onClick}
      className={clsx(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
        checked ? 'border-easy bg-easy text-ink-950' : 'border-ink-500 bg-ink-950/60 hover:border-easy',
        disabled && 'cursor-not-allowed opacity-40',
        busy && 'opacity-60'
      )}
    >
      {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
    </button>
  );
}

function ProblemRow({ problem, done, canTrack, busy, onToggle }) {
  return (
    <li className={clsx('flex items-center gap-4 px-4 py-3 transition-colors', done ? 'bg-easy/[0.04]' : 'hover:bg-ink-850/60')}>
      <SolvedCheckbox
        checked={done}
        busy={busy}
        disabled={!canTrack}
        onClick={() => onToggle(problem.slug)}
        title={canTrack ? (done ? 'Mark as not solved' : 'Mark as solved') : 'Sign in to track progress'}
      />
      <Link to={`/problems/${problem.slug}`} className="group min-w-0 flex-1">
        <p className={clsx('truncate text-sm font-medium', done ? 'text-ink-400' : 'text-ink-200 group-hover:text-white')}>
          {problem.frontendId && <span className="text-ink-500">{problem.frontendId}. </span>}
          {problem.title}
          {done && <span className="ml-2 text-xs font-semibold text-easy">Solved</span>}
        </p>
        <p className="mt-0.5 truncate text-xs text-ink-500">{problem.tags.slice(0, 4).join(' · ')}</p>
      </Link>
      {problem.acRate != null && <span className="hidden font-mono text-xs text-ink-500 sm:block">{problem.acRate.toFixed(1)}%</span>}
      <DifficultyBadge difficulty={problem.difficulty} className="w-16 justify-center" />
    </li>
  );
}

export default function Practice() {
  const { user, setUser } = useAuth();
  const [filters, setFilters] = useState({ pool: 'curated', difficulty: '', topic: '', search: '' });
  const [tab, setTab] = useState('todo');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState([]);
  const [debounced, setDebounced] = useState('');
  const [solved, setSolved] = useState(() => new Set());
  const [busy, setBusy] = useState(() => new Set());
  const [counts, setCounts] = useState(null);
  const [countsTick, setCountsTick] = useState(0);
  const [daily, setDaily] = useState(null);
  const [progress, setProgress] = useState(null);

  // Signed-out visitors have no solved list, so they always browse everything.
  const view = user ? tab : 'all';

  useEffect(() => {
    document.title = 'Practice · League of Coders';
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(filters.search), 300);
    return () => clearTimeout(id);
  }, [filters.search]);

  useEffect(() => {
    api.problems.topics(filters.pool).then((r) => setTopics(r.topics)).catch(() => {});
  }, [filters.pool]);

  useEffect(() => {
    if (!user) {
      setSolved(new Set());
      return;
    }
    api.users
      .solved()
      .then((r) => setSolved(new Set(r.slugs)))
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    api.problems.daily().then(setDaily).catch(() => setDaily(null));
  }, [user?.id, countsTick]);

  useEffect(() => {
    if (!user) {
      setProgress(null);
      return;
    }
    api.users.progress().then(setProgress).catch(() => setProgress(null));
  }, [user?.id, countsTick]);

  const query = {
    pool: filters.pool,
    difficulty: filters.difficulty || undefined,
    topic: filters.topic || undefined,
    search: debounced || undefined,
  };
  const queryKey = JSON.stringify(query);

  // The list only refetches on filter, tab or page changes, so a row you just ticked stays where it is.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const extra = view === 'todo' ? { hideSolved: true } : view === 'solved' ? { onlySolved: true } : {};
    api.problems
      .list({ ...query, ...extra, page, limit: LIMIT })
      .then((r) => !cancelled && setData(r))
      .catch((err) => !cancelled && toast.error(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, view, page, user?.id]);

  // Tab counts, refreshed after every tick without touching the visible list.
  useEffect(() => {
    if (!user) {
      setCounts(null);
      return undefined;
    }
    let cancelled = false;
    Promise.all([
      api.problems.list({ ...query, hideSolved: true, limit: 1 }),
      api.problems.list({ ...query, onlySolved: true, limit: 1 }),
      api.problems.list({ ...query, limit: 1 }),
    ])
      .then(([todo, done, all]) => !cancelled && setCounts({ todo: todo.total, solved: done.total, all: all.total }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, user?.id, countsTick]);

  const update = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const setMark = async (slug, next, { quiet = false } = {}) => {
    setBusy((b) => new Set(b).add(slug));
    setSolved((s) => {
      const copy = new Set(s);
      if (next) copy.add(slug);
      else copy.delete(slug);
      return copy;
    });
    try {
      const res = await api.users.setSolved(slug, next);
      if (res?.practice) setUser((u) => (u ? { ...u, practice: res.practice, solvedCount: Math.max(0, (u.solvedCount || 0) + (next ? 1 : -1)) } : u));
      setCountsTick((n) => n + 1);
      if (!quiet) {
        toast.success(next ? 'Marked as solved' : 'Marked as not solved', {
          action: { label: 'Undo', onClick: () => setMark(slug, !next, { quiet: true }) },
        });
      }
    } catch (err) {
      setSolved((s) => {
        const copy = new Set(s);
        if (next) copy.delete(slug);
        else copy.add(slug);
        return copy;
      });
      toast.error(err.message);
    } finally {
      setBusy((b) => {
        const copy = new Set(b);
        copy.delete(slug);
        return copy;
      });
    }
  };

  const toggle = (slug) => setMark(slug, !solved.has(slug));
  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Practice</h1>
          <p className="mt-1 max-w-2xl text-ink-400">
            Warm up on the same problem bank battles draw from. Tick a problem once LeetCode accepts it. Battles can skip solved problems when you opt in.
          </p>
        </div>
        <Link to="/new?mode=battle" className="btn-primary">
          <Swords className="h-4 w-4" /> Turn it into a battle
        </Link>
      </div>

      <DailyProblem daily={daily} done={daily?.done || (daily?.problem && solved.has(daily.problem.slug))} onMark={user ? (slug) => setMark(slug, true) : null} />

      {user && <ProgressPanel progress={progress} user={user} activeTopic={filters.topic} onTopic={(topic) => update({ topic, pool: 'curated' })} />}

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-800 p-4">
          <div className="inline-flex rounded-xl border border-ink-700 bg-ink-950/60 p-1">
            {[
              ['curated', 'Interview classics'],
              ['all', 'All LeetCode'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => update({ pool: value, topic: '' })}
                className={clsx('rounded-lg px-3 py-1.5 text-sm font-medium', filters.pool === value ? 'bg-ink-700 text-white' : 'text-ink-400 hover:text-white')}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input className="input pl-10" placeholder="Search by title or number" value={filters.search} onChange={(e) => update({ search: e.target.value })} />
          </div>
          <select className="input w-auto min-w-[10rem]" value={filters.difficulty} onChange={(e) => update({ difficulty: e.target.value })} aria-label="Difficulty">
            <option value="">All difficulties</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
          <select className="input w-auto min-w-[10rem] max-w-[16rem]" value={filters.topic} onChange={(e) => update({ topic: e.target.value })} aria-label="Topic">
            <option value="">All topics</option>
            {topics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-ink-800 px-4">
          {user ? (
            <div className="flex gap-1" role="tablist">
              {TABS.map(([key, label]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => {
                    setTab(key);
                    setPage(1);
                  }}
                  className={clsx(
                    '-mb-px border-b-2 px-3 py-3 text-sm font-medium transition-colors',
                    tab === key ? 'border-brand-500 text-white' : 'border-transparent text-ink-400 hover:text-ink-200'
                  )}
                >
                  {label}
                  {counts && <span className={clsx('ml-2 font-mono text-xs', key === 'solved' ? 'text-easy' : 'text-ink-500')}>{counts[key]}</span>}
                </button>
              ))}
            </div>
          ) : (
            <p className="py-3 text-sm text-ink-400">Problem bank</p>
          )}
          {loading && data && <Spinner className="h-4 w-4 text-ink-500" />}
        </div>

        {loading && !data ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6 text-ink-500" />
          </div>
        ) : data?.problems.length ? (
          <ul className={clsx('divide-y divide-ink-800/70', loading && 'opacity-60')}>
            {data.problems.map((p) => (
              <ProblemRow key={p.slug} problem={p} done={solved.has(p.slug)} busy={busy.has(p.slug)} canTrack={!!user} onToggle={toggle} />
            ))}
          </ul>
        ) : (
          <div className="p-6">
            <EmptyState icon={Search} title={view === 'solved' ? 'Nothing solved for these filters yet' : 'No problems match these filters'}>
              {view === 'solved' && 'Tick a problem in To solve and it shows up here.'}
            </EmptyState>
          </div>
        )}
        <Pager page={page} pages={pages} onPage={setPage} />
      </section>
    </div>
  );
}
