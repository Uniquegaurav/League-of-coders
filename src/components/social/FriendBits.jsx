import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Check, Flame, Send, Swords, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocial } from '../../context/SocialContext';
import { tierFor } from '../../lib/rank';
import { practiceOf } from '../../lib/progression';
import RankEmblem from '../game/RankEmblem';
import { Avatar, Spinner } from '../ui';

const byOnline = (a, b) => Number(!!b.online) - Number(!!a.online) || b.stats.rating - a.stats.rating;

export function FriendRow({ friend, children, compact }) {
  const tier = tierFor(friend.stats.rating);
  const lvl = practiceOf(friend);
  return (
    <div className="group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-ink-800/60">
      <Link to={`/u/${friend.id}`} className="shrink-0">
        <Avatar name={friend.name} src={friend.avatar} size={compact ? 32 : 38} online={!!friend.online} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/u/${friend.id}`} className="block truncate text-sm font-semibold text-ink-200 hover:text-white">
          {friend.name}
        </Link>
        <p className="flex items-center gap-2 text-[11px] text-ink-500">
          <span className={clsx('font-semibold', tier.color)}>{tier.name}</span>
          <span>Lv {lvl.level}</span>
          {lvl.streak > 0 && (
            <span className="inline-flex items-center gap-0.5 text-orange-400">
              <Flame className="h-3 w-3" />
              {lvl.streak}
            </span>
          )}
          {!compact && <span className={friend.online ? 'text-easy' : ''}>{friend.online ? 'Online' : 'Offline'}</span>}
        </p>
      </div>
      {!compact && <RankEmblem tier={tier} size={30} animated={false} className="hidden sm:inline-flex" />}
      {children}
    </div>
  );
}

// Sidebar on the home screen: who is online, with a one-click challenge.
export function FriendsPanel({ lobbyCode }) {
  const { user } = useAuth();
  const social = useSocial();
  const navigate = useNavigate();
  const [sent, setSent] = useState({});

  if (!user) {
    return (
      <div className="hud-panel p-5">
        <p className="hud-title mb-2">
          <Users className="h-4 w-4 text-neon-400" /> Squad
        </p>
        <p className="text-sm text-ink-400">Sign in to add friends, see their progress, and challenge them directly.</p>
      </div>
    );
  }

  const friends = [...social.friends].sort(byOnline).slice(0, 6);
  const challenge = async (f) => {
    if (lobbyCode) {
      const ok = await social.invite(f.id, lobbyCode);
      if (ok) setSent((s) => ({ ...s, [f.id]: true }));
    } else {
      navigate(`/new?mode=battle&invite=${f.id}`);
    }
  };

  return (
    <div className="hud-panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="hud-title">
          <Users className="h-4 w-4 text-neon-400" /> Squad
          <span className="ml-1 rounded-full bg-easy/15 px-2 py-0.5 text-[10px] tracking-normal text-easy">{social.onlineCount} online</span>
        </p>
        <Link to="/community?tab=friends" className="text-xs text-brand-400 hover:underline">
          Manage
        </Link>
      </div>
      {!social.ready ? (
        <div className="flex justify-center py-6">
          <Spinner className="h-5 w-5 text-ink-500" />
        </div>
      ) : friends.length ? (
        <div className="space-y-0.5">
          {friends.map((f) => (
            <FriendRow key={f.id} friend={f} compact>
              <button
                onClick={() => challenge(f)}
                disabled={sent[f.id]}
                title={lobbyCode ? 'Invite to your lobby' : 'Create a lobby and invite'}
                className={clsx('btn-sm btn shrink-0', sent[f.id] ? 'text-easy' : 'border border-brand-500/40 bg-brand-500/10 text-brand-400 hover:bg-brand-500/20')}
              >
                {sent[f.id] ? <Check className="h-3.5 w-3.5" /> : <Swords className="h-3.5 w-3.5" />}
                {sent[f.id] ? 'Sent' : 'Duel'}
              </button>
            </FriendRow>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-ink-700 p-4 text-center">
          <UserPlus className="mx-auto h-6 w-6 text-ink-500" />
          <p className="mt-2 text-sm text-ink-300">Your squad is empty</p>
          <Link to="/community?tab=friends" className="btn-secondary btn-sm mt-3">
            Find players
          </Link>
        </div>
      )}
      {social.incoming.length > 0 && (
        <Link to="/community?tab=friends" className="mt-3 flex items-center justify-between rounded-xl border border-brand-500/30 bg-brand-500/10 px-3 py-2 text-xs text-brand-400">
          <span>{social.incoming.length} pending friend request{social.incoming.length > 1 ? 's' : ''}</span>
          <span className="font-semibold">Review</span>
        </Link>
      )}
    </div>
  );
}

// Lobby side panel: invite friends straight into this room.
export function InviteFriends({ code }) {
  const { user } = useAuth();
  const social = useSocial();
  const [sent, setSent] = useState({});
  const [busy, setBusy] = useState(null);
  if (!user || !social) return null;
  const friends = [...social.friends].sort(byOnline);

  return (
    <div className="mt-5 border-t border-ink-800 pt-4">
      <p className="label flex items-center justify-between">
        Challenge friends <span className="normal-case tracking-normal text-easy">{social.onlineCount} online</span>
      </p>
      {friends.length ? (
        <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
          {friends.map((f) => (
            <FriendRow key={f.id} friend={f} compact>
              <button
                className={clsx('btn-sm btn shrink-0', sent[f.id] ? 'text-easy' : 'btn-secondary')}
                disabled={sent[f.id] || busy === f.id}
                onClick={async () => {
                  setBusy(f.id);
                  const ok = await social.invite(f.id, code);
                  setBusy(null);
                  if (ok) setSent((s) => ({ ...s, [f.id]: true }));
                }}
              >
                {busy === f.id ? <Spinner className="h-3.5 w-3.5" /> : sent[f.id] ? <Check className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                {sent[f.id] ? 'Invited' : 'Invite'}
              </button>
            </FriendRow>
          ))}
        </div>
      ) : (
        <p className="text-xs text-ink-500">
          No friends yet.{' '}
          <Link to="/community?tab=friends" className="text-brand-400 hover:underline">
            Add some
          </Link>{' '}
          to invite them with one click.
        </p>
      )}
    </div>
  );
}

// Add-friend button that reflects the current relation (used on profiles and search).
export function FriendButton({ playerId, className }) {
  const { user } = useAuth();
  const social = useSocial();
  const [busy, setBusy] = useState(false);
  if (!user || !social || user.id === playerId) return null;
  const relation = social.relationOf(playerId);
  const request = social.incoming.find((r) => r.from.id === playerId);
  const act = async (fn) => {
    setBusy(true);
    await fn();
    setBusy(false);
  };

  if (relation === 'friend') {
    return (
      <span className={clsx('chip border-easy/40 text-easy', className)}>
        <Check className="h-3.5 w-3.5" /> Friends
      </span>
    );
  }
  if (relation === 'outgoing') return <span className={clsx('chip', className)}>Request sent</span>;
  if (relation === 'incoming') {
    return (
      <button className={clsx('btn-primary btn-sm', className)} disabled={busy} onClick={() => act(() => social.accept(request.id))}>
        <Check className="h-4 w-4" /> Accept request
      </button>
    );
  }
  return (
    <button className={clsx('btn-secondary btn-sm', className)} disabled={busy} onClick={() => act(() => social.sendRequest(playerId))}>
      {busy ? <Spinner className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />} Add friend
    </button>
  );
}
