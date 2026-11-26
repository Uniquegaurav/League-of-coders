import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

// Small shared pieces for the Practice page.

/** Solved on/off. A switch reads as "state", which is what this is; it is not a call to action. */
export function StatusSwitch({ checked, onChange, disabled, busy, label, className }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled || busy}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(!checked);
      }}
      className={clsx(
        'relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full transition-colors duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
        checked ? 'bg-easy/90' : 'bg-ink-700 hover:bg-ink-600',
        disabled && 'cursor-not-allowed opacity-40',
        busy && 'opacity-60',
        className
      )}
    >
      <span
        className={clsx(
          'h-3.5 w-3.5 rounded-full shadow transition-transform duration-200',
          checked ? 'translate-x-[16px] bg-ink-950' : 'translate-x-[2px] bg-ink-300'
        )}
      />
    </button>
  );
}

/** Closes on outside click and Escape. Returns [open, setOpen, ref]. */
export function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  return [open, setOpen, ref];
}

export const DIFF_TEXT = { Easy: 'text-easy', Medium: 'text-medium', Hard: 'text-hard' };
export const DIFF_SHORT = { Easy: 'Easy', Medium: 'Med.', Hard: 'Hard' };
export const DIFF_BAR = { Easy: 'bg-easy', Medium: 'bg-medium', Hard: 'bg-hard' };

/** Square icon tile used for list identity (sidebar and list header). */
export function ListIcon({ icon: Icon, size = 'sm', className }) {
  return (
    <span
      className={clsx(
        'flex shrink-0 items-center justify-center bg-gradient-to-b from-white/[0.09] to-white/[0.03] text-ink-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]',
        size === 'lg' ? 'h-14 w-14 rounded-2xl' : 'h-7 w-7 rounded-lg',
        className
      )}
    >
      <Icon className={size === 'lg' ? 'h-6 w-6' : 'h-3.5 w-3.5'} />
    </span>
  );
}

export const SLUG_TYPE = 'application/x-loc-slug';
