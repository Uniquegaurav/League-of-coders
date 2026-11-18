// Animated header art for the three play-mode cards. Drawn in SVG/CSS so it is crisp, light and free.
// All motion stops for people who ask their device to reduce motion (see index.css).

function Frame({ from, children }) {
  return (
    <div className={`relative h-32 overflow-hidden rounded-t-2xl bg-gradient-to-br ${from} to-ink-950`}>
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

/** Quick play: a lightning bolt with energy rings pulsing out from it. */
export function QuickArt() {
  return (
    <Frame from="from-neon-500/25 via-ink-900">
      {[0, 0.8, 1.6].map((d) => (
        <span key={d} className="ring-pulse absolute h-24 w-24 rounded-full border-2 border-neon-400/60" style={{ animationDelay: `${d}s` }} />
      ))}
      <svg viewBox="0 0 64 64" className="flicker relative h-16 w-16">
        <defs>
          <linearGradient id="bolt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d5fff7" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <path d="M36 4 L12 36 H29 L24 60 L52 24 H34 Z" fill="url(#bolt)" stroke="#0b3d3a" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </Frame>
  );
}

/** Battle hour / tournament: a trophy under slowly turning light rays, with sparkles. */
export function EventArt() {
  return (
    <Frame from="from-gold/20 via-ink-900">
      <div
        className="spin-slower absolute h-72 w-72 opacity-40"
        style={{ background: 'repeating-conic-gradient(from 0deg, rgba(227,199,122,0.35) 0deg 8deg, transparent 8deg 24deg)', maskImage: 'radial-gradient(circle, #000 20%, transparent 65%)', WebkitMaskImage: 'radial-gradient(circle, #000 20%, transparent 65%)' }}
      />
      {[
        ['22%', '30%', 0],
        ['74%', '26%', 0.7],
        ['66%', '68%', 1.4],
        ['30%', '70%', 1.9],
      ].map(([l, t, d]) => (
        <span key={`${l}${t}`} className="twinkle absolute h-1.5 w-1.5 rounded-full bg-gold" style={{ left: l, top: t, animationDelay: `${d}s`, boxShadow: '0 0 8px #e3c77a' }} />
      ))}
      <svg viewBox="0 0 64 64" className="relative h-16 w-16 drop-shadow-[0_0_12px_rgba(227,199,122,0.55)]">
        <defs>
          <linearGradient id="cup" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff3cf" />
            <stop offset="1" stopColor="#c9a24a" />
          </linearGradient>
        </defs>
        <path d="M18 8 H46 V22 C46 32 40 38 32 38 C24 38 18 32 18 22 Z" fill="url(#cup)" />
        <path d="M18 12 H10 C10 22 14 26 19 27 M46 12 H54 C54 22 50 26 45 27" fill="none" stroke="#e3c77a" strokeWidth="3" strokeLinecap="round" />
        <rect x="29" y="38" width="6" height="9" fill="#c9a24a" />
        <rect x="20" y="47" width="24" height="7" rx="2" fill="url(#cup)" />
      </svg>
    </Frame>
  );
}
