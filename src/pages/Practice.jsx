import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'sonner';
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, Flame, Gift, Map as MapIcon, Search, Sparkles, Swords, Target, Trophy } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { practiceOf, titleFor, XP } from '../lib/progression';
import { burstConfetti, CountUp, floatXpAt, LevelUpOverlay, ProgressRing, XpBar } from '../components/game/fx';
import { PracticeArt } from '../components/game/ModeArt';
import { DifficultyBadge, EmptyState, Spinner } from '../components/ui';

const LIMIT = 30;
const SOLVED_LIMIT = 20;
const DIFF_COLORS = { Easy: '#34d399', Medium: '#fbbf24', Hard: '#fb7185' };

// Mastery ranks for a topic, by share of the curated set solved.
const MASTERY = [
  { min: 0.8, name: 'Master', color: 'text-fuchsia-300', bar: 'from-fuchsia-500 to-brand-400' },
  { min: 0.5, name: 'Expert', color: 'text-sky-300', bar: 'from-sky-500 to-neon-400' },
  { min: 0.2, name: 'Adept', color: 'text-easy', bar: 'from-emerald-500 to-teal-300' },
  { min: 0.01, name: 'Novice', color: 'text-medium', bar: 'from-amber-500 to-yellow-300' },
  { min: 0, name: 'Locked', color: 'text-ink-500', bar: 'from-ink-600 to-ink-500' },
];
const masteryOf = (solved, total) => MASTERY.find((m) => (total ? solved / total : 0) >= m.min);

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

function ProblemRow({ problem, done, canTrack, onToggle, isDaily, index }) {
  const [busy, setBusy] = useState(false);
  const reward = (XP[problem.difficulty] || 10) * (isDaily ? 2 : 1);

  const click = async (e) => {
    const el = e.currentTarget;
    setBusy(true);
    const gained = await onToggle(problem.slug);
    setBusy(false);
    floatXpAt(el, gained);
  };

  return (
    <li
      className={clsx('group flex animate-rise-in items-center gap-4 px-4 py-3 transition hover:bg-ink-850/60', isDaily && 'bg-fuchsia-500/5')}
      style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
    >
      <span className="shrink-0">
        <button
          disabled={!canTrack || busy}
          onClick={click}
          title={canTrack ? (done ? 'Move back to the problem bank' : `Mark as solved (+${reward} XP)`) : 'Sign in to track progress'}
          className={clsx('rounded-full p-1 transition', done ? 'text-easy' : 'text-ink-600 hover:scale-110 hover:text-easy')}
        >
          {busy ? <Spinner className="h-5 w-5" /> : done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
        </button>
      </span>
      <Link to={`/problems/${problem.slug}`} className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-medium text-ink-200 group-hover:text-white">
          <span className="truncate">
            {problem.frontendId && <span className="text-ink-500">{problem.frontendId}. </span>}
            {problem.title}
          </span>
          {isDaily && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fuchsia-300">
              <Gift className="h-3 w-3" /> Daily
            </span>
          )}
        </p>
        <p className="mt-0.5 truncate text-xs text-ink-500">{problem.tags.slice(0, 4).join(' · ')}</p>
      </Link>
      {!done && <span className="hidden font-mono text-xs font-bold text-brand-400/80 sm:block">+{reward} XP</span>}
      {problem.acRate != null && <span className="hidden font-mono text-xs text-ink-500 md:block">{problem.acRate.toFixed(1)}%</span>}
      <DifficultyBadge difficulty={problem.difficulty} className="w-16 justify-center" />
    </li>
  );
}

