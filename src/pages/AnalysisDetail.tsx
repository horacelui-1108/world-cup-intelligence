/**
 * `/analysis/:slug`（slug = matchId）— 賽後分析文章（analysis-detail.md）。
 * editorial article layout：Noto Serif TC 標題、欄寬 68ch、行高 1.8。
 * 按 MatchAnalysis 結構依序渲染①快速摘要→⑨來源清單；
 * 〔Sn〕行內標記 = 可點擊 popover，與來源清單聯動（scroll + highlight）。
 * - section.status='insufficient_data' → 「資料不足」placeholder（章節唔隱藏）
 * - analysisStatus='blocked' → 成頁「分析未能通過驗證，不予發布」+ blockedReasons
 * - dataMode='demo' → 顯眼 Demo Data banner（G-12）
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { motion, useScroll } from 'framer-motion';
import { formatInTimeZone } from 'date-fns-tz';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Ban,
  Clock3,
  Hash,
  Info,
  ShieldBan,
  UserRound,
} from 'lucide-react';
import DataStatusBadge from '@/components/DataStatusBadge';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import StatBar from '@/components/StatBar';
import TeamChip from '@/components/TeamChip';
import { useTimezone } from '@/lib/timezone';
import type { SourceMeta as UiSourceMeta } from '@/lib/types';
import type { Claim, KeySubstitution, TurningPoint } from '@/lib/analysis/types';
import { AnalysisCard } from './analysis/AnalysisCard';
import ClaimText from './analysis/ClaimText';
import SmoothScroll from './analysis/SmoothScroll';
import SourceList from './analysis/SourceList';
import { AnalysisArticleSkeleton } from './analysis/skeletons';
import { AnalysisNotFoundError, loadAnalysisDetail, type AnalysisDetailData } from './analysis/data';
import {
  SELECTION_BASIS_LABEL,
  STAGE_LABEL,
  TIER_LABEL,
  minuteLabel,
  penaltiesLine,
  readingMinutes,
  scoreLine,
  toTeamRef,
  type AnalysisEntry,
} from './analysis/model';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ---------------------------------------------------------------------------
// 小組件
// ---------------------------------------------------------------------------

function FadeIn({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20% 0px' }}
      transition={{ duration: 0.4, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionHeader({ num, title, id }: { num: string; title: string; id: string }) {
  return (
    <h2 id={id} className="group flex scroll-mt-24 items-baseline gap-3 font-display text-xl font-semibold text-foreground md:text-2xl">
      <span className="font-num text-sm font-semibold text-gold">{num}</span>
      <span>{title}</span>
      <a
        href={`#${id}`}
        aria-label={`${title} 章節連結`}
        className="self-center text-text-3 opacity-0 transition-opacity duration-200 hover:text-accent focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Hash className="h-4 w-4" strokeWidth={1.5} aria-hidden />
      </a>
    </h2>
  );
}

/** 資料不足 placeholder（framework M0／analysis-detail §3：章節標題仍顯示） */
function InsufficientNotice() {
  return (
    <div className="mt-4 flex items-center gap-2.5 rounded-md border border-dashed border-border-strong bg-surface-2/40 px-4 py-3.5 text-sm text-text-3">
      <Info className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
      本節資料不足，未能作出分析
    </div>
  );
}

// ---------------------------------------------------------------------------
// 頁面
// ---------------------------------------------------------------------------

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'not-found' }
  | { status: 'ok'; data: AnalysisDetailData };

/** 無效 slug（路由唔存在 matchId）→ EmptyState + 返回列表 */
function NotFoundView() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <EmptyState
        title="找不到這篇分析"
        description="呢個連結可能已經過期，或者該場比賽仲未完場。分析只於比賽完場並核實後發佈。"
        ctaLabel="返回分析列表"
        ctaHref="/analysis"
      />
    </div>
  );
}

export default function AnalysisDetail() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <NotFoundView />;
  // key={slug}：切換文章時重設載入狀態（pager 導航）
  return <DetailContent key={slug} slug={slug} />;
}

