import { useCallback, useEffect, useRef, useState } from 'react';

// Fetches immediately, then every `intervalMs` while the tab is visible.
export default function usePolling(fetcher, intervalMs = 0, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const latest = useRef(0); // only the newest request may update state (tabs can switch mid-request)

  const load = useCallback(async () => {
    const id = ++latest.current;
    try {
      const next = await fetcherRef.current();
      if (id !== latest.current) return;
      setData(next);
      setError(null);
    } catch (err) {
      if (id === latest.current) setError(err);
    } finally {
      if (id === latest.current) setLoading(false);
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