function TrainerCard({ user }) {
  const lvl = practiceOf(user);
  return (
    <div className="hud-panel neon-ring relative overflow-hidden p-6">
      <PracticeArt className="pointer-events-none absolute -bottom-12 left-1/2 h-48 w-48 opacity-10" />
      <div className="relative flex flex-wrap items-center gap-5">
        <ProgressRing value={lvl.xp - lvl.levelXp} max={lvl.nextLevelXp - lvl.levelXp} size={92} stroke={7} color="#a18bff">
          <span className="text-center leading-none">
            <span className="block text-[9px] font-bold uppercase tracking-widest text-ink-400">Level</span>
            <span className="stat-num text-3xl">{lvl.level}</span>
          </span>
        </ProgressRing>
        <div className="min-w-[200px] flex-1">
          <p className="font-display text-xl font-black text-white">{titleFor(lvl.level)}</p>
          <p className="text-sm text-ink-400">
            <CountUp value={lvl.xp} className="font-mono text-brand-400" /> XP · {lvl.nextLevelXp - lvl.xp} XP to level {lvl.level + 1}
          </p>
          <XpBar pct={lvl.pct} className="mt-3 h-2.5" />
        </div>
        <div className="flex gap-3">
          <div className={clsx('rounded-xl border px-4 py-3 text-center', lvl.streak ? 'border-orange-500/40 bg-orange-500/10' : 'border-ink-700 bg-ink-950/40')}>
            <Flame className={clsx('mx-auto h-6 w-6', lvl.streak ? 'animate-flicker text-orange-400' : 'text-ink-600')} />
            <p className="stat-num text-xl">{lvl.streak}</p>
            <p className="text-[10px] uppercase tracking-wider text-ink-500">Day streak</p>
          </div>
          <div className="rounded-xl border border-ink-700 bg-ink-950/40 px-4 py-3 text-center">
            <Trophy className="mx-auto h-6 w-6 text-medium" />
            <p className="stat-num text-xl">{lvl.bestStreak}</p>
            <p className="text-[10px] uppercase tracking-wider text-ink-500">Best</p>
          </div>
        </div>
      </div>
      <p className="relative mt-4 text-xs text-ink-500">
        Easy +{XP.Easy} · Medium +{XP.Medium} · Hard +{XP.Hard} XP · Daily quest pays double · Mark one problem a day to keep the flame alive.
      </p>
    </div>
  );
}

