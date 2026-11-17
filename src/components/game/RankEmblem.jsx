import { useId } from 'react';
import clsx from 'clsx';
import { tierFor } from '../../lib/rank';

// Original crest-style rank badge drawn in SVG. Higher tiers grow wings, a crown and more gems.
export default function RankEmblem({ rating, tier: tierProp, size = 56, animated = true, className }) {
  const tier = tierProp || tierFor(rating);
  const [light, mid, dark] = tier.hue;
  const uid = useId().replace(/:/g, '');
  const g = `rg-${uid}`;
  const s = `rs-${uid}`;
  const high = tier.gems >= 4;
  const top = tier.gems >= 5;

  return (
    <span className={clsx('relative inline-flex shrink-0 items-center justify-center', className)} style={{ width: size, height: size }} title={tier.name}>
      {animated && (
        <span className="absolute inset-[14%] animate-glow-pulse rounded-full blur-xl" style={{ background: mid, opacity: 0.6 }} />
      )}
      <svg viewBox="0 0 100 100" className="relative h-full w-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]" aria-hidden="true">
        <defs>
          <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={light} />
            <stop offset="55%" stopColor={mid} />
            <stop offset="100%" stopColor={dark} />
          </linearGradient>
          <linearGradient id={s} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity=".55" />
            <stop offset="45%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {high && (
          <g fill={`url(#${g})`} opacity=".9">
            <path d="M22 40 L4 30 L10 46 L2 50 L14 58 L10 66 L26 60 Z" />
            <path d="M78 40 L96 30 L90 46 L98 50 L86 58 L90 66 L74 60 Z" />
          </g>
        )}
        {top && <path d="M36 14 L42 4 L50 12 L58 4 L64 14 Z" fill={light} stroke={dark} strokeWidth="1.5" />}

        {/* shield body */}
        <path d="M50 12 L80 24 L80 52 C80 70 66 84 50 92 C34 84 20 70 20 52 L20 24 Z" fill={`url(#${g})`} stroke={dark} strokeWidth="2.5" />
        <path d="M50 20 L73 29 L73 52 C73 66 63 77 50 84 C37 77 27 66 27 52 L27 29 Z" fill="none" stroke={light} strokeOpacity=".55" strokeWidth="1.5" />
        <path d="M50 12 L80 24 L80 52 C80 70 66 84 50 92 C34 84 20 70 20 52 L20 24 Z" fill={`url(#${s})`} />

        {/* center glyph: crossed code brackets */}
        <g fill="none" stroke={dark} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M42 40 L33 50 L42 60" />
          <path d="M58 40 L67 50 L58 60" />
          <path d="M53 37 L47 63" />
        </g>
        <g fill="none" stroke="#fff" strokeOpacity=".85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M42 40 L33 50 L42 60" />
          <path d="M58 40 L67 50 L58 60" />
          <path d="M53 37 L47 63" />
        </g>

        {/* gems */}
        {Array.from({ length: tier.gems }).map((_, i) => {
          const x = 50 + (i - (tier.gems - 1) / 2) * 8;
          return <path key={i} d={`M${x} 70 l3 3.5 l-3 3.5 l-3 -3.5 Z`} fill="#fff" stroke={dark} strokeWidth=".8" />;
        })}
      </svg>
    </span>
  );
}
