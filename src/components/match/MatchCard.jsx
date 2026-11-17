import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Clock, Eye, Trophy, Users } from 'lucide-react';
import { timeAgo } from '../../lib/format';

const STATUS = {
  lobby: { label: 'Open lobby', dot: 'bg-easy', text: 'text-easy' },
  countdown: { label: 'Starting', dot: 'bg-medium animate-pulse', text: 'text-medium' },
  live: { label: 'Live', dot: 'bg-hard animate-pulse', text: 'text-hard' },
  finished: { label: 'Finished', dot: 'bg-ink-500', text: 'text-ink-400' },
  cancelled: { label: 'Cancelled', dot: 'bg-ink-600', text: 'text-ink-500' },
};

export function StatusPill({ status }) {
  const s = STATUS[status] || STATUS.lobby;
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider', s.text)}>
      <span className={clsx('h-2 w-2 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}

export function ProblemMix({ settings }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs">
      {settings.easy > 0 && <span className="text-easy">{settings.easy}E</span>}
      {settings.medium > 0 && <span className="text-medium">{settings.medium}M</span>}
      {settings.hard > 0 && <span className="text-hard">{settings.hard}H</span>}
    </span>
  );
}

export default function MatchCard({ match, joined }) {
  const open = match.status === 'lobby';
  const full = match.players >= match.maxPlayers;
  return (
    <Link to={`/m/${match.code}`} className="card card-hover group flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <StatusPill status={match.status} />
          <p className="mt-1.5 truncate font-display text-base font-semibold text-white">{match.name}</p>
          <p className="text-xs text-ink-400">hosted by {match.hostName}</p>
        </div>
        <span className="rounded-lg border border-ink-700 bg-ink-950/60 px-2 py-1 font-mono text-xs tracking-widest text-ink-300">{match.code}</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-400">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" /> {match.players}/{match.maxPlayers}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {match.settings.durationMin} min
        </span>
        <ProblemMix settings={match.settings} />
        {match.settings.solo && <span className="chip">Solo</span>}
        {match.settings.pool === 'all' && <span className="chip">All LeetCode</span>}
        {match.status === 'finished' && match.finishedAt && <span>{timeAgo(match.finishedAt)}</span>}
      </div>
      {match.status === 'finished' ? (
        match.winner && (
          <p className="inline-flex items-center gap-1.5 text-sm text-medium">
            <Trophy className="h-4 w-4" /> {match.winner.name} · {match.winner.score} pts
          </p>
        )
      ) : joined ? (
        <span className="btn-primary btn-sm w-full">{open ? 'Return to lobby' : 'Back to the arena'}</span>
      ) : (
        <span className={clsx('btn btn-sm w-full', open && !full ? 'btn-primary' : 'btn-secondary')}>
          {open && !full ? 'Join battle' : (
            <>
              <Eye className="h-4 w-4" /> Spectate
            </>
          )}
        </span>
      )}
    </Link>
  );
}
