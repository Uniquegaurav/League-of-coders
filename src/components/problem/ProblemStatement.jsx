import { useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { ChevronDown, ExternalLink, Lightbulb } from 'lucide-react';
import { leetcodeUrl } from '../../lib/format';
import { DifficultyBadge, PageLoader } from '../ui';

function Hints({ hints }) {
  const [open, setOpen] = useState(-1);
  if (!hints?.length) return null;
  return (
    <div className="mt-6 space-y-2">
      {hints.map((hint, i) => (
        <div key={i} className="rounded-xl border border-ink-700 bg-ink-950/40">
          <button className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-ink-300" onClick={() => setOpen(open === i ? -1 : i)}>
            <span className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-gold" /> Hint {i + 1}
            </span>
            <ChevronDown className={`h-4 w-4 transition ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && (
            <div className="problem-html border-t border-ink-800 px-4 py-2 text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(hint) }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ProblemStatement({ slug, problem, loading, error, header, label }) {
  const html = useMemo(() => (problem?.content ? DOMPurify.sanitize(problem.content) : ''), [problem?.content]);

  if (loading) return <PageLoader label="Loading problem…" />;
  if (error || !problem) {
    return (
      <div className="p-6 text-sm text-ink-400">
        Couldn't load this problem statement. You can still{' '}
        <a href={leetcodeUrl(slug)} target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">
          open it on LeetCode
        </a>
        .
      </div>
    );
  }

  return (
    <article>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {label && <span className="rounded-lg bg-brand-500/15 px-2 py-0.5 font-mono text-sm font-bold text-brand-400">{label}</span>}
        <h2 className="font-display text-2xl font-bold text-white">
          {problem.frontendId && <span className="text-ink-500">{problem.frontendId}. </span>}
          {problem.title}
        </h2>
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={problem.difficulty} />
        {problem.tags?.slice(0, 6).map((t) => (
          <span key={t} className="chip">
            {t}
          </span>
        ))}
        <a href={leetcodeUrl(slug)} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs text-ink-400 hover:text-white">
          View on LeetCode <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      {header}
      {html ? (
        <div className="problem-html" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p className="text-sm text-ink-400">This problem's statement isn't available through LeetCode's public API. Open it on LeetCode to read it.</p>
      )}
      <Hints hints={problem.hints} />
    </article>
  );
}