function DailyBanner({ daily, onToggle, solvedNow }) {
  if (!daily?.problem) return null;
  const p = daily.problem;
  const done = daily.done || solvedNow;
  return (
    <div className="hud-panel shine flex flex-wrap items-center gap-4 border-fuchsia-500/30 p-5">
      <span className="flex h-12 w-12 shrink-0 animate-float-slow items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-brand-600 shadow-glow">
        <Gift className="h-6 w-6 text-white" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="hud-title text-fuchsia-300">Daily quest · {daily.day}</p>
        <Link to={`/problems/${p.slug}`} className="mt-1 block truncate font-display text-lg font-bold text-white hover:underline">
          {p.title}
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <DifficultyBadge difficulty={p.difficulty} />
          <span className="text-xs text-brand-400">+{(XP[p.difficulty] || 10) * 2} XP</span>
        </div>
      </div>
      {done ? (
        <span className="chip border-easy/40 py-1.5 text-sm text-easy">
          <CheckCircle2 className="h-4 w-4" /> Claimed
        </span>
      ) : (
        <div className="flex gap-2">
          <Link to={`/problems/${p.slug}`} className="btn-secondary">
            Open
          </Link>
          {onToggle && (
            <button
              className="btn-play"
              onClick={async (e) => {
                const el = e.currentTarget;
                floatXpAt(el, await onToggle(p.slug));
              }}
            >
              <Sparkles className="h-4 w-4" /> I solved it
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MasteryMap({ progress, activeTopic, onPick }) {
  if (!progress) return null;
  const diffs = ['Easy', 'Medium', 'Hard'];
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <div className="hud-panel p-5">
        <p className="hud-title mb-4">
          <Target className="h-4 w-4 text-easy" /> Difficulty clears
        </p>
        <div className="flex justify-between">
          {diffs.map((d) => {
            const v = progress.byDifficulty?.[d] || { solved: 0, total: 0 };
            return (
              <div key={d} className="text-center">
                <ProgressRing value={v.solved} max={v.total} size={64} stroke={5} color={DIFF_COLORS[d]}>
                  <span className="font-mono text-xs font-bold text-white">{v.solved}</span>
                </ProgressRing>
                <p className="mt-1 text-xs font-semibold" style={{ color: DIFF_COLORS[d] }}>
                  {d}
                </p>
                <p className="font-mono text-[10px] text-ink-500">/{v.total}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="hud-panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="hud-title">
            <MapIcon className="h-4 w-4 text-neon-400" /> Skill map
          </p>
          <p className="text-[11px] text-ink-500">Click a skill to train it</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {progress.topics.map((t) => {
            const m = masteryOf(t.solved, t.total);
            const pct = t.total ? Math.round((t.solved / t.total) * 100) : 0;
            return (
              <button
                key={t.topic}
                onClick={() => onPick(activeTopic === t.topic ? '' : t.topic)}
                className={clsx(
                  'lift rounded-xl border bg-ink-950/50 p-3 text-left',
                  activeTopic === t.topic ? 'border-brand-500 shadow-glow' : 'border-ink-800 hover:border-ink-600'
                )}
              >
                <p className="truncate text-sm font-semibold text-ink-200">{t.topic}</p>
                <p className={clsx('text-[10px] font-bold uppercase tracking-wider', m.color)}>{m.name}</p>
                <div className="xp-track mt-2 h-1.5">
                  <div className={clsx('h-full rounded-full bg-gradient-to-r transition-[width] duration-700', m.bar)} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 font-mono text-[10px] text-ink-500">
                  {t.solved}/{t.total}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
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
  const [levelUp, setLevelUp] = useState(null);
  const [dailyClaimed, setDailyClaimed] = useState(false);

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
    api.problems.daily().then(setDaily).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!user) return setProgress(null);
    api.users.progress().then(setProgress).catch(() => {});
    return undefined;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.pool, filters.difficulty, filters.topic, debounced, solvedPage, user?.id, refresh]);

  const update = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
    setSolvedPage(1);
  };

  // Returns the XP delta so the row can float it.
  const toggleSolved = useCallback(
    async (slug) => {
      if (!user) return 0;
      const inSolved = (solvedData?.problems || []).some((p) => p.slug === slug);
      try {
        const res = await api.users.setSolved(slug, !inSolved);
        if (res.practice) {
          setUser((u) => (u ? { ...u, practice: res.practice, solvedCount: Math.max(0, (u.solvedCount || 0) + (res.solved ? 1 : -1)) } : u));
        }
        if (res.daily) {
          setDailyClaimed(true);
          burstConfetti(60);
          toast.success(`Daily quest complete! +${res.xpGained} XP`);
        } else if (res.xpGained > 0 && res.practice?.streak > 1 && res.practice.streak > (user.practice?.streak || 0)) {
          toast(`🔥 ${res.practice.streak}-day streak!`);
        }
        if (res.leveledUp && res.practice) setLevelUp(res.practice.level);
        setRefresh((n) => n + 1);
        return res.xpGained || 0;
      } catch (err) {
        toast.error(err.message);
        return 0;
      }
    },
    [user, solvedData, setUser]
  );

  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;
  const solvedPages = solvedData ? Math.max(1, Math.ceil(solvedData.total / SOLVED_LIMIT)) : 1;
  const dailySlug = daily?.problem?.slug;

  return (
    <div className="space-y-6">
      {levelUp && <LevelUpOverlay level={levelUp} title={titleFor(levelUp)} onDone={() => setLevelUp(null)} />}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="hud-title text-easy">Training grounds</p>
          <h1 className="font-display text-3xl font-black text-white sm:text-4xl">Practice</h1>
          <p className="mt-1 max-w-2xl text-ink-400">
            Warm up on the same problem bank battles draw from. Every solve earns XP, keeps your streak alive and levels up your skill map.
          </p>
        </div>
        <Link to="/new?mode=battle" className="btn-play">
          <Swords className="h-4 w-4" /> Turn it into a battle
        </Link>
      </div>

      {user ? (
        <TrainerCard user={user} />
      ) : (
        <div className="hud-panel flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="text-sm text-ink-300">Sign in to earn XP, build streaks and unlock your skill map.</p>
          <Link to="/login" state={{ from: '/practice' }} className="btn-primary btn-sm">
            Sign in
          </Link>
        </div>
      )}

      <DailyBanner daily={daily} onToggle={user ? toggleSolved : null} solvedNow={dailyClaimed || (user && user.practice?.dailyDone)} />

      {user && <MasteryMap progress={progress} activeTopic={filters.topic} onPick={(topic) => update({ topic, pool: 'curated' })} />}

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

      <section className="hud-panel">
        <div className="flex items-center justify-between border-b border-ink-800 px-4 py-3">
          <div>
            <h2 className="font-semibold text-white">Problem bank</h2>
            <p className="text-xs text-ink-500">Still to solve · tick the circle once LeetCode accepts it</p>
          </div>
          {data && <span className="font-mono text-sm text-ink-400">{data.total}</span>}
        </div>
        {loading && !data ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6 text-ink-500" />
          </div>
        ) : data?.problems.length ? (
          <ul className={clsx('divide-y divide-ink-800/70', loading && 'opacity-60')}>
            {data.problems.map((p, i) => (
              <ProblemRow key={p.slug} index={i} problem={p} done={false} canTrack={!!user} onToggle={toggleSolved} isDaily={p.slug === dailySlug} />
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
            <p className="text-xs text-ink-400">Kept apart from the bank. Click a check to move one back (the XP goes with it).</p>
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
            {solvedData.problems.map((p, i) => (
              <ProblemRow key={p.slug} index={i} problem={p} done canTrack onToggle={toggleSolved} isDaily={p.slug === dailySlug} />
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
