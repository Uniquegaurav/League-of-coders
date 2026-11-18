import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Bell, LogOut, Menu, Swords, User as UserIcon, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocial } from '../context/SocialContext';
import { timeAgo } from '../lib/format';
import { tierFor } from '../lib/rank';
import { Avatar } from './ui';

const LINKS = [
  { to: '/', label: 'Compete', end: true },
  { to: '/practice', label: 'Practice' },
  { to: '/tournaments', label: 'Tournaments' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/community', label: 'Community' },
];

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-neon-500 shadow-glow ring-2 ring-amber-400/80">
        <Swords className="h-5 w-5 text-white" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-white">
        League<span className="text-amber-400">of</span>Coders
      </span>
    </Link>
  );
}

function Notifications() {
  const social = useSocial();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const count = social?.notifications || 0;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="btn-ghost relative p-2" aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {count > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-hard ring-2 ring-ink-950" />}
      </button>
      {open && (
        <div className="card absolute right-0 mt-2 w-80 overflow-hidden p-1 shadow-2xl">
          {count === 0 && <p className="px-3 py-4 text-sm text-ink-400">No new notifications.</p>}
          {social.invites.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-ink-800/70">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink-200">
                  <span className="font-semibold text-white">{inv.from.name}</span> invited you to a battle
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
              <p className="min-w-0 flex-1 truncate text-sm text-ink-200">
                <span className="font-semibold text-white">{r.from.name}</span> sent a friend request
              </p>
              <button className="btn-secondary btn-sm" onClick={() => social.accept(r.id)}>
                Accept
              </button>
              <button className="text-ink-500 hover:text-white" onClick={() => social.decline(r.id)} aria-label="Decline">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full p-0.5 pr-3 hover:bg-ink-800">
        <Avatar name={user.name} src={user.avatar} size={32} />
        <span className="hidden text-sm font-medium text-ink-200 sm:block">{user.name.split(' ')[0]}</span>
        <span className={clsx('hidden rounded-md bg-ink-800 px-1.5 py-0.5 font-mono text-xs sm:block', tierFor(user.stats.rating).color)}>
          {tierFor(user.stats.rating).name} {user.stats.rating}
        </span>
      </button>
      {open && (
        <div className="card absolute right-0 mt-2 w-56 overflow-hidden p-1 shadow-2xl">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-ink-400">{user.email}</p>
          </div>
          <Link to={`/u/${user.username || user.id}`} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-200 hover:bg-ink-800">
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
    clsx('rounded-lg px-3 py-2 text-sm font-medium transition', isActive ? 'bg-ink-800 text-white' : 'text-ink-300 hover:text-white');

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/50 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/new" className="btn-primary btn-sm hidden sm:inline-flex">
                <Swords className="h-4 w-4" /> New battle
              </Link>
              <Notifications />
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
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
