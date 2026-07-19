import { useMemo } from 'react';
import type { Match, MatchStats } from '@/types/football';
import type { SourceMeta as UiSourceMeta } from '@/lib/types';
import EmptyState from '@/components/EmptyState';
import StatBar from '@/components/StatBar';
import DataStatusBadge from '@/components/DataStatusBadge';
import { relativePast } from '@/lib/format';
import { uiStatus } from '@/pages/schedule/model';

interface MetricDef {
  key: keyof MatchStats;
  label: string;
  format?: (v: number) => string;
  /** 固定比例尺（如百分比 0–100） */
  max?: number;
}

/** 展示順序依 match.md §5;xG 只喺 xg != null 時顯示 */
const METRICS: MetricDef[] = [
  { key: 'possession', label: '控球率', format: (v) => `${v}%`, max: 100 },
  { key: 'shots', label: '射門' },
  { key: 'shotsOnTarget', label: '射正' },
  { key: 'corners', label: '角球' },
  { key: 'fouls', label: '犯規' },
  { key: 'offsides', label: '越位' },
  { key: 'passAccuracy', label: '傳球成功率', format: (v) => `${v}%`, max: 100 },
  { key: 'yellowCards', label: '黃牌' },
  { key: 'redCards', label: '紅牌' },
  { key: 'xg', label: '預期入球 (xG)', format: (v) => v.toFixed(2) },
];

interface StatsTabProps {
  match: Match;
  meta: UiSourceMeta;
}

/**
 * match.md §5 — 數據統計：只渲染 provider 有提供嘅欄位(null/undefined → 整行省略);
 * 全無 stats → EmptyState「資料不足(Demo 數據未涵蓋)」。
 */
export default function StatsTab({ match, meta }: StatsTabProps) {
  const status = uiStatus(match.status);

  const rows = useMemo(() => {
    const stats = match.stats;
    if (!stats) return [];
    return METRICS.flatMap((m) => {
      const pair = stats[m.key];
      if (pair == null) return [];
      return [{ ...m, home: pair.home, away: pair.away }];
    });
  }, [match.stats]);

  if (status === 'scheduled' || status === 'postponed') {
    return (
      <EmptyState
        title={status === 'postponed' ? '比賽延期' : '比賽尚未開始'}
        description="數據統計將於開賽後更新。"
        ctaLabel="返回賽程"
        ctaHref="/schedule"
      />
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="資料不足"
        description="Demo 數據未涵蓋本場統計。"
      />
    );
  }

  const hasXG = match.stats?.xg != null;

  return (
    <div className="rounded-md border border-border bg-surface p-4 md:p-6">
      <div className="mx-auto max-w-2xl space-y-5">
        {rows.map((r) => (
          <StatBar
            key={r.key}
            label={r.label}
            valueA={r.home}
            valueB={r.away}
            max={r.max}
            format={r.format}
          />
        ))}
      </div>
      {!hasXG && (
        <p className="mt-5 text-center text-caption text-text-3">本場 xG 數據未由資料來源提供</p>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 border-t border-border pt-4 text-caption text-text-3">
        <span>
          數據:{meta.source} · 更新於 {relativePast(meta.lastUpdated)}
        </span>
        <DataStatusBadge status={meta.dataStatus} meta={meta} />
      </div>
    </div>
  );
}
