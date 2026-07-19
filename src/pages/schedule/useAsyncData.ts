import { useCallback, useEffect, useRef, useState } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * 通用 async 數據 hook（skeleton → content / ErrorState(retry 真 refetch)）。
 * - fetcher 每次 attempt 改變時重新執行（retry = 真實重新請求）。
 * - refetchSilent：live 自動更新用，唔會觸發 loading skeleton。
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, deps: readonly unknown[] = []) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });
  const [attempt, setAttempt] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ data: s.data, loading: true, error: null }));
    fetcherRef.current().then(
      (data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      },
      (err: unknown) => {
        if (!cancelled) {
          setState({ data: null, loading: false, error: err instanceof Error ? err.message : String(err) });
        }
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, ...deps]);

  /** 真實 retry — 重新執行 fetch cycle（ErrorState 用） */
  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  /** 靜默更新（live polling）：保留現有內容，唔入 skeleton */
  const refetchSilent = useCallback(() => {
    fetcherRef.current().then(
      (data) => setState({ data, loading: false, error: null }),
      () => {
        /* 靜默失敗：保留舊數據，下個 cycle 再試 */
      },
    );
  }, []);

  return { ...state, retry, refetchSilent };
}
