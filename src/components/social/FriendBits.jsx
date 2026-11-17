import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useSocial } from '../../context/SocialContext';
import { tierFor } from '../../lib/rank';
import { Avatar, Spinner } from '../ui';

const byOnline = (a, b) => Number(!!b.online) - Number(!!a.online) || b.stats.rating - a.stats.rating;

export function FriendRow({ friend, children }) {
  const tier = tierFor(friend.stats.rating);
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-ink-800/60">
      <Link to={`/u/${friend.id}`} className="shrink-0">
        <Avatar name={friend.name} src={friend.avatar} size={32} online={!!friend.online} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/u/${friend.id}`} className="block truncate text-sm font-medium text-ink-200 hover:text-white">
          {friend.name}
        </Link>
        <p className="text-xs text-ink-500">
          <span className={tier.color}>{tier.name}</span> · {friend.stats.rating}
        </p>
      </div>
      {children}
    </div>
  );
}

// Home sidebar: friends, online first, with a challenge button. Signed-in only.
export function FriendsPanel({ lobbyCode }) {
  const { user } = useAuth();
  const social = useSocial();
  const navigate = useNavigate();
  const [sent, setSent] = useState({});
  if (!user) return null;

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
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-title">Friends</h2>
        <Link to="/community?tab=friends" className="text-sm text-brand-400 hover:underline">
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
            <FriendRow key={f.id} friend={f}>
              <button
                onClick={() => challenge(f)}
                disabled={sent[f.id]}
                title={lobbyCode ? 'Invite to your open lobby' : 'Create a lobby and invite'}
                className={clsx('btn-sm btn shrink-0', sent[f.id] ? 'text-easy' : 'btn-secondary')}
              >
                {sent[f.id] ? 'Invited' : 'Challenge'}
              </button>
            </FriendRow>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-400">
          No friends yet.{' '}
          <Link to="/community?tab=friends" className="text-brand-400 hover:underline">
            Find players
          </Link>{' '}
          to follow their progress and challenge them.
        </p>
      )}
      {social.incoming.length > 0 && (
        <Link to="/community?tab=friends" className="mt-3 block rounded-xl border border-ink-700 px-3 py-2 text-sm text-ink-300 hover:border-brand-500/50">
          {social.incoming.length} pending friend request{social.incoming.length > 1 ? 's' : ''}
        </Link>
      )}
    </div>
  );
}

// Lobby: invite friends straight into this room.
export function InviteFriends({ code }) {
  const { user } = useAuth();
  const social = useSocial();
  const [sent, setSent] = useState({});
  const [busy, setBusy] = useState(null);
  if (!user || !social?.friends.length) return null;
  const friends = [...social.friends].sort(byOnline);

  return (
    <div className="mt-5 border-t border-ink-800 pt-4">
      <p className="label">Invite friends</p>
      <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
        {friends.map((f) => (
          <FriendRow key={f.id} friend={f}>
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
              {busy === f.id && <Spinner className="h-3.5 w-3.5" />}
              {sent[f.id] ? 'Invited' : 'Invite'}
            </button>
          </FriendRow>
        ))}
      </div>
    </div>
  );
}

// Add-friend button reflecting the current relation (profiles, search).
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

  if (relation === 'friend') return <span className={clsx('chip text-easy', className)}>Friends</span>;
  if (relation === 'outgoing') return <span className={clsx('chip', className)}>Request sent</span>;
  if (relation === 'incoming') {
    return (
      <button className={clsx('btn-primary btn-sm', className)} disabled={busy} onClick={() => act(() => social.accept(request.id))}>
        Accept request
      </button>
    );
  }
  return (
    <button className={clsx('btn-secondary btn-sm', className)} disabled={busy} onClick={() => act(() => social.sendRequest(playerId))}>
      {busy && <Spinner className="h-4 w-4" />} Add friend
    </button>
  );
}
