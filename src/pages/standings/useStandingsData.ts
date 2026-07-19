import { useCallback, useEffect, useMemo, useState } from 'react';
import { getProvider } from '@/lib/provider';
import { computeBestThirds, type GroupStanding, type StandingRow } from '@/lib/standings';
import type { DataMode, Match, SourceMeta } from '@/types/football';
import type { FormResult } from '@/components/TeamChip';

export type QualStatus = 'auto' | 'best-third' | 'out' | 'pending';

export interface StandingsData {
  standings: GroupStanding[];
  bestThirds: StandingRow[];
  /** teamId → 近績（最舊 → 最新），只計已完場分組賽 */
  formMap: ReadonlyMap<string, FormResult[]>;
  /** teamId → 晉級狀態（按真實賽果推導） */
  qualMap: ReadonlyMap<string, QualStatus>;
  /** 每組賽事是否全部完場（名次已定） */
  groupComplete: ReadonlyMap<string, boolean>;
  /** 最佳第三名比較是否已完全解出（12 組全部完場） */
  thirdsResolved: boolean;
  source: SourceMeta;
  dataMode: DataMode;
  lastUpdated: string;
}

/** 由各隊分組賽賽果推導近績（最舊 → 最新） */
function buildFormMap(matches: Match[]): Map<string, FormResult[]> {
  const sorted = [...matches]
    .filter((m) => m.stage === 'GROUP' && m.status === 'ft')
    .sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc));
  const map = new Map<string, FormResult[]>();
  const push = (teamId: string, r: FormResult) => {
    const arr = map.get(teamId) ?? [];
    arr.push(r);
    map.set(teamId, arr);
  };
  for (const m of sorted) {
    const { home, away } = m.score;
    if (home === away) {
      push(m.homeTeamId, 'D');
      push(m.awayTeamId, 'D');
    } else if (home > away) {
      push(m.homeTeamId, 'W');
      push(m.awayTeamId, 'L');
    } else {
      push(m.homeTeamId, 'L');
      push(m.awayTeamId, 'W');
    }
  }
  return map;
}

function deriveQualification(
  standings: GroupStanding[],
  bestThirds: StandingRow[],
  groupComplete: ReadonlyMap<string, boolean>,
): { qualMap: Map<string, QualStatus>; thirdsResolved: boolean } {
  const thirdsResolved = standings.every((g) => groupComplete.get(g.group));
  const qualifiedThirds = new Set(
    bestThirds.filter((r) => r.qualification === 'best-third').map((r) => r.teamId),
  );
  const qualMap = new Map<string, QualStatus>();
  for (const g of standings) {
    const complete = groupComplete.get(g.group) ?? false;
    for (const row of g.rows) {
      if (!complete) {
        qualMap.set(row.teamId, 'pending');
      } else if (row.position <= 2) {
        qualMap.set(row.teamId, 'auto');
      } else if (row.position === 3) {
        qualMap.set(
          row.teamId,
          thirdsResolved ? (qualifiedThirds.has(row.teamId) ? 'best-third' : 'out') : 'pending',
        );
      } else {
        qualMap.set(row.teamId, 'out');
      }
    }
  }
  return { qualMap, thirdsResolved };
}

export function useStandingsData() {
  const [data, setData] = useState<StandingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const provider = getProvider();
    Promise.all([provider.getStandings(), provider.getMatches({ stage: 'GROUP' })])
      .then(([standingsRes, matchesRes]) => {
        if (cancelled) return;
        const standings = standingsRes.data;
        const bestThirds = computeBestThirds(standings);
        const formMap = buildFormMap(matchesRes.data);
        // 一組 4 隊每隊 3 場 = 12 隊次出場；全部完場即名次確定
        const groupComplete = new Map<string, boolean>(
          standings.map((g) => [g.group, g.rows.reduce((sum, r) => sum + r.played, 0) >= 12]),
        );
        const { qualMap, thirdsResolved } = deriveQualification(standings, bestThirds, groupComplete);
        setData({
          standings,
          bestThirds,
          formMap,
          qualMap,
          groupComplete,
          thirdsResolved,
          source: standingsRes.source,
          dataMode: standingsRes.dataMode,
          lastUpdated: standingsRes.lastUpdated,
        });
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

  /** 真實重試 — 重新執行 provider 查詢 */
  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setAttempt((a) => a + 1);
  }, []);

  return useMemo(() => ({ data, loading, error, retry }), [data, loading, error, retry]);
}
