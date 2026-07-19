import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import type { Match, Tournament } from '@/types/football';
import type { SourceMeta } from '@/lib/types';
import { getProvider } from '@/lib/provider';
import { relativePast } from '@/lib/format';
import DataStatusBadge from '@/components/DataStatusBadge';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { MatchRowSkeleton } from '@/components/Skeletons';
import ScheduleFilterBar from './schedule/ScheduleFilterBar';
import type { StatusCounts } from './schedule/ScheduleFilterBar';
import DateView from './schedule/DateView';
import GroupView from './schedule/GroupView';
import { teamOf, toUiMeta, uiStatus, venueOf } from './schedule/model';
import type { ScheduleFilters } from './schedule/filters';
import { DEFAULT_FILTERS, filtersFromParams, hasActiveFilters, paramsFromFilters } from './schedule/filters';
import { useAsyncData } from './schedule/useAsyncData';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface ScheduleData {
  matches: Match[];
  tournament: Tournament;
  meta: SourceMeta;
  lastUpdated: string;
  dataMode: 'live' | 'demo';
}

/** 搜尋：隊名（中/英/code）、球場、城市 */
function matchSearchable(m: Match): string {
  const home = teamOf(m.homeTeamId);
  const away = teamOf(m.awayTeamId);
  const venue = venueOf(m.venueId);
  return [
    home?.nameZh, home?.nameEn, home?.code3,
    away?.nameZh, away?.nameEn, away?.code3,
    venue?.stadium, venue?.city, venue?.country,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/** 套用 status 以外嘅所有篩選（供計數 + 結果集共用） */
function applyBaseFilters(matches: Match[], f: ScheduleFilters): Match[] {
  const q = f.q.trim().toLowerCase();
  return matches.filter((m) => {
    if (f.stage && m.stage !== f.stage) return false;
    if (f.group && m.group !== f.group) return false;
    if (f.team && m.homeTeamId !== f.team && m.awayTeamId !== f.team) return false;
    if (q && !matchSearchable(m).includes(q)) return false;
    return true;
  });
}

export default function Schedule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const reduce = useReducedMotion();

  const { data, loading, error, retry, refetchSilent } = useAsyncData<ScheduleData>(async () => {
    const provider = getProvider();
    const [matchesRes, tournamentRes] = await Promise.all([
      provider.getMatches(),
      provider.getTournament(),
    ]);
    return {
      matches: matchesRes.data,
      tournament: tournamentRes.data,
      meta: toUiMeta(matchesRes.source, matchesRes.lastUpdated),
      lastUpdated: matchesRes.lastUpdated,
      dataMode: matchesRes.dataMode,
    };
  });

  // URL search params = 篩選狀態唯一來源（refresh 可還原）
  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);

  const onChange = useCallback(
    (patch: Partial<ScheduleFilters>) => {
      setSearchParams(paramsFromFilters({ ...filters, ...patch }), { replace: true });
    },
    [filters, setSearchParams],
  );

  const onClear = useCallback(() => {
    setSearchParams(paramsFromFilters({ ...DEFAULT_FILTERS, view: filters.view }), { replace: true });
  }, [filters.view, setSearchParams]);

  const matches = useMemo(() => data?.matches ?? [], [data]);

  // live 自動更新 30s（demo 快照無 live，live provider 下生效）
  const hasLive = useMemo(() => matches.some((m) => uiStatus(m.status) === 'live'), [matches]);
  useEffect(() => {
    if (!hasLive) return;
    const id = window.setInterval(refetchSilent, 30000);
    return () => window.clearInterval(id);
  }, [hasLive, refetchSilent]);

  const baseFiltered = useMemo(() => applyBaseFilters(matches, filters), [matches, filters]);

  const counts = useMemo<StatusCounts>(() => {
    const c: StatusCounts = { scheduled: 0, live: 0, finished: 0 };
    for (const m of baseFiltered) {
      const s = uiStatus(m.status);
      if (s === 'scheduled' || s === 'live' || s === 'finished') c[s] += 1;
    }
    return c;
  }, [baseFiltered]);

  const filtered = useMemo(() => {
    const list =
      filters.status.size === 0
        ? baseFiltered
        : baseFiltered.filter((m) => {
            const s = uiStatus(m.status);
            return s !== 'postponed' && filters.status.has(s);
          });
    return [...list].sort(
      (a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc) || a.matchId.localeCompare(b.matchId),
    );
  }, [baseFiltered, filters.status]);

  const total = data?.tournament.totalMatches ?? matches.length;

  return (
    <div className="pb-10 md:pb-14">
      {/* ===== 頁首 ===== */}
      <div className="mx-auto max-w-7xl px-4 pt-6 md:px-6 md:pt-10">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="flex flex-wrap items-end justify-between gap-3 pb-5"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">完整賽程</h1>
            <p className="mt-1.5 text-sm text-text-2">
              {data ? `${data.tournament.nameEn} · ${total} 場賽事` : '載入中…'}
            </p>
            {data && (
              <p className="mt-1 text-caption text-text-3">
                資料來源:{data.meta.source} · 更新於 {relativePast(data.lastUpdated)}
              </p>
            )}
          </div>
          {data && (
            <div className="flex items-center gap-2">
              <DataStatusBadge status={data.meta.dataStatus} meta={data.meta} />
              {data.dataMode === 'demo' && <DataStatusBadge status="DEMO" meta={data.meta} />}
            </div>
          )}
        </motion.div>
      </div>

      {/* ===== Sticky 篩選列（載入完成先顯示，篩選狀態全喺 URL） ===== */}
      {data && (
        <ScheduleFilterBar
          filters={filters}
          onChange={onChange}
          onClear={onClear}
          counts={counts}
          allCount={baseFiltered.length}
          shown={filtered.length}
          total={total}
        />
      )}

      {/* ===== 內容區 ===== */}
      <div className="mx-auto max-w-7xl px-4 pt-5 md:px-6">
        {loading && (
          <div className="space-y-2.5" aria-label="賽程載入中">
            {Array.from({ length: 8 }).map((_, i) => (
              <MatchRowSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && error && (
          <ErrorState
            error={error}
            onRetry={retry}
            // retry 真 refetch;篩選狀態存喺 URL,重試後保留
          />
        )}

        {!loading && !error && data && (
          <>
            {filtered.length === 0 ? (
              <EmptyState
                title="沒有符合條件的比賽"
                description={
                  hasActiveFilters(filters)
                    ? '試試清除部分篩選,或調整搜尋關鍵字。'
                    : '暫時沒有可顯示的賽事。'
                }
                ctaLabel={hasActiveFilters(filters) ? '清除全部篩選' : undefined}
                onCta={hasActiveFilters(filters) ? onClear : undefined}
              />
            ) : (
              <motion.div
                key={filters.view}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {filters.view === 'date' ? (
                  <DateView matches={filtered} />
                ) : (
                  <GroupView matches={filtered} />
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
