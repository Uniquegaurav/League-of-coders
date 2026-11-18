// Animated header art for the three play-mode cards. Drawn in SVG/CSS so it is crisp, light and free.
// All motion stops for people who ask their device to reduce motion (see index.css).

function Frame({ from, children }) {
  return (
    <div className={`relative h-32 overflow-hidden bg-gradient-to-br sm:h-full sm:min-h-[8.5rem] ${from} to-ink-950`}>
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(255,255,255,0.07),transparent_60%)]" />
      <div aria-hidden className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
        {children}
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-ink-900/90 to-transparent" />
    </div>
  );
}

/** Solo test: a stopwatch with a sweeping hand and drifting code glyphs. */
export function SoloArt() {
  const ticks = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <Frame from="from-hard/25 via-ink-900">
      {['{ }', '</>', 'O(n)'].map((g, i) => (
        <span key={g} className="float-up absolute font-mono text-xs text-hard/60" style={{ left: `${18 + i * 30}%`, bottom: '18%', animationDelay: `${i * 1.3}s` }}>
          {g}
        </span>
      ))}
      <svg viewBox="0 0 100 100" className="h-24 w-24">
        <defs>
          <radialGradient id="solo-face" cx="50%" cy="45%" r="60%">
            <stop offset="0" stopColor="#2a1b2a" />
            <stop offset="1" stopColor="#120d16" />
          </radialGradient>
        </defs>
        <rect x="44" y="2" width="12" height="7" rx="2" fill="#f48a9b" opacity="0.8" />
        <circle cx="50" cy="54" r="40" fill="url(#solo-face)" stroke="#f48a9b" strokeOpacity="0.7" strokeWidth="3" />
        {ticks.map((a) => (
          <line key={a} x1="50" y1="19" x2="50" y2={a % 90 === 0 ? 25 : 22} stroke="#f7c6ce" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" transform={`rotate(${a} 50 54)`} />
        ))}
        <g className="spin-slow" style={{ transformOrigin: '50px 54px' }}>
          <path d="M50 54 L50 18 A36 36 0 0 1 68 23 Z" fill="#f48a9b" opacity="0.18" />
          <line x1="50" y1="54" x2="50" y2="22" stroke="#ffe1e6" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <circle cx="50" cy="54" r="3.5" fill="#ffe1e6" />
      </svg>
    </Frame>
  );
}
