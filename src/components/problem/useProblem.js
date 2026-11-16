import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const cache = new Map();

export default function useProblem(slug) {
  const [state, setState] = useState(() => ({ problem: cache.get(slug) || null, error: null, loading: !cache.has(slug) }));

  useEffect(() => {
    if (!slug) return undefined;
    if (cache.has(slug)) {
      setState({ problem: cache.get(slug), error: null, loading: false });
      return undefined;
    }
    let cancelled = false;
    setState({ problem: null, error: null, loading: true });
    api.problems
      .get(slug)
      .then(({ problem }) => {
        cache.set(slug, problem);
        if (!cancelled) setState({ problem, error: null, loading: false });
      })
      .catch((error) => !cancelled && setState({ problem: null, error, loading: false }));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return state;
}
