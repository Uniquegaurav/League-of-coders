import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import useProblem from '../components/problem/useProblem';
import ProblemStatement from '../components/problem/ProblemStatement';
import CodePad from '../components/problem/CodePad';

export default function ProblemPage() {
  const { slug } = useParams();
  const { problem, loading, error } = useProblem(slug);

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
    <div className="space-y-4">
      <Link to="/practice" className="inline-flex items-center gap-1 text-sm text-ink-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to practice
      </Link>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card p-6">
          <ProblemStatement slug={slug} problem={problem} loading={loading} error={error} />
        </div>
        <div className="h-[75vh] xl:sticky xl:top-24">{problem && <CodePad slug={slug} snippets={problem.snippets} />}</div>
      </div>
    </div>
  );
}
