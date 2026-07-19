import { useCallback, useEffect, useMemo, useState } from 'react';
import { getProvider } from '@/lib/provider';
import type { DataMode, Match, SourceMeta, Stage } from '@/types/football';
import { buildLayout, ROUND_ORDER, type BracketLayout } from '@/pages/bracket/bracketModel';

export interface BracketData {
  /** null = 呢個賽事冇淘汰賽數據 */
  layout: BracketLayout | null;
  final?: Match;
  thirdPlace?: Match;
  source: SourceMeta;
  dataMode: DataMode;
  lastUpdated: string;
}

/**
 * 載入淘汰賽樹：優先用 provider.getBracket()；
 * 如果 rounds 為空（provider 冇整 bracket），就由 getMatches() 推導。
 */
export function useBracketData() {
  const [data, setData] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const provider = getProvider();

    async function load(): Promise<BracketData> {
      const bracketRes = await provider.getBracket();
      let byStage = new Map<Stage, Match[]>();
      for (const round of bracketRes.data.rounds) {
        byStage.set(round.stage, round.matches);
      }
      let final = bracketRes.data.final;
      let thirdPlace = bracketRes.data.thirdPlace;

      // fallback：bracket 為空時由 matches 推導
      const hasAny = ROUND_ORDER.some((s) => (byStage.get(s) ?? []).length > 0);
      if (!hasAny) {
        const matchesRes = await provider.getMatches();
        byStage = new Map();
        for (const m of matchesRes.data) {
          if (m.stage === 'GROUP') continue;
          const arr = byStage.get(m.stage) ?? [];
          arr.push(m);
          byStage.set(m.stage, arr);
        }
        final = final ?? matchesRes.data.find((m) => m.stage === 'F');
        thirdPlace = thirdPlace ?? matchesRes.data.find((m) => m.stage === '3P');
      }

      const layout = buildLayout(
        ROUND_ORDER.map((stage) => ({
          rounds: byStage.get(stage) ?? [],
          thirdPlace: stage === 'F' ? thirdPlace : undefined,
        })),
      );

      return {
        layout: layout && layout.rounds.some((r) => r.length > 0) ? layout : null,
        final,
        thirdPlace,
        source: bracketRes.source,
        dataMode: bracketRes.dataMode,
        lastUpdated: bracketRes.lastUpdated,
      };
    }

    load()
      .then((out) => {
        if (cancelled) return;
        setData(out);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  /** 真實重試 — 重新查詢 provider */
  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setAttempt((a) => a + 1);
  }, []);

  return useMemo(() => ({ data, loading, error, retry }), [data, loading, error, retry]);
}
