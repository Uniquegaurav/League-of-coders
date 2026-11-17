import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Bell, Check, Dumbbell, LogOut, Menu, Swords, Trophy, User as UserIcon, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocial } from '../context/SocialContext';
import { tierFor } from '../lib/rank';
import { practiceOf } from '../lib/progression';
import { timeAgo } from '../lib/format';
import RankEmblem from './game/RankEmblem';
import { Avatar } from './ui';

const LINKS = [
  { to: '/', label: 'Compete', end: true, icon: Swords },
  { to: '/practice', label: 'Practice', icon: Dumbbell },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/community', label: 'Community', icon: Users },
];

export function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-neon-500 shadow-glow ring-2 ring-medium/80 transition group-hover:rotate-6 group-hover:scale-105">
        <Swords className="h-5 w-5 text-white" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-white">
        League<span className="text-medium">of</span>Coders
      </span>
    </Link>
  );
}

function useClickAway(onAway) {
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && onAway();
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [onAway]);
  return ref;
}

function NotificationBell() {
  const social = useSocial();
  const [open, setOpen] = useState(false);
  const ref = useClickAway(() => setOpen(false));
  const navigate = useNavigate();
  const count = social?.notifications || 0;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="btn-ghost relative p-2" aria-label="Notifications">
        <Bell className={clsx('h-5 w-5', count > 0 && 'text-white')} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 animate-pop-in items-center justify-center rounded-full bg-hard px-1 text-[10px] font-bold text-white ring-2 ring-ink-950">
            {count}
          </span>
        )}
      </button>
      {open && (
        <div className="card absolute right-0 mt-2 w-80 animate-rise-in overflow-hidden p-1 shadow-2xl">
          <p className="hud-title px-3 py-2">Notifications</p>
          {count === 0 && <p className="px-3 pb-4 text-sm text-ink-400">All quiet. Challenge a friend to stir things up.</p>}
          {social.invites.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-ink-800/70">
              <Avatar name={inv.from.name} src={inv.from.avatar} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink-200">
                  <span className="font-semibold text-white">{inv.from.name}</span> challenged you
                </p>
                <p className="truncate text-xs text-ink-500">
                  {inv.match?.name} · {timeAgo(inv.createdAt)}
                </p>
              </div>
              <button
                className="btn-primary btn-sm"
                onClick={() => {
                  setOpen(false);
                  social.dismissInvite(inv.id);
                  navigate(`/m/${inv.match.code}`);
                }}
              >
                Join
              </button>
              <button className="text-ink-500 hover:text-white" onClick={() => social.dismissInvite(inv.id)} aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {social.incoming.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-ink-800/70">
              <Avatar name={r.from.name} src={r.from.avatar} size={32} />
              <p className="min-w-0 flex-1 truncate text-sm text-ink-200">
                <span className="font-semibold text-white">{r.from.name}</span> sent a friend request
              </p>
              <button className="btn-secondary btn-sm px-2" onClick={() => social.accept(r.id)} aria-label="Accept">
                <Check className="h-4 w-4 text-easy" />
              </button>
              <button className="btn-ghost btn-sm px-2" onClick={() => social.decline(r.id)} aria-label="Decline">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Link to="/community?tab=friends" onClick={() => setOpen(false)} className="mt-1 block rounded-lg px-3 py-2 text-center text-xs font-semibold text-brand-400 hover:bg-ink-800">
            Open friends hub
          </Link>
        </div>
      )}
    </div>
  );
}

function UserMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useClickAway(() => setOpen(false));
  const tier = tierFor(user.stats.rating);
  const lvl = practiceOf(user);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full p-0.5 pr-3 transition hover:bg-ink-800">
        <span className="relative">
          <Avatar name={user.name} src={user.avatar} size={32} />
          <span className="absolute -bottom-1 -right-1 rounded-full bg-ink-950 px-1 font-mono text-[9px] font-bold text-brand-400 ring-1 ring-brand-500/60">{lvl.level}</span>
        </span>
        <span className="hidden text-sm font-medium text-ink-200 sm:block">{user.name.split(' ')[0]}</span>
        <span className={clsx('hidden items-center gap-1 rounded-md bg-ink-800 py-0.5 pl-0.5 pr-1.5 font-mono text-xs sm:inline-flex', tier.color)}>
          <RankEmblem tier={tier} size={20} animated={false} /> {user.stats.rating}
        </span>
      </button>
      {open && (
        <div className="card absolute right-0 mt-2 w-60 animate-rise-in overflow-hidden p-1 shadow-2xl">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-ink-400">{user.email}</p>
            <p className="mt-2 flex justify-between text-[11px] text-ink-400">
              <span>Level {lvl.level}</span>
              <span className="font-mono">
                {lvl.xp}/{lvl.nextLevelXp} XP
              </span>
            </p>
            <div className="xp-track mt-1 h-1.5">
              <div className="xp-fill" style={{ width: `${lvl.pct}%` }} />
            </div>
          </div>
          <Link to={`/u/${user.id}`} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-200 hover:bg-ink-800">
            <UserIcon className="h-4 w-4" /> Profile & LeetCode
          </Link>
          <Link to="/community?tab=friends" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-200 hover:bg-ink-800">
            <Users className="h-4 w-4" /> Friends
          </Link>
          <button onClick={onSignOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-200 hover:bg-ink-800">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const linkClass = ({ isActive }) =>
    clsx(
      'relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition',
      isActive
        ? 'bg-ink-800 text-white after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-gradient-to-r after:from-brand-500 after:to-neon-400 after:shadow-[0_0_10px_#7c5cff]'
        : 'text-ink-300 hover:text-white'
    );

  return (
    <header className="sticky top-0 z-40 border-b border-ink-800/80 bg-ink-950/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map(({ to, label, end, icon: Icon }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/new" className="btn-play btn-sm hidden sm:inline-flex">
                <Swords className="h-4 w-4" /> Play
              </Link>
              <NotificationBell />
              <UserMenu
                user={user}
                onSignOut={() => {
                  signOut();
                  navigate('/');
                }}
              />
            </>
          ) : loading ? null : (
            <Link to="/login" state={{ from: location.pathname }} className="btn-primary btn-sm">
              Sign in
            </Link>
          )}
          <button className="btn-ghost p-2 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t border-ink-800 px-4 py-3 md:hidden">
          {LINKS.map(({ to, label, end, icon: Icon }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => clsx('flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium', isActive ? 'bg-ink-800 text-white' : 'text-ink-300')}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
