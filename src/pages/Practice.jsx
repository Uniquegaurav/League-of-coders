import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'sonner';
import { Check, ChevronLeft, ChevronRight, ExternalLink, ListPlus, Pencil, Plus, Search, Swords, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { invalidate, load, peek } from '../lib/cache';
import { track } from '../lib/analytics';
import { useAuth } from '../context/AuthContext';
import { streakOf } from '../lib/progression';
import { DifficultyBadge, EmptyState, PageBanner, ProgressBar, Spinner } from '../components/ui';

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

// "Add to list" menu: tick the lists that should contain this problem, or start a new one.
function AddToList({ slug, lists, onChanged }) {
  const [open, setOpen] = useState(false);
  const [keys, setKeys] = useState(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    api.lists
      .containing(slug)
      .then((r) => setKeys(new Set(r.keys)))
      .catch(() => setKeys(new Set()));
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open, slug]);

  const toggle = async (key) => {
    const has = keys.has(key);
    setKeys((k) => {
      const next = new Set(k);
      if (has) next.delete(key);
      else next.add(key);
      return next;
    });
    try {
      await (has ? api.lists.drop(key, slug) : api.lists.add(key, slug));
      onChanged(key);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const { list } = await api.lists.create(name.trim(), slug);
      track('list_created');
      setKeys((k) => new Set(k).add(list.key));
      setName('');
      onChanged(list.key);
      toast.success(`Added to ${list.name}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" className="btn-ghost p-1.5" aria-label="Add to a list" title="Add to a list" onClick={() => setOpen((o) => !o)}>
        <ListPlus className="h-4 w-4" />
      </button>
      {open && (
        <div className="card absolute right-0 top-9 z-30 w-64 space-y-1 p-2 shadow-2xl">
          <p className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wider text-ink-500">Add to list</p>
          {keys === null ? (
            <div className="flex justify-center py-3">
              <Spinner className="h-4 w-4 text-ink-500" />
            </div>
          ) : (
            lists.map((l) => (
              <label key={l.key} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink-200 hover:bg-ink-800">
                <input type="checkbox" className="accent-brand-500" checked={keys.has(l.key)} onChange={() => toggle(l.key)} />
                <span className="truncate">{l.name}</span>
              </label>
            ))
          )}
          <form onSubmit={create} className="flex gap-1.5 border-t border-ink-800 pt-2">
            <input className="input py-1.5 text-xs" placeholder="New list name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn-primary btn-sm shrink-0" disabled={busy || !name.trim()} aria-label="Create list">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function ProblemRow({ problem, done, canTrack, busy, onToggle, lists, onListChanged }) {
  return (
    <li className={clsx('flex items-center gap-3 px-4 py-3 transition-colors sm:gap-4', done ? 'bg-easy/[0.04]' : 'hover:bg-ink-850/60')}>
      <SolvedCheckbox
        checked={done}
        busy={busy}
        onClick={() => onToggle(problem.slug)}
        title={canTrack ? (done ? 'Mark as not solved' : 'Mark as solved') : 'Sign in to track progress'}
      />
      <Link to={`/problems/${problem.slug}`} className="group min-w-0 flex-1">
        <p className={clsx('truncate text-sm font-medium', done ? 'text-ink-400' : 'text-ink-200 group-hover:text-white')}>
          {problem.frontendId && <span className="text-ink-500">{problem.frontendId}. </span>}
          {problem.title}
          {done && <span className="ml-2 text-xs font-semibold text-easy">Solved</span>}
        </p>
        <p className="mt-0.5 truncate text-xs text-ink-500">{(problem.tags || []).slice(0, 4).join(' · ')}</p>
      </Link>
      {problem.acRate != null && <span className="hidden font-mono text-xs text-ink-500 sm:block">{problem.acRate.toFixed(1)}%</span>}
      <DifficultyBadge difficulty={problem.difficulty} className="w-16 justify-center" />
      {canTrack && lists && <AddToList slug={problem.slug} lists={lists} onChanged={onListChanged} />}
    </li>
  );
}

function SkeletonRows({ n = 8 }) {
  return (
    <ul className="divide-y divide-ink-800/70" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-4 py-3.5">
          <span className="h-5 w-5 rounded-md bg-ink-800" />
          <span className="flex-1 space-y-2">
            <span className="block h-3 w-2/3 animate-pulse rounded bg-ink-800" />
            <span className="block h-2.5 w-1/3 animate-pulse rounded bg-ink-800/70" />
          </span>
          <span className="h-5 w-16 rounded-full bg-ink-800" />
        </li>
      ))}
    </ul>
  );
}

const BUILT_IN = [
  { key: 'curated', name: 'Interview classics', description: 'The hand-picked set battles draw from.' },
  { key: 'all', name: 'All LeetCode', description: 'Every free LeetCode problem.' },
];

// Horizontal row of list chips: built-in pools, well-known lists, then your own lists.
function ListBar({ active, curated, mine, user, onPick, onCreate }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const chip = (l) => (
    <button
      key={l.key}
      onClick={() => onPick(l.key)}
      className={clsx(
        'shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
        active === l.key ? 'border-brand-500 bg-brand-500/15 text-white' : 'border-ink-700 text-ink-300 hover:border-ink-500 hover:text-white'
      )}
    >
      {l.name}
      {l.count != null && (
        <span className="ml-1.5 font-mono text-xs text-ink-500">
          {l.solved != null ? `${l.solved}/` : ''}
          {l.count}
        </span>
      )}
    </button>
  );
  return (
    <div className="space-y-3">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
        {BUILT_IN.map(chip)}
        {curated.map(chip)}
      </div>
      {user && (
        <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-ink-500">My lists</span>
          {mine.map(chip)}
          {creating ? (
            <form
              className="flex shrink-0 gap-1.5"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await onCreate(name.trim())) {
                  setName('');
                  setCreating(false);
                }
              }}
            >
              <input className="input w-44 py-1.5 text-sm" autoFocus maxLength={60} placeholder="List name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => !name && setCreating(false)} />
              <button className="btn-primary btn-sm" disabled={!name.trim()}>
                Create
              </button>
            </form>
          ) : (
            <button className="btn-ghost btn-sm shrink-0" onClick={() => setCreating(true)}>
              <Plus className="h-3.5 w-3.5" /> New list
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ListHeader({ list, onRename, onDelete }) {
  if (!list) return null;
  const pct = list.count && list.solved != null ? Math.round((list.solved / list.count) * 100) : null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-800 px-4 py-3">
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-semibold text-white">
          {list.name}
          {list.sourceUrl && (
            <a href={list.sourceUrl} target="_blank" rel="noreferrer" className="text-ink-500 hover:text-white" title="Original list">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </p>
        {list.description && <p className="text-xs text-ink-400">{list.description}</p>}
        {list.custom && !list.count && <p className="text-xs text-ink-400">Empty for now. Use the list button on any problem to add it here.</p>}
      </div>
      <div className="flex items-center gap-3">
        {pct != null && (
          <div className="w-40">
            <p className="mb-1 flex justify-between text-xs text-ink-400">
              <span>Solved</span>
              <span className="font-mono">
                {list.solved}/{list.count}
              </span>
            </p>
            <ProgressBar value={list.solved} max={list.count} barClassName="bg-easy" />
          </div>
        )}
        {list.custom && (
          <>
            <button className="btn-ghost p-1.5" title="Rename list" onClick={onRename}>
              <Pencil className="h-4 w-4" />
            </button>
            <button className="btn-ghost p-1.5 text-ink-400 hover:text-hard" title="Delete list" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Practice() {
  const { user, setUser, refresh } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const listKey = searchParams.get('list') || 'curated';
  const [filters, setFilters] = useState({ difficulty: '', topic: '', search: '' });
  const [tab, setTab] = useState('todo');
  const [page, setPage] = useState(1);
  const [debounced, setDebounced] = useState('');
  const [solved, setSolved] = useState(() => new Set());
  const [busy, setBusy] = useState(() => new Set());
  const userKey = user?.id || 'anon';
  const [lists, setLists] = useState(() => peek(`lists:${userKey}`) || { curated: [], mine: [] });
  const [topics, setTopics] = useState([]);
  const [daily, setDaily] = useState(() => peek(`daily:${userKey}`));
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null); // { key, data }
  const [loadingKey, setLoadingKey] = useState(null);
  const progressTimer = useRef(null);

  const view = user ? tab : 'all';
  const pool = listKey === 'all' ? 'all' : 'curated';
  const isPool = listKey === 'curated' || listKey === 'all';
  const activeList = isPool ? null : [...lists.curated, ...lists.mine].find((l) => l.key === listKey) || null;

  useEffect(() => {
    document.title = 'Practice · League of Coders';
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(filters.search), 250);
    return () => clearTimeout(id);
  }, [filters.search]);

  const reloadLists = useCallback(() => {
    invalidate(`lists:${userKey}`);
    return load(`lists:${userKey}`, () => api.lists.all())
      .then(setLists)
      .catch(() => {});
  }, [userKey]);

  useEffect(() => {
    setLists(peek(`lists:${userKey}`) || { curated: [], mine: [] });
    load(`lists:${userKey}`, () => api.lists.all())
      .then(setLists)
      .catch(() => {});
  }, [userKey]);

  // Back/forward between lists starts each list on its first page.
  useEffect(() => {
    setPage(1);
  }, [listKey]);

  useEffect(() => {
    load(`topics:${pool}`, () => api.problems.topics(pool).then((r) => r.topics), { ttl: 10 * 60000 })
      .then(setTopics)
      .catch(() => {});
  }, [pool]);

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
    load(`daily:${userKey}`, () => api.problems.daily(), { ttl: 5 * 60000 })
      .then(setDaily)
      .catch(() => setDaily(null));
  }, [user?.id]);

  const loadProgress = useCallback(() => {
    if (!user) return setProgress(null);
    return api.users.progress().then(setProgress).catch(() => setProgress(null));
  }, [user]);
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const query = {
    ...(isPool ? { pool } : { list: listKey }),
    difficulty: filters.difficulty || undefined,
    topic: filters.topic || undefined,
    search: debounced || undefined,
  };
  const extraFor = (v) => (v === 'todo' ? { hideSolved: true } : v === 'solved' ? { onlySolved: true } : {});
  const keyFor = (p) => `problems:${user?.id || 'anon'}:${JSON.stringify(query)}:${view}:${p}`;
  const key = keyFor(page);
  const fetchPage = (p) => () => api.problems.list({ ...query, ...extraFor(view), page: p, limit: LIMIT });

  // Show the cached page at once, then refresh it quietly. The next page is fetched ahead of time.
  useEffect(() => {
    let cancelled = false;
    const cached = peek(key);
    if (cached) setResult({ key, data: cached });
    setLoadingKey(key);
    load(key, fetchPage(page), { ttl: 30000 })
      .then((data) => {
        if (cancelled) return;
        setResult({ key, data });
        if (data.total > page * LIMIT) load(keyFor(page + 1), fetchPage(page + 1), { ttl: 30000 }).catch(() => {});
      })
      .catch((err) => !cancelled && toast.error(err.message))
      .finally(() => !cancelled && setLoadingKey(null));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const data = result?.data;
  const counts = data?.counts || null;
  const loading = loadingKey === key;
  const stale = result && result.key !== key;

  const update = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };
  const pickList = (k) => {
    setSearchParams(k === 'curated' ? {} : { list: k });
    setFilters((f) => ({ ...f, topic: '' }));
    setPage(1);
  };

  const askToSignIn = () =>
    toast('Sign in to track solved problems', {
      id: 'practice-sign-in',
      description: 'Your progress is saved to your account.',
      action: { label: 'Sign in', onClick: () => navigate('/login', { state: { from: '/practice' } }) },
    });

  // Adjust the visible counts locally instead of refetching, and refresh the slower panels a moment later.
  const bumpCounts = (next) => {
    setResult((r) =>
      r?.data?.counts
        ? { ...r, data: { ...r.data, counts: { ...r.data.counts, solved: r.data.counts.solved + (next ? 1 : -1), todo: r.data.counts.todo + (next ? -1 : 1) } } }
        : r
    );
    invalidate('problems:');
    clearTimeout(progressTimer.current);
    progressTimer.current = setTimeout(() => {
      loadProgress();
      reloadLists();
    }, 1500);
  };

  const setMark = async (slug, next, { quiet = false } = {}) => {
    if (!user) return askToSignIn();
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
      if (res?.badges?.length) refresh();
      if (next) track('problem_marked_solved', { daily: !!res?.daily, list: listKey });
      if (res?.daily) setDaily((d) => (d ? { ...d, done: true } : d));
      bumpCounts(next);
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

  const createList = async (name) => {
    try {
      const { list } = await api.lists.create(name);
      track('list_created');
      await reloadLists();
      pickList(list.key);
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  const renameList = async () => {
    const name = window.prompt('Rename list', activeList?.name || '');
    if (!name?.trim()) return;
    try {
      await api.lists.rename(listKey, name.trim());
      reloadLists();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const deleteList = async () => {
    if (!window.confirm(`Delete "${activeList?.name}"? The problems stay in the bank.`)) return;
    try {
      await api.lists.remove(listKey);
      pickList('curated');
      reloadLists();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onListChanged = (changedKey) => {
    reloadLists();
    if (changedKey === listKey) invalidate('problems:');
  };

  const toggle = (slug) => setMark(slug, !solved.has(slug));
  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <div className="space-y-6">
      <PageBanner
        title="Practice"
        info={
          <>
            These are the same problems battles draw from. Tick a problem once LeetCode accepts it. Lists like Blind 75 and NeetCode 150 are refreshed from
            their public sources every week. Make your own lists with the list button on any problem.
          </>
        }
        actions={
          <Link to="/new?mode=battle" className="btn-primary">
            <Swords className="h-4 w-4" /> Turn it into a battle
          </Link>
        }
      >
        Sharpen your skills and keep track of what you have solved.
      </PageBanner>

      <DailyProblem daily={daily} done={daily?.done || (daily?.problem && solved.has(daily.problem.slug))} onMark={(slug) => setMark(slug, true)} />

      {user && <ProgressPanel progress={progress} user={user} activeTopic={filters.topic} onTopic={(topic) => { pickList('curated'); update({ topic }); }} />}

      <ListBar active={listKey} curated={lists.curated} mine={lists.mine} user={user} onPick={pickList} onCreate={createList} />

      <section className="card overflow-hidden">
        <ListHeader list={activeList} onRename={renameList} onDelete={deleteList} />
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-800 p-4">
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
              {TABS.map(([k, label]) => (
                <button
                  key={k}
                  role="tab"
                  aria-selected={tab === k}
                  onClick={() => {
                    setTab(k);
                    setPage(1);
                  }}
                  className={clsx(
                    '-mb-px border-b-2 px-3 py-3 text-sm font-medium transition-colors',
                    tab === k ? 'border-brand-500 text-white' : 'border-transparent text-ink-400 hover:text-ink-200'
                  )}
                >
                  {label}
                  {counts && <span className={clsx('ml-2 font-mono text-xs', k === 'solved' ? 'text-easy' : 'text-ink-500')}>{counts[k]}</span>}
                </button>
              ))}
            </div>
          ) : (
            <p className="py-3 text-sm text-ink-400">Problem bank</p>
          )}
          {loading && data && <Spinner className="h-4 w-4 text-ink-500" />}
        </div>

        {!data ? (
          <SkeletonRows />
        ) : data.problems.length ? (
          <ul className={clsx('divide-y divide-ink-800/70 transition-opacity duration-150', stale && 'opacity-50')}>
            {data.problems.map((p) => (
              <ProblemRow
                key={p.slug}
                problem={p}
                done={solved.has(p.slug)}
                busy={busy.has(p.slug)}
                canTrack={!!user}
                onToggle={toggle}
                lists={lists.mine}
                onListChanged={onListChanged}
              />
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
