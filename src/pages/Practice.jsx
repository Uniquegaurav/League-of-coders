import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'sonner';
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, Search, Swords } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { DifficultyBadge, EmptyState, Spinner, Toggle } from '../components/ui';

const LIMIT = 30;

export default function Practice() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ pool: 'curated', difficulty: '', topic: '', search: '', hideSolved: false });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState([]);
  const [solved, setSolved] = useState(new Set());
  const [debounced, setDebounced] = useState('');

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
    api.users.solved().then((r) => setSolved(new Set(r.slugs))).catch(() => {});
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.problems
      .list({
        pool: filters.pool,
        difficulty: filters.difficulty || undefined,
        topic: filters.topic || undefined,
        search: debounced || undefined,
        hideSolved: filters.hideSolved || undefined,
        page,
        limit: LIMIT,
      })
      .then((r) => !cancelled && setData(r))
      .catch((err) => !cancelled && toast.error(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filters.pool, filters.difficulty, filters.topic, filters.hideSolved, debounced, page]);

  const update = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const toggleSolved = async (slug) => {
    const next = !solved.has(slug);
    setSolved((s) => {
      const copy = new Set(s);
      if (next) copy.add(slug);
      else copy.delete(slug);
      return copy;
    });
    try {
      await api.users.setSolved(slug, next);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Practice</h1>
          <p className="mt-1 text-ink-400">Warm up on the same problem bank battles draw from. Problems you mark solved are skipped in battles when you opt in.</p>
        </div>
        <Link to="/new" className="btn-primary">
          <Swords className="h-4 w-4" /> Turn it into a battle
        </Link>
      </div>

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
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input className="input pl-9" placeholder="Search by title or number" value={filters.search} onChange={(e) => update({ search: e.target.value })} />
        </div>
        <select className="input w-auto" value={filters.difficulty} onChange={(e) => update({ difficulty: e.target.value })}>
          <option value="">All difficulties</option>
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
        <select className="input w-auto max-w-[200px]" value={filters.topic} onChange={(e) => update({ topic: e.target.value })}>
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        {user && <Toggle checked={filters.hideSolved} onChange={(hideSolved) => update({ hideSolved })} label="Hide solved" />}
      </div>

      {user && (
        <p className="text-sm text-ink-400">
          <span className="font-semibold text-white">{solved.size}</span> problems in your solved list
        </p>
      )}

      <div className="card overflow-hidden">
        {loading && !data ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6 text-ink-500" />
          </div>
        ) : data?.problems.length ? (
          <ul className={clsx('divide-y divide-ink-800/70', loading && 'opacity-60')}>
            {data.problems.map((p) => {
              const done = solved.has(p.slug);
              return (
                <li key={p.slug} className="flex items-center gap-4 px-4 py-3 hover:bg-ink-850/60">
                  <button
                    disabled={!user}
                    onClick={() => toggleSolved(p.slug)}
                    title={user ? (done ? 'Mark as unsolved' : 'Mark as solved') : 'Sign in to track progress'}
                    className={clsx('shrink-0', done ? 'text-easy' : 'text-ink-600 hover:text-ink-400')}
                  >
                    {done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                  </button>
                  <Link to={`/problems/${p.slug}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-200 hover:text-white">
                      {p.frontendId && <span className="text-ink-500">{p.frontendId}. </span>}
                      {p.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-500">{p.tags.slice(0, 4).join(' · ')}</p>
                  </Link>
                  {p.acRate != null && <span className="hidden font-mono text-xs text-ink-500 sm:block">{p.acRate.toFixed(1)}%</span>}
                  <DifficultyBadge difficulty={p.difficulty} className="w-16 justify-center" />
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-6">
            <EmptyState icon={Search} title="No problems match these filters" />
          </div>
        )}
      </div>

      {data && pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span className="font-mono text-sm text-ink-400">
            {page} / {pages}
          </span>
          <button className="btn-secondary btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
