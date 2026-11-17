import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Check, Flame, Search, Swords, Trophy, UserMinus, UserPlus, Users, X } from 'lucide-react';
import { api } from '../../lib/api';
import { tierFor } from '../../lib/rank';
import { practiceOf } from '../../lib/progression';
import { timeAgo } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { useSocial } from '../../context/SocialContext';
import RankEmblem from '../game/RankEmblem';
import { XpBar } from '../game/fx';
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
    <div className="hud-panel p-5">
      <p className="hud-title mb-3">
        <UserPlus className="h-4 w-4 text-brand-400" /> Recruit players
      </p>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input className="input pl-10" placeholder="Search by name or LeetCode username" value={q} onChange={(e) => setQ(e.target.value)} />
        {loading && <Spinner className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />}
      </div>
      {results && (
        <ul className="mt-3 space-y-1">
          {results.length === 0 && <li className="px-2 py-3 text-sm text-ink-400">No players found.</li>}
          {results.map((p) => {
            const tier = tierFor(p.stats.rating);
            return (
              <li key={p.id} className="flex animate-rise-in items-center gap-3 rounded-xl px-2 py-2 hover:bg-ink-800/60">
                <Avatar name={p.name} src={p.avatar} size={34} />
                <Link to={`/u/${p.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-200 hover:text-white">{p.name}</p>
                  <p className="text-[11px] text-ink-500">
                    <span className={tier.color}>{tier.name}</span> · {p.stats.rating}
                    {p.leetcode && ` · @${p.leetcode.username}`}
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
    <div className="hud-panel p-5">
      <p className="hud-title mb-3">Requests</p>
      <ul className="space-y-1">
        {social.incoming.map((r) => (
          <li key={r.id} className="flex animate-rise-in items-center gap-3 rounded-xl border border-brand-500/30 bg-brand-500/5 px-3 py-2">
            <Avatar name={r.from.name} src={r.from.avatar} size={32} />
            <p className="min-w-0 flex-1 truncate text-sm">
              <Link to={`/u/${r.from.id}`} className="font-semibold text-white hover:underline">
                {r.from.name}
              </Link>
              <span className="text-ink-500"> · {timeAgo(r.createdAt)}</span>
            </p>
            <button className="btn-primary btn-sm" onClick={() => social.accept(r.id)}>
              <Check className="h-4 w-4" /> Accept
            </button>
            <button className="btn-ghost btn-sm px-2" onClick={() => social.decline(r.id)} aria-label="Decline">
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
        {social.outgoing.map((r) => (
          <li key={r.id} className="flex items-center gap-3 rounded-xl px-3 py-2">
            <Avatar name={r.to.name} src={r.to.avatar} size={32} />
            <p className="min-w-0 flex-1 truncate text-sm text-ink-300">
              Waiting on <span className="font-semibold text-ink-200">{r.to.name}</span>
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

function FriendCard({ friend, me }) {
  const social = useSocial();
  const navigate = useNavigate();
  const tier = tierFor(friend.stats.rating);
  const lvl = practiceOf(friend);
  const diff = friend.stats.rating - me.stats.rating;
  return (
    <div className="hud-panel lift shine animate-rise-in p-4">
      <div className="flex items-center gap-3">
        <Link to={`/u/${friend.id}`}>
          <Avatar name={friend.name} src={friend.avatar} size={44} online={!!friend.online} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/u/${friend.id}`} className="block truncate font-semibold text-white hover:underline">
            {friend.name}
          </Link>
          <p className="text-xs text-ink-500">
            <span className={friend.online ? 'text-easy' : ''}>{friend.online ? '● Online' : 'Offline'}</span> · Lv {lvl.level}
          </p>
        </div>
        <RankEmblem tier={tier} size={44} animated={!!friend.online} />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        {[
          ['Rating', friend.stats.rating, tier.color],
          ['Wins', friend.stats.wins],
          ['Solved', friend.stats.solved],
          ['Streak', lvl.streak, lvl.streak ? 'text-orange-400' : ''],
        ].map(([l, v, c]) => (
          <div key={l} className="rounded-lg bg-ink-950/50 py-1.5">
            <p className={clsx('font-display text-sm font-bold text-white', c)}>{v}</p>
            <p className="text-[9px] uppercase tracking-wider text-ink-500">{l}</p>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <p className="mb-1 flex justify-between text-[10px] text-ink-500">
          <span>XP {lvl.xp}</span>
          <span className={diff > 0 ? 'text-hard' : diff < 0 ? 'text-easy' : ''}>
            {diff === 0 ? 'Dead even' : diff > 0 ? `${diff} rating ahead of you` : `${-diff} behind you`}
          </span>
        </p>
        <XpBar pct={lvl.pct} className="h-1.5" />
      </div>
      <div className="mt-3 flex gap-2">
        <button className="btn-play btn-sm flex-1" onClick={() => navigate(`/new?mode=battle&invite=${friend.id}`)}>
          <Swords className="h-4 w-4" /> Challenge
        </button>
        <button
          className="btn-ghost btn-sm px-2 text-ink-500 hover:text-hard"
          title="Remove friend"
          onClick={() => window.confirm(`Remove ${friend.name} from friends?`) && social.remove(friend.id)}
        >
          <UserMinus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SquadBoard({ friends, me }) {
  const rows = [...friends, { ...me, isMe: true }].sort((a, b) => b.stats.rating - a.stats.rating);
  return (
    <div className="hud-panel p-5">
      <p className="hud-title mb-3">
        <Trophy className="h-4 w-4 text-medium" /> Squad ladder
      </p>
      <ol className="space-y-1">
        {rows.map((p, i) => {
          const lvl = practiceOf(p);
          return (
            <li key={p.id} className={clsx('flex items-center gap-3 rounded-xl px-2 py-1.5', p.isMe && 'bg-brand-500/10 ring-1 ring-brand-500/30')}>
              <span className={clsx('w-5 text-center font-mono text-sm font-bold', ['text-medium', 'text-ink-200', 'text-amber-600'][i] || 'text-ink-500')}>{i + 1}</span>
              <Avatar name={p.name} src={p.avatar} size={26} />
              <span className="min-w-0 flex-1 truncate text-sm text-ink-200">{p.isMe ? 'You' : p.name}</span>
              {lvl.streak > 0 && (
                <span className="inline-flex items-center gap-0.5 text-xs text-orange-400">
                  <Flame className="h-3 w-3" />
                  {lvl.streak}
                </span>
              )}
              <span className="font-mono text-xs text-ink-400">Lv{lvl.level}</span>
              <span className="w-11 text-right font-mono text-sm font-bold text-brand-400">{p.stats.rating}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function FriendsHub() {
  const { user } = useAuth();
  const social = useSocial();

  if (!user) {
    return (
      <EmptyState
        icon={Users}
        title="Build your squad"
        action={
          <Link to="/login" state={{ from: '/community?tab=friends' }} className="btn-primary btn-sm">
            Sign in
          </Link>
        }
      >
        Add friends to follow their progress, compare ranks and challenge them to battles.
      </EmptyState>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">
        <Requests />
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-white">
            <Users className="h-5 w-5 text-neon-400" /> Your squad
            <span className="font-mono text-sm text-ink-500">{social.friends.length}</span>
            <span className="ml-1 rounded-full bg-easy/15 px-2 py-0.5 text-xs text-easy">{social.onlineCount} online</span>
          </h2>
          {!social.ready ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-6 w-6 text-ink-500" />
            </div>
          ) : social.friends.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {social.friends.map((f) => (
                <FriendCard key={f.id} friend={f} me={user} />
              ))}
            </div>
          ) : (
            <EmptyState icon={UserPlus} title="No friends yet">
              Search for players on the right, or add people from their profile or a battle scoreboard.
            </EmptyState>
          )}
        </div>
      </div>
      <aside className="space-y-5">
        <PlayerSearch />
        {social.friends.length > 0 && <SquadBoard friends={social.friends} me={user} />}
      </aside>
    </div>
  );
}
