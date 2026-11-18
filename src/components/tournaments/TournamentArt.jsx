import clsx from 'clsx';

// Artwork for tournament cards: a soft gradient field with swooping arcs and a glass shape.
// Each kind has its own palette and shape so cards are told apart at a glance.
const THEMES = {
  daily: { bg: 'from-[#3b2a8f] via-[#5a3fd1] to-[#8f7bff]', arc: 'rgba(255,255,255,0.10)', shape: 'cube', hue: ['#d9d2ff', '#8f7bff', '#4b33c9'] },
  cup: { bg: 'from-[#c2641c] via-[#e79a3a] to-[#f6cf7a]', arc: 'rgba(255,255,255,0.14)', shape: 'gem', hue: ['#fff4d6', '#f3b860', '#b5641f'] },
  special: { bg: 'from-[#0f5a63] via-[#1b8f8c] to-[#5fd4c4]', arc: 'rgba(255,255,255,0.12)', shape: 'stack', hue: ['#dcfffa', '#5fd4c4', '#126c6b'] },
};

function Cube({ x = 0, y = 0, s = 1, hue, id }) {
  const [light, mid, dark] = hue;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light} stopOpacity="0.95" />
          <stop offset="1" stopColor={mid} stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={`${id}-left`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mid} stopOpacity="0.75" />
          <stop offset="1" stopColor={dark} stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={`${id}-right`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={light} stopOpacity="0.55" />
          <stop offset="1" stopColor={mid} stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <path d="M0 -40 L46 -16 L0 8 L-46 -16 Z" fill={`url(#${id}-top)`} stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" />
      <path d="M-46 -16 L0 8 L0 60 L-46 36 Z" fill={`url(#${id}-left)`} stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
      <path d="M46 -16 L0 8 L0 60 L46 36 Z" fill={`url(#${id}-right)`} stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
      <path d="M-30 -12 L-6 -24" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

function Gem({ hue, id }) {
  const [light, mid, dark] = hue;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="0.55" stopColor={mid} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
      </defs>
      <path d="M-44 -18 L-22 -44 L22 -44 L44 -18 L0 52 Z" fill={`url(#${id}-g)`} fillOpacity="0.85" stroke="rgba(255,255,255,0.75)" strokeWidth="1.3" />
      <path d="M-44 -18 H44 M-22 -44 L-12 -18 L0 52 M22 -44 L12 -18 L0 52 M-12 -18 L0 -44 L12 -18" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
      <path d="M-30 -24 L-18 -38" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

export default function TournamentArt({ kind = 'daily', className, compact = false }) {
  const t = THEMES[kind] || THEMES.daily;
  const id = `ta-${kind}-${compact ? 's' : 'l'}`;
  return (
    <div aria-hidden className={clsx('relative overflow-hidden bg-gradient-to-br', t.bg, className)}>
      <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <path d="M-40 230 C 80 120, 200 40, 460 30" fill="none" stroke={t.arc} strokeWidth="60" />
        <path d="M120 240 C 200 170, 300 120, 460 120" fill="none" stroke={t.arc} strokeWidth="34" />
        <ellipse cx="260" cy="150" rx="120" ry="34" fill="rgba(0,0,0,0.16)" />
        <g className="art-drift" transform="translate(260 105)">
          {t.shape === 'gem' ? (
            <Gem hue={t.hue} id={id} />
          ) : t.shape === 'stack' ? (
            <>
              <Cube x={-34} y={18} s={0.72} hue={t.hue} id={`${id}-a`} />
              <Cube x={34} y={-6} s={0.82} hue={t.hue} id={`${id}-b`} />
            </>
          ) : (
            <Cube hue={t.hue} id={id} />
          )}
        </g>
      </svg>
    </div>
  );
}
