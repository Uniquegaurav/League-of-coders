import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Ban, SearchX, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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

export default function MatchRoom() {
  const { code: rawCode } = useParams();
  const code = rawCode.toUpperCase();
  const { user } = useAuth();
  const { match, setMatch, messages, error, connected, now } = useMatchRoom(code, { userId: user?.id });

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

  const me = user ? match.participants.find((p) => p.id === user.id) : null;
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
