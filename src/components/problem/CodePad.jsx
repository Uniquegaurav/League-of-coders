import { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Check, Copy, ExternalLink, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { leetcodeUrl } from '../../lib/format';
import { Spinner } from '../ui';

const PREFERRED = ['python3', 'cpp', 'java', 'javascript', 'typescript', 'golang', 'rust', 'csharp', 'kotlin', 'swift', 'c'];
const MONACO_LANG = { python3: 'python', python: 'python', cpp: 'cpp', c: 'c', java: 'java', javascript: 'javascript', typescript: 'typescript', golang: 'go', rust: 'rust', csharp: 'csharp', kotlin: 'kotlin', swift: 'swift', php: 'php', ruby: 'ruby', scala: 'scala' };
const LANG_KEY = 'loc.lang';

/**
 * A scratchpad pre-filled with LeetCode's starter code. Code is kept per problem in localStorage.
 * Submissions still happen on LeetCode (it has the judge); we pick up the verdict automatically.
 */
export default function CodePad({ slug, snippets = [], storageScope = 'practice' }) {
  const options = useMemo(
    () => [...snippets].sort((a, b) => (PREFERRED.indexOf(a.langSlug) + 1 || 99) - (PREFERRED.indexOf(b.langSlug) + 1 || 99)),
    [snippets]
  );
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || 'python3');
  const active = options.find((o) => o.langSlug === lang) || options[0];
  const storageKey = active ? `loc.code.${storageScope}.${slug}.${active.langSlug}` : null;
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!active) return;
    setCode(localStorage.getItem(storageKey) ?? active.code);
  }, [storageKey, active]);

  useEffect(() => {
    if (!storageKey) return undefined;
    const id = setTimeout(() => localStorage.setItem(storageKey, code), 400);
    return () => clearTimeout(id);
  }, [code, storageKey]);

  if (!options.length) {
    return <p className="p-4 text-sm text-ink-400">No starter code available for this problem.</p>;
  }

  const copyAndOpen = async (open) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      if (!open) toast.success('Code copied');
    } catch {
      toast.error('Could not access the clipboard');
    }
    if (open) window.open(leetcodeUrl(slug), '_blank', 'noopener');
  };

  return (
    <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-ink-700 bg-[#1e1e1e]">
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-700 bg-ink-900 px-3 py-2">
        <select
          value={active.langSlug}
          onChange={(e) => {
            setLang(e.target.value);
            localStorage.setItem(LANG_KEY, e.target.value);
          }}
          className="rounded-lg border border-ink-700 bg-ink-950 px-2 py-1 text-xs text-ink-200 focus:outline-none"
        >
          {options.map((o) => (
            <option key={o.langSlug} value={o.langSlug}>
              {o.lang}
            </option>
          ))}
        </select>
        <button
          className="btn-ghost btn-sm"
          title="Reset to starter code"
          onClick={() => {
            setCode(active.code);
            toast('Reset to starter code');
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <div className="ml-auto flex gap-2">
          <button className="btn-secondary btn-sm" onClick={() => copyAndOpen(false)}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy
          </button>
          <button className="btn-primary btn-sm" onClick={() => copyAndOpen(true)}>
            Copy & submit on LeetCode <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <Editor
          theme="vs-dark"
          language={MONACO_LANG[active.langSlug] || 'plaintext'}
          value={code}
          onChange={(v) => setCode(v ?? '')}
          loading={<Spinner className="h-6 w-6 text-ink-500" />}
          options={{
            fontSize: 14,
            fontFamily: 'JetBrains Mono, monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            tabSize: 4,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
