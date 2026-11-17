import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'sonner';
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, Search, Swords } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { streakOf } from '../lib/progression';
import { DifficultyBadge, EmptyState, ProgressBar, Spinner } from '../components/ui';

const LIMIT = 30;
const SOLVED_LIMIT = 20;

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

function ProblemRow({ problem, done, canTrack, onToggle }) {
  return (
    <li className="flex items-center gap-4 px-4 py-3 hover:bg-ink-850/60">
      <button
        disabled={!canTrack}
        onClick={() => onToggle(problem.slug)}
        title={canTrack ? (done ? 'Move back to the problem bank' : 'Mark as solved') : 'Sign in to track progress'}
        className={clsx('shrink-0 rounded-full p-1', done ? 'text-easy' : 'text-ink-600 hover:text-ink-400')}
      >
        {done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
      </button>
      <Link to={`/problems/${problem.slug}`} className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-200 hover:text-white">
          {problem.frontendId && <span className="text-ink-500">{problem.frontendId}. </span>}
          {problem.title}
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
  const [page, setPage] = useState(1);
  const [solvedPage, setSolvedPage] = useState(1);
  const [data, setData] = useState(null);
  const [solvedData, setSolvedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [solvedLoading, setSolvedLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const [debounced, setDebounced] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [daily, setDaily] = useState(null);
  const [progress, setProgress] = useState(null);

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
    api.problems.daily().then(setDaily).catch(() => setDaily(null));
  }, [user?.id, refresh]);

  useEffect(() => {
    if (!user) {
      setProgress(null);
      return;
    }
    api.users.progress().then(setProgress).catch(() => setProgress(null));
  }, [user?.id, refresh]);

  const query = {
    pool: filters.pool,
    difficulty: filters.difficulty || undefined,
    topic: filters.topic || undefined,
    search: debounced || undefined,
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.problems
      .list({ ...query, hideSolved: user ? true : undefined, page, limit: LIMIT })
      .then((r) => !cancelled && setData(r))
      .catch((err) => !cancelled && toast.error(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filters.pool, filters.difficulty, filters.topic, debounced, page, user?.id, refresh]);

  useEffect(() => {
    if (!user) {
      setSolvedData(null);
      return undefined;
    }
    let cancelled = false;
    setSolvedLoading(true);
    api.problems
      .list({ ...query, onlySolved: true, page: solvedPage, limit: SOLVED_LIMIT })
      .then((r) => !cancelled && setSolvedData(r))
      .catch((err) => !cancelled && toast.error(err.message))
      .finally(() => !cancelled && setSolvedLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filters.pool, filters.difficulty, filters.topic, debounced, solvedPage, user?.id, refresh]);

  const update = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
    setSolvedPage(1);
  };

  const toggleSolved = async (slug) => {
    const inSolved = (solvedData?.problems || []).some((p) => p.slug === slug);
    try {
      const res = await api.users.setSolved(slug, !inSolved);
      if (res?.practice) setUser((u) => (u ? { ...u, practice: res.practice } : u));
      setRefresh((n) => n + 1);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;
  const solvedPages = solvedData ? Math.max(1, Math.ceil(solvedData.total / SOLVED_LIMIT)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Practice</h1>
          <p className="mt-1 max-w-2xl text-ink-400">
            Warm up on the same problem bank battles draw from. Mark a problem solved and it leaves this list. Battles can skip it when you opt in.
          </p>
        </div>
        <Link to="/new?mode=battle" className="btn-primary">
          <Swords className="h-4 w-4" /> Turn it into a battle
        </Link>
      </div>

      <DailyProblem daily={daily} done={daily?.done} onMark={user ? toggleSolved : null} />

      {user && <ProgressPanel progress={progress} user={user} activeTopic={filters.topic} onTopic={(topic) => update({ topic, pool: 'curated' })} />}

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <div className="inline-flex rounded-xl border border-ink-700 bg-ink-950/60 p-1">
          {[
            ['curated', 'Interview classics'],
            ['all', 'All LeetCode'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => update({ pool: value, topic: '' })}
              className={clsx('rounded-lg px-3 py-1.5 text-sm font-medium', filters.pool === value ? 'bg-ink-700 text-white' : 'text-ink-400')}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input className="input pl-10" placeholder="Search by title or number" value={filters.search} onChange={(e) => update({ search: e.target.value })} />
        </div>
        <select className="input w-auto min-w-[11rem]" value={filters.difficulty} onChange={(e) => update({ difficulty: e.target.value })} aria-label="Difficulty">
          <option value="">All difficulties</option>
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
        <select className="input w-auto min-w-[11rem] max-w-[16rem]" value={filters.topic} onChange={(e) => update({ topic: e.target.value })} aria-label="Topic">
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-800 px-4 py-3">
          <div>
            <h2 className="font-semibold text-white">Problem bank</h2>
            <p className="text-xs text-ink-500">Still to solve</p>
          </div>
          {data && <span className="font-mono text-sm text-ink-400">{data.total}</span>}
        </div>
        {loading && !data ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6 text-ink-500" />
          </div>
        ) : data?.problems.length ? (
          <ul className={clsx('divide-y divide-ink-800/70', loading && 'opacity-60')}>
            {data.problems.map((p) => (
              <ProblemRow key={p.slug} problem={p} done={false} canTrack={!!user} onToggle={toggleSolved} />
            ))}
          </ul>
        ) : (
          <div className="p-6">
            <EmptyState icon={Search} title="No problems match these filters" />
          </div>
        )}
        <Pager page={page} pages={pages} onPage={setPage} />
      </section>

      <section className="card overflow-hidden border-easy/25">
        <div className="flex items-center justify-between border-b border-easy/20 bg-easy/5 px-4 py-3">
          <div>
            <h2 className="font-semibold text-white">Solved</h2>
            <p className="text-xs text-ink-400">Kept apart from the bank. Click a check to move one back.</p>
          </div>
          <span className="font-mono text-sm text-easy">{user ? solvedData?.total ?? 0 : 0}</span>
        </div>
        {!user ? (
          <div className="px-4 py-8 text-center text-sm text-ink-400">
            <Link to="/login" state={{ from: '/practice' }} className="font-semibold text-brand-400 hover:underline">
              Sign in
            </Link>{' '}
            to keep a solved list.
          </div>
        ) : solvedLoading && !solvedData ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-5 w-5 text-ink-500" />
          </div>
        ) : solvedData?.problems.length ? (
          <ul className={clsx('divide-y divide-ink-800/70', solvedLoading && 'opacity-60')}>
            {solvedData.problems.map((p) => (
              <ProblemRow key={p.slug} problem={p} done canTrack onToggle={toggleSolved} />
            ))}
          </ul>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-ink-400">Nothing in Solved for these filters. Mark a problem in the bank and it shows up here.</p>
        )}
        {user && <Pager page={solvedPage} pages={solvedPages} onPage={setSolvedPage} />}
      </section>
    </div>
  );
}
