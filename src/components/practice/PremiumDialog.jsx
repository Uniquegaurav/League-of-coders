import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { toast } from 'sonner';
import { Building2, Crown, KeyRound, Link2, LogOut, RefreshCw, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { track } from '../../lib/analytics';
import { InfoTip, Spinner } from '../ui';

function Dialog({ onClose, children, labelledBy }) {
  const panel = useRef(null);
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector('input, textarea, button')?.focus();
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-ink-950/80 p-4 backdrop-blur-sm sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={labelledBy} className="relative my-8 w-full max-w-lg rounded-3xl border border-ink-700 bg-ink-900 p-6 shadow-2xl">
        <button type="button" className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-400 hover:bg-white/[0.06] hover:text-white" aria-label="Close" onClick={onClose}>
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

function Redeem({ onDone }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.premium.redeem(code);
      track('premium_redeemed');
      toast.success('Premium unlocked');
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="label" htmlFor="premium-code">
        Premium code
      </label>
      <div className="flex gap-2">
        <input
          id="premium-code"
          className="input font-mono uppercase tracking-wider"
          placeholder="LOC-XXXX-XXXX-XXXX"
          autoComplete="off"
          spellCheck={false}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button className="btn-primary shrink-0" disabled={busy || code.replace(/[^a-z0-9]/gi, '').length < 8}>
          {busy ? <Spinner className="h-4 w-4" /> : 'Redeem'}
        </button>
      </div>
    </form>
  );
}

function Connect({ onDone }) {
  const [session, setSession] = useState('');
  const [csrf, setCsrf] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.premium.connect(session.trim(), csrf.trim() || undefined);
      toast.success(`Connected as ${r.premium.leetcode?.username || 'your LeetCode account'}`);
      if (!r.leetcodePremium) toast('This LeetCode account has no Premium, so company lists may come back empty.');
      setSession('');
      onDone(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex items-center gap-1">
        <label className="label mb-0" htmlFor="lc-session">
          LEETCODE_SESSION cookie
        </label>
        <InfoTip label="How to find your session cookie">
          Sign in on leetcode.com, open DevTools → Application → Cookies → https://leetcode.com, and copy the value of <code className="text-ink-100">LEETCODE_SESSION</code>.
          It is stored encrypted, used only to read your own lists, and never shown to anyone. Sessions expire after a few weeks; paste a fresh one then.
        </InfoTip>
      </div>
      <textarea
        id="lc-session"
        className="input h-20 resize-none font-mono text-xs"
        placeholder="eyJ0eXAiOiJKV1Qi…"
        spellCheck={false}
        autoComplete="off"
        value={session}
        onChange={(e) => setSession(e.target.value)}
      />
      <details className="text-xs text-ink-400">
        <summary className="cursor-pointer select-none hover:text-white">Optional: csrftoken</summary>
        <input className="input mt-2 font-mono text-xs" placeholder="csrftoken value" spellCheck={false} autoComplete="off" value={csrf} onChange={(e) => setCsrf(e.target.value)} />
      </details>
      <button className="btn-primary w-full" disabled={busy || session.trim().length < 40}>
        {busy ? <Spinner className="h-4 w-4" /> : (
          <>
            <Link2 className="h-4 w-4" /> Connect LeetCode
          </>
        )}
      </button>
    </form>
  );
}

function CompanyPicker({ companies, periods, onAdded }) {
  const [company, setCompany] = useState('google');
  const [other, setOther] = useState('');
  const [period, setPeriod] = useState('six-months');
  const [busy, setBusy] = useState(false);
  const slug = company === '__other' ? other.trim().toLowerCase().replace(/\s+/g, '-') : company;
  const add = async () => {
    setBusy(true);
    try {
      const { list } = await api.premium.addCompany(slug, period);
      track('premium_company_added', { company: slug });
      toast.success(`Added ${list.count} questions`);
      onAdded(list.key);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <select className="input" value={company} onChange={(e) => setCompany(e.target.value)} aria-label="Company">
          {companies.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
          <option value="__other">Other…</option>
        </select>
        <select className="input" value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Time period">
          {Object.entries(periods).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {company === '__other' && <input className="input" placeholder="Company name as on LeetCode, e.g. goldman-sachs" value={other} onChange={(e) => setOther(e.target.value)} />}
      <button type="button" className="btn-secondary w-full" disabled={busy || !slug} onClick={add}>
        {busy ? <Spinner className="h-4 w-4" /> : (
          <>
            <Building2 className="h-4 w-4" /> Add company list
          </>
        )}
      </button>
    </div>
  );
}

const ago = (d) => {
  if (!d) return 'never';
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} h ago` : `${Math.round(h / 24)} days ago`;
};

/** Redeem a code, connect your LeetCode session, import your lists and company lists. */
export default function PremiumDialog({ user, premiumLists, onClose, onChanged, onPick }) {
  const [status, setStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const active = user?.premium?.active;

  const load = () =>
    api.premium
      .status()
      .then(setStatus)
      .catch((err) => toast.error(err.message));
  useEffect(() => {
    load();
  }, [active]);

  const changed = async () => {
    await onChanged();
    await load();
  };
  const sync = async () => {
    setSyncing(true);
    try {
      const r = await api.premium.sync();
      toast.success(r.imported ? `Imported ${r.imported} list${r.imported === 1 ? '' : 's'} from LeetCode` : 'No lists found on your LeetCode account');
      await changed();
    } catch (err) {
      toast.error(err.message);
      await load();
    } finally {
      setSyncing(false);
    }
  };
  const disconnect = async () => {
    if (!window.confirm('Disconnect your LeetCode account? Imported lists stay.')) return;
    try {
      await api.premium.disconnect();
      await changed();
    } catch (err) {
      toast.error(err.message);
    }
  };
  const removeList = async (l) => {
    if (!window.confirm(`Remove "${l.name}"?`)) return;
    try {
      await api.lists.remove(l.key);
      await changed();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const lc = status?.premium?.leetcode;
  return (
    <Dialog onClose={onClose} labelledBy="premium-title">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/10 text-gold">
          <Crown className="h-5 w-5" />
        </span>
        <div>
          <h2 id="premium-title" className="font-display text-xl font-bold text-white">
            Premium
          </h2>
          <p className="text-sm text-ink-400">{active ? 'Your lists and company lists, only for you.' : 'Company lists and your own LeetCode lists.'}</p>
        </div>
      </div>

      {!active ? (
        <Redeem onDone={changed} />
      ) : !status ? (
        <div className="flex justify-center py-8">
          <Spinner className="h-5 w-5 text-ink-500" />
        </div>
      ) : (
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <KeyRound className="h-4 w-4 text-ink-400" /> LeetCode account
            </h3>
            {lc ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{lc.username || 'Connected'}</p>
                    <p className={clsx('text-xs', lc.status === 'expired' ? 'text-warn' : 'text-ink-400')}>
                      {lc.status === 'expired' ? 'Session expired. Paste a fresh one below.' : `Lists synced ${ago(lc.syncedAt)}`}
                    </p>
                  </div>
                  <button type="button" className="btn-ghost btn-sm text-ink-400" onClick={disconnect} title="Disconnect">
                    <LogOut className="h-3.5 w-3.5" /> Disconnect
                  </button>
                </div>
                {lc.status === 'expired' ? (
                  <Connect onDone={changed} />
                ) : (
                  <button type="button" className="btn-primary w-full" disabled={syncing} onClick={sync}>
                    {syncing ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />} {lc.syncedAt ? 'Sync my LeetCode lists' : 'Import my LeetCode lists'}
                  </button>
                )}
              </div>
            ) : (
              <Connect onDone={changed} />
            )}
          </section>

          {lc && lc.status !== 'expired' && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Building2 className="h-4 w-4 text-ink-400" /> Company lists
              </h3>
              <CompanyPicker companies={status.companies} periods={status.periods} onAdded={async (key) => {
                await changed();
                onPick(key);
              }} />
            </section>
          )}

          {premiumLists.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-white">Your premium lists</h3>
              <ul className="space-y-1">
                {premiumLists.map((l) => (
                  <li key={l.key} className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-white/[0.04]">
                    <button type="button" className="min-w-0 flex-1 truncate text-left text-ink-200 hover:text-white" onClick={() => onPick(l.key)}>
                      {l.name}
                    </button>
                    <span className="font-mono text-[11px] text-ink-500">{l.count}</span>
                    <button type="button" className="rounded-md p-1 text-ink-500 hover:text-hard" title="Remove list" aria-label={`Remove ${l.name}`} onClick={() => removeList(l)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </Dialog>
  );
}
