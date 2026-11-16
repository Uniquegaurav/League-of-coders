import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Globe, Lock, Search } from 'lucide-react';
import { api } from '../../lib/api';
import { Stepper } from '../ui';
import { BASE_POINTS } from './ScoringRules';

const DURATIONS = [15, 30, 45, 60, 90, 120];

export const DEFAULT_SETTINGS = {
  name: '',
  visibility: 'public',
  settings: { durationMin: 45, easy: 1, medium: 2, hard: 0, pool: 'curated', topics: [], maxPlayers: 8 },
};

function Segmented({ value, onChange, options, disabled }) {
  return (
    <div className="inline-flex rounded-xl border border-ink-700 bg-ink-950/60 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition',
            value === o.value ? 'bg-ink-700 text-white' : 'text-ink-400 hover:text-ink-200'
          )}
        >
          {o.icon && <o.icon className="h-3.5 w-3.5" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function TopicPicker({ pool, selected, onChange, disabled }) {
  const [topics, setTopics] = useState([]);
  const [query, setQuery] = useState('');
  useEffect(() => {
    api.problems
      .topics(pool)
      .then((r) => setTopics(r.topics))
      .catch(() => setTopics([]));
  }, [pool]);

  const visible = topics.filter((t) => t.toLowerCase().includes(query.toLowerCase()));
  const toggle = (t) => onChange(selected.includes(t) ? selected.filter((x) => x !== t) : [...selected, t].slice(0, 12));

  return (
    <div>
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input className="input pl-9" placeholder="Filter topics…" value={query} onChange={(e) => setQuery(e.target.value)} disabled={disabled} />
      </div>
      <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto pr-1">
        {visible.map((t) => (
          <button
            type="button"
            key={t}
            disabled={disabled}
            onClick={() => toggle(t)}
            className={clsx(
              'rounded-full border px-2.5 py-1 text-xs font-medium transition',
              selected.includes(t) ? 'border-brand-500 bg-brand-500/20 text-white' : 'border-ink-700 text-ink-400 hover:border-ink-500 hover:text-ink-200'
            )}
          >
            {t}
          </button>
        ))}
        {!visible.length && <p className="text-xs text-ink-500">No topics found</p>}
      </div>
      <p className="mt-2 text-xs text-ink-500">{selected.length ? `${selected.length} selected — problems will match any of them` : 'No topic filter — any topic can appear'}</p>
    </div>
  );
}

export default function MatchSettingsForm({ value, onChange, disabled }) {
  const s = value.settings;
  const setSetting = (patch) => onChange({ ...value, settings: { ...s, ...patch } });
  const total = s.easy + s.medium + s.hard;
  const maxScore = s.easy * BASE_POINTS.Easy * 1.5 + s.medium * BASE_POINTS.Medium * 1.5 + s.hard * BASE_POINTS.Hard * 1.5;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <label className="label" htmlFor="match-name">
            Battle name
          </label>
          <input
            id="match-name"
            className="input"
            maxLength={60}
            placeholder="Friday night grind"
            value={value.name}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
        </div>
        <div>
          <span className="label">Visibility</span>
          <Segmented
            disabled={disabled}
            value={value.visibility}
            onChange={(visibility) => onChange({ ...value, visibility })}
            options={[
              { value: 'public', label: 'Public', icon: Globe },
              { value: 'private', label: 'Invite only', icon: Lock },
            ]}
          />
        </div>
      </div>

      <div>
        <span className="label">Duration</span>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              disabled={disabled}
              onClick={() => setSetting({ durationMin: d })}
              className={clsx(
                'rounded-xl border px-4 py-2 font-mono text-sm font-semibold transition',
                s.durationMin === d ? 'border-brand-500 bg-brand-500/15 text-white' : 'border-ink-700 text-ink-400 hover:border-ink-500'
              )}
            >
              {d}m
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="label">Problem mix</span>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['easy', 'Easy', 'text-easy'],
            ['medium', 'Medium', 'text-medium'],
            ['hard', 'Hard', 'text-hard'],
          ].map(([key, label, color]) => (
            <div key={key} className="flex items-center justify-between rounded-xl border border-ink-700 bg-ink-950/40 px-3 py-2">
              <span className={clsx('text-sm font-semibold', color)}>{label}</span>
              <Stepper value={s[key]} min={0} max={6} disabled={disabled} onChange={(v) => setSetting({ [key]: v })} />
            </div>
          ))}
        </div>
        <p className={clsx('mt-2 text-xs', total < 1 || total > 10 ? 'text-hard' : 'text-ink-500')}>
          {total} problem{total === 1 ? '' : 's'} · up to {Math.round(maxScore)} points available · pick 1–10
        </p>
      </div>

      <div>
        <span className="label">Question pool</span>
        <Segmented
          disabled={disabled}
          value={s.pool}
          onChange={(pool) => setSetting({ pool, topics: [] })}
          options={[
            { value: 'curated', label: 'Interview classics (170)' },
            { value: 'all', label: 'All free LeetCode' },
          ]}
        />
        <p className="mt-2 text-xs text-ink-500">
          {s.pool === 'curated'
            ? 'A hand-picked list of the most common interview problems (Blind 75 / Grind style).'
            : 'Any free problem from LeetCode’s full catalogue — expect surprises.'}
        </p>
      </div>

      <div>
        <span className="label">Topics (optional)</span>
        <TopicPicker pool={s.pool} selected={s.topics} disabled={disabled} onChange={(topics) => setSetting({ topics })} />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-ink-700 bg-ink-950/40 px-3 py-2">
        <div>
          <p className="text-sm font-semibold text-ink-200">Max players</p>
          <p className="text-xs text-ink-500">Including you</p>
        </div>
        <Stepper value={s.maxPlayers} min={2} max={20} disabled={disabled} onChange={(v) => setSetting({ maxPlayers: v })} />
      </div>
    </div>
  );
}
