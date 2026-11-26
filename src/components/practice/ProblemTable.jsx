import { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowDown, ArrowUp, GripVertical, Lock, X } from 'lucide-react';
import AddToList from './AddToList';
import { DIFF_SHORT, DIFF_TEXT, SLUG_TYPE, StatusSwitch } from './bits';

function Row({ problem, index, count, done, busy, canTrack, onToggle, myLists, onListChanged, reorderable, onMove, onRemove, drag }) {
  const { dragSlug, over, setDrag, setOver, drop } = drag;
  const isOver = over?.slug === problem.slug && dragSlug && dragSlug !== problem.slug;
  return (
    <li
      draggable={canTrack}
      onDragStart={(e) => {
        e.dataTransfer.setData(SLUG_TYPE, problem.slug);
        e.dataTransfer.effectAllowed = reorderable ? 'copyMove' : 'copy';
        setDrag(problem.slug);
      }}
      onDragEnd={() => {
        setDrag(null);
        setOver(null);
      }}
      onDragOver={(e) => {
        if (!reorderable || !dragSlug) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const r = e.currentTarget.getBoundingClientRect();
        setOver({ slug: problem.slug, after: e.clientY > r.top + r.height / 2 });
      }}
      onDrop={(e) => {
        if (!reorderable || !dragSlug) return;
        e.preventDefault();
        drop();
      }}
      className={clsx(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors sm:gap-4',
        index % 2 === 0 ? 'bg-white/[0.025]' : 'bg-transparent',
        'hover:bg-white/[0.05]',
        dragSlug === problem.slug && 'opacity-40'
      )}
    >
      {isOver && <span className={clsx('pointer-events-none absolute inset-x-2 h-0.5 rounded-full bg-brand-400', over.after ? '-bottom-px' : '-top-px')} />}
      {reorderable && (
        <span className="-ml-1 hidden cursor-grab text-ink-600 transition group-hover:text-ink-300 active:cursor-grabbing sm:block" title="Drag to reorder" aria-hidden>
          <GripVertical className="h-4 w-4" />
        </span>
      )}
      <StatusSwitch
        checked={done}
        busy={busy}
        onChange={() => onToggle(problem.slug)}
        label={canTrack ? (done ? 'Solved. Switch off to mark as not solved' : 'Mark as solved') : 'Sign in to track progress'}
      />
      <Link to={`/problems/${problem.slug}`} draggable={false} className="min-w-0 flex-1">
        <p className={clsx('truncate text-sm font-medium transition-colors', done ? 'text-ink-400' : 'text-ink-100 group-hover:text-white')}>
          {problem.frontendId && <span className="text-ink-500">{problem.frontendId}. </span>}
          {problem.title}
          {problem.paidOnly && <Lock className="ml-1.5 inline h-3 w-3 -translate-y-px text-gold" aria-label="LeetCode Premium" />}
        </p>
        {problem.tags?.length > 0 && <p className="mt-0.5 hidden truncate text-xs text-ink-500 md:block">{problem.tags.slice(0, 3).join(' · ')}</p>}
      </Link>
      {problem.acRate != null && <span className="hidden w-12 text-right font-mono text-xs text-ink-400 sm:block" title="Acceptance rate">{problem.acRate.toFixed(1)}%</span>}
      <span className={clsx('w-10 text-right text-xs font-semibold', DIFF_TEXT[problem.difficulty])}>{DIFF_SHORT[problem.difficulty]}</span>
      <div className="flex w-[4.5rem] shrink-0 items-center justify-end gap-0.5">
        {reorderable && (
          <span className="hidden items-center opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100 sm:flex">
            <button type="button" className="rounded-md p-1 text-ink-500 hover:bg-white/[0.06] hover:text-white disabled:opacity-30" title="Move up" aria-label="Move up" disabled={index === 0} onClick={() => onMove(problem.slug, -1)}>
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button type="button" className="rounded-md p-1 text-ink-500 hover:bg-white/[0.06] hover:text-white disabled:opacity-30" title="Move down" aria-label="Move down" disabled={index === count - 1} onClick={() => onMove(problem.slug, 1)}>
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </span>
        )}
        {onRemove ? (
          <button type="button" className="rounded-md p-1 text-ink-500 opacity-0 transition hover:bg-white/[0.06] hover:text-hard group-focus-within:opacity-100 group-hover:opacity-100" title="Remove from this list" aria-label="Remove from this list" onClick={() => onRemove(problem.slug)}>
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          canTrack && myLists && <AddToList slug={problem.slug} lists={myLists} onChanged={onListChanged} />
        )}
      </div>
    </li>
  );
}

export function SkeletonRows({ n = 10 }) {
  return (
    <ul className="space-y-1" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <li key={i} className={clsx('flex items-center gap-4 rounded-xl px-3 py-3.5', i % 2 === 0 && 'bg-white/[0.025]')}>
          <span className="h-[18px] w-8 rounded-full bg-ink-800" />
          <span className="h-3 flex-1 animate-pulse rounded bg-ink-800" style={{ maxWidth: `${40 + ((i * 37) % 40)}%` }} />
          <span className="ml-auto h-3 w-10 rounded bg-ink-800" />
        </li>
      ))}
    </ul>
  );
}

/**
 * The problem rows. In your own list (default order) rows can be dragged to reorder or moved with the arrows;
 * anywhere, a row can be dragged onto one of your lists in the sidebar.
 */
export default function ProblemTable({ problems, solved, busy, canTrack, onToggle, myLists, onListChanged, reorderable, onReorder, onRemove, stale }) {
  const [dragSlug, setDrag] = useState(null);
  const [over, setOver] = useState(null);

  const order = problems.map((p) => p.slug);
  const drop = () => {
    if (!over || !dragSlug || over.slug === dragSlug) return;
    const next = order.filter((s) => s !== dragSlug);
    const at = next.indexOf(over.slug) + (over.after ? 1 : 0);
    next.splice(at, 0, dragSlug);
    setDrag(null);
    setOver(null);
    onReorder(next);
  };
  const onMove = (slug, dir) => {
    const i = order.indexOf(slug);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    onReorder(next);
  };

  return (
    <ul className={clsx('space-y-1 transition-opacity duration-150', stale && 'opacity-50')} onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setOver(null)}>
      {problems.map((p, i) => (
        <Row
          key={p.slug}
          problem={p}
          index={i}
          count={problems.length}
          done={solved.has(p.slug)}
          busy={busy.has(p.slug)}
          canTrack={canTrack}
          onToggle={onToggle}
          myLists={myLists}
          onListChanged={onListChanged}
          reorderable={reorderable}
          onMove={onMove}
          onRemove={onRemove}
          drag={{ dragSlug, over, setDrag, setOver, drop }}
        />
      ))}
    </ul>
  );
}
