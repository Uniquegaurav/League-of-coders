import { useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Check, Copy, ExternalLink, Play, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { load } from '../../lib/cache';
import { leetcodeUrl } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui';
import RunConsole from './RunConsole';

// The languages most people use, in menu order. C++ is the default.
const LANGUAGES = ['cpp', 'java', 'python3', 'javascript', 'kotlin'];
const MONACO_LANG = { python3: 'python', python: 'python', cpp: 'cpp', c: 'c', java: 'java', javascript: 'javascript', typescript: 'typescript', golang: 'go', rust: 'rust', csharp: 'csharp', kotlin: 'kotlin', swift: 'swift', php: 'php', ruby: 'ruby', scala: 'scala' };
const LANG_KEY = 'loc.lang';

/**
 * A scratchpad pre-filled with LeetCode's starter code. Code is kept per problem in localStorage.
 * Run compiles and runs the code on our sandboxed runner (errors are underlined in the editor);
 * submissions still happen on LeetCode (it has the tests); we pick up the verdict automatically.
 */
export default function CodePad({ slug, snippets = [], storageScope = 'practice' }) {
  const options = useMemo(
    () => LANGUAGES.map((slug) => snippets.find((s) => s.langSlug === slug)).filter(Boolean),
    [snippets]
  );
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || 'cpp');
  const active = options.find((o) => o.langSlug === lang) || options[0];
  const storageKey = active ? `loc.code.${storageScope}.${slug}.${active.langSlug}` : null;
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  // null = available; otherwise the reason Run is off (not configured, or today's free runs are used up).
  const [runOff, setRunOff] = useState(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleTab, setConsoleTab] = useState('output');
  const stdinKey = `loc.stdin.${slug}`;
  const [stdin, setStdin] = useState(() => localStorage.getItem(stdinKey) || '');
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const runRef = useRef(() => {});

  useEffect(() => {
    load('run:status', () => api.run.status(), { ttl: 10 * 60000 })
      .then((r) => setRunOff(!r.enabled ? "Running code isn't set up on the server yet" : r.paused ? "Today's free runs are used up. Copy your code to LeetCode to run it." : null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setStdin(localStorage.getItem(stdinKey) || '');
    setResult(null);
  }, [stdinKey]);

  useEffect(() => {
    const id = setTimeout(() => localStorage.setItem(stdinKey, stdin), 400);
    return () => clearTimeout(id);
  }, [stdin, stdinKey]);

  // Underline compile / runtime errors on the lines they point at.
  const setMarkers = (markers = []) => {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel();
    if (!monaco || !model) return;
    monaco.editor.setModelMarkers(
      model,
      'run',
      markers.map((m) => ({
        startLineNumber: m.line,
        endLineNumber: m.line,
        startColumn: m.column,
        endColumn: model.getLineMaxColumn(Math.min(m.line, model.getLineCount())),
        message: m.message,
        severity: monaco.MarkerSeverity.Error,
      }))
    );
  };

  const runCode = async () => {
    if (running || !active) return;
    if (!user) {
      toast('Sign in to run code', { action: { label: 'Sign in', onClick: () => navigate('/login', { state: { from: window.location.pathname } }) } });
      return;
    }
    setRunning(true);
    setConsoleOpen(true);
    setConsoleTab('output');
    setMarkers([]);
    try {
      const r = await api.run.exec(active.langSlug, code, stdin);
      setResult(r);
      setMarkers(r.markers);
    } catch (err) {
      setResult({ status: 'error', message: err.message });
      if (/paused for today/.test(err.message)) setRunOff(err.message);
    } finally {
      setRunning(false);
    }
  };
  runRef.current = runCode;

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
          className="input w-auto py-1.5 pl-3 text-xs"
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
          <button className="btn-ghost btn-sm" title="Copy code" aria-label="Copy code" onClick={() => copyAndOpen(false)}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            className="btn-secondary btn-sm"
            onClick={runCode}
            disabled={running || !!runOff}
            title={runOff || 'Compile and run (Ctrl/⌘ + Enter)'}
          >
            {running ? <Spinner className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />} Run
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
          onChange={(v) => {
            setCode(v ?? '');
            if (result?.markers?.length) setMarkers([]);
          }}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current());
          }}
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
      <RunConsole
        open={consoleOpen}
        onToggle={() => setConsoleOpen((o) => !o)}
        tab={consoleTab}
        onTab={setConsoleTab}
        stdin={stdin}
        onStdin={setStdin}
        result={result}
        running={running}
      />
    </div>
  );
}
