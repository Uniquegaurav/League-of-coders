import { memo } from 'react';

// Fixed, decorative backdrop: glow orbs, a scrolling perspective grid and rising sparks.
const SPARKS = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 53) % 100}%`,
  bottom: `${(i * 37) % 30}%`,
  duration: `${9 + ((i * 7) % 9)}s`,
  delay: `${-((i * 3) % 12)}s`,
  color: ['#a18bff', '#5eead4', '#fbbf24'][i % 3],
}));

function ArenaBackground() {
  return (
    <div className="arena-bg" aria-hidden="true">
      <div className="orb" style={{ width: 520, height: 520, left: '-8%', top: '-12%', background: '#7c5cff' }} />
      <div className="orb" style={{ width: 420, height: 420, right: '-6%', top: '18%', background: '#22d3ee', animationDelay: '-8s', opacity: 0.2 }} />
      <div className="orb" style={{ width: 360, height: 360, left: '35%', bottom: '-10%', background: '#c026d3', animationDelay: '-14s', opacity: 0.18 }} />
      <div className="grid-floor" />
      {SPARKS.map((s, i) => (
        <span
          key={i}
          className="spark"
          style={{ left: s.left, bottom: s.bottom, animationDuration: s.duration, animationDelay: s.delay, background: s.color, boxShadow: `0 0 8px ${s.color}` }}
        />
      ))}
    </div>
  );
}

export default memo(ArenaBackground);
