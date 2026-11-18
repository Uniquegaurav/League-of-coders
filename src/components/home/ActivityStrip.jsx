import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Eye, Flame, Trophy } from 'lucide-react';
import { api } from '../../lib/api';
import { clock, timeAgo } from '../../lib/format';
import usePolling from '../../hooks/usePolling';
import { useNow } from '../match/EventCard';
import { Avatar } from '../ui';

const DIFF = { Easy: 'text-easy', Medium: 'text-medium', Hard: 'text-hard' };
const keyOf = (item) => `${item.type}:${item.match.code}:${item.name}:${item.problem || ''}:${item.at}`;

function LiveBattle({ battle, now }) {
  const left = new Date(battle.endsAt).getTime() - now;
  return (
    <Link to={`/m/${battle.code}`} className="card card-hover flex items-center gap-3 p-3">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hard/70" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-hard" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{battle.name}</p>
        <p className="text-xs text-ink-400">
          {battle.status === 'countdown' ? 'Starting' : `${clock(Math.max(0, left))} left`} · {battle.players} playing
        </p>
      </div>
      <span className="flex -space-x-2">
        {battle.avatars.map((a) => (
          <Avatar key={a.name} name={a.name} src={a.avatar} size={24} className="rounded-full ring-2 ring-ink-900" />
        ))}
      </span>
      <Eye className="h-4 w-4 shrink-0 text-ink-500" />
    </Link>
  );
}

function FeedItem({ item, fresh }) {
  return (
    <li className={clsx('flex items-center gap-3 py-2.5', fresh && 'feed-in')}>
      <Avatar name={item.name} src={item.avatar} size={28} />
      <p className="min-w-0 flex-1 truncate text-sm text-ink-300">
        <span className="font-medium text-white">{item.name}</span>{' '}
        {item.type === 'win' ? (
          <>
            won <Link to={`/m/${item.match.code}`} className="text-ink-200 hover:underline">{item.match.name}</Link>
          </>
        ) : (
          <>
            solved <span className={DIFF[item.difficulty] || 'text-ink-200'}>{item.problem}</span>
          </>
        )}
      </p>
      {item.type === 'win' ? <Trophy className="h-4 w-4 shrink-0 text-medium" /> : item.firstSolve ? <Flame className="h-4 w-4 shrink-0 text-medium" title="First solve" /> : null}
      <span className="shrink-0 text-xs text-ink-500">{timeAgo(item.at)}</span>
    </li>
  );
}

/**
 * "Happening now": live public battles and the latest solves and wins, refreshed every 15 seconds.
 * `lead` (the next scheduled event) sits at the top of the left column.
 */
export default function ActivityStrip({ lead }) {
  const { data } = usePolling(() => api.activity().catch(() => null), 15000);
  const now = useNow();
  const seen = useRef(null);
  const feed = data?.feed?.slice(0, 6) || [];
  const live = data?.live || [];

  // Only items that arrive after the first load animate in.
  const firstLoad = seen.current === null;
  const fresh = new Set(firstLoad ? [] : feed.map(keyOf).filter((k) => !seen.current.has(k)));
  useEffect(() => {
    if (data) seen.current = new Set((data.feed || []).map(keyOf));
  }, [data]);

  if (!data || (!feed.length && !live.length)) return lead || null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-6">
        {lead}
        <div>
        <h2 className="section-title mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-hard" /> Live now
        </h2>
        {live.length ? (
          <div className="space-y-2">
            {live.map((b) => (
              <LiveBattle key={b.code} battle={b} now={now} />
            ))}
          </div>
        ) : (
          <p className="card p-4 text-sm text-ink-400">No battles running this minute. Start one and it shows up here.</p>
        )}
        </div>
      </div>
      <div className="min-w-0">
        <h2 className="section-title mb-3">Latest solves and wins</h2>
        <ul className="card divide-y divide-ink-800/70 px-4">
          {feed.map((item) => (
            <FeedItem key={keyOf(item)} item={item} fresh={fresh.has(keyOf(item))} />
          ))}
        </ul>
      </div>
    </div>
  );
}
