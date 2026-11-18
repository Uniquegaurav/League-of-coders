import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Clock, Crown, Globe, Layers, Link2, Lock, LogOut, Play, Settings2, Tags, Users, X } from 'lucide-react';
import { api } from '../../lib/api';
import { track } from '../../lib/analytics';
import { clock } from '../../lib/format';
import { Avatar, Spinner, Toggle, VerifiedBadge } from '../ui';
import ChatPanel from './ChatPanel';
import InviteBox from './InviteBox';
import MatchSettingsForm from './MatchSettingsForm';
import { ProblemMix, StatusPill } from './MatchCard';

function useAction(setMatch) {
  const [busy, setBusy] = useState(null);
  const run = async (key, fn, success) => {
    setBusy(key);
    try {
      const res = await fn();
      if (res?.match) setMatch(res.match);
      if (success) toast.success(success);
      return res;
    } catch (err) {
      toast.error(err.message);
      return null;
    } finally {
      setBusy(null);
    }
  };
  return [busy, run];
}

function SettingsSummary({ match }) {
  const s = match.settings;
  const rows = [
    [Clock, s.solo ? 'Time limit' : 'Duration', s.solo ? `${s.durationMin} min from the mix` : `${s.durationMin} minutes`],
    [Layers, 'Problems', <ProblemMix key="mix" settings={s} />],
    [Tags, 'Pool', s.pool === 'all' ? 'All free LeetCode' : 'Interview classics'],
    [Users, 'Players', s.solo ? 'Just you' : `up to ${s.maxPlayers}`],
    ...(s.solo ? [] : [[match.visibility === 'public' ? Globe : Lock, 'Visibility', match.visibility === 'public' ? 'Public lobby' : 'Invite only']]),
  ];
  return (
    <div className="space-y-2.5">
      {rows.map(([Icon, label, value]) => (
        <div key={label} className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-ink-400">
            <Icon className="h-4 w-4" /> {label}
          </span>
          <span className="font-medium text-ink-200">{value}</span>
        </div>
      ))}
      {s.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {s.topics.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function eventLine(match, now) {
  const starts = new Date(match.event.startsAt).getTime();
  const left = starts - (typeof now === 'function' ? now() : Date.now());
  const at = new Date(starts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return left > 0
    ? `Starts automatically at ${at} (in ${clock(left)}). Needs 2 or more players. ${match.participants.length} in the room.`
    : `Starting now. ${match.participants.length} in the room.`;
}

export default function Lobby({ match, messages, me, user, setMatch, now }) {
  const location = useLocation();
  const isHost = user && match.host === user.id;
  const [busy, run] = useAction(setMatch);
  const [editing, setEditing] = useState(null);
  const solo = !!match.settings.solo;
  const slots = solo ? 0 : Math.max(0, match.settings.maxPlayers - match.participants.length);
  const [, tick] = useState(0);
  // Scheduled lobbies show a live countdown to their start time.
  useEffect(() => {
    if (!match.event) return undefined;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [match.event]);

  const saveSettings = async () => {
    const res = await run('settings', () => api.matches.update(match.code, editing), 'Settings updated');
    if (res) setEditing(null);
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <StatusPill status="lobby" />
            <h1 className="mt-2 font-display text-3xl font-bold text-white">{match.name}</h1>
            <p className="text-sm text-ink-400">
              {solo
                ? `Solo test. ${match.settings.durationMin} minutes on the clock. Start when you are ready.`
                : match.event
                  ? eventLine(match, now)
                  : `Waiting for the host to start. ${match.participants.length} in the room.`}
            </p>
          </div>
          <div className="flex gap-2">
            {me ? (
              <button className="btn-secondary" disabled={!!busy} onClick={() => run('leave', () => api.matches.leave(match.code), 'You left the lobby')}>
                <LogOut className="h-4 w-4" /> Leave
              </button>
            ) : user ? (
              user.leetcode?.verified ? (
                <button
                  className="btn-primary"
                  disabled={!!busy}
                  onClick={async () => {
                    const res = await run('join', () => api.matches.join(match.code), 'You joined the battle!');
                    if (res) track('match_joined', { event: match.event?.kind || null, players: match.participants.length + 1 });
                  }}
                >
                  {busy === 'join' ? <Spinner className="h-4 w-4" /> : <Users className="h-4 w-4" />} Join battle
                </button>
              ) : (
                <Link to="/u/me" state={{ from: location.pathname }} className="btn-primary">
                  <Link2 className="h-4 w-4" /> {user.leetcode ? 'Verify LeetCode to join' : 'Link LeetCode to join'}
                </Link>
              )
            ) : (
              <Link to="/login" state={{ from: location.pathname }} className="btn-primary">
                <Users className="h-4 w-4" /> Sign up to join
              </Link>
            )}
            {isHost && (
              <button className="btn-primary" disabled={!!busy} onClick={() => run('start', () => api.matches.start(match.code))}>
                {busy === 'start' ? <Spinner className="h-4 w-4" /> : <Play className="h-4 w-4" />} {solo ? 'Start test' : 'Start battle'}
              </button>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="section-title">Players</p>
            <span className="font-mono text-sm text-ink-400">
              {match.participants.length}/{match.settings.maxPlayers}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {match.participants.map((p) => (
              <div key={p.id} className="flex animate-pop-in items-center gap-3 rounded-xl border border-ink-700 bg-ink-950/40 p-3">
                <Avatar name={p.name} src={p.avatar} size={40} online={p.online} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-white">
                    <Link to={`/u/${p.id}`} className="truncate hover:underline">
                      {p.name}
                    </Link>
                    {p.id === match.host && <Crown className="h-3.5 w-3.5 shrink-0 text-medium" title="Host" />}
                  </p>
                  <p className="flex items-center gap-1 truncate text-xs text-ink-400">
                    @{p.leetcode} <VerifiedBadge verified={p.verified} />
                  </p>
                </div>
                {p.excludeSolved && <span className="chip hidden text-[10px] sm:inline-flex">fresh only</span>}
                {isHost && p.id !== user.id && (
                  <button
                    className="btn-ghost p-1.5"
                    title="Remove player"
                    onClick={() => run(`kick-${p.id}`, () => api.matches.kick(match.code, p.id))}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {Array.from({ length: Math.min(slots, 4) }).map((_, i) => (
              <div key={`slot-${i}`} className="flex items-center gap-3 rounded-xl border border-dashed border-ink-700 p-3 text-sm text-ink-500">
                <span className="h-10 w-10 rounded-full border border-dashed border-ink-600" /> Waiting for player…
              </div>
            ))}
          </div>
        </div>

        {me && (
          <div className="card p-5">
            <Toggle
              checked={me.excludeSolved}
              onChange={(excludeSolved) => run('prefs', () => api.matches.setPrefs(match.code, { excludeSolved }))}
              label="Skip problems I've already solved"
              description="Leaves out problems you solved in past battles, marked solved in Practice, or got accepted recently on LeetCode (its public API exposes your last 20)."
            />
          </div>
        )}

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="section-title">{solo ? 'Test settings' : 'Battle settings'}</p>
            {isHost && !editing && (
              <button className="btn-ghost btn-sm" onClick={() => setEditing({ name: match.name, visibility: match.visibility, settings: match.settings })}>
                <Settings2 className="h-4 w-4" /> Edit
              </button>
            )}
          </div>
          {editing ? (
            <>
              <MatchSettingsForm value={editing} onChange={setEditing} />
              <div className="mt-6 flex justify-end gap-2">
                <button className="btn-ghost" onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button className="btn-primary" disabled={busy === 'settings'} onClick={saveSettings}>
                  Save settings
                </button>
              </div>
            </>
          ) : (
            <SettingsSummary match={match} />
          )}
        </div>
      </div>

      <div className="space-y-6">
        {solo ? (
          <div className="card p-5 text-sm text-ink-300">
            <p className="section-title mb-2">Clock</p>
            <p className="font-display text-3xl font-bold text-white">{match.settings.durationMin} min</p>
            <p className="mt-2 text-ink-400">Easy 10 min, medium 20, hard 35. The server sets this when you save the mix.</p>
          </div>
        ) : (
          <InviteBox code={match.code} name={match.name} />
        )}
        <ChatPanel code={match.code} messages={messages} className="h-[460px]" />
      </div>
    </div>
  );
}
