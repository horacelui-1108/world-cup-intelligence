import { useCallback, useEffect, useState } from 'react';

/**
 * Simulated async fetch for the home page's local mock. Kept deliberately
 * thin: the data-layer agent will swap this for the real provider adapter
 * hook (same { loading, error, retry } contract).
 */
export function useHomeData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      try {
        // mock module is statically imported; "fetch" always succeeds
        setLoading(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      }
    }, 700);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [attempt]);

  /** genuine retry — re-runs the fetch cycle */
  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setAttempt((a) => a + 1);
  }, []);

  return { loading, error, retry };
}
