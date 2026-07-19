import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { formatInTimeZone } from 'date-fns-tz';
import { Trophy } from 'lucide-react';
import DataStatusBadge from '@/components/DataStatusBadge';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import FilterChip from '@/components/FilterChip';
import { TableSkeleton } from '@/components/Skeletons';
import { useTimezone } from '@/lib/timezone';
import GroupCard from '@/pages/standings/GroupCard';
import BestThirdsTable from '@/pages/standings/BestThirdsTable';
import RulesAccordion from '@/pages/standings/RulesAccordion';
import { toBadgeMeta } from '@/pages/standings/badgeMeta';
import { useStandingsData } from '@/pages/standings/useStandingsData';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Standings() {
  const { data, loading, error, retry } = useStandingsData();
  const { timeZone, label: tzLabel } = useTimezone();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const hashHandled = useRef(false);

  const groups = useMemo(() => data?.standings.map((g) => g.group) ?? [], [data]);
  const rawGroup = searchParams.get('group')?.toUpperCase() ?? '';
  const activeGroup = groups.some((g) => g === rawGroup) ? rawGroup : groups[0];
  const activeStanding = data?.standings.find((g) => g.group === activeGroup);

  const selectGroup = (g: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('group', g);
    setSearchParams(next);
  };

  // deep link：#/standings#rules 或 #best-thirds — 數據載入後捲動
  useEffect(() => {
    if (!data || hashHandled.current) return;
    if (location.hash === '#rules' || location.hash === '#best-thirds') {
      hashHandled.current = true;
      const id = location.hash.slice(1);
      window.setTimeout(() => scrollToId(id), 120);
    }
  }, [data, location.hash]);

  const lastUpdatedLabel = data
    ? `${formatInTimeZone(new Date(data.lastUpdated), timeZone, 'yyyy-MM-dd HH:mm')} ${tzLabel}`
    : '';

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
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">分組排名</h1>
          <p className="mt-1.5 text-sm text-text-2">48 隊 · 12 組 · 每組前兩名及 8 支最佳第三名晉級 32 強</p>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          {data && (
            <DataStatusBadge
              status={toBadgeMeta(data.source, data.dataMode).dataStatus}
              meta={toBadgeMeta(data.source, data.dataMode)}
            />
          )}
          {data && <p className="text-caption text-text-3">最後更新：{lastUpdatedLabel}</p>}
        </div>
      </motion.header>

      {/* ── Controls：組別 chips + 跳轉 chips ──────────────── */}
      {!loading && !error && data && data.standings.length > 0 && (
          <nav
            aria-label="選擇組別"
            className="sticky top-14 z-30 -mx-4 mt-5 overflow-x-auto border-b border-border bg-bg px-4 py-2.5 md:top-16 md:-mx-6 md:px-6"
          >
            <div className="flex w-max items-center gap-2">
              {groups.map((g) => (
                <span key={g} className="relative pb-1">
                  <FilterChip label={`${g} 組`} selected={g === activeGroup} onClick={() => selectGroup(g)} />
                  {g === activeGroup && (
                    <motion.span
                      layoutId="group-chip-underline"
                      transition={{ duration: 0.25, ease: EASE }}
                      className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent"
                      aria-hidden
                    />
                  )}
                </span>
              ))}
              <span aria-hidden className="mx-1 h-6 w-px bg-border" />
              <FilterChip label="最佳第三名" selected={false} onClick={() => scrollToId('best-thirds')} />
              <FilterChip label="排名規則" selected={false} onClick={() => scrollToId('rules')} />
            </div>
          </nav>
      )}

      {/* ── Content ────────────────────────────────────────── */}
      <div className="mt-6">
        {loading && (
          <div className="grid gap-5 lg:grid-cols-2">
            <TableSkeleton rows={4} />
            <TableSkeleton rows={4} className="hidden lg:block" />
            <TableSkeleton rows={12} className="lg:col-span-2" />
          </div>
        )}

        {!loading && error && (
          <ErrorState error={error} onRetry={retry} />
        )}

        {!loading && !error && data && data.standings.length === 0 && (
          <EmptyState
            title="本賽事不設分組賽"
            description="呢個賽事冇分組賽階段，可以直接前往淘汰賽圖睇最新對賽形勢。"
            ctaLabel="前往淘汰賽圖"
            ctaHref="/bracket"
          />
        )}

        {!loading && !error && data && activeStanding && (
          <div className="space-y-8">
            {/* 選定組別排名表 */}
            <motion.div
              key={activeStanding.group}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <GroupCard
                group={activeStanding.group}
                rows={activeStanding.rows}
                formMap={data.formMap}
                qualMap={data.qualMap}
              />
            </motion.div>

            {/* 最佳第三名 */}
            <div id="best-thirds" className="scroll-mt-32">
              <BestThirdsTable
                rows={data.bestThirds}
                qualMap={data.qualMap}
                resolved={data.thirdsResolved}
                onJumpToRules={() => scrollToId('rules')}
              />
            </div>

            {/* 同分排名規則 */}
            <section id="rules" aria-label="同分排名規則" className="scroll-mt-32">
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-gold" strokeWidth={1.5} aria-hidden />
                <h2 className="font-display text-lg font-semibold text-foreground">同分排名規則</h2>
              </div>
              <RulesAccordion
                sourceName={data.source.source}
                lastUpdatedLabel={lastUpdatedLabel}
                isDemo={data.dataMode === 'demo'}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
