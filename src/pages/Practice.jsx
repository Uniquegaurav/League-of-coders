import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, ExternalLink, MoreHorizontal, Pencil, Play, Search, Shuffle, Swords, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { invalidate, load, peek } from '../lib/cache';
import { track } from '../lib/analytics';
import { useAuth } from '../context/AuthContext';
import { EmptyState, PageBanner, Spinner } from '../components/ui';
import ListSidebar, { BUILT_IN, iconFor } from '../components/practice/ListSidebar';
import ProblemTable, { SkeletonRows } from '../components/practice/ProblemTable';
import Toolbar from '../components/practice/Toolbar';
import PremiumDialog from '../components/practice/PremiumDialog';
import { DailyCard, ProgressCard, TopicsCard } from '../components/practice/ProgressColumn';
import { ListIcon, usePopover } from '../components/practice/bits';

const POOL_LIMIT = 50;
const LIST_LIMIT = 200;
// Your own lists load in one go so every row can be dragged anywhere.
const CUSTOM_LIMIT = 500;

function Pager({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <button className="btn-ghost btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft className="h-4 w-4" /> Prev
      </button>
      <span className="font-mono text-sm text-ink-400">
        {page} / {pages}
      </span>
      <button className="btn-ghost btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function ListMenu({ list, onRename, onDelete }) {
  const [open, setOpen, ref] = usePopover();
  if (!list?.custom && !list?.premium) return null;
  return (
    <div className="relative" ref={ref}>
      <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-ink-300 transition hover:bg-white/[0.1] hover:text-white" aria-label="List options" title="List options" onClick={() => setOpen((o) => !o)}>
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-30 w-44 rounded-2xl border border-ink-700 bg-ink-900 p-1.5 shadow-2xl">
          {list.custom && (
            <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-200 hover:bg-white/[0.05]" onClick={() => { setOpen(false); onRename(); }}>
              <Pencil className="h-3.5 w-3.5" /> Rename
            </button>
          )}
          <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-hard hover:bg-hard/10" onClick={() => { setOpen(false); onDelete(); }}>
            <Trash2 className="h-3.5 w-3.5" /> {list.custom ? 'Delete list' : 'Remove list'}
          </button>
        </div>
      )}
    </div>
  );
}

