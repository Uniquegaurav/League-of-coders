import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import clsx from 'clsx';
import { AlertCircle, ArrowRight, Link2, Swords } from 'lucide-react';
import { api } from '../lib/api';
import { track } from '../lib/analytics';
import { useAuth } from '../context/AuthContext';
import MatchSettingsForm, { DEFAULT_SETTINGS } from '../components/match/MatchSettingsForm';
import ScoringRules from '../components/match/ScoringRules';
import { soloClock } from '../lib/soloTime';
import { InfoTip, Spinner } from '../components/ui';

const STORAGE_KEY = 'loc.lastMatchSettings';

function withMode(form, solo) {
  return {
    ...form,
    visibility: solo ? 'private' : form.visibility || 'public',
    settings: { ...form.settings, solo, maxPlayers: solo ? 1 : Math.max(2, form.settings.maxPlayers || 8) },
  };
}

export default function NewMatch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState(() => {
    const solo = params.get('mode') === 'solo';
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const base = saved ? { ...DEFAULT_SETTINGS, ...saved, name: '' } : DEFAULT_SETTINGS;
      return withMode(base, solo);
    } catch {
      return withMode(DEFAULT_SETTINGS, solo);
    }
  });
  const [submitting, setSubmitting] = useState(false);
  // Set when the user presses create without a verified LeetCode account; bumps re-trigger the shake.
  const [linkNudge, setLinkNudge] = useState(0);
  const linkRef = useRef(null);

  useEffect(() => {
    document.title = form.settings.solo ? 'Solo test · League of Coders' : 'New battle · League of Coders';
  }, [form.settings.solo]);

  useEffect(() => {
    const solo = params.get('mode') === 'solo';
    setForm((current) => (current.settings.solo === solo ? current : withMode(current, solo)));
  }, [params]);

  const solo = !!form.settings.solo;
  const clock = soloClock(form.settings);
  const total = form.settings.easy + form.settings.medium + form.settings.hard;
  const verified = !!user?.leetcode?.verified;
  // Stays clickable while unlinked so the press can point the user at what is missing.
  const canSubmit = total >= 1 && total <= 10 && !submitting;

  const submit = async (e) => {
    e.preventDefault();
    if (!verified) {
      setLinkNudge((n) => n + 1);
      linkRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    try {
      const { match } = await api.matches.create(form);
      track('match_created', { solo: !!match.settings.solo, visibility: match.visibility, players: match.settings.maxPlayers });
      const inviteId = params.get('invite');
      if (inviteId && !form.settings.solo) {
        api.friends
          .invite(inviteId, match.code)
          .then(() => toast.success('Challenge sent to your friend'))
          .catch((err) => toast.error(err.message));
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ visibility: form.visibility, settings: form.settings }));
      navigate(`/m/${match.code}`);
    } catch (err) {
      toast.error(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-8 pt-6 sm:pt-12 lg:grid-cols-[1fr_340px]">
      <form onSubmit={submit} className="card p-6 sm:p-8">
        <div className="mb-8">
          <div>
          <div className="mb-5 inline-flex rounded-xl border border-ink-700 bg-ink-950/60 p-1">
            <button
              type="button"
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${solo ? 'bg-ink-700 text-white' : 'text-ink-400'}`}
              onClick={() => setForm((f) => withMode(f, true))}
            >
              Solo test
            </button>
            <button
              type="button"
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${!solo ? 'bg-ink-700 text-white' : 'text-ink-400'}`}
              onClick={() => setForm((f) => withMode(f, false))}
            >
              Battle
            </button>
          </div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-bold text-white">
            {solo ? 'Set up your test' : 'Set up your battle'}
            <InfoTip label="How this works">
              {solo
                ? 'Each problem adds time to the clock: 10 minutes for easy, 20 for medium and 35 for hard. Problems stay hidden until you start, and solo tests never change your rating.'
                : 'Problems are drawn and shuffled only when you press start, so nobody sees them early. Battles with 2 or more players are rated.'}
            </InfoTip>
          </h1>
          <p className="mt-1 text-ink-300">
            {solo ? `Pick your mix. Clock: ${clock.minutes || 0} min.` : 'Choose the rules and invite your rivals.'}
          </p>
          </div>
        </div>

        {!verified && (
          <div
            ref={linkRef}
            key={linkNudge}
            className={clsx(
              'mb-6 flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors',
              linkNudge ? 'shake border-hard/70 bg-hard/10' : 'border-warn/30 bg-warn/5'
            )}
          >
            <p className="flex items-center gap-2 text-sm text-ink-200">
              <Link2 className={clsx('h-4 w-4', linkNudge ? 'text-hard' : 'text-warn')} />{' '}
              {user?.leetcode ? 'Verify your LeetCode account before hosting.' : 'Link your LeetCode account before hosting.'}
            </p>
            <Link to="/u/me#leetcode" state={{ from: `/new?mode=${solo ? 'solo' : 'battle'}` }} className={linkNudge ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}>
              {user?.leetcode ? 'Verify now' : 'Link now'} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        <MatchSettingsForm value={form} onChange={setForm} />

        <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
          {!verified && linkNudge > 0 && (
            <p role="alert" className="flex items-center gap-1.5 text-sm text-hard">
              <AlertCircle className="h-4 w-4" /> {user?.leetcode ? 'Verify your LeetCode account first.' : 'Link your LeetCode account first.'}
            </p>
          )}
          <button type="submit" disabled={!canSubmit} className="btn-primary px-6 py-3 text-base">
            {submitting ? <Spinner className="h-5 w-5" /> : <Swords className="h-5 w-5" />}
            {solo ? 'Create test' : 'Create lobby'}
          </button>
        </div>
      </form>

      <aside className="space-y-4">
        <div className="card p-5">
          <p className="section-title mb-4">{solo ? 'Time limit' : 'Scoring'}</p>
          {solo ? (
            <div className="space-y-2 text-sm text-ink-300">
              <p className="font-display text-3xl font-bold text-white">{clock.minutes || 0} min</p>
              <p>Easy {form.settings.easy} × 10</p>
              <p>Medium {form.settings.medium} × 20</p>
              <p>Hard {form.settings.hard} × 35</p>
              {clock.capped && <p className="text-warn">Capped at 180 minutes.</p>}
              <p className="text-ink-500">Solo tests are private and do not change your rating.</p>
            </div>
          ) : (
            <ScoringRules compact />
          )}
        </div>
        <div className="card p-5 text-sm text-ink-400">
          <p className="mb-2 font-semibold text-white">Fresh problems for everyone</p>
          Each player can turn on <span className="text-ink-200">“Skip problems I’ve solved”</span> in the lobby. We then leave out
          anything they solved here, marked in Practice, or recently got accepted on LeetCode.
        </div>
      </aside>
    </div>
  );
}
