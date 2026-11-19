import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Ban, SearchX, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL, api, tokenStore } from '../lib/api';
import useMatchRoom from '../hooks/useMatchRoom';
import { PageLoader } from '../components/ui';
import Lobby from '../components/match/Lobby';
import Arena from '../components/match/Arena';
import Results from '../components/match/Results';

function Notice({ icon: Icon, title, children }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <Icon className="h-10 w-10 text-ink-500" />
      <p className="mt-4 font-display text-2xl font-bold text-white">{title}</p>
      <p className="mt-2 text-ink-400">{children}</p>
      <Link to="/" className="btn-primary mt-6">
        Back to Compete
      </Link>
    </div>
  );
}

const rejoinKey = (code) => `loc.rejoin.${code}`;

/**
 * While you hold a spot, closing the tab asks first. A player (not the host) who closes a lobby tab
 * is taken out so the list stays honest. A reload looks the same to the page, so the spot is
 * remembered for this tab and taken back on the next load.
 */
function useLeaveGuard(match, me, user) {
  const inLobby = match?.status === 'lobby';
  const live = match?.status === 'live' || match?.status === 'countdown';
  const holding = !!me && !me.left && (inLobby || live);
  const autoLeave = holding && inLobby && !match.settings.solo && String(match.host) !== String(user?.id);
  const rejoined = useRef(false);

  useEffect(() => {
    if (!holding) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    const leave = (e) => {
      if (!autoLeave || e.persisted) return;
      try {
        sessionStorage.setItem(rejoinKey(match.code), '1');
      } catch {
        /* storage unavailable */
      }
      fetch(`${API_URL}/api/matches/${match.code}/leave`, {
        method: 'POST',
        keepalive: true,
        headers: { Authorization: `Bearer ${tokenStore.get()}` },
      }).catch(() => {});
    };
    window.addEventListener('beforeunload', warn);
    window.addEventListener('pagehide', leave);
    return () => {
      window.removeEventListener('beforeunload', warn);
      window.removeEventListener('pagehide', leave);
    };
  }, [holding, autoLeave, match?.code]);

  // Back after a reload: take the spot again.
  useEffect(() => {
    if (!match || !user || rejoined.current) return;
    let flagged = false;
    try {
      flagged = sessionStorage.getItem(rejoinKey(match.code)) === '1';
      sessionStorage.removeItem(rejoinKey(match.code));
    } catch {
      /* storage unavailable */
    }
    rejoined.current = true;
    // A short wait lets the leave sent while unloading land first; join is a no-op if we are still in.
    if (flagged && inLobby) setTimeout(() => api.matches.join(match.code).catch(() => {}), 800);
  }, [match, user, inLobby]);
}

export default function MatchRoom() {
  const { code: rawCode } = useParams();
  const code = rawCode.toUpperCase();
  const { user } = useAuth();
  const { match, setMatch, messages, error, connected, now } = useMatchRoom(code, { userId: user?.id });

  const me = user && match ? match.participants.find((p) => p.id === user.id) : null;
  useLeaveGuard(match, me, user);

  useEffect(() => {
    if (match) document.title = `${match.name} · ${code} · League of Coders`;
  }, [match?.name, code]);

  if (error && !match) {
    return (
      <Notice icon={SearchX} title="Battle not found">
        There’s no battle with the code <span className="font-mono text-white">{code}</span>. Double-check the invite link.
      </Notice>
    );
  }
  if (!match) return <PageLoader label="Entering the arena…" />;

  if (match.status === 'cancelled') {
    return (
      <Notice icon={Ban} title="This lobby was closed">
        Everyone left before the battle started.
      </Notice>
    );
  }

  const props = { match, messages, me, user, setMatch, now };

  return (
    <>
      {!connected && (
        <div className="flex items-center justify-center gap-2 bg-warn/15 py-1.5 text-xs text-warn">
          <WifiOff className="h-3.5 w-3.5" /> Reconnecting to live updates…
        </div>
      )}
      {match.status === 'lobby' && <Lobby {...props} />}
      {(match.status === 'countdown' || match.status === 'live') && <Arena {...props} />}
      {match.status === 'finished' && <Results {...props} />}
    </>
  );
}
