import { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { BookOpen, Bookmark, Building2, ChevronDown, Crown, Library, ListChecks, Plus, Settings2, Sparkles } from 'lucide-react';
import { InfoTip } from '../ui';
import { ListIcon, SLUG_TYPE } from './bits';

export const BUILT_IN = [
  { key: 'curated', name: 'Interview classics', description: 'The hand-picked set battles draw from.' },
  { key: 'all', name: 'All problems', description: 'Every free LeetCode problem.' },
];

export function iconFor(list) {
  if (!list) return Library;
  if (list.key === 'curated') return Sparkles;
  if (list.key === 'all') return Library;
  if (list.premium) return list.kind === 'company' ? Building2 : Bookmark;
  if (list.custom) return ListChecks;
  return BookOpen;
}

function Item({ list, active, onPick, onDropSlug }) {
  const [over, setOver] = useState(false);
  const droppable = !!onDropSlug;
  return (
    <button
      type="button"
      onClick={() => onPick(list.key)}
      onDragOver={(e) => {
        if (!droppable || !e.dataTransfer.types.includes(SLUG_TYPE)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        setOver(false);
        const slug = e.dataTransfer.getData(SLUG_TYPE);
        if (droppable && slug) {
          e.preventDefault();
          onDropSlug(list, slug);
        }
      }}
      className={clsx(
        'group flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-sm transition-colors',
        active ? 'bg-white/[0.08] text-white' : 'text-ink-300 hover:bg-white/[0.04] hover:text-white',
        over && 'bg-brand-500/15 ring-1 ring-brand-500/60'
      )}
      aria-current={active ? 'true' : undefined}
    >
      <ListIcon icon={iconFor(list)} className={active ? 'text-white' : undefined} />
      <span className="min-w-0 flex-1 truncate">{list.name}</span>
      {list.count != null && (
        <span className="shrink-0 font-mono text-[11px] text-ink-500">
          {list.solved != null ? `${list.solved}/` : ''}
          {list.count}
        </span>
      )}
    </button>
  );
}

function Section({ title, action, children }) {
  return (
    <div className="space-y-0.5">
      <div className="flex h-7 items-center justify-between px-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

function NewList({ onCreate }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  if (!open) {
    return (
      <button type="button" className="rounded-md p-1 text-ink-500 transition hover:bg-white/[0.06] hover:text-white" title="New list" aria-label="New list" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
      </button>
    );
  }
  return (
    <form
      className="absolute inset-x-0 top-8 z-10 flex gap-1.5 rounded-xl border border-ink-700 bg-ink-900 p-1.5 shadow-2xl"
      onSubmit={async (e) => {
        e.preventDefault();
        if (name.trim() && (await onCreate(name.trim()))) {
          setName('');
          setOpen(false);
        }
      }}
    >
      <input
        className="input py-1.5 text-xs"
        autoFocus
        maxLength={60}
        placeholder="List name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        onBlur={() => !name && setOpen(false)}
      />
      <button className="btn-primary btn-sm shrink-0" disabled={!name.trim()}>
        Create
      </button>
    </form>
  );
}

function Lists({ active, lists, user, onPick, onCreate, onDropSlug, onOpenPremium }) {
  const premium = user?.premium?.active;
  return (
    <nav className="space-y-4" aria-label="Problem lists">
      <Section title="Library">
        {BUILT_IN.map((l) => (
          <Item key={l.key} list={l} active={active === l.key} onPick={onPick} />
        ))}
      </Section>

      {lists.curated.length > 0 && (
        <Section title="Study plans">
          {lists.curated.map((l) => (
            <Item key={l.key} list={l} active={active === l.key} onPick={onPick} />
          ))}
        </Section>
      )}

      <div className="relative">
        <Section
          title={
            <span className="inline-flex items-center gap-1">
              My lists
              <InfoTip label="About my lists">Drag any problem onto a list here to add it. Inside your own list, drag rows (or use the arrows) to set the order.</InfoTip>
            </span>
          }
          action={user && <NewList onCreate={onCreate} />}
        >
          {!user ? (
            <p className="px-2 py-1 text-xs text-ink-500">
              <Link to="/login" state={{ from: '/practice' }} className="text-brand-400 hover:underline">
                Sign in
              </Link>{' '}
              to make your own lists.
            </p>
          ) : lists.mine.length ? (
            lists.mine.map((l) => <Item key={l.key} list={l} active={active === l.key} onPick={onPick} onDropSlug={onDropSlug} />)
          ) : (
            <p className="px-2 py-1 text-xs text-ink-500">No lists yet. Use + to start one.</p>
          )}
        </Section>
      </div>

      {user && (
        <Section
          title={
            <span className="inline-flex items-center gap-1.5">
              Premium {premium && <Crown className="h-3 w-3 text-gold" />}
            </span>
          }
          action={
            premium && (
              <button type="button" className="rounded-md p-1 text-ink-500 transition hover:bg-white/[0.06] hover:text-white" title="Manage Premium" aria-label="Manage Premium" onClick={onOpenPremium}>
                <Settings2 className="h-3.5 w-3.5" />
              </button>
            )
          }
        >
          {premium ? (
            lists.premium.length ? (
              lists.premium.map((l) => <Item key={l.key} list={l} active={active === l.key} onPick={onPick} />)
            ) : (
              <button type="button" onClick={onOpenPremium} className="w-full rounded-xl px-2 py-1.5 text-left text-xs text-ink-400 hover:bg-white/[0.04] hover:text-white">
                Import your LeetCode lists and company lists →
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={onOpenPremium}
              className="group flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-sm text-ink-300 transition hover:bg-white/[0.04] hover:text-white"
            >
              <ListIcon icon={Crown} className="text-gold" />
              <span className="min-w-0 flex-1">
                <span className="block">Unlock Premium</span>
                <span className="block text-[11px] text-ink-500">Company lists, your LeetCode lists</span>
              </span>
            </button>
          )}
        </Section>
      )}
    </nav>
  );
}

/** Left column on large screens; a collapsible picker on small ones. */
export default function ListSidebar(props) {
  const [open, setOpen] = useState(false);
  const all = [...BUILT_IN, ...props.lists.curated, ...props.lists.mine, ...props.lists.premium];
  const current = all.find((l) => l.key === props.active) || BUILT_IN[0];
  const pick = (key) => {
    setOpen(false);
    props.onPick(key);
  };
  return (
    <>
      <aside className="panel sticky top-20 hidden max-h-[calc(100vh-6rem)] overflow-y-auto p-3 lg:block">
        <Lists {...props} />
      </aside>
      <div className="lg:hidden">
        <button type="button" className="panel flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <ListIcon icon={iconFor(current)} />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">List</span>
            <span className="block truncate text-sm font-medium text-white">{current.name}</span>
          </span>
          <ChevronDown className={clsx('h-4 w-4 text-ink-400 transition', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="panel mt-2 p-3">
            <Lists {...props} onPick={pick} />
          </div>
        )}
      </div>
    </>
  );
}
