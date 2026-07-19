import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatInTimeZone } from 'date-fns-tz';
import { GitBranch, List } from 'lucide-react';
import DataStatusBadge from '@/components/DataStatusBadge';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { cn } from '@/lib/utils';
import { useTimezone } from '@/lib/timezone';
import BracketCanvas from '@/pages/bracket/BracketCanvas';
import BracketTextView from '@/pages/bracket/BracketTextView';
import FinalSpotlight from '@/pages/bracket/FinalSpotlight';
import { useBracketData } from '@/pages/bracket/useBracketData';
import { toBadgeMeta } from '@/pages/standings/badgeMeta';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** 樹形 skeleton：各輪節點位置放 shimmer 矩形 */
function BracketSkeleton() {
  const cols = [16, 8, 4, 2, 1];
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-bg p-4" aria-label="淘汰賽圖載入中">
      <div className="flex items-center gap-16">
        {cols.map((n, ci) => (
          <div key={ci} className={cn('flex w-[220px] shrink-0 flex-col justify-center gap-4', ci > 1 && 'max-md:hidden')}>
            {Array.from({ length: n }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-[88px] w-[220px] rounded-md" aria-hidden />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Bracket() {
  const { data, loading, error, retry } = useBracketData();
  const { timeZone, label: tzLabel } = useTimezone();
  const [view, setView] = useState<'canvas' | 'text'>('canvas');

  const lastUpdatedLabel = data
    ? `${formatInTimeZone(new Date(data.lastUpdated), timeZone, 'yyyy-MM-dd HH:mm')} ${tzLabel}`
    : '';

  // 賽期 caption：由 R32 首場至決賽推導；冇數據就用預設文案
  let rangeCaption = '32 隊單敗淘汰 · 2026年6月28日 – 7月19日';
  if (data?.layout) {
    const all = data.layout.rounds.flat().map((n) => n.match.kickoffUtc).sort();
    if (all.length > 0) {
      const f = (iso: string, withYear: boolean) =>
        formatInTimeZone(new Date(iso), timeZone, withYear ? 'yyyy年M月d日' : 'M月d日');
      const teams = (data.layout.rounds[0]?.length ?? 16) * 2;
      rangeCaption = `${teams} 隊單敗淘汰 · ${f(all[0], true)} – ${f(all[all.length - 1], false)}`;
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3"
      >
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">淘汰賽</h1>
          <p className="mt-1.5 text-sm text-text-2">{rangeCaption}</p>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          {data && (
            <DataStatusBadge
              status={toBadgeMeta(data.source, data.dataMode).dataStatus}
              meta={toBadgeMeta(data.source, data.dataMode)}
            />
          )}
          {data && <p className="text-caption text-text-3">最後更新:{lastUpdatedLabel}</p>}
        </div>
      </motion.header>

      {/* ── 視圖切換 ───────────────────────────────────────── */}
      {!loading && !error && data?.layout && (
        <div className="mt-5 flex items-center justify-end gap-1" role="group" aria-label="切換顯示方式">
          <button
            type="button"
            aria-pressed={view === 'canvas'}
            onClick={() => setView('canvas')}
            className={cn(
              'inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors duration-200',
              view === 'canvas'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-text-2 hover:border-border-strong hover:text-foreground',
            )}
          >
            <GitBranch className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            對陣圖
          </button>
          <button
            type="button"
            aria-pressed={view === 'text'}
            onClick={() => setView('text')}
            className={cn(
              'inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors duration-200',
              view === 'text'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-text-2 hover:border-border-strong hover:text-foreground',
            )}
          >
            <List className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            文字版
          </button>
        </div>
      )}

      {/* ── Content ────────────────────────────────────────── */}
      <div className="mt-4 space-y-8">
        {loading && <BracketSkeleton />}

        {!loading && error && <ErrorState error={error} onRetry={retry} />}

        {!loading && !error && data && !data.layout && (
          <EmptyState
            title="暫無淘汰賽資料"
            description="呢個賽事仲未有淘汰賽對陣數據，可以先去賽程睇最新比賽。"
            ctaLabel="前往賽程"
            ctaHref="/schedule"
          />
        )}

        {!loading && !error && data?.layout && (
          <>
            {view === 'canvas' ? (
              <BracketCanvas layout={data.layout} final={data.final} />
            ) : (
              <BracketTextView layout={data.layout} />
            )}
            {data.final && <FinalSpotlight final={data.final} />}
          </>
        )}
      </div>
    </div>
  );
}
