import clsx from 'clsx';
import { ArrowUpDown, Check, ListFilter, Search, X } from 'lucide-react';
import { usePopover } from './bits';

export const SORT_OPTIONS = [
  ['default', 'Default order'],
  ['number', 'Problem number'],
  ['difficulty', 'Difficulty: easy first'],
  ['difficulty-desc', 'Difficulty: hard first'],
  ['acceptance', 'Acceptance: high first'],
  ['acceptance-asc', 'Acceptance: low first'],
  ['title', 'Title A–Z'],
];

const iconBtn = 'relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-ink-300 transition hover:bg-white/[0.09] hover:text-white';

function SortMenu({ sort, onSort, defaultLabel, isPool }) {
  const [open, setOpen, ref] = usePopover();
  return (
    <div className="relative" ref={ref}>
      <button type="button" className={clsx(iconBtn, open && 'bg-white/[0.09] text-white')} title="Sort" aria-label="Sort" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <ArrowUpDown className="h-4 w-4" />
        {sort !== 'default' && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-400" />}
      </button>
      {open && (
        <div className="absolute left-0 top-12 z-30 w-60 rounded-2xl border border-ink-700 bg-ink-900 p-1.5 shadow-2xl">
          {SORT_OPTIONS.filter(([key]) => !(isPool && key === 'number')).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onSort(key);
                setOpen(false);
              }}
              className={clsx('flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm', sort === key ? 'bg-white/[0.06] text-white' : 'text-ink-300 hover:bg-white/[0.04] hover:text-white')}
            >
              {key === 'default' ? defaultLabel : label}
              {sort === key && <Check className="h-3.5 w-3.5 text-brand-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterMenu({ filters, topics, onChange }) {
  const [open, setOpen, ref] = usePopover();
  const active = (filters.difficulty ? 1 : 0) + (filters.topic ? 1 : 0);
  return (
    <div className="relative" ref={ref}>
      <button type="button" className={clsx(iconBtn, open && 'bg-white/[0.09] text-white')} title="Filter" aria-label="Filter" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <ListFilter className="h-4 w-4" />
        {active > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-400" />}
      </button>
      {open && (
        <div className="absolute left-0 top-12 z-30 w-72 space-y-4 rounded-2xl border border-ink-700 bg-ink-900 p-4 shadow-2xl sm:left-auto sm:right-0">
          <div>
            <p className="label">Difficulty</p>
            <div className="pill-tabs w-full">
              {['', 'Easy', 'Medium', 'Hard'].map((d) => (
                <button key={d || 'any'} type="button" className={clsx('pill-tab flex-1 px-2 text-xs', filters.difficulty === d && 'pill-tab-active')} onClick={() => onChange({ difficulty: d })}>
                  {d || 'Any'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="label">Topic</p>
            <select className="input py-2" value={filters.topic} onChange={(e) => onChange({ topic: e.target.value })} aria-label="Topic">
              <option value="">Any topic</option>
              {topics.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          {active > 0 && (
            <button type="button" className="text-xs text-ink-400 hover:text-white" onClick={() => onChange({ difficulty: '', topic: '' })}>
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const TABS = [
  ['todo', 'To solve'],
  ['solved', 'Solved'],
  ['all', 'All'],
];

export default function Toolbar({ filters, topics, onChange, sort, onSort, defaultSortLabel, isPool, tab, onTab, counts, signedIn }) {
  const chips = [filters.difficulty && ['difficulty', filters.difficulty], filters.topic && ['topic', filters.topic]].filter(Boolean);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            className="h-10 w-full rounded-xl border-0 bg-white/[0.05] pl-10 pr-9 text-sm text-white placeholder:text-ink-500 transition focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            placeholder="Search by title or number"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            aria-label="Search problems"
          />
          {filters.search && (
            <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-500 hover:text-white" aria-label="Clear search" onClick={() => onChange({ search: '' })}>
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <SortMenu sort={sort} onSort={onSort} defaultLabel={defaultSortLabel} isPool={isPool} />
        <FilterMenu filters={filters} topics={topics} onChange={onChange} />
        {signedIn && (
          <div className="pill-tabs w-full sm:ml-auto sm:w-auto" role="tablist" aria-label="Show">
            {TABS.map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => onTab(k)} className={clsx('pill-tab flex-1 px-3 text-xs sm:flex-none sm:text-sm', tab === k && 'pill-tab-active')}>
                {label}
                {counts && <span className={clsx('ml-1.5 font-mono text-[11px]', tab === k ? 'text-ink-300' : 'text-ink-500')}>{counts[k]}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map(([k, v]) => (
            <button key={k} type="button" className="chip hover:border-ink-500 hover:text-white" onClick={() => onChange({ [k]: '' })} title="Remove filter">
              {v} <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
