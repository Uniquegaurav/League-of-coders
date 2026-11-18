import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRight, CalendarDays, Radio } from 'lucide-react';
import { api } from '../lib/api';
import { timeAgo } from '../lib/format';
import usePolling from '../hooks/usePolling';
import { useNow } from '../components/match/EventCard';
import { ProblemMix } from '../components/match/MatchCard';
import { Avatar, InfoTip, Spinner } from '../components/ui';

// One accent per kind of event, used for its chip, timeline dot and glow.
export const KIND = {
  daily: { label: 'Battle hour', dot: 'bg-brand-400', chip: 'bg-brand-500/15 text-brand-300', glow: 'rgba(124,92,255,0.28)' },
  cup: { label: 'Sunday Cup', dot: 'bg-gold', chip: 'bg-gold/15 text-gold', glow: 'rgba(227,199,122,0.22)' },
  special: { label: 'Planned', dot: 'bg-neon-400', chip: 'bg-neon-500/15 text-neon-400', glow: 'rgba(94,234,212,0.2)' },
};
const kindOf = (e) => KIND[e.kind] || KIND.daily;

const time = (d) => new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const longDate = (d) => new Date(d).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' });

function parts(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  return [
    ['Days', Math.floor(t / 86400)],
    ['Hours', Math.floor((t % 86400) / 3600)],
    ['Min', Math.floor((t % 3600) / 60)],
    ['Sec', t % 60],
  ];
}

function Countdown({ ms }) {
  return (
    <div className="flex gap-2 sm:gap-3">
      {parts(ms).map(([label, v]) => (
        <div key={label} className="w-16 rounded-2xl bg-black/30 py-3 text-center sm:w-20">
          <p className="font-mono text-2xl font-bold tabular-nums text-white sm:text-3xl">{String(v).padStart(2, '0')}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-400">{label}</p>
        </div>
      ))}
    </div>
  );
}

