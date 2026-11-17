// Small original vector scenes for the game-mode cards. Each animates subtly via Tailwind classes.

export function BattleArt({ className }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ba-blade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#a18bff" />
        </linearGradient>
        <radialGradient id="ba-burst">
          <stop offset="0" stopColor="#fbbf24" stopOpacity=".9" />
          <stop offset="1" stopColor="#fb7185" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="56" r="40" fill="url(#ba-burst)" className="animate-glow-pulse" />
      <g className="origin-center animate-float-slow">
        <g transform="rotate(45 60 60)">
          <rect x="56" y="14" width="8" height="66" rx="2" fill="url(#ba-blade)" />
          <rect x="44" y="78" width="32" height="6" rx="3" fill="#fbbf24" />
          <rect x="57" y="84" width="6" height="18" rx="2" fill="#7c2d12" />
        </g>
        <g transform="rotate(-45 60 60)">
          <rect x="56" y="14" width="8" height="66" rx="2" fill="url(#ba-blade)" />
          <rect x="44" y="78" width="32" height="6" rx="3" fill="#22d3ee" />
          <rect x="57" y="84" width="6" height="18" rx="2" fill="#0c4a6e" />
        </g>
      </g>
      {[[22, 30], [96, 26], [30, 92], [92, 90]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 5} L${x + 1.5} ${y - 1.5} L${x + 5} ${y} L${x + 1.5} ${y + 1.5} L${x} ${y + 5} L${x - 1.5} ${y + 1.5} L${x - 5} ${y} L${x - 1.5} ${y - 1.5} Z`} fill="#fde68a" className="animate-glow-pulse" style={{ animationDelay: `${i * 0.4}s` }} />
      ))}
    </svg>
  );
}

export function SoloArt({ className }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="so-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="44" fill="none" stroke="#fbbf24" strokeOpacity=".25" strokeWidth="2" strokeDasharray="4 6" className="origin-center animate-spin-slow" />
      <g className="animate-float-slow">
        <rect x="36" y="20" width="48" height="8" rx="3" fill="#78350f" />
        <rect x="36" y="92" width="48" height="8" rx="3" fill="#78350f" />
        <path d="M42 28 H78 C78 46 64 52 60 60 C64 68 78 74 78 92 H42 C42 74 56 68 60 60 C56 52 42 46 42 28 Z" fill="#fff" fillOpacity=".08" stroke="#fde68a" strokeWidth="2.5" />
        <path d="M48 36 H72 C70 46 62 50 60 56 C58 50 50 46 48 36 Z" fill="url(#so-glass)" />
        <path d="M60 62 L60 80" stroke="#fbbf24" strokeWidth="2" strokeDasharray="2 3" className="animate-glow-pulse" />
        <path d="M46 88 C50 80 70 80 74 88 Z" fill="url(#so-glass)" />
      </g>
    </svg>
  );
}

export function PracticeArt({ className }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <g className="origin-center animate-spin-slow" style={{ animationDuration: '30s' }}>
        <circle cx="60" cy="60" r="42" fill="none" stroke="#34d399" strokeOpacity=".35" strokeWidth="3" />
        <circle cx="60" cy="60" r="30" fill="none" stroke="#34d399" strokeOpacity=".55" strokeWidth="3" strokeDasharray="10 6" />
      </g>
      <circle cx="60" cy="60" r="18" fill="#34d399" fillOpacity=".2" stroke="#34d399" strokeWidth="3" />
      <circle cx="60" cy="60" r="6" fill="#ecfdf5" className="animate-glow-pulse" />
      <g className="animate-float-slow">
        <path d="M96 22 L64 56" stroke="#e2e8f0" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M96 22 L104 18 L100 28 Z M96 22 L92 14 L102 16 Z" fill="#5eead4" />
        <path d="M62 52 L66 60 L58 58 Z" fill="#e2e8f0" />
      </g>
    </svg>
  );
}

export function QuestArt({ className }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="qa-chest" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c084fc" />
          <stop offset="1" stopColor="#6542f5" />
        </linearGradient>
        <radialGradient id="qa-glow">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="50" rx="34" ry="26" fill="url(#qa-glow)" className="animate-glow-pulse" />
      <g className="animate-float-slow">
        <path d="M28 58 H92 V94 a4 4 0 0 1 -4 4 H32 a4 4 0 0 1 -4 -4 Z" fill="url(#qa-chest)" stroke="#2e1065" strokeWidth="2.5" />
        <path d="M28 58 C28 40 92 40 92 58 Z" fill="#a78bfa" stroke="#2e1065" strokeWidth="2.5" />
        <rect x="26" y="56" width="68" height="6" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
        <rect x="53" y="62" width="14" height="14" rx="2" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
        <circle cx="60" cy="69" r="2.5" fill="#78350f" />
      </g>
      {[[38, 30], [60, 20], [84, 30]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 6} L${x + 2} ${y - 2} L${x + 6} ${y} L${x + 2} ${y + 2} L${x} ${y + 6} L${x - 2} ${y + 2} L${x - 6} ${y} L${x - 2} ${y - 2} Z`} fill="#fde68a" className="animate-glow-pulse" style={{ animationDelay: `${i * 0.5}s` }} />
      ))}
    </svg>
  );
}
