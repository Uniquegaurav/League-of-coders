import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { api } from '../lib/api';
import { timeAgo } from '../lib/format';
import usePolling from '../hooks/usePolling';
import EventCard from '../components/match/EventCard';
import { Avatar, EmptyState, InfoTip, Spinner } from '../components/ui';

const PLACE = ['text-gold', 'text-ink-300', 'text-amber-600'];
const SHOW_UPCOMING = 4;
const SHOW_PAST = 3;

function PastCard({ cup }) {
  return (
    <Link to={`/m/${cup.code}`} className="card card-hover block p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="truncate font-semibold text-white">{cup.name}</p>
        <p className="shrink-0 text-xs text-ink-500">{timeAgo(cup.finishedAt)}</p>
      </div>
      <p className="text-xs text-ink-500">{cup.players} players</p>
      <ol className="mt-4 space-y-2">
        {cup.podium.map((p, i) => (
          <li key={p.id} className="flex items-center gap-3 text-sm">
            <span className={`w-4 font-mono font-bold ${PLACE[i]}`}>{i + 1}</span>
            <Avatar name={p.name} src={p.avatar} size={26} />
            <span className="min-w-0 flex-1 truncate text-ink-200">{p.name}</span>
            <span className="font-mono text-ink-300">{p.score}</span>
          </li>
        ))}
      </ol>
    </Link>
  );
}

/** Tournaments block at the top of the League page: what is next, what is coming, and who won recently. */
export function TournamentsSection() {
  const { data, loading, error } = usePolling(() => api.events.list(), 30000);
  const [allUpcoming, setAllUpcoming] = useState(false);
  const [allPast, setAllPast] = useState(false);

  const heading = (
    <h2 className="section-title flex items-center gap-2">
      <Trophy className="h-5 w-5 text-gold" /> Tournaments
      <InfoTip label="About tournaments">
        Every day at the same time there is a public battle hour. On Sundays it becomes the Sunday Cup: 60 minutes, one Easy, two Medium and one Hard.
        Planned tournaments are listed here too. Lobbies open 30 minutes before and start on their own once 2 or more players have joined. Up to 20 players,
        rated like any battle.
      </InfoTip>
    </h2>
  );

  if (loading && !data) {
    return (
      <section className="space-y-4">
        {heading}
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6 text-ink-500" />
        </div>
      </section>
    );
  }
  if (error && !data) {
    return (
      <section className="space-y-4">
        {heading}
        <EmptyState icon={Trophy} title="Tournaments are not available yet">
          They will appear here after the next server update.
        </EmptyState>
      </section>
    );
  }

  const [next, ...rest] = data?.upcoming || [];
  const upcoming = allUpcoming ? rest : rest.slice(0, SHOW_UPCOMING);
  const cups = data?.cups || [];
  const past = allPast ? cups : cups.slice(0, SHOW_PAST);

  return (
    <section className="space-y-6">
      {heading}
      {next && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Next up</p>
          <EventCard event={next} className="border-brand-500/40" />
        </div>
      )}
      {rest.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Coming up</p>
          <div className="grid gap-3 lg:grid-cols-2">
            {upcoming.map((e) => (
              <EventCard key={e.key} event={e} />
            ))}
          </div>
          {rest.length > SHOW_UPCOMING && (
            <button className="text-sm text-brand-400 hover:underline" onClick={() => setAllUpcoming((v) => !v)}>
              {allUpcoming ? 'Show fewer' : `Show all ${rest.length}`}
            </button>
          )}
        </div>
      )}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Recent winners</p>
        {cups.length ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {past.map((cup) => (
                <PastCard key={cup.code} cup={cup} />
              ))}
            </div>
            {cups.length > SHOW_PAST && (
              <button className="text-sm text-brand-400 hover:underline" onClick={() => setAllPast((v) => !v)}>
                {allPast ? 'Show fewer' : `Show all ${cups.length}`}
              </button>
            )}
          </>
        ) : (
          <p className="card p-4 text-sm text-ink-400">Winners of each Sunday Cup and planned tournament show up here.</p>
        )}
      </div>
    </section>
  );
}
