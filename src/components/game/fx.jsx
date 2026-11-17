import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Counts up to `value` once it scrolls into view. Timer-driven, and always lands on the final value.
export function CountUp({ value = 0, duration = 900, className, format = (n) => n.toLocaleString() }) {
  const target = Number(value) || 0;
  const [shown, setShown] = useState(0);
  const ref = useRef(null);
  const from = useRef(0);

  useEffect(() => {
    if (reduced() || typeof IntersectionObserver === 'undefined') {
      setShown(target);
      return undefined;
    }
    let timer;
    let done;
    const run = () => {
      const base = from.current;
      const start = Date.now();
      setShown(base);
      timer = setInterval(() => {
        const k = Math.min(1, (Date.now() - start) / duration);
        setShown(Math.round(base + (target - base) * (1 - (1 - k) ** 3)));
        if (k >= 1) {
          clearInterval(timer);
          from.current = target;
        }
      }, 16);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        io.disconnect();
        run();
      }
    });
    if (ref.current) io.observe(ref.current);
    // Safety net: whatever happens, show the real number.
    done = setTimeout(() => setShown(target), duration + 2500);
    return () => {
      io.disconnect();
      clearInterval(timer);
      clearTimeout(done);
    };
  }, [target, duration]);

  return (
    <span ref={ref} className={className}>
      {format(shown)}
    </span>
  );
}

// Width is set directly; the grow-in comes from a CSS keyframe so it never depends on JS timing.
export function XpBar({ pct, className }) {
  return (
    <div className={clsx('xp-track', className)}>
      <div className="xp-fill animate-bar-grow" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

export function ProgressRing({ value = 0, max = 1, size = 56, stroke = 5, color = '#7c5cff', children, className }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max ? Math.min(1, value / max) : 0;
  return (
    <span className={clsx('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#1f2437" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          className="ring-draw"
          style={{ '--ring-c': c, strokeDashoffset: c * (1 - pct), filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </span>
  );
}

const CONFETTI_COLORS = ['#7c5cff', '#22d3ee', '#fbbf24', '#fb7185', '#34d399', '#f0abfc'];

export function burstConfetti(count = 80) {
  if (reduced() || typeof document === 'undefined') return;
  for (let i = 0; i < count; i += 1) {
    const el = document.createElement('span');
    el.className = 'confetti-piece';
    el.style.left = `${Math.random() * 100}vw`;
    el.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    el.style.borderRadius = Math.random() > 0.5 ? '2px' : '50%';
    el.style.setProperty('--dx', `${(Math.random() - 0.5) * 300}px`);
    el.style.setProperty('--rot', `${Math.random() * 900}deg`);
    const dur = 1800 + Math.random() * 1600;
    el.style.animationDuration = `${dur}ms`;
    el.style.animationDelay = `${Math.random() * 300}ms`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), dur + 400);
  }
}

// Fixed-position "+25 XP" that survives the source element unmounting.
export function floatXpAt(el, amount) {
  if (!el || !amount || typeof document === 'undefined') return;
  const r = el.getBoundingClientRect();
  const node = document.createElement('span');
  node.className = `pointer-events-none fixed z-[95] animate-xp-float whitespace-nowrap font-display text-sm font-black drop-shadow-[0_0_8px_rgba(161,139,255,.9)] ${
    amount > 0 ? 'text-brand-400' : 'text-ink-400'
  }`;
  node.style.left = `${r.left + r.width / 2}px`;
  node.style.top = `${r.top - 4}px`;
  node.textContent = `${amount > 0 ? '+' : ''}${amount} XP`;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 1400);
}

// "+25 XP" that floats up from wherever it is rendered.
export function FloatingXp({ amount, onDone }) {
  useEffect(() => {
    const id = setTimeout(onDone, 1300);
    return () => clearTimeout(id);
  }, [onDone]);
  return (
    <span
      className={clsx(
        'pointer-events-none absolute left-1/2 top-0 z-20 animate-xp-float whitespace-nowrap font-display text-sm font-black drop-shadow-[0_0_8px_rgba(161,139,255,.9)]',
        amount >= 0 ? 'text-brand-400' : 'text-ink-400'
      )}
    >
      {amount >= 0 ? '+' : ''}
      {amount} XP
    </span>
  );
}

export function LevelUpOverlay({ level, title, onDone }) {
  useEffect(() => {
    burstConfetti(120);
    const id = setTimeout(onDone, 2600);
    return () => clearTimeout(id);
  }, [onDone]);
  return (
    <div className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-ink-950/40 backdrop-blur-[2px]">
      <div className="animate-level-up text-center">
        <p className="font-display text-sm font-bold uppercase tracking-[0.5em] text-neon-400">Level up</p>
        <p className="gradient-text font-display text-8xl font-black drop-shadow-[0_0_30px_rgba(124,92,255,.8)]">{level}</p>
        {title && <p className="mt-1 font-display text-xl font-bold text-white">{title}</p>}
      </div>
    </div>
  );
}
