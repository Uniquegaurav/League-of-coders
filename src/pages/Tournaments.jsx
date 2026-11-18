import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { api } from '../lib/api';
import { timeAgo } from '../lib/format';
import usePolling from '../hooks/usePolling';
import { useNow } from '../components/match/EventCard';
import FeaturedCard from '../components/tournaments/FeaturedCard';
import { ProblemMix } from '../components/match/MatchCard';
import TournamentArt from '../components/tournaments/TournamentArt';
import Ranking from '../components/tournaments/Ranking';
import { Avatar, InfoTip, Spinner } from '../components/ui';

function PastTournaments({ cups }) {
  const [all, setAll] = useState(false);
  const shown = all ? cups : cups.slice(0, 5);
  return (
    <section className="panel p-5 sm:p-6">
      <div className="pill-tabs">
        <span className="pill-tab pill-tab-active">Past tournaments</span>
      </div>
      {cups.length ? (
        <ul className="mt-4 space-y-2">
          {shown.map((cup) => {
            const winner = cup.podium[0];
            return (
              <li key={cup.code}>
                <Link to={`/m/${cup.code}`} className="group flex items-center gap-4 rounded-2xl p-2 transition hover:bg-white/[0.04]">
                  <TournamentArt kind={cup.kind} compact className="h-16 w-24 shrink-0 rounded-xl sm:w-28" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{cup.name}</p>
                    <p className="text-xs text-ink-500">
                      {timeAgo(cup.finishedAt)} · {cup.players} players
                    </p>
                    {winner && (
                      <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-ink-300">
                        <Avatar name={winner.name} src={winner.avatar} size={16} /> {winner.name} won with {winner.score}
                      </p>
                    )}
                  </div>
                  <span className="hidden shrink-0 rounded-full bg-brand-500/15 px-3 py-1 text-xs font-semibold text-brand-300 transition group-hover:bg-brand-500/25 sm:inline">
                    Results
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-ink-400">Results of the Sunday Cup and planned tournaments show up here.</p>
      )}
      {cups.length > 5 && (
        <button className="mt-3 text-sm text-brand-400 hover:underline" onClick={() => setAll((v) => !v)}>
          {all ? 'Show fewer' : `Show all ${cups.length}`}
        </button>
      )}
    </section>
  );
}

export default function Tournaments() {
  const { data, loading, error } = usePolling(() => api.events.list(), 30000);
  const now = useNow();

  useEffect(() => {
    document.title = 'Tournaments · League of Coders';
  }, []);

  const upcoming = data?.upcoming || [];
  // Lead with the next event and the next Sunday Cup (or the one after).
  const first = upcoming[0];
  const second = upcoming.find((e) => e !== first && e.kind === 'cup') || upcoming[1];
  const featured = [first, second].filter(Boolean);
  const more = upcoming.filter((e) => !featured.includes(e)).slice(0, 6);

  return (
    <div className="space-y-12 pb-6">
      <header className="pt-8 text-center sm:pt-14">
        <h1 className="flex items-center justify-center gap-2 font-display text-4xl font-bold tracking-tight text-white drop-shadow sm:text-5xl">
          Tournaments
          <InfoTip label="About tournaments">
            A public battle hour every evening, the Sunday Cup each week, and planned tournaments. Lobbies open 30 minutes before and start on their own
            once 2 or more players join. Up to 20 players. Tournaments are the only battles that move your rating.
          </InfoTip>
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-lg text-ink-300">Compete on a schedule and climb the rating.</p>
      </header>

      {loading && !data ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-ink-500" />
        </div>
      ) : error && !data ? (
        <p className="text-center text-sm text-ink-400">The schedule is not available right now.</p>
      ) : (
        <>
          <section className={clsx('mx-auto grid max-w-5xl gap-6', featured.length > 1 && 'md:grid-cols-2')}>
            {featured.map((e) => (
              <FeaturedCard key={e.key} event={e} now={now} />
            ))}
          </section>

          {more.length > 0 && (
            <section className="mx-auto max-w-5xl">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-500">Also coming up</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {more.map((e) => (
                  <div key={e.key} className="space-y-2">
                    <FeaturedCard event={e} now={now} size="sm" />
                    <div className="flex items-center gap-2 px-1 text-xs text-ink-500">
                      <ProblemMix settings={e.settings} />
                      {e.description && <span className="truncate">{e.description}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Ranking />
        <PastTournaments cups={data?.cups || []} />
      </div>
    </div>
  );
}