function NextUp({ event, now }) {
  const k = kindOf(event);
  const running = ['countdown', 'live'].includes(event.status);
  return (
    <section className="panel relative overflow-hidden p-6 sm:p-8" style={{ backgroundImage: `radial-gradient(ellipse at 85% 0%, ${k.glow}, transparent 60%)` }}>
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
            Next up <span className={clsx('rounded-full px-2.5 py-0.5 normal-case tracking-normal', k.chip)}>{k.label}</span>
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">{event.name}</h2>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-300">
            <span>
              {longDate(event.startsAt)}, {time(event.startsAt)}
            </span>
            <span className="text-ink-600">·</span>
            <span>{event.settings.durationMin} min</span>
            <span className="text-ink-600">·</span>
            <ProblemMix settings={event.settings} />
            {event.code && (
              <>
                <span className="text-ink-600">·</span>
                <span>{event.players} joined</span>
              </>
            )}
          </p>
          {event.description && <p className="mt-2 max-w-md text-sm text-ink-400">{event.description}</p>}
          <div className="mt-6">
            {event.code ? (
              <Link to={`/m/${event.code}`} className="btn-primary px-5 py-2.5">
                {running ? (
                  <>
                    <Radio className="h-4 w-4" /> Watch live
                  </>
                ) : (
                  <>
                    Join the lobby <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Link>
            ) : (
              <p className="text-sm text-ink-400">The lobby opens at {time(event.opensAt)}, 30 minutes before the start.</p>
            )}
          </div>
        </div>
        {!running && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Starts in</p>
            <Countdown ms={new Date(event.startsAt).getTime() - now} />
          </div>
        )}
      </div>
    </section>
  );
}

// Upcoming events as a timeline, grouped by day.
function Schedule({ events }) {
  const days = [];
  events.forEach((e) => {
    const key = new Date(e.startsAt).toDateString();
    const day = days.find((d) => d.key === key);
    if (day) day.items.push(e);
    else days.push({ key, date: e.startsAt, items: [e] });
  });
  return (
    <section>
      <h2 className="section-title mb-5 flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-ink-400" /> Schedule
      </h2>
      <ol className="space-y-6">
        {days.map((d) => (
          <li key={d.key} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 sm:grid-cols-[4.5rem_minmax(0,1fr)]">
            <div className="pt-1 text-center">
              <p className="text-xs uppercase tracking-wider text-ink-500">{new Date(d.date).toLocaleDateString([], { weekday: 'short' })}</p>
              <p className="font-display text-2xl font-bold text-white">{new Date(d.date).getDate()}</p>
            </div>
            <ul className="space-y-2 border-l border-white/10 pl-4">
              {d.items.map((e) => {
                const k = kindOf(e);
                const row = (
                  <div className="relative flex flex-col gap-1.5 rounded-2xl bg-white/[0.03] px-4 py-3 transition hover:bg-white/[0.06] sm:flex-row sm:items-center sm:gap-4">
                    <span className={clsx('absolute -left-[1.4rem] top-5 h-2.5 w-2.5 -translate-y-1/2 rounded-full ring-4 ring-ink-950 sm:top-1/2', k.dot)} />
                    <span className="flex min-w-0 flex-1 items-baseline gap-4">
                      <span className="w-14 shrink-0 font-mono text-sm text-ink-300">{time(e.startsAt)}</span>
                      <span className="min-w-0 truncate font-medium text-white">{e.name}</span>
                    </span>
                    <span className="flex flex-wrap items-center gap-3 pl-[4.5rem] sm:pl-0">
                      <span className={clsx('rounded-full px-2.5 py-0.5 text-xs', k.chip)}>{k.label}</span>
                      <span className="text-xs text-ink-500">{e.settings.durationMin} min</span>
                      <ProblemMix settings={e.settings} />
                      {e.code && <span className="text-xs font-semibold text-easy">{['countdown', 'live'].includes(e.status) ? 'Live' : `Open · ${e.players} in`}</span>}
                    </span>
                  </div>
                );
                return <li key={e.key}>{e.code ? <Link to={`/m/${e.code}`}>{row}</Link> : row}</li>;
              })}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Winners({ cups }) {
  return (
    <section>
      <h2 className="section-title mb-4">Recent winners</h2>
      {cups.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cups.slice(0, cups.length >= 6 ? 6 : Math.min(cups.length, 3)).map((cup) => {
            const k = KIND[cup.kind] || KIND.cup;
            const [first, second, third] = cup.podium;
            return (
              <Link key={cup.code} to={`/m/${cup.code}`} className="panel block p-5 transition hover:bg-white/[0.06]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{cup.name}</p>
                    <p className="text-xs text-ink-500">
                      {timeAgo(cup.finishedAt)} · {cup.players} players
                    </p>
                  </div>
                  <span className={clsx('shrink-0 rounded-full px-2.5 py-0.5 text-xs', k.chip)}>{k.label}</span>
                </div>
                <div className="mt-5 flex items-end justify-center gap-2">
                  {[second, first, third].map((p, i) =>
                    p ? (
                      <div key={p.id} className="flex w-20 flex-col items-center">
                        <Avatar name={p.name} src={p.avatar} size={i === 1 ? 44 : 34} className={clsx('rounded-full ring-2', i === 1 ? 'ring-gold' : i === 0 ? 'ring-ink-300' : 'ring-amber-700')} />
                        <div className={clsx('mt-2 w-full rounded-t-lg bg-white/[0.06] text-center', i === 1 ? 'h-10 pt-1.5' : i === 0 ? 'h-7 pt-1' : 'h-5 pt-0.5')}>
                          <span className="font-mono text-xs text-ink-300">{i === 1 ? 1 : i === 0 ? 2 : 3}</span>
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="w-20" />
                    )
                  )}
                </div>
                {first && (
                  <p className="mt-3 truncate text-center text-sm text-ink-300">
                    <span className="font-medium text-white">{first.name}</span> won with {first.score}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-ink-400">Winners of the Sunday Cup and planned tournaments show up here.</p>
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

  const [next, ...rest] = data?.upcoming || [];

  return (
    <div className="space-y-12 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4 pt-6 sm:pt-12">
        <div>
          <h1 className="flex items-center gap-2 font-display text-4xl font-bold tracking-tight text-white drop-shadow sm:text-5xl">
            Tournaments
            <InfoTip label="About tournaments">
              A public battle hour every evening, the Sunday Cup each week, and planned tournaments. Lobbies open 30 minutes before and start on their own
              once 2 or more players join. Up to 20 players. Tournaments are the only battles that move your rating, and they give 1.5x XP.
            </InfoTip>
          </h1>
          <p className="mt-2 text-lg text-ink-200">Scheduled, public, and the only battles that move your rating.</p>
        </div>
        <Link to="/leaderboard" className="btn-ghost text-sm text-ink-200">
          Leaderboard <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      {loading && !data ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-ink-500" />
        </div>
      ) : error && !data ? (
        <p className="text-sm text-ink-400">The schedule is not available right now.</p>
      ) : (
        <>
          {next && <NextUp event={next} now={now} />}
          {rest.length > 0 && <Schedule events={rest} />}
        </>
      )}

      <Winners cups={data?.cups || []} />
    </div>
  );
}
