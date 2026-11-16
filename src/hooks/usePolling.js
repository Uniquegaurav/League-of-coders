import { useCallback, useEffect, useRef, useState } from 'react';

// Fetches immediately, then every `intervalMs` while the tab is visible.
export default function usePolling(fetcher, intervalMs = 0, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    try {
      setData(await fetcherRef.current());
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load();
    if (!intervalMs) return undefined;
    const id = setInterval(() => document.visibilityState === 'visible' && load(), intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, intervalMs, ...deps]);

  return { data, error, loading, reload: load, setData };
}
