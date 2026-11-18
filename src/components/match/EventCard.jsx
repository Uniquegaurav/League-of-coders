import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { CalendarClock, Trophy, Users } from 'lucide-react';
import { clock } from '../../lib/format';
import { ProblemMix } from './MatchCard';

const timeOf = (d) => new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const dayOf = (d) => new Date(d).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' });

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** One scheduled event: the daily battle hour or the Sunday Cup. */
export default function EventCard({ event, className }) {
  const now = useNow();
  const startsIn = new Date(event.startsAt).getTime() - now;
  const opensIn = new Date(event.opensAt).getTime() - now;
  const cup = event.kind === 'cup';
  const running = ['countdown', 'live'].includes(event.status);
  const Icon = cup ? Trophy : CalendarClock;

  return (
    <div className={clsx('card card-hover flex flex-col gap-4 p-5 sm:flex-row sm:items-center', cup && 'border-medium/30', className)}>
      <span className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', cup ? 'bg-medium/15 text-medium' : 'bg-brand-500/15 text-brand-400')}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-white">{event.name}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-400">
          <span>
            {dayOf(event.startsAt)}, {timeOf(event.startsAt)}
          </span>
          <span className="text-ink-600">·</span>
          <span>{event.settings.durationMin} min</span>
          <span className="text-ink-600">·</span>
          <ProblemMix settings={event.settings} />
          {event.code && (
            <>
              <span className="text-ink-600">·</span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {event.players} joined
              </span>
            </>
          )}
        </p>
      </div>
      {running && event.code ? (
        <Link to={`/m/${event.code}`} className="btn-secondary shrink-0">
          Watch live
        </Link>
      ) : event.code ? (
        <Link to={`/m/${event.code}`} className="btn-primary shrink-0">
          Join · starts in {clock(Math.max(0, startsIn))}
        </Link>
      ) : (
        <span className="shrink-0 text-right text-sm text-ink-400">
          {opensIn > 24 * 3600 * 1000 ? (
            <>Lobby opens {new Date(event.opensAt).toLocaleDateString([], { weekday: 'short' })}, {timeOf(event.opensAt)}</>
          ) : opensIn > 0 ? (
            <>
              Lobby opens in <span className="font-mono text-ink-200">{clock(opensIn)}</span>
            </>
          ) : (
            'Opening now'
          )}
        </span>
      )}
    </div>
  );
}