function DetailContent({ slug }: { slug: string }) {
  const { timeZone, label: tzLabel } = useTimezone();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadAnalysisDetail(slug)
      .then((data) => {
        if (!cancelled) setState({ status: 'ok', data });
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof AnalysisNotFoundError) setState({ status: 'not-found' });
        else setState({ status: 'error', error: e instanceof Error ? e.message : String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [slug, attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((a) => a + 1);
  }, []);

  // 閱讀進度條（aria-hidden 裝飾）
  const { scrollYProgress } = useScroll();

  // 〔Sn〕→ 來源清單聯動：scroll + gold flash highlight
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const highlightTimer = useRef<number | undefined>(undefined);
  const jumpToSource = useCallback((index: number) => {
    setHighlightIndex(index);
    document.getElementById(`source-row-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => setHighlightIndex(null), 1600);
  }, []);
  useEffect(() => () => window.clearTimeout(highlightTimer.current), []);

  // 上一篇/下一篇（按比賽日期排序）
  const pager = useMemo(() => {
    if (state.status !== 'ok') return { prev: null as AnalysisEntry | null, next: null as AnalysisEntry | null };
    const sorted = [...state.data.entries].sort((a, b) => a.match.kickoffUtc.localeCompare(b.match.kickoffUtc));
    const idx = sorted.findIndex((e) => e.match.matchId === state.data.match.matchId);
    return {
      prev: idx > 0 ? sorted[idx - 1] : null,
      next: idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null,
    };
  }, [state]);

  const moreAnalyses = useMemo(() => {
    if (state.status !== 'ok') return [];
    return [...state.data.entries]
      .filter((e) => e.match.matchId !== state.data.match.matchId)
      .sort((a, b) => b.match.kickoffUtc.localeCompare(a.match.kickoffUtc))
      .slice(0, 2);
  }, [state]);

  if (state.status === 'loading') {
    return <AnalysisArticleSkeleton />;
  }

  if (state.status === 'not-found') {
    return <NotFoundView />;
  }

  if (state.status === 'error') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState error={state.error} onRetry={retry} />
      </div>
    );
  }

  const { analysis, match, home, away, source, dataMode, lastUpdated } = state.data;
  const providerName = source.source;
  const providerUrl = source.sourceUrl;
  const meta: UiSourceMeta = {
    source: providerName,
    sourceUrl: providerUrl,
    retrievedAt: source.retrievedAt,
    lastUpdated,
    dataStatus: 'DEMO',
  };
  const mins = readingMinutes(analysis);
  const pens = penaltiesLine(match);
  const aet = match.score.extraTime !== undefined;
  const published = formatInTimeZone(new Date(analysis.generatedAt), timeZone, 'yyyy-MM-dd HH:mm');

  const claimProps = { sources: analysis.sources, providerName, onJumpToSource: jumpToSource };

  // ---- blocked：成頁不予發布 ----
  if (analysis.analysisStatus === 'blocked') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-md border border-border bg-surface px-6 py-14 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-live/40 bg-live/10">
            <Ban className="h-5 w-5 text-live" strokeWidth={1.5} aria-hidden />
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold text-foreground">分析未能通過驗證，不予發布</h1>
          <p className="mt-2 text-sm text-text-2">
            {home.nameZh} {scoreLine(match)} {away.nameZh} · {STAGE_LABEL[match.stage]}嘅賽後分析未通過 G-11 發布前驗證。
          </p>
          {analysis.blockedReasons && analysis.blockedReasons.length > 0 && (
            <ul className="mx-auto mt-5 max-w-xl space-y-1.5 text-left">
              {analysis.blockedReasons.map((r, i) => (
                <li key={i} className="rounded-sm border border-border bg-surface-2/50 px-3 py-2 font-mono text-caption text-text-3">
                  {r}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/analysis"
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent-strong"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              返回分析列表
            </Link>
            <Link
              to={`/matches/${match.matchId}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-5 text-sm font-medium text-text-2 transition-colors duration-200 hover:border-border-strong hover:text-foreground"
            >
              前往比賽中心
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SmoothScroll />
      {/* 閱讀進度條 */}
      <motion.div
        aria-hidden
        className="fixed inset-x-0 top-0 z-40 h-0.5 origin-left bg-accent"
        style={{ scaleX: scrollYProgress }}
      />

      {/* ===== Article hero ===== */}
      <header className="relative overflow-hidden border-b border-border">
        <img
          src="/analysis-texture.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/80 to-bg" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 py-14 text-center md:py-20">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
            <span className="inline-flex items-center rounded-full border border-gold/50 px-2.5 py-1 text-caption font-semibold text-gold">
              {STAGE_LABEL[match.stage]}
              {match.group ? ` ${match.group} 組` : ''}
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground md:text-5xl">
              {home.nameZh}{' '}
              <span className="font-num tnum">{scoreLine(match)}</span>{' '}
              {away.nameZh}
            </h1>
            {pens && <p className="mt-2 font-num text-sm text-gold tnum">{pens}</p>}
            {aet && <p className="mt-1 text-caption text-text-3">加時後比數</p>}
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-text-2">
              呢篇分析基於已核實嘅比賽數據生成；每個數字均可追溯至文末嘅資料來源。
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-caption text-text-3"
          >
            <Link
              to={`/matches/${match.matchId}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/80 px-3 py-1 text-text-2 backdrop-blur-sm transition-colors duration-200 hover:border-border-strong hover:text-foreground"
            >
              比賽中心：{home.nameZh} {scoreLine(match)} {away.nameZh}
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            </Link>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              發佈 {published} {tzLabel}
            </span>
            <span>約 {mins} 分鐘閱讀</span>
            {dataMode === 'demo' ? (
              <DataStatusBadge status="DEMO" meta={meta} />
            ) : (
              <DataStatusBadge status="VERIFIED" />
            )}
            <span className="text-text-3">
              數據完整度 {TIER_LABEL[analysis.dataTier]}
              {analysis.analysisStatus === 'degraded' ? ' · 部分章節資料不足' : ''}
            </span>
          </motion.div>
        </div>
      </header>

      <article className="mx-auto max-w-[68ch] px-4 pb-14">
        {/* ===== Demo Data banner（G-12 不可移除） ===== */}
        {dataMode === 'demo' && (
          <div className="mt-8 flex items-start gap-3 rounded-md border border-warn/50 bg-info-bg px-4 py-3.5" role="note">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warn" strokeWidth={1.5} aria-hidden />
            <div>
              <p className="text-sm font-semibold text-foreground">Demo Data 示範數據</p>
              <p className="mt-0.5 text-caption leading-relaxed text-text-2">
                呢篇分析以示範數據生成，所有數字嚟自 {providerName} 快照，只供參考。
              </p>
            </div>
          </div>
        )}

        {/* ===== ① 100 字快速摘要 ===== */}
        <FadeIn className="mt-8">
          <section aria-label="100 字快速摘要" className="rounded-md border-l-[3px] border-accent bg-surface-2 p-4 md:p-5">
            <p className="text-label text-accent">100 字快速摘要</p>
            {analysis.quickSummary.status === 'ok' && analysis.quickSummary.content ? (
              <p className="mt-2 text-base leading-[1.8] text-foreground md:text-[1.0625rem]">
                <ClaimText claim={analysis.quickSummary.content} {...claimProps} />
              </p>
            ) : (
              <p className="mt-2 text-sm text-text-3">本節資料不足，未能作出分析</p>
            )}
          </section>
        </FadeIn>

        {/* ===== ② 完整賽後分析 ===== */}
        <FadeIn className="mt-12">
          <section aria-labelledby="full-report">
            <SectionHeader num="01" title="完整賽後分析" id="full-report" />
            {analysis.fullReport.status === 'ok' && analysis.fullReport.content ? (
              <div className="mt-4 space-y-4 text-base leading-[1.8] text-foreground/90">
                {analysis.fullReport.content.paragraphs.map((p, i) => (
                  <p key={i}>
                    <ClaimText claim={p} {...claimProps} />
                  </p>
                ))}
              </div>
            ) : (
              <InsufficientNotice />
            )}
          </section>
        </FadeIn>

        {/* ===== ③ 戰術部署 ===== */}
        <FadeIn className="mt-12">
          <section aria-labelledby="tactical">
            <SectionHeader num="02" title="戰術部署" id="tactical" />
            {analysis.tactical.status === 'ok' && analysis.tactical.content ? (
              <div className="mt-4 space-y-4">
                {analysis.tactical.content.formationsAvailable &&
                  match.lineups?.home?.formation &&
                  match.lineups?.away?.formation && (
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-border px-2.5 py-1 font-num text-xs text-foreground">
                        {match.lineups.home.formation}
                      </span>
                      <span className="text-caption text-text-3">vs</span>
                      <span className="rounded-full border border-border px-2.5 py-1 font-num text-xs text-foreground">
                        {match.lineups.away.formation}
                      </span>
                      <span className="text-caption text-text-3">（雙方陣式）</span>
                    </p>
                  )}
                <div className="space-y-4 text-base leading-[1.8] text-foreground/90">
                  {analysis.tactical.content.claims.map((c, i) => (
                    <p key={i}>
                      <ClaimText claim={c} {...claimProps} />
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <InsufficientNotice />
            )}
          </section>
        </FadeIn>

        {/* ===== ④ 勝負轉捩點 ===== */}
        <FadeIn className="mt-12">
          <section aria-labelledby="turning-points">
            <SectionHeader num="03" title="勝負轉捩點" id="turning-points" />
            {analysis.turningPoints.status === 'ok' && analysis.turningPoints.content ? (
              <ol className="mt-4 space-y-4">
                {[...analysis.turningPoints.content]
                  .sort((a, b) => a.rank - b.rank)
                  .map((tp: TurningPoint) => (
                    <li key={tp.rank} className="rounded-md border border-border bg-surface p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-sm bg-accent/15 px-2 py-0.5 font-num text-caption font-semibold text-accent">
                          第{minuteLabel(tp.minute, aet)}分鐘
                        </span>
                        <span className="text-caption text-text-3">
                          {tp.eventType === 'goal' ? '入球' : tp.eventType === 'red_card' ? '紅牌' : tp.eventType === 'var' ? 'VAR' : '十二碼'}
                        </span>
                        <span className="ml-auto inline-flex items-center gap-1.5 font-num text-caption text-text-2 tnum">
                          事件前 {tp.scoreBefore}
                          {tp.scoreAfter && (
                            <>
                              <ArrowRight className="h-3 w-3 text-text-3" strokeWidth={1.5} aria-hidden />
                              事件後 {tp.scoreAfter}
                            </>
                          )}
                        </span>
                      </div>
                      <p className="mt-2.5 text-sm leading-[1.8] text-foreground/90">
                        <ClaimText claim={tp.description} {...claimProps} />
                      </p>
                    </li>
                  ))}
              </ol>
            ) : (
              <InsufficientNotice />
            )}
          </section>
        </FadeIn>

        {/* ===== ⑤ 關鍵球員 ===== */}
        <FadeIn className="mt-12">
          <section aria-labelledby="key-players">
            <SectionHeader num="04" title="關鍵球員" id="key-players" />
            {analysis.keyPlayers.status === 'ok' && analysis.keyPlayers.content ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {analysis.keyPlayers.content.map((kp) => (
                  <div key={kp.playerId} className="rounded-md border border-border bg-surface p-4">
                    <div className="flex items-center gap-3">
                      <img src="/player-silhouette.svg" alt="" width={40} height={40} className="rounded-full border border-border bg-surface-2" />
                      <div className="min-w-0">
                        <Link
                          to={`/players/${kp.playerId}`}
                          className="block truncate text-sm font-semibold text-foreground transition-colors duration-200 hover:text-accent"
                        >
                          {kp.name}
                        </Link>
                        <p className="text-caption text-text-3">
                          {kp.team === 'home' ? home.nameZh : away.nameZh} · 入選依據:{SELECTION_BASIS_LABEL[kp.selectionBasis]}
                        </p>
                      </div>
                      {kp.rating && (
                        <span className="ml-auto rounded-sm border border-gold/40 px-1.5 py-0.5 font-num text-caption font-semibold text-gold">
                          {kp.rating.value}
                        </span>
                      )}
                    </div>
                    <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-foreground/90">
                      {kp.stats.map((s: Claim, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <UserRound className="mt-1 h-3.5 w-3.5 shrink-0 text-text-3" strokeWidth={1.5} aria-hidden />
                          <span>
                            <ClaimText claim={s} {...claimProps} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <InsufficientNotice />
            )}
          </section>
        </FadeIn>

        {/* ===== ⑥ 重要換人 ===== */}
        <FadeIn className="mt-12">
          <section aria-labelledby="substitutions">
            <SectionHeader num="05" title="重要換人" id="substitutions" />
            {analysis.keySubstitutions.status === 'insufficient_data' ? (
              <InsufficientNotice />
            ) : analysis.keySubstitutions.content && analysis.keySubstitutions.content.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {analysis.keySubstitutions.content.map((ks: KeySubstitution, i: number) => (
                  <li key={i} className="rounded-md border border-border bg-surface p-4">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="rounded-sm bg-surface-2 px-2 py-0.5 font-num text-caption font-semibold text-foreground">
                        第{minuteLabel(ks.minute, aet)}分鐘
                      </span>
                      <span className="font-medium text-foreground">{ks.playerIn}</span>
                      <span className="text-caption text-text-3">入替 {ks.playerOut || '（下場球員未標明）'}</span>
                    </p>
                    <p className="mt-2 text-sm leading-[1.8] text-foreground/90">
                      <ClaimText claim={ks.impact} {...claimProps} />
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-md border border-border bg-surface-2/40 px-4 py-3 text-sm text-text-3">
                換人影響未能由數據確認
              </p>
            )}
          </section>
        </FadeIn>

        {/* ===== ⑦ 數據支持的結論 ===== */}
        <FadeIn className="mt-12">
          <section aria-labelledby="data-conclusions">
            <SectionHeader num="06" title="數據支持的結論" id="data-conclusions" />
            {analysis.dataConclusions.status === 'ok' && analysis.dataConclusions.content ? (
              <div className="mt-4 space-y-5">
                {/* StatBar 對比（xG 只有 provider 有才顯示，G-03） */}
                {match.stats && (
                  <div className="rounded-md border border-border bg-surface p-4">
                    <div className="mb-3 flex items-center justify-between text-caption font-medium text-text-2">
                      <span className="flex items-center gap-2">
                        <TeamChip team={toTeamRef(home)} crestSize={24} link={false} />
                        {home.nameZh}
                      </span>
                      <span className="flex items-center gap-2">
                        {away.nameZh}
                        <TeamChip team={toTeamRef(away)} crestSize={24} link={false} />
                      </span>
                    </div>
                    <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                      {match.stats.possession && (
                        <StatBar label="控球率" valueA={match.stats.possession.home} valueB={match.stats.possession.away} max={100} format={(v) => `${v}%`} />
                      )}
                      {match.stats.shots && <StatBar label="射門" valueA={match.stats.shots.home} valueB={match.stats.shots.away} />}
                      {match.stats.shotsOnTarget && (
                        <StatBar label="射正" valueA={match.stats.shotsOnTarget.home} valueB={match.stats.shotsOnTarget.away} />
                      )}
                      {match.stats.corners && <StatBar label="角球" valueA={match.stats.corners.home} valueB={match.stats.corners.away} />}
                      {match.stats.passAccuracy && (
                        <StatBar label="傳球成功率" valueA={match.stats.passAccuracy.home} valueB={match.stats.passAccuracy.away} max={100} format={(v) => `${v}%`} />
                      )}
                      {match.stats.xg && (
                        <StatBar label="預期入球（xG）" valueA={match.stats.xg.home} valueB={match.stats.xg.away} format={(v) => v.toFixed(1)} />
                      )}
                    </div>
                  </div>
                )}
                <ul className="space-y-3">
                  {analysis.dataConclusions.content.map((dc, i) => (
                    <li key={i} className="rounded-md border border-border bg-surface p-4">
                      <p className="text-sm leading-[1.8] text-foreground/90">
                        <ClaimText claim={dc.claim} {...claimProps} />
                      </p>
                      <p className="mt-2 flex flex-wrap gap-1.5">
                        {dc.fields.map((f) => (
                          <span key={f} className="rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-3">
                            {f}
                          </span>
                        ))}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <InsufficientNotice />
            )}
          </section>
        </FadeIn>

        {/* ===== ⑧ 下一場影響 ===== */}
        <FadeIn className="mt-12">
          <section aria-labelledby="next-match">
            <SectionHeader num="07" title="下一場影響" id="next-match" />
            {analysis.nextMatch.status === 'ok' && analysis.nextMatch.content ? (
              <div className="mt-4 space-y-4">
                <ul className="space-y-3 text-base leading-[1.8] text-foreground/90">
                  {analysis.nextMatch.content.facts.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                      <span>
                        <ClaimText claim={f} {...claimProps} />
                      </span>
                    </li>
                  ))}
                </ul>
                {analysis.nextMatch.content.confirmedSuspensions.length > 0 && (
                  <div className="rounded-md border border-live/40 bg-live/5 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <ShieldBan className="h-4 w-4 text-live" strokeWidth={1.5} aria-hidden />
                      已確定停賽
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-text-2">
                      {analysis.nextMatch.content.confirmedSuspensions.map((s) => (
                        <li key={s.playerId}>
                          <Link to={`/players/${s.playerId}`} className="font-medium text-foreground hover:text-accent">
                            {s.name}
                          </Link>
                          （{s.reason === 'red_card' ? '紅牌停賽' : '累積黃牌停賽'}）
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.nextMatch.content.nextFixture && (
                  <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-foreground/90">
                    下一場對手：<span className="font-semibold text-foreground">{analysis.nextMatch.content.nextFixture.opponent}</span>
                    <span className="text-text-3">
                      {' '}
                      ·{' '}
                      {formatInTimeZone(
                        new Date(analysis.nextMatch.content.nextFixture.kickoffUtc),
                        timeZone,
                        'yyyy-MM-dd HH:mm',
                      )}{' '}
                      {tzLabel}
                    </span>
                  </p>
                )}
                <p className="text-caption text-text-3">本節只陳述已確認事實及其直接影響</p>
              </div>
            ) : (
              <InsufficientNotice />
            )}
          </section>
        </FadeIn>

        {/* ===== ⑨ 分析資料來源清單 ===== */}
        <FadeIn className="mt-12">
          <section aria-labelledby="sources" className="scroll-mt-24">
            <SectionHeader num="08" title="資料來源" id="sources" />
            <p className="mt-1.5 text-caption text-text-3">所有數字可追溯至以下來源</p>
            <div className="mt-4">
              <SourceList
                sources={analysis.sources}
                providerName={providerName}
                providerUrl={providerUrl}
                highlightIndex={highlightIndex}
              />
            </div>
          </section>
        </FadeIn>
      </article>

      {/* ===== Article footer：更多分析 + 上一篇/下一篇 ===== */}
      <footer className="border-t border-border bg-surface/50">
        <div className="mx-auto max-w-5xl px-4 py-10">
          {moreAnalyses.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">更多分析</h2>
              <ul className="mt-4 grid gap-4 md:grid-cols-2">
                {moreAnalyses.map((entry, i) => (
                  <li key={entry.match.matchId}>
                    <AnalysisCard entry={entry} dataMode={dataMode} meta={meta} index={i} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <nav aria-label="上一篇 / 下一篇分析" className="mt-10 grid gap-3 sm:grid-cols-2">
            {pager.prev ? (
              <Link
                to={`/analysis/${pager.prev.match.matchId}`}
                className="group rounded-md border border-border bg-surface p-4 transition-colors duration-200 hover:border-border-strong"
              >
                <span className="flex items-center gap-1.5 text-caption text-text-3">
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-1" strokeWidth={1.5} aria-hidden />
                  上一篇 · {STAGE_LABEL[pager.prev.match.stage]}
                </span>
                <span className="mt-1.5 block font-display text-base font-semibold text-foreground group-hover:text-accent">
                  {pager.prev.home.nameZh} <span className="font-num tnum">{scoreLine(pager.prev.match)}</span>{' '}
                  {pager.prev.away.nameZh}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {pager.next ? (
              <Link
                to={`/analysis/${pager.next.match.matchId}`}
                className="group rounded-md border border-border bg-surface p-4 text-right transition-colors duration-200 hover:border-border-strong"
              >
                <span className="flex items-center justify-end gap-1.5 text-caption text-text-3">
                  下一篇 · {STAGE_LABEL[pager.next.match.stage]}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={1.5} aria-hidden />
                </span>
                <span className="mt-1.5 block font-display text-base font-semibold text-foreground group-hover:text-accent">
                  {pager.next.home.nameZh} <span className="font-num tnum">{scoreLine(pager.next.match)}</span>{' '}
                  {pager.next.away.nameZh}
                </span>
              </Link>
            ) : (
              <span />
            )}
          </nav>

          <div className="mt-8 text-center">
            <Link
              to="/analysis"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-5 text-sm font-medium text-text-2 transition-colors duration-200 hover:border-border-strong hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              返回分析列表
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
