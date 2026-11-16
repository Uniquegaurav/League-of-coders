import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { LogOut, Menu, Swords, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui';

const LINKS = [
  { to: '/', label: 'Compete', end: true },
  { to: '/practice', label: 'Practice' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/community', label: 'Community' },
];

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-neon-500 shadow-glow">
        <Swords className="h-5 w-5 text-white" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-white">
        League<span className="text-ink-400">of</span>Coders
      </span>
    </Link>
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
        <span className="hidden rounded-md bg-ink-800 px-1.5 py-0.5 font-mono text-xs text-brand-400 sm:block">{user.stats.rating}</span>
      </button>
      {open && (
        <div className="card absolute right-0 mt-2 w-56 overflow-hidden p-1 shadow-2xl">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-ink-400">{user.email}</p>
          </div>
          <Link to={`/u/${user.id}`} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-200 hover:bg-ink-800">
            <UserIcon className="h-4 w-4" /> Profile & LeetCode
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
    <header className="sticky top-0 z-40 border-b border-ink-800/80 bg-ink-950/75 backdrop-blur-xl">
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
