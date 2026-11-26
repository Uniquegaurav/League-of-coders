import clsx from 'clsx';
import { ChevronDown, ChevronUp, CircleAlert, CircleCheck, Clock } from 'lucide-react';
import { Spinner } from '../ui';

const STATUS = {
  ok: { label: 'Ran successfully', icon: CircleCheck, tone: 'text-easy' },
  compile_error: { label: 'Compilation error', icon: CircleAlert, tone: 'text-hard' },
  runtime_error: { label: 'Runtime error', icon: CircleAlert, tone: 'text-hard' },
  timeout: { label: 'Time limit exceeded', icon: Clock, tone: 'text-warn' },
  error: { label: 'Could not run', icon: CircleAlert, tone: 'text-warn' },
};

function Output({ result, running }) {
  if (running) {
    return (
      <p className="flex items-center gap-2 text-sm text-ink-400">
        <Spinner className="h-4 w-4" /> Compiling and running…
      </p>
    );
  }
  if (!result) {
    return (
      <p className="text-sm text-ink-500">
        Run compiles your code and runs it. Add a <code className="text-ink-300">main</code> or print statements to see output; type test input in Input.
      </p>
    );
  }
  const s = STATUS[result.status] || STATUS.error;
  const Icon = s.icon;
  const details = result.status === 'compile_error' ? result.compileOutput : result.stderr || result.message;
  return (
    <div className="space-y-3">
      <p className={clsx('flex items-center gap-2 text-sm font-semibold', s.tone)}>
        <Icon className="h-4 w-4" /> {result.status === 'ok' && !result.stdout ? 'Compiled successfully' : s.label}
        {result.time != null && result.status === 'ok' && <span className="font-mono text-xs font-normal text-ink-500">{(result.time * 1000).toFixed(0)} ms</span>}
      </p>
      {result.stdout && (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-500">Output</p>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-black/30 p-3 font-mono text-xs text-ink-100">{result.stdout}</pre>
        </div>
      )}
      {details && (
        <pre className={clsx('max-h-56 overflow-auto whitespace-pre-wrap rounded-lg p-3 font-mono text-xs', result.status === 'ok' ? 'bg-black/30 text-ink-300' : 'bg-hard/10 text-hard')}>{details}</pre>
      )}
    </div>
  );
}

/** Bottom panel of the editor: custom input and the result of the last run. */
export default function RunConsole({ open, onToggle, tab, onTab, stdin, onStdin, result, running }) {
  const s = result && !running ? STATUS[result.status] || STATUS.error : null;
  return (
    <div className={clsx('flex shrink-0 flex-col border-t border-ink-700 bg-ink-900', open ? 'h-[42%] min-h-[180px]' : 'h-10')}>
      <div className="flex h-10 shrink-0 items-center gap-1 px-2">
        {['input', 'output'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              onTab(t);
              if (!open) onToggle();
            }}
            className={clsx('rounded-lg px-3 py-1 text-xs font-medium capitalize transition', open && tab === t ? 'bg-white/[0.08] text-white' : 'text-ink-400 hover:text-white')}
          >
            {t}
          </button>
        ))}
        {s && (
          <span className={clsx('ml-2 truncate text-xs', s.tone)}>{result.status === 'ok' && !result.stdout ? 'Compiled successfully' : s.label}</span>
        )}
        {running && <Spinner className="ml-2 h-3.5 w-3.5 text-ink-400" />}
        <button type="button" className="ml-auto rounded-md p-1.5 text-ink-400 hover:bg-white/[0.06] hover:text-white" onClick={onToggle} aria-label={open ? 'Hide console' : 'Show console'} title={open ? 'Hide console' : 'Show console'}>
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <div className="min-h-0 flex-1 overflow-auto px-3 pb-3">
          {tab === 'input' ? (
            <textarea
              className="h-full min-h-[100px] w-full resize-none rounded-lg border border-ink-700 bg-black/30 p-3 font-mono text-xs text-ink-100 placeholder:text-ink-600 focus:border-brand-500 focus:outline-none"
              placeholder="Input for your program (stdin)"
              spellCheck={false}
              value={stdin}
              onChange={(e) => onStdin(e.target.value)}
              aria-label="Program input"
            />
          ) : (
            <Output result={result} running={running} />
          )}
        </div>
      )}
    </div>
  );
}
