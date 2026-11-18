import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import clsx from 'clsx';
import compete from '../assets/bg/compete.jpg';
import signin from '../assets/bg/signin.jpg';
import profile from '../assets/bg/profile.jpg';
import practice from '../assets/bg/practice.jpg';
import leaderboard from '../assets/bg/leaderboard.jpg';
import community from '../assets/bg/community.jpg';
import battle from '../assets/bg/battle.jpg';
import match from '../assets/bg/match.jpg';

// Each tab gets its own scene behind the top of the page. All images are graded to the same palette,
// so switching tabs changes the mood without changing the theme.
const SCENES = [
  { test: (p) => p === '/', src: compete, position: 'center 30%', height: 'h-[720px] sm:h-[820px]', dim: 'light' },
  { test: (p) => p.startsWith('/login'), src: signin, position: 'center', height: 'h-full', dim: 'none' },
  { test: (p) => p.startsWith('/practice') || p.startsWith('/problems'), src: practice, position: 'center' },
  { test: (p) => p.startsWith('/league'), src: leaderboard, position: 'left top', flip: true },
  { test: (p) => p.startsWith('/community'), src: community, position: 'right center' },
  { test: (p) => p.startsWith('/u/'), src: profile, position: 'center 45%' },
  { test: (p) => p.startsWith('/new'), src: battle, position: 'right center' },
  { test: (p) => p.startsWith('/m/'), src: match, position: 'center', height: 'h-[420px]' },
];

const DIM = {
  // Top fades out into the page colour; the left side is darker so headings stay readable.
  normal: 'bg-gradient-to-b from-ink-950/40 via-ink-950/70 to-ink-950',
  light: 'bg-gradient-to-b from-ink-950/10 via-ink-950/45 to-ink-950',
  none: 'bg-ink-950/30',
};

// The scene drifts a little slower than the page as you scroll. Off for reduced motion.
function useParallax(ref, factor = 0.25) {
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (ref.current) ref.current.style.transform = `translate3d(0, ${Math.min(window.scrollY, 900) * factor}px, 0)`;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [ref, factor]);
}

export default function Backdrop() {
  const { pathname } = useLocation();
  const layer = useRef(null);
  useParallax(layer);
  const scene = SCENES.find((s) => s.test(pathname));
  if (!scene) return null;
  return (
    <div aria-hidden className={clsx('pointer-events-none absolute inset-x-0 top-0 overflow-hidden', scene.height || 'h-[460px] sm:h-[520px]')}>
      <div ref={layer} className="h-full w-full will-change-transform">
       <div key={scene.src} className="backdrop-in h-full w-full">
        <img src={scene.src} alt="" className={clsx('h-full w-full object-cover', scene.flip && '-scale-x-100')} style={{ objectPosition: scene.position }} />
       </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/80 via-ink-950/30 to-transparent" />
      <div className={clsx('absolute inset-0', DIM[scene.dim || 'normal'])} />
    </div>
  );
}
