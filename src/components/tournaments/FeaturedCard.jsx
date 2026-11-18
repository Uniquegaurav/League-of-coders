import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRight, Hourglass, Radio } from 'lucide-react';
import TournamentArt from './TournamentArt';

const pad = (n) => String(n).padStart(2, '0');
function countdown(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(t / 86400);
  const h = Math.floor((t % 86400) / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${d ? `${d}d ` : ''}${pad(h)}:${pad(m)}:${pad(s)}`;
}
const when = (d) => new Date(d).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

function Status({ event, now }) {
  const running = ['countdown', 'live'].includes(event.status);
  const open = event.code && event.status === 'lobby';
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 font-mono text-xs text-white backdrop-blur-md sm:text-sm">
      {running ? (
        <>
          <Radio className="h-3.5 w-3.5 text-hard" /> Live now
        </>
      ) : (
        <>
          <Hourglass className="h-3.5 w-3.5" /> {open ? 'Starts in ' : ''}
          {countdown(new Date(event.startsAt).getTime() - now)}
        </>
      )}
    </span>
  );
}

/** Big artwork card for an upcoming tournament. Clickable once its lobby exists. */
export default function FeaturedCard({ event, now, size = 'lg' }) {
  const big = size === 'lg';
  const running = ['countdown', 'live'].includes(event.status);
  const content = (
    <div className={clsx('group relative overflow-hidden rounded-3xl shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] transition duration-300', event.code && 'hover:-translate-y-1')}>
      <TournamentArt kind={event.kind} compact={!big} className={big ? 'h-48 sm:h-56' : 'h-36'} />
      <div className="absolute right-4 top-4">
        <Status event={event} now={now} />
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/55 via-black/30 to-transparent px-5 pb-4 pt-10">
        <div className="min-w-0">
          <p className={clsx('truncate font-display font-bold text-white drop-shadow', big ? 'text-2xl' : 'text-lg')}>{event.name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-white/80">
            <span>{when(event.startsAt)}</span>
            <span className="text-white/40">·</span>
            <span>{event.settings.durationMin} min</span>
            {event.code && (
              <>
                <span className="text-white/40">·</span>
                <span>{event.players} joined</span>
              </>
            )}
          </p>
        </div>
        {event.code && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition group-hover:bg-white/30" title={running ? 'Watch' : 'Join the lobby'}>
            <ArrowRight className="h-5 w-5" />
          </span>
        )}
      </div>
    </div>
  );
  return event.code ? <Link to={`/m/${event.code}`}>{content}</Link> : content;
}

