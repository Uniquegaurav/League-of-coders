import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Info, Loader2, ShieldCheck } from 'lucide-react';

export function Spinner({ className }) {
  return <Loader2 className={clsx('animate-spin', className || 'h-5 w-5')} />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-ink-400">
      <Spinner className="h-7 w-7 text-brand-400" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

const DIFFICULTY_STYLES = {
  Easy: 'text-easy bg-easy/[0.08] border-easy/25',
  Medium: 'text-medium bg-medium/[0.08] border-medium/25',
  Hard: 'text-hard bg-hard/[0.08] border-hard/25',
};

export function DifficultyBadge({ difficulty, className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold',
        DIFFICULTY_STYLES[difficulty],
        className
      )}
    >
      {difficulty}
    </span>
  );
}

const AVATAR_COLORS = ['from-brand-500 to-fuchsia-500', 'from-cyan-500 to-blue-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500', 'from-rose-500 to-pink-500'];

export function Avatar({ name = '?', src, size = 36, online, className }) {
  const color = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return (
    <span className={clsx('relative inline-flex shrink-0', className)} style={{ width: size, height: size }}>
      {src ? (
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover ring-1 ring-ink-600" referrerPolicy="no-referrer" />
      ) : (
        <span
          className={clsx('flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white', color)}
          style={{ fontSize: size * 0.42 }}
        >
          {name.trim().charAt(0).toUpperCase()}
        </span>
      )}
      {online !== undefined && (
        <span
          className={clsx(
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-ink-900',
            online ? 'bg-easy' : 'bg-ink-500'
          )}
        />
      )}
    </span>
  );
}

export function VerifiedBadge({ verified }) {
  if (!verified) return null;
  return (
    <span title="LeetCode account ownership verified" className="inline-flex text-neon-400">
      <ShieldCheck className="h-3.5 w-3.5" />
    </span>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-700 px-6 py-10 text-center">
      {Icon && <Icon className="h-8 w-8 text-ink-500" />}
      <p className="font-medium text-ink-200">{title}</p>
      {children && <p className="max-w-sm text-sm text-ink-400">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, disabled, label, description }) {
  return (
    <label className={clsx('flex cursor-pointer items-start gap-3', disabled && 'cursor-not-allowed opacity-60')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition',
          checked ? 'bg-brand-500' : 'bg-ink-600'
        )}
      >
        <span className={clsx('h-4 w-4 rounded-full bg-white shadow transition', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
      </button>
      {(label || description) && (
        <span>
          {label && <span className="block text-sm font-medium text-ink-200">{label}</span>}
          {description && <span className="block text-xs text-ink-400">{description}</span>}
        </span>
      )}
    </label>
  );
}

export function Stepper({ value, onChange, min = 0, max = 10, disabled }) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl border border-ink-700 bg-ink-950/60">
      <button type="button" className="px-3 py-2 text-ink-300 hover:bg-ink-800 disabled:opacity-40" disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span className="w-8 text-center font-mono text-sm font-bold text-white">{value}</span>
      <button type="button" className="px-3 py-2 text-ink-300 hover:bg-ink-800 disabled:opacity-40" disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}

export function ProgressBar({ value = 0, max = 1, className, barClassName = 'bg-brand-500' }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={clsx('h-1.5 overflow-hidden rounded-full bg-ink-800', className)}>
      <div className={clsx('h-full rounded-full transition-[width] duration-500', barClassName)} style={{ width: `${pct}%` }} />
    </div>
  );
}

// Small "i" button that reveals the specifics, so page copy can stay short.
// The tip renders in a portal with fixed positioning, so cards with overflow-hidden can never clip it.
export function InfoTip({ children, label = 'More info', className }) {
  const [pos, setPos] = useState(null);
  const btn = useRef(null);
  const tip = useRef(null);
  const open = !!pos;

  const place = () => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(288, window.innerWidth - 24);
    const left = Math.max(12, Math.min(r.left + r.width / 2 - width / 2, window.innerWidth - width - 12));
    const below = r.bottom + 8;
    const flip = below + 160 > window.innerHeight && r.top > 180;
    setPos({ left, width, top: flip ? undefined : below, bottom: flip ? window.innerHeight - r.top + 8 : undefined });
  };

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !btn.current?.contains(e.target) && !tip.current?.contains(e.target) && setPos(null);
    const esc = (e) => e.key === 'Escape' && setPos(null);
    const hide = () => setPos(null);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [open]);

  return (
    <span className={clsx('relative inline-flex align-middle', className)}>
      <button
        ref={btn}
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (open) setPos(null);
          else place();
        }}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-ink-400 transition hover:text-white focus-visible:text-white"
      >
        <Info className="h-4 w-4" />
      </button>
      {open &&
        createPortal(
          <span
            ref={tip}
            role="tooltip"
            style={{ position: 'fixed', left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.width }}
            className="z-[100] rounded-xl border border-ink-700 bg-ink-900/95 p-3.5 text-left text-sm font-normal normal-case leading-relaxed tracking-normal text-ink-300 shadow-2xl backdrop-blur"
          >
            {children}
          </span>,
          document.body
        )}
    </span>
  );
}

// Page heading that sits directly on the page backdrop (see Backdrop.jsx).
export function PageBanner({ title, children, info, actions, className }) {
  return (
    <section className={clsx('flex flex-wrap items-end justify-between gap-4 pb-2 pt-6 sm:pt-12', className)}>
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 font-display text-4xl font-bold tracking-tight text-white drop-shadow sm:text-5xl">
          {title}
          {info && <InfoTip label={`About ${typeof title === 'string' ? title : 'this page'}`}>{info}</InfoTip>}
        </h1>
        {children && <p className="mt-2 max-w-xl text-lg text-ink-200">{children}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </section>
  );
}
