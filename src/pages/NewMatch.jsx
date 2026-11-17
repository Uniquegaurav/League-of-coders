import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, Link2, Swords } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import MatchSettingsForm, { DEFAULT_SETTINGS } from '../components/match/MatchSettingsForm';
import ScoringRules from '../components/match/ScoringRules';
import { soloClock } from '../lib/soloTime';
import { Spinner } from '../components/ui';

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
  const canSubmit = user?.leetcode?.verified && total >= 1 && total <= 10 && !submitting;

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { match } = await api.matches.create(form);
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
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <form onSubmit={submit} className="card p-6 sm:p-8">
        <div className="mb-8">
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
          <h1 className="font-display text-3xl font-bold text-white">{solo ? 'Set up your test' : 'Set up your battle'}</h1>
          <p className="mt-1 text-ink-400">
            {solo
              ? `Clock is ${clock.minutes || 0} min from this mix. Easy is 10, medium is 20, hard is 35. Problems stay hidden until you start.`
              : 'Problems are drawn and shuffled when you press start. Nobody sees them early.'}
          </p>
        </div>

        {!user?.leetcode?.verified && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-medium/30 bg-medium/5 p-4">
            <p className="flex items-center gap-2 text-sm text-ink-200">
              <Link2 className="h-4 w-4 text-medium" /> {user?.leetcode ? 'Verify your LeetCode account before hosting.' : 'Link your LeetCode account before hosting.'}
            </p>
            <Link to="/u/me" className="btn-secondary btn-sm">
              {user?.leetcode ? 'Verify now' : 'Link now'} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        <MatchSettingsForm value={form} onChange={setForm} />

        <div className="mt-8 flex justify-end">
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
              {clock.capped && <p className="text-medium">Capped at 180 minutes.</p>}
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
