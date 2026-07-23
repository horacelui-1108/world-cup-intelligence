/**
 * `/analysis` — 賽後分析列表（analysis.md）。
 * featured（最新一場四強/季軍戰級數分析）+ 篩選卡片流。
 * 篩選（階段 chip / 球隊下拉 / 搜尋 / 排序）全部入 URL search params。
 * blocked 分析唔顯示（全站貫徹）；demo 數據標示「示範數據」。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import DataStatusBadge from '@/components/DataStatusBadge';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import FilterChip from '@/components/FilterChip';
import SegmentedControl from '@/components/SegmentedControl';
import type { SourceMeta as UiSourceMeta } from '@/lib/types';
import type { Stage } from '@/types/football';
import { AnalysisCard, FeaturedAnalysisCard } from './analysis/AnalysisCard';
import { AnalysisListSkeleton } from './analysis/skeletons';
import { loadAnalysisList, type AnalysisListData } from './analysis/data';
import { FILTER_STAGES, STAGE_ORDER } from './analysis/model';

const PAGE_SIZE = 12;

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ok'; data: AnalysisListData };

function useAnalysisList() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadAnalysisList()
      .then((data) => {
        if (!cancelled) setState({ status: 'ok', data });
      })
      .catch((e) => {
        if (!cancelled) setState({ status: 'error', error: e instanceof Error ? e.message : String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((a) => a + 1);
  }, []);

  return { state, retry };
}

type SortMode = 'latest' | 'goals';

export default function Analysis() {
  const { state, retry } = useAnalysisList();
  const [searchParams, setSearchParams] = useSearchParams();

  const stage = searchParams.get('stage') ?? 'all';
  const team = searchParams.get('team') ?? 'all';
  const q = searchParams.get('q') ?? '';
  const sort = (searchParams.get('sort') ?? 'latest') as SortMode;

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === '' || v === 'all') next.delete(k);
        else next.set(k, v);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // 搜尋輸入：200ms debounce 先寫入 URL（analysis.md §3）
  const [qInput, setQInput] = useState(q);
  useEffect(() => setQInput(q), [q]);
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (qInput.trim() !== q) updateParams({ q: qInput.trim() || null });
    }, 200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => setVisibleCount(PAGE_SIZE), [stage, team, q, sort]);

  const entries = useMemo(() => (state.status === 'ok' ? state.data.entries : []), [state]);

  /** 球隊下拉選項：有分析嘅球隊，按中文名排序 */
  const teamOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of entries) {
      map.set(e.home.id, e.home.nameZh);
      map.set(e.away.id, e.away.nameZh);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'zh-Hant'));
  }, [entries]);

  const filtered = useMemo(() => {
    let list = entries;
    if (stage !== 'all') list = list.filter((e) => e.match.stage === stage);
    if (team !== 'all') list = list.filter((e) => e.home.id === team || e.away.id === team);
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter((e) =>
        [e.home.nameZh, e.away.nameZh, e.home.nameEn, e.away.nameEn, e.home.code3, e.away.code3].some((n) =>
          n.toLowerCase().includes(needle),
        ),
      );
    }
    const sorted = [...list];
    if (sort === 'goals') {
      sorted.sort(
        (a, b) =>
          b.match.score.home + b.match.score.away - (a.match.score.home + a.match.score.away) ||
          b.match.kickoffUtc.localeCompare(a.match.kickoffUtc),
      );
    } else {
      sorted.sort((a, b) => b.match.kickoffUtc.localeCompare(a.match.kickoffUtc));
    }
    return sorted;
  }, [entries, stage, team, q, sort]);

  const filtersActive = stage !== 'all' || team !== 'all' || q !== '' || sort !== 'latest';

  /** featured：最新一場四強/季軍戰級數分析；只在無篩選時顯示 */
  const featured = useMemo(() => {
    if (filtersActive || entries.length === 0) return null;
    const pool = entries.filter((e) => STAGE_ORDER[e.match.stage] >= STAGE_ORDER.SF);
    if (pool.length === 0) return null;
    return pool.sort((a, b) => b.match.kickoffUtc.localeCompare(a.match.kickoffUtc))[0];
  }, [entries, filtersActive]);

  const gridEntries = useMemo(
    () => (featured ? filtered.filter((e) => e.match.matchId !== featured.match.matchId) : filtered),
    [filtered, featured],
  );
  const visible = gridEntries.slice(0, visibleCount);

  // infinite scroll：sentinel 入 viewport 就載入下一頁
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (observed) => {
        if (observed.some((o) => o.isIntersecting)) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, gridEntries.length));
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [gridEntries.length]);

  const meta: UiSourceMeta | null =
    state.status === 'ok'
      ? {
          source: state.data.source.source,
          sourceUrl: state.data.source.sourceUrl,
          retrievedAt: state.data.source.retrievedAt,
          lastUpdated: state.data.lastUpdated,
          dataStatus: 'DEMO',
        }
      : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
      {/* ===== Masthead ===== */}
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">賽後分析</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-2">
          每一場完場比賽嘅深度覆盤——所有數字嚟自己核實嘅比賽事件同統計，並附完整資料來源。
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-caption text-text-3">
          <span>分析只於比賽完場並核實後發佈</span>
          {state.status === 'ok' && meta && (
            <>
              {state.data.dataMode === 'demo' ? (
                <DataStatusBadge status="DEMO" meta={meta} />
              ) : (
                <DataStatusBadge status="VERIFIED" />
              )}
              <span aria-live="polite">共 {entries.length} 篇分析</span>
            </>
          )}
        </div>
      </header>

      {/* ===== 內容 ===== */}
      {state.status === 'loading' && (
        <div className="mt-8">
          <AnalysisListSkeleton />
        </div>
      )}

      {state.status === 'error' && (
        <ErrorState className="mt-8" error={state.error} onRetry={retry} />
      )}

      {state.status === 'ok' && meta && (
        <>
          {featured && (
            <div className="mt-8">
              <FeaturedAnalysisCard entry={featured} dataMode={state.data.dataMode} meta={meta} />
            </div>
          )}

          {/* ===== Filter bar（sticky under navbar） ===== */}
          <form
            aria-label="篩選分析"
            onSubmit={(e) => e.preventDefault()}
            className="sticky top-14 z-30 -mx-4 mt-8 border-y border-border bg-bg/95 px-4 py-3 backdrop-blur md:top-16 md:-mx-6 md:px-6"
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <input
                  type="search"
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  placeholder="搜尋球隊…"
                  aria-label="搜尋分析（球隊）"
                  className="h-9 w-44 rounded-full border border-border bg-surface pl-9 pr-8 text-sm text-foreground placeholder:text-text-3 focus:border-border-strong focus:outline-none md:w-52"
                />
                {qInput && (
                  <button
                    type="button"
                    onClick={() => setQInput('')}
                    aria-label="清除搜尋"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-text-3 hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                  </button>
                )}
              </div>

              <fieldset className="flex flex-wrap items-center gap-2">
                <legend className="sr-only">按階段篩選</legend>
                <FilterChip label="全部" selected={stage === 'all'} onClick={() => updateParams({ stage: null })} />
                {FILTER_STAGES.map((s) => (
                  <FilterChip
                    key={s.value}
                    label={s.label}
                    selected={stage === s.value}
                    onClick={() => updateParams({ stage: s.value as Stage })}
                  />
                ))}
              </fieldset>

              <div className="relative">
                <select
                  value={team}
                  onChange={(e) => updateParams({ team: e.target.value })}
                  aria-label="按球隊篩選"
                  className={cn(
                    'h-9 appearance-none rounded-full border bg-surface pl-3.5 pr-8 text-sm font-medium transition-colors duration-200 focus:outline-none',
                    team !== 'all'
                      ? 'border-accent text-accent'
                      : 'border-border text-text-2 hover:border-border-strong',
                  )}
                >
                  <option value="all">所有球隊</option>
                  {teamOptions.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </div>

              <SegmentedControl<SortMode>
                ariaLabel="排序方式"
                size="sm"
                value={sort}
                onChange={(v) => updateParams({ sort: v === 'latest' ? null : v })}
                options={[
                  { value: 'latest', label: '最新' },
                  { value: 'goals', label: '最多入球場次' },
                ]}
              />

              <p aria-live="polite" className="ml-auto text-caption text-text-3">
                顯示 {Math.min(visibleCount, gridEntries.length)} / {gridEntries.length} 篇{featured ? '（另有 1 篇精選）' : ''}
              </p>
            </div>
          </form>

          {/* ===== Article grid ===== */}
          {visible.length > 0 ? (
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {visible.map((entry, i) => (
                <li key={entry.match.matchId}>
                  <AnalysisCard entry={entry} dataMode={state.data.dataMode} meta={meta} index={i} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              className="mt-6"
              title={entries.length === 0 ? '暫無分析' : '暫無符合條件的分析'}
              description="分析喺比賽完場並核實後先會發佈"
              ctaLabel="查看賽程"
              ctaHref="/schedule"
            />
          )}

          {visible.length === 0 && filtersActive && entries.length > 0 && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setQInput('');
                  setSearchParams(new URLSearchParams(), { replace: true });
                }}
                className="inline-flex min-h-11 items-center rounded-md border border-accent px-5 text-sm font-medium text-accent transition-colors duration-200 hover:bg-accent/10"
              >
                清除所有篩選
              </button>
            </div>
          )}

          {/* infinite scroll sentinel + 載入更多（button 後備，功能一致） */}
          {visibleCount < gridEntries.length && (
            <div ref={sentinelRef} className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => Math.min(c + PAGE_SIZE, gridEntries.length))}
                className="inline-flex min-h-11 items-center rounded-md border border-border px-5 text-sm font-medium text-text-2 transition-colors duration-200 hover:border-border-strong hover:text-foreground"
              >
                載入更多（仲有 {gridEntries.length - visibleCount} 篇）
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
