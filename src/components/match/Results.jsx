import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'sonner';
import { ArrowRight, Flame, Megaphone, RefreshCw, Swords, Trophy } from 'lucide-react';
import { api } from '../../lib/api';
import { elapsedLabel, leetcodeUrl, ordinal } from '../../lib/format';
import { Avatar, DifficultyBadge, Spinner, VerifiedBadge } from '../ui';
import ChatPanel from './ChatPanel';
import { letter } from './Scoreboard';

const PODIUM = [
  { place: 2, height: 'h-24', ring: 'ring-ink-300', text: 'text-ink-300' },
  { place: 1, height: 'h-32', ring: 'ring-medium', text: 'text-medium' },
  { place: 3, height: 'h-16', ring: 'ring-amber-700', text: 'text-amber-600' },
];

function RatingDelta({ p }) {
  if (p.ratingBefore == null || p.ratingAfter == null) return <span className="text-ink-500">—</span>;
  const d = p.ratingAfter - p.ratingBefore;
  return (
    <span className={clsx('font-mono text-sm font-semibold', d > 0 ? 'text-easy' : d < 0 ? 'text-hard' : 'text-ink-400')}>
      {d > 0 ? `+${d}` : d}
    </span>
  );
}

export default function Results({ match, messages, me, user }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(null);
  const ranked = match.participants;
  const rated = ranked.length >= 2;
  const podium = PODIUM.map((slot) => ({ ...slot, player: ranked[slot.place - 1] })).filter((s) => s.player);

  const rematch = async () => {
    setBusy('rematch');
    try {
      if (match.rematchCode) {
        await api.matches.join(match.rematchCode).catch(() => {});
        navigate(`/m/${match.rematchCode}`);
      } else {
        const { match: next } = await api.matches.rematch(match.code);
        navigate(`/m/${next.code}`);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const shareResult = async () => {
    setBusy('share');
    try {
      const winner = ranked[0];
      await api.posts.create({
        title: `${match.name}: ${winner?.score ? `${winner.name} won with ${winner.score} pts` : 'battle results'}`,
        body: ranked
          .map((p, i) => `${i + 1}. ${p.name} — ${p.score} pts (${p.solves.length}/${match.problems.length} solved)`)
          .join('\n'),
        tags: ['battle', ...match.problems.map((p) => p.difficulty.toLowerCase())].slice(0, 5),
        matchCode: match.code,
      });
      toast.success('Shared to the community feed', { action: { label: 'View', onClick: () => navigate('/community') } });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Battle over · {match.code}</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-white">{match.name}</h1>
          {me && (
            <p className="mt-1 text-ink-300">
              You finished <span className="font-semibold text-white">{ordinal(me.rank || ranked.indexOf(me) + 1)}</span> with{' '}
              <span className="font-semibold text-white">{me.score} pts</span>
              {rated && me.ratingAfter != null && (
                <>
                  {' '}
                  · rating {me.ratingBefore} → <span className="font-semibold text-white">{me.ratingAfter}</span>
                </>
              )}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {user && (
            <button className="btn-secondary" disabled={!!busy} onClick={shareResult}>
              {busy === 'share' ? <Spinner className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />} Share result
            </button>
          )}
          {me && (
            <button className="btn-primary" disabled={!!busy} onClick={rematch}>
              {busy === 'rematch' ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
              {match.rematchCode ? 'Join rematch' : 'Rematch'}
            </button>
          )}
          <Link to="/" className="btn-ghost">
            <Swords className="h-4 w-4" /> New battle
          </Link>
        </div>
      </div>

      {match.rematchCode && !me && (
        <Link to={`/m/${match.rematchCode}`} className="card flex items-center justify-between p-4 text-sm text-ink-200 hover:border-brand-500/50">
          A rematch lobby is open <ArrowRight className="h-4 w-4" />
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Podium */}
          <div className="card flex items-end justify-center gap-2 px-3 pb-0 pt-8 sm:gap-4 sm:px-6">
            {podium.map(({ place, height, ring, text, player }) => (
              <div key={place} className="flex min-w-0 max-w-[8rem] flex-1 flex-col items-center">
                {place === 1 && <Trophy className="mb-2 h-7 w-7 text-medium" />}
                <Avatar name={player.name} src={player.avatar} size={place === 1 ? 64 : 52} className={clsx('rounded-full ring-4', ring)} />
                <p className="mt-2 max-w-full truncate text-sm font-semibold text-white">{player.name}</p>
                <p className="font-mono text-xs text-ink-400">{player.score} pts</p>
                <div className={clsx('mt-3 flex w-full items-start justify-center rounded-t-xl border border-b-0 border-ink-700 bg-ink-800/80 pt-2', height)}>
                  <span className={clsx('font-display text-2xl font-bold', text)}>{place}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Standings */}
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-ink-800 text-left text-xs uppercase tracking-wider text-ink-500">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Player</th>
                  {match.problems.map((p, i) => (
                    <th key={p.slug} className="px-2 py-3 text-center" title={p.title}>
                      {letter(i)}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right">Score</th>
                  {rated && <th className="px-4 py-3 text-right">Rating</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/70">
                {ranked.map((p, i) => {
                  const solves = new Map(p.solves.map((s) => [s.slug, s]));
                  return (
                    <tr key={p.id} className={clsx(p.id === user?.id && 'bg-brand-500/5')}>
                      <td className="px-4 py-3 font-mono text-ink-400">{p.rank || i + 1}</td>
                      <td className="px-4 py-3">
                        <Link to={`/u/${p.id}`} className="flex items-center gap-2 hover:underline">
                          <Avatar name={p.name} src={p.avatar} size={26} />
                          <span className="font-medium text-ink-200">{p.name}</span>
                          <VerifiedBadge verified={p.verified} />
                          {p.left && <span className="text-[10px] text-hard">forfeit</span>}
                        </Link>
                      </td>
                      {match.problems.map((prob) => {
                        const s = solves.get(prob.slug);
                        return (
                          <td key={prob.slug} className="px-2 py-3 text-center">
                            {s ? (
                              <span className={clsx('inline-flex flex-col items-center', s.firstSolve ? 'text-medium' : 'text-easy')}>
                                <span className="inline-flex items-center gap-0.5 font-mono text-xs font-bold">
                                  {s.firstSolve && <Flame className="h-3 w-3" />}+{s.points}
                                </span>
                                <span className="font-mono text-[10px] text-ink-500">{elapsedLabel(match.startedAt, s.solvedAt)}</span>
                              </span>
                            ) : (
                              <span className="text-ink-600">·</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right font-mono font-bold text-white">{p.score}</td>
                      {rated && (
                        <td className="px-4 py-3 text-right">
                          <RatingDelta p={p} />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Problems */}
          <div className="card p-5">
            <p className="section-title mb-3">Problems in this battle</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {match.problems.map((p, i) => (
                <div key={p.slug} className="flex items-center gap-3 rounded-xl border border-ink-800 p-3">
                  <span className="font-mono text-sm font-bold text-brand-400">{letter(i)}</span>
                  <Link to={`/problems/${p.slug}`} className="min-w-0 flex-1 truncate text-sm text-ink-200 hover:underline">
                    {p.title}
                  </Link>
                  <DifficultyBadge difficulty={p.difficulty} />
                  <a href={leetcodeUrl(p.slug)} target="_blank" rel="noreferrer" className="text-xs text-ink-500 hover:text-white">
                    LC ↗
                  </a>
                </div>
              ))}
            </div>
            {match.selection?.reusedSolved > 0 && (
              <p className="mt-3 text-xs text-ink-500">
                {match.selection.reusedSolved} problem(s) had been solved before by someone who asked to skip them — the pool ran out of fresh ones.
              </p>
            )}
          </div>
        </div>
        <ChatPanel code={match.code} messages={messages} className="h-[560px] lg:sticky lg:top-24" />
      </div>
    </div>
  );
}
