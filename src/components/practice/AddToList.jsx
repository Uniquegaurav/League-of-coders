import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, ListPlus, Plus } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../../lib/api';
import { track } from '../../lib/analytics';
import { Spinner } from '../ui';
import { usePopover } from './bits';

// "Add to list" menu: tick the lists that should contain this problem, or start a new one.
export default function AddToList({ slug, lists, onChanged }) {
  const [open, setOpen, ref] = usePopover();
  const [keys, setKeys] = useState(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKeys(null);
    api.lists
      .containing(slug)
      .then((r) => setKeys(new Set(r.keys)))
      .catch(() => setKeys(new Set()));
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
      <button
        type="button"
        className={clsx('rounded-lg p-1.5 text-ink-500 transition hover:bg-white/[0.06] hover:text-white', open && 'bg-white/[0.06] text-white')}
        aria-label="Add to a list"
        title="Add to a list"
        onClick={() => setOpen((o) => !o)}
      >
        <ListPlus className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 w-64 space-y-0.5 rounded-2xl border border-ink-700 bg-ink-900 p-2 shadow-2xl">
          <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-ink-500">Add to list</p>
          {keys === null ? (
            <div className="flex justify-center py-3">
              <Spinner className="h-4 w-4 text-ink-500" />
            </div>
          ) : (
            lists.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => toggle(l.key)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-ink-200 hover:bg-white/[0.05]"
              >
                <span className={clsx('flex h-4 w-4 items-center justify-center rounded border', keys.has(l.key) ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-500')}>
                  {keys.has(l.key) && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className="truncate">{l.name}</span>
              </button>
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
