import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, Link2, Swords } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import MatchSettingsForm, { DEFAULT_SETTINGS } from '../components/match/MatchSettingsForm';
import ScoringRules from '../components/match/ScoringRules';
import { Spinner } from '../components/ui';

const STORAGE_KEY = 'loc.lastMatchSettings';

export default function NewMatch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved ? { ...DEFAULT_SETTINGS, ...saved, name: '' } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'New battle · League of Coders';
  }, []);

  const total = form.settings.easy + form.settings.medium + form.settings.hard;
  const canSubmit = user?.leetcode && total >= 1 && total <= 10 && !submitting;

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { match } = await api.matches.create(form);
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
          <h1 className="font-display text-3xl font-bold text-white">Set up your battle</h1>
          <p className="mt-1 text-ink-400">Problems are drawn and shuffled on the server when you press start — nobody sees them early.</p>
        </div>

        {!user?.leetcode && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-medium/30 bg-medium/5 p-4">
            <p className="flex items-center gap-2 text-sm text-ink-200">
              <Link2 className="h-4 w-4 text-medium" /> Link your LeetCode username before hosting.
            </p>
            <Link to="/u/me" className="btn-secondary btn-sm">
              Link now <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        <MatchSettingsForm value={form} onChange={setForm} />

        <div className="mt-8 flex justify-end">
          <button type="submit" disabled={!canSubmit} className="btn-primary px-6 py-3 text-base">
            {submitting ? <Spinner className="h-5 w-5" /> : <Swords className="h-5 w-5" />}
            Create lobby
          </button>
        </div>
      </form>

      <aside className="space-y-4">
        <div className="card p-5">
          <p className="section-title mb-4">Scoring</p>
          <ScoringRules compact />
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
