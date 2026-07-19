/**
 * 首頁數據 hook — 接駁真實 data provider 層（getProvider()）。
 *
 * 每個 section 一條獨立 async slice：各自 loading → content / ErrorState，
 * retry 會真 refetch（唔係重置本地 state）；一個 section 失敗唔會影響其他。
 *
 * slices:
 * - matches  — getMatches()      → hero 決賽倒數 / 今日比賽 / 下一場 / 最新賽果
 * - trending — getMatches() + getTopScorers() → 熱門球隊（四強 + form + 射手 stat）
 * - analyses — listAnalyses() + getMatches()  → 最新賽後分析（join 賽事做標題）
 * - news     — getNews() + getMatches()       → 賽事重要消息（7 條）
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { getProvider } from '@/lib/provider';
import {
  buildAnalysisCards,
  buildHomeMatches,
  buildNewsCards,
  buildTrending,
  toUiDataStatus,
  toUiMeta,
  type AnalysisCardData,
  type HomeMatchesData,
  type NewsCardData,
  type TrendingData,
} from './adapters';

export interface AsyncSlice<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** 真 refetch：重新執行 fetch cycle */
  retry: () => void;
}

function useAsyncSlice<T>(fetcher: () => Promise<T>): AsyncSlice<T> {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({
    data: null,
    loading: true,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);
  const fetcherRef = useRef(fetcher);

  // 更新 ref 只可以喺 effect 做（react-hooks/refs）
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;
    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setState({ data: null, loading: false, error: e instanceof Error ? e.message : String(e) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  /** 真 refetch：重置 loading 並重新執行 fetch cycle */
  const retry = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    setAttempt((a) => a + 1);
  }, []);
  return { ...state, retry };
}

export interface HomeData {
  matches: AsyncSlice<HomeMatchesData>;
  trending: AsyncSlice<TrendingData>;
  analyses: AsyncSlice<AnalysisCardData[]>;
  news: AsyncSlice<NewsCardData[]>;
}

export function useHomeData(): HomeData {
  const matches = useAsyncSlice(async () => {
    const provider = getProvider();
    const res = await provider.getMatches();
    return buildHomeMatches(res.data, { dataMode: res.dataMode, lastUpdated: res.lastUpdated, source: res.source });
  });

  const trending = useAsyncSlice(async () => {
    const provider = getProvider();
    const [matchesRes, scorersRes] = await Promise.all([provider.getMatches(), provider.getTopScorers()]);
    return {
      teams: buildTrending(matchesRes.data, scorersRes.data),
      status: toUiDataStatus(scorersRes.dataMode, scorersRes.source.dataStatus),
      meta: toUiMeta(scorersRes.source, scorersRes.lastUpdated, scorersRes.dataMode),
    };
  });

  const analyses = useAsyncSlice(async () => {
    const provider = getProvider();
    const [analysesRes, matchesRes] = await Promise.all([provider.listAnalyses(), provider.getMatches()]);
    return buildAnalysisCards(analysesRes.data, matchesRes.data, analysesRes.dataMode);
  });

  const news = useAsyncSlice(async () => {
    const provider = getProvider();
    const [newsRes, matchesRes] = await Promise.all([provider.getNews(), provider.getMatches()]);
    const finalId = matchesRes.data.find((m) => m.stage === 'F')?.matchId ?? null;
    return buildNewsCards(newsRes.data, newsRes.dataMode, finalId);
  });

  return { matches, trending, analyses, news };
}