function ListHeader({ list, total, picking, onPick, onRename, onDelete }) {
  return (
    <section className="flex flex-wrap items-center gap-x-5 gap-y-4">
      <ListIcon icon={iconFor(list)} size="lg" />
      <div className="min-w-0 flex-1 basis-48">
        <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">{list.name}</h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ink-400">
          {total != null && (
            <span>
              {total} problem{total === 1 ? '' : 's'}
            </span>
          )}
          {list.description && (
            <>
              <span className="text-ink-600">·</span>
              <span className="line-clamp-2 sm:line-clamp-1">{list.description}</span>
            </>
          )}
          {list.sourceUrl && (
            <a href={list.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink-500 hover:text-white" title="Original list">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </p>
      </div>
      <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
        <button type="button" className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 sm:flex-none text-sm font-semibold text-ink-950 transition hover:bg-ink-200 disabled:opacity-60" disabled={!!picking} onClick={() => onPick('next')} title="Open the next unsolved problem">
          {picking === 'next' ? <Spinner className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />} Practice
        </button>
        <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-ink-300 transition hover:bg-white/[0.1] hover:text-white disabled:opacity-60" disabled={!!picking} onClick={() => onPick('random')} title="Random unsolved problem" aria-label="Random unsolved problem">
          {picking === 'random' ? <Spinner className="h-4 w-4" /> : <Shuffle className="h-4 w-4" />}
        </button>
        <ListMenu list={list} onRename={onRename} onDelete={onDelete} />
      </div>
    </section>
  );
}

export default function Practice() {
  const { user, setUser, refresh } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const listKey = searchParams.get('list') || 'curated';
  const [filters, setFilters] = useState({ difficulty: '', topic: '', search: '' });
  const [sort, setSort] = useState('default');
  const [tab, setTab] = useState('todo');
  const [page, setPage] = useState(1);
  const [debounced, setDebounced] = useState('');
  const [solved, setSolved] = useState(() => new Set());
  const [busy, setBusy] = useState(() => new Set());
  const userKey = user?.id || 'anon';
  const empty = { curated: [], mine: [], premium: [] };
  const [lists, setLists] = useState(() => ({ ...empty, ...peek(`lists:${userKey}`) }));
  const [topics, setTopics] = useState([]);
  const [daily, setDaily] = useState(() => peek(`daily:${userKey}`));
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null); // { key, data }
  const [loadingKey, setLoadingKey] = useState(null);
  const [picking, setPicking] = useState(null);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const progressTimer = useRef(null);

  const view = user ? tab : 'all';
  const pool = listKey === 'all' ? 'all' : 'curated';
  const isPool = listKey === 'curated' || listKey === 'all';
  const activeList = isPool ? BUILT_IN.find((l) => l.key === listKey) : [...lists.curated, ...lists.mine, ...lists.premium].find((l) => l.key === listKey) || null;
  const limit = isPool ? POOL_LIMIT : activeList?.custom ? CUSTOM_LIMIT : LIST_LIMIT;

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
      .then((l) => setLists({ ...empty, ...l }))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userKey]);

  useEffect(() => {
    setLists({ ...empty, ...peek(`lists:${userKey}`) });
    load(`lists:${userKey}`, () => api.lists.all())
      .then((l) => setLists({ ...empty, ...l }))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userKey, user?.premium?.active]);

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
  const sortParam = sort === 'default' ? undefined : sort;
  const extraFor = (v) => (v === 'todo' ? { hideSolved: true } : v === 'solved' ? { onlySolved: true } : {});
  const keyFor = (p) => `problems:${user?.id || 'anon'}:${JSON.stringify(query)}:${sort}:${view}:${limit}:${p}`;
  const key = keyFor(page);
  const fetchPage = (p) => () => api.problems.list({ ...query, ...extraFor(view), sort: sortParam, page: p, limit });

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
        if (data.total > page * limit) load(keyFor(page + 1), fetchPage(page + 1), { ttl: 30000 }).catch(() => {});
      })
      .catch((err) => {
        if (cancelled) return;
        // A list that no longer exists (deleted, or Premium ended): fall back to the default list.
        if (/not found/i.test(err.message) && !isPool) {
          setSearchParams({});
          return;
        }
        toast.error(err.message);
      })
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const askToSignIn = () =>
    toast('Sign in to track solved problems', {
      id: 'practice-sign-in',
      description: 'Your progress is saved to your account.',
      action: { label: 'Sign in', onClick: () => navigate('/login', { state: { from: '/practice' } }) },
    });

  // Adjust the visible counts locally instead of refetching, and refresh the slower panels a moment later.
  const bumpCounts = (slug, next) => {
    setResult((r) => {
      if (!r?.data) return r;
      const d = r.data;
      const diff = d.problems.find((p) => p.slug === slug)?.difficulty;
      const counts2 = d.counts ? { ...d.counts, solved: d.counts.solved + (next ? 1 : -1), todo: d.counts.todo + (next ? -1 : 1) } : d.counts;
      const breakdown = diff && d.breakdown ? { ...d.breakdown, [diff]: { ...d.breakdown[diff], solved: d.breakdown[diff].solved + (next ? 1 : -1) } } : d.breakdown;
      return { ...r, data: { ...d, counts: counts2, breakdown } };
    });
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
      bumpCounts(slug, next);
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
    const msg = activeList?.custom ? `Delete "${activeList?.name}"? The problems stay in the bank.` : `Remove "${activeList?.name}"? You can add it again from Premium.`;
    if (!window.confirm(msg)) return;
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

  // Drag a problem onto one of your lists in the sidebar.
  const dropOnList = async (list, slug) => {
    try {
      await api.lists.add(list.key, slug);
      track('list_drop_add');
      toast.success(`Added to ${list.name}`);
      onListChanged(list.key);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Reorder your own list. The rows move at once; the server keeps hidden (filtered-out) rows where they were.
  const reorder = async (nextSlugs) => {
    const before = result;
    const bySlug = new Map(data.problems.map((p) => [p.slug, p]));
    setResult((r) => ({ ...r, data: { ...r.data, problems: nextSlugs.map((s) => bySlug.get(s)) } }));
    try {
      await api.lists.reorder(listKey, nextSlugs);
      track('list_reordered');
      invalidate('problems:');
    } catch (err) {
      setResult(before);
      toast.error(err.message);
    }
  };

  const removeFromList = async (slug) => {
    const before = result;
    setResult((r) => ({ ...r, data: { ...r.data, total: r.data.total - 1, problems: r.data.problems.filter((p) => p.slug !== slug) } }));
    try {
      await api.lists.drop(listKey, slug);
      invalidate('problems:');
      reloadLists();
      toast('Removed from list', { action: { label: 'Undo', onClick: () => api.lists.add(listKey, slug).then(() => { setResult(before); onListChanged(listKey); }) } });
    } catch (err) {
      setResult(before);
      toast.error(err.message);
    }
  };

  const pickProblem = async (mode) => {
    setPicking(mode);
    try {
      const { slug } = await api.problems.pick({ ...query, mode });
      track('practice_pick', { mode, list: listKey });
      navigate(`/problems/${slug}`);
    } catch (err) {
      toast(err.message);
    } finally {
      setPicking(null);
    }
  };

  const toggle = (slug) => setMark(slug, !solved.has(slug));
  const pages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;
  const reorderable = !!activeList?.custom && sort === 'default' && !!data?.problems?.length;
  const defaultSortLabel = isPool ? 'Problem number' : activeList?.custom ? 'My order' : 'List order';
  const filtered = !!(filters.search || filters.difficulty || filters.topic);

  return (
    <div className="space-y-6">
      <PageBanner
        title="Practice"
        info={
          <>
            These are the same problems battles draw from. Switch a problem on once LeetCode accepts it. Lists like Blind 75 and NeetCode 150 refresh from their
            public sources every week. Drag any problem onto one of your lists to add it.
          </>
        }
        actions={
          <Link to="/new?mode=battle" className="btn-primary">
            <Swords className="h-4 w-4" /> Turn it into a battle
          </Link>
        }
      >
        Every list you need, in one place.
      </PageBanner>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_300px]">
        <div className="lg:row-span-2 xl:row-span-1">
          <ListSidebar
            active={listKey}
            lists={lists}
            user={user}
            onPick={pickList}
            onCreate={createList}
            onDropSlug={dropOnList}
            onOpenPremium={() => (user ? setPremiumOpen(true) : askToSignIn())}
          />
        </div>

        <div className="min-w-0 space-y-5">
          {activeList ? (
            <ListHeader list={activeList} total={counts?.all ?? data?.total} picking={picking} onPick={pickProblem} onRename={renameList} onDelete={deleteList} />
          ) : (
            <div className="h-14 animate-pulse rounded-2xl bg-white/[0.03]" />
          )}

          <Toolbar
            filters={filters}
            topics={topics}
            onChange={update}
            sort={sort}
            onSort={(s) => {
              setSort(s);
              setPage(1);
            }}
            defaultSortLabel={defaultSortLabel}
            isPool={isPool}
            tab={tab}
            onTab={(k) => {
              setTab(k);
              setPage(1);
            }}
            counts={counts}
            signedIn={!!user}
          />

          <div className="relative">
            {loading && data && <Spinner className="absolute -top-8 right-1 h-4 w-4 text-ink-500" />}
            {!data ? (
              <SkeletonRows />
            ) : data.problems.length ? (
              <ProblemTable
                problems={data.problems}
                solved={solved}
                busy={busy}
                canTrack={!!user}
                onToggle={toggle}
                myLists={lists.mine}
                onListChanged={onListChanged}
                reorderable={reorderable}
                onReorder={reorder}
                onRemove={activeList?.custom ? removeFromList : null}
                stale={stale}
              />
            ) : (
              <div className="panel p-6">
                {activeList?.custom && !filtered && view === 'all' ? (
                  <EmptyState icon={Search} title="This list is empty" bare>
                    Drag problems here from any list in the sidebar, or use the list button on a problem.
                  </EmptyState>
                ) : (
                  <EmptyState icon={Search} title={view === 'solved' ? 'Nothing solved here yet' : view === 'todo' && !filtered ? 'All solved. Nice work!' : 'No problems match'} bare>
                    {view === 'solved' ? 'Switch a problem on in To solve and it shows up here.' : filtered ? 'Try clearing a filter.' : null}
                  </EmptyState>
                )}
              </div>
            )}
          </div>
          {reorderable && view === 'all' && !filtered && data.problems.length > 1 && <p className="text-center text-xs text-ink-500">Drag rows or use the arrows to set your order.</p>}
          <Pager page={page} pages={pages} onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </div>

        <aside className={clsx('min-w-0 space-y-5 lg:col-start-2 xl:col-start-auto', 'xl:sticky xl:top-20 xl:self-start')}>
          <ProgressCard title={activeList?.name} breakdown={data?.breakdown} user={user} signedIn={!!user} />
          <DailyCard
            daily={daily}
            done={!!(daily?.done || (daily?.problem && solved.has(daily.problem.slug)))}
            busy={daily?.problem && busy.has(daily.problem.slug)}
            onToggle={(next) => setMark(daily.problem.slug, next)}
          />
          {user && (
            <TopicsCard
              progress={progress}
              activeTopic={filters.topic}
              onTopic={(topic) => {
                pickList('curated');
                update({ topic });
              }}
            />
          )}
        </aside>
      </div>

      {premiumOpen && user && (
        <PremiumDialog
          user={user}
          premiumLists={lists.premium}
          onClose={() => setPremiumOpen(false)}
          onChanged={async () => {
            await refresh();
            await reloadLists();
          }}
          onPick={(k) => {
            setPremiumOpen(false);
            pickList(k);
          }}
        />
      )}
    </div>
  );
}
