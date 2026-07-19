import { useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { KeyboardEvent } from 'react';
import type { Match } from '@/types/football';
import type { SourceMeta as UiSourceMeta } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getProvider } from '@/lib/provider';
import { relativePast } from '@/lib/format';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import ScoreHero from './match/ScoreHero';
import EventTimeline from './match/EventTimeline';
import LineupsTab from './match/LineupsTab';
import StatsTab from './match/StatsTab';
import VarTab from './match/VarTab';
import InfoTab from './match/InfoTab';
import { teamNameZh, toUiMeta, uiStatus } from './schedule/model';
import { useAsyncData } from './schedule/useAsyncData';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const TABS = [
  { id: 'events', label: '比賽事件' },
  { id: 'lineups', label: '陣容' },
  { id: 'stats', label: '數據統計' },
  { id: 'var', label: 'VAR' },
  { id: 'info', label: '資訊' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function validTab(v: string | null): TabId {
  return (TABS.find((t) => t.id === v)?.id ?? 'events') as TabId;
}

interface MatchData {
  match: Match;
  meta: UiSourceMeta;
  all: Match[];
}

function Bone({ className }: { className?: string }) {
  return <div className={cn('skeleton-shimmer rounded-md', className)} aria-hidden />;
}

/** 載入骨架:hero + 6 張時間軸卡 */
function MatchDetailSkeleton() {
  return (
    <div aria-label="比賽資料載入中">
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
          <div className="flex items-center justify-center gap-3">
            <Bone className="h-5 w-20 rounded-full" />
            <Bone className="h-4 w-40" />
            <Bone className="h-5 w-14 rounded-full" />
          </div>
          <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-start gap-4">
            <div className="flex flex-col items-center gap-3 md:items-end">
              <Bone className="h-16 w-16 rounded-full md:h-20 md:w-20" />
              <Bone className="h-5 w-24" />
              <Bone className="h-3 w-16" />
            </div>
            <Bone className="mt-2 h-14 w-28 md:h-20 md:w-40" />
            <div className="flex flex-col items-center gap-3 md:items-start">
              <Bone className="h-16 w-16 rounded-full md:h-20 md:w-20" />
              <Bone className="h-5 w-24" />
              <Bone className="h-3 w-16" />
            </div>
          </div>
          <Bone className="mx-auto mt-6 h-3 w-72 max-w-full" />
        </div>
      </div>
      <div className="mx-auto max-w-4xl space-y-3 px-4 py-6 md:px-6">
        <Bone className="h-8 w-64 rounded-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Bone className="h-7 w-12 shrink-0 rounded-full" />
            <Bone className="h-16 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** 各 tab 底部嘅來源 caption（stats/info tab 自帶來源區,唔會重複） */
function SourceCaption({ meta }: { meta: UiSourceMeta }) {
  return (
    <p className="mt-6 text-center text-caption text-text-3">
      資料來源:{meta.source} · 更新於 {relativePast(meta.lastUpdated)}
    </p>
  );
}

export default function MatchDetail() {
  const { matchId } = useParams<{ matchId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const reduce = useReducedMotion();
  const tab = validTab(searchParams.get('tab'));
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { data, loading, error, retry, refetchSilent } = useAsyncData<MatchData>(
    async () => {
      const provider = getProvider();
      const [matchRes, allRes] = await Promise.all([provider.getMatch(matchId ?? ''), provider.getMatches()]);
      return {
        match: matchRes.data,
        meta: toUiMeta(matchRes.source, matchRes.lastUpdated),
        all: allRes.data,
      };
    },
    [matchId],
  );

  // live 自動更新 30s(demo 快照無 live;live provider 下生效)
  const isLive = data ? uiStatus(data.match.status) === 'live' : false;
  useEffect(() => {
    if (!isLive) return;
    const id = window.setInterval(refetchSilent, 30000);
    return () => window.clearInterval(id);
  }, [isLive, refetchSilent]);

  const setTab = (t: TabId) => {
    const next = new URLSearchParams(searchParams);
    if (t === 'events') next.delete('tab');
    else next.set('tab', t);
    setSearchParams(next, { replace: true });
  };

  // tablist 方向鍵導覽(match.md a11y)
  const onTabKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const idx = TABS.findIndex((t) => t.id === tab);
    const nextIdx = e.key === 'ArrowRight' ? (idx + 1) % TABS.length : (idx - 1 + TABS.length) % TABS.length;
    tabRefs.current[nextIdx]?.focus();
    setTab(TABS[nextIdx].id);
  };

  const related = useMemo(() => {
    if (!data) return [];
    const { match, all } = data;
    return all
      .filter((m) => {
        if (m.matchId === match.matchId) return false;
        return match.group ? m.group === match.group : m.stage === match.stage;
      })
      .sort((a, b) => b.kickoffUtc.localeCompare(a.kickoffUtc))
      .slice(0, 8);
  }, [data]);

  if (loading) return <MatchDetailSkeleton />;

  if (error || !data) {
    const notFound = !!error && /搵唔到|not found/i.test(error);
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        {notFound ? (
          <EmptyState
            title="找不到這場比賽"
            description={`比賽編號「${matchId ?? ''}」不存在或已被移除。`}
            ctaLabel="返回賽程"
            ctaHref="/schedule"
          />
        ) : (
          <ErrorState error={error ?? '未知錯誤'} onRetry={retry} />
        )}
      </div>
    );
  }

  const { match, meta } = data;
  const status = uiStatus(match.status);
  const analysisHref = status === 'finished' ? `/analysis/${match.matchId}` : undefined;

  return (
    <div className="pb-10 md:pb-14">
      <h1 className="sr-only">
        {teamNameZh(match.homeTeamId)} 對 {teamNameZh(match.awayTeamId)} — Match Centre
      </h1>

      <ScoreHero match={match} meta={meta} analysisHref={analysisHref} />

      {/* ===== Tab bar(sticky 喺 navbar 下;?tab= 同步) ===== */}
      <div className="sticky top-14 z-30 border-b border-border bg-surface/95 backdrop-blur md:top-16">
        <div
          role="tablist"
          aria-label="比賽資料分頁"
          onKeyDown={onTabKeyDown}
          className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 md:px-6"
        >
          {TABS.map((t, i) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`tabpanel-${t.id}`}
                id={`tab-${t.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative shrink-0 px-3 py-3 text-sm font-medium transition-colors duration-200',
                  active ? 'text-accent' : 'text-text-2 hover:text-foreground',
                )}
              >
                {t.label}
                {active && (
                  <motion.span
                    layoutId="match-tab-underline"
                    transition={{ duration: 0.25, ease: EASE }}
                    className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent"
                    aria-hidden
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== Tab 內容(0.2s fade + 8px rise) ===== */}
      <div className="mx-auto max-w-4xl px-4 pt-6 md:px-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            role="tabpanel"
            id={`tabpanel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            {tab === 'events' && (
              <>
                <EventTimeline match={match} />
                <SourceCaption meta={meta} />
              </>
            )}
            {tab === 'lineups' && (
              <>
                <LineupsTab match={match} />
                <SourceCaption meta={meta} />
              </>
            )}
            {tab === 'stats' && <StatsTab match={match} meta={meta} />}
            {tab === 'var' && (
              <>
                <VarTab match={match} />
                <SourceCaption meta={meta} />
              </>
            )}
            {tab === 'info' && <InfoTab match={match} meta={meta} related={related} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
