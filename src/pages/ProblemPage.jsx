import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowLeft, Code2, FileText } from 'lucide-react';
import useProblem from '../components/problem/useProblem';
import ProblemStatement from '../components/problem/ProblemStatement';
import CodePad from '../components/problem/CodePad';
import SplitHandle from '../components/problem/SplitHandle';
import usePref from '../hooks/usePref';

export default function ProblemPage() {
  const { slug } = useParams();
  const { problem, loading, error } = useProblem(slug);
  const [tab, setTab] = useState('statement');
  const [split, setSplit] = usePref('loc.practice.split', 50);
  const splitRef = useRef(null);

  useEffect(() => {
    if (problem) document.title = `${problem.title} · League of Coders`;
  }, [problem]);

  // Problem statements are LeetCode's content. Keep them out of search results (duplicate content, and not ours to rank).
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, follow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <div className="flex flex-col lg:h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-1 border-b border-ink-800 px-3 py-2">
        <Link to="/practice" className="btn-ghost btn-sm text-ink-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to practice
        </Link>
        <div className="ml-auto flex items-center gap-1 xl:hidden">
          {[
            ['statement', 'Problem', FileText],
            ['code', 'Code', Code2],
          ].map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)} className={clsx('btn-sm btn', tab === key ? 'bg-ink-800 text-white' : 'text-ink-400')}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>
      <div ref={splitRef} className="flex min-h-0 flex-1 flex-col xl:flex-row" style={{ '--split': `${split}%` }}>
        <div
          className={clsx(
            'min-h-0 min-w-0 p-4 sm:p-6 lg:overflow-y-auto xl:w-[var(--split)] xl:shrink-0',
            tab !== 'statement' && 'hidden xl:block',
            split === 0 && 'xl:hidden'
          )}
        >
          <ProblemStatement slug={slug} problem={problem} loading={loading} error={error} />
        </div>
        <SplitHandle containerRef={splitRef} split={split} onChange={setSplit} />
        <div className={clsx('h-[70vh] min-h-0 min-w-0 p-3 lg:h-auto lg:flex-1', tab !== 'code' && 'hidden xl:block', split === 100 && 'xl:hidden')}>
          {problem && <CodePad slug={slug} snippets={problem.snippets} />}
        </div>
      </div>
    </div>
  );
}
