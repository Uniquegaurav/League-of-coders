import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Search, X } from 'lucide-react';
import { api } from '../../lib/api';
import { tierFor } from '../../lib/rank';
import { streakOf } from '../../lib/progression';
import { timeAgo } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { useSocial } from '../../context/SocialContext';
import { Avatar, EmptyState, Spinner } from '../ui';
import { FriendButton } from './FriendBits';

function PlayerSearch() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const social = useSocial();

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults(null);
      return undefined;
    }
    setLoading(true);
    const id = setTimeout(() => {
      api.friends
        .search(term)
        .then((r) => setResults(r.players))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(id);
  }, [q, social.friends.length, social.outgoing.length]);

  return (
    <div className="card p-5">
      <h2 className="section-title mb-3">Find players</h2>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input className="input pl-10" placeholder="Name or LeetCode username" value={q} onChange={(e) => setQ(e.target.value)} />
        {loading && <Spinner className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />}
      </div>
      {results && (
        <ul className="mt-3 space-y-1">
          {results.length === 0 && <li className="px-2 py-3 text-sm text-ink-400">No players found.</li>}
          {results.map((p) => {
            const tier = tierFor(p.stats.rating);
            return (
              <li key={p.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-ink-800/60">
                <Avatar name={p.name} src={p.avatar} size={32} />
                <Link to={`/u/${p.username || p.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-200 hover:text-white">{p.name}</p>
                  <p className="text-xs text-ink-500">
                    <span className={tier.color}>{tier.name}</span> · {p.stats.rating}
                  </p>
                </Link>
                <FriendButton playerId={p.id} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Requests() {
  const social = useSocial();
  if (!social.incoming.length && !social.outgoing.length) return null;
  return (
    <div className="card p-5">
      <h2 className="section-title mb-3">Requests</h2>
      <ul className="divide-y divide-ink-800/70">
        {social.incoming.map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-2.5">
            <Avatar name={r.from.name} src={r.from.avatar} size={32} />
            <p className="min-w-0 flex-1 truncate text-sm">
              <Link to={`/u/${r.from.username || r.from.id}`} className="font-medium text-white hover:underline">
                {r.from.name}
              </Link>
              <span className="text-ink-500"> wants to be friends · {timeAgo(r.createdAt)}</span>
            </p>
            <button className="btn-primary btn-sm" onClick={() => social.accept(r.id)}>
              Accept
            </button>
            <button className="btn-ghost btn-sm px-2" onClick={() => social.decline(r.id)} aria-label="Decline">
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
        {social.outgoing.map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-2.5">
            <Avatar name={r.to.name} src={r.to.avatar} size={32} />
            <p className="min-w-0 flex-1 truncate text-sm text-ink-400">
              Sent to <span className="text-ink-200">{r.to.name}</span>
            </p>
            <button className="btn-ghost btn-sm" onClick={() => social.decline(r.id)}>
              Cancel
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// One row per friend with their numbers next to yours, so progress is easy to compare.
function FriendsTable({ friends, me }) {
  const social = useSocial();
  const navigate = useNavigate();
  const rows = [...friends].sort((a, b) => b.stats.rating - a.stats.rating);
  const cell = 'px-4 py-3 text-right font-mono text-ink-300';

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-ink-800 text-left text-xs uppercase tracking-wider text-ink-500">
            <th className="px-4 py-3">Player</th>
            <th className="px-4 py-3 text-right">Rating</th>
            <th className="px-4 py-3 text-right">Wins</th>
            <th className="px-4 py-3 text-right">Solved</th>
            <th className="px-4 py-3 text-right">Streak</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-800/70">
          <tr className="bg-brand-500/5">
            <td className="px-4 py-3">
              <span className="flex items-center gap-3">
                <Avatar name={me.name} src={me.avatar} size={30} />
                <span className="font-medium text-ink-200">You</span>
              </span>
            </td>
            <td className={clsx(cell, 'font-bold text-brand-400')}>{me.stats.rating}</td>
            <td className={cell}>{me.stats.wins}</td>
            <td className={cell}>{me.stats.solved}</td>
            <td className={cell}>{streakOf(me).streak || '—'}</td>
            <td />
          </tr>
          {rows.map((f) => {
            const tier = tierFor(f.stats.rating);
            const diff = f.stats.rating - me.stats.rating;
            return (
              <tr key={f.id} className="hover:bg-ink-850/60">
                <td className="px-4 py-3">
                  <Link to={`/u/${f.username || f.id}`} className="flex items-center gap-3 hover:underline">
                    <Avatar name={f.name} src={f.avatar} size={30} online={!!f.online} />
                    <span>
                      <span className="block font-medium text-ink-200">{f.name}</span>
                      <span className={clsx('text-xs', tier.color)}>{tier.name}</span>
                    </span>
                  </Link>
                </td>
                <td className={clsx(cell, 'font-bold text-brand-400')}>
                  {f.stats.rating}
                  {diff !== 0 && <span className={clsx('ml-1.5 text-xs font-normal', diff > 0 ? 'text-hard' : 'text-easy')}>{diff > 0 ? `+${diff}` : diff}</span>}
                </td>
                <td className={cell}>{f.stats.wins}</td>
                <td className={cell}>{f.stats.solved}</td>
                <td className={cell}>{streakOf(f).streak || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button className="btn-secondary btn-sm" onClick={() => navigate(`/new?mode=battle&invite=${f.id}`)}>
                      Challenge
                    </button>
                    <button
                      className="btn-ghost btn-sm text-ink-500 hover:text-hard"
                      onClick={() => window.confirm(`Remove ${f.name} from friends?`) && social.remove(f.id)}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function FriendsHub() {
  const { user } = useAuth();
  const social = useSocial();

  if (!user) {
    return (
      <EmptyState title="Friends">
        Sign in from the top right to add friends, compare progress and challenge them to battles.
      </EmptyState>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">
        <Requests />
        <div>
          <div className="mb-3 flex items-baseline gap-3">
            <h2 className="section-title">Your friends</h2>
            <span className="text-sm text-ink-500">
              {social.friends.length} · {social.onlineCount} online
            </span>
          </div>
          {!social.ready ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-6 w-6 text-ink-500" />
            </div>
          ) : social.friends.length ? (
            <FriendsTable friends={social.friends} me={user} />
          ) : (
            <EmptyState title="No friends yet">Search for players, or add people from their profile.</EmptyState>
          )}
        </div>
      </div>
      <aside className="space-y-5">
        <PlayerSearch />
      </aside>
    </div>
  );
}
