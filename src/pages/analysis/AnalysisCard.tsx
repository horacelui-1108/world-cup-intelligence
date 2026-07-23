/**
 * AnalysisCard / FeaturedAnalysisCard — 分析列表卡片。
 * 每張卡：對賽+比分、quickSummary 摘錄、階段標籤、generatedAt 相對時間、
 * DataStatusBadge（demo → 示範數據）。成張卡可撳入文章；隊徽 link 去球隊頁。
 */
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import DataStatusBadge from '@/components/DataStatusBadge';
import TeamChip from '@/components/TeamChip';
import type { SourceMeta as UiSourceMeta } from '@/lib/types';
import type { DataMode } from '@/types/football';
import { relativePast } from '@/lib/format';
import {
  STAGE_LABEL,
  penaltiesLine,
  readingMinutes,
  scoreLine,
  stripCitations,
  toTeamRef,
  type AnalysisEntry,
} from './model';
import { asset } from '@/lib/asset';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function StageChip({ entry, className }: { entry: AnalysisEntry; className?: string }) {
  const knockout = entry.match.stage !== 'GROUP';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-caption font-medium',
        knockout ? 'border-gold/40 text-gold' : 'border-border text-text-2',
        className,
      )}
    >
      {STAGE_LABEL[entry.match.stage]}
      {entry.match.group ? ` ${entry.match.group} 組` : ''}
    </span>
  );
}

function Badge({ dataMode, meta }: { dataMode: DataMode; meta: UiSourceMeta }) {
  if (dataMode === 'demo') return <DataStatusBadge status="DEMO" meta={meta} />;
  return <DataStatusBadge status="VERIFIED" />;
}

interface AnalysisCardProps {
  entry: AnalysisEntry;
  dataMode: DataMode;
  meta: UiSourceMeta;
  /** 首 12 張先 stagger（design §5 上限） */
  index?: number;
}

export function AnalysisCard({ entry, dataMode, meta, index = 0 }: AnalysisCardProps) {
  const { analysis, match, home, away } = entry;
  const excerpt = analysis.quickSummary.content
    ? stripCitations(analysis.quickSummary.content.text)
    : '摘要資料不足';
  const href = `/analysis/${match.matchId}`;
  const pens = penaltiesLine(match);

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15% 0px' }}
      transition={{ duration: 0.35, ease: EASE, delay: index < 12 ? index * 0.04 : 0 }}
      className="group relative flex flex-col rounded-md border border-border bg-surface p-4 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-border-strong"
    >
      <div className="flex flex-wrap items-center gap-2">
        <StageChip entry={entry} />
        <Badge dataMode={dataMode} meta={meta} />
        <span className="ml-auto text-caption text-text-3" title={analysis.generatedAt}>
          {relativePast(analysis.generatedAt)}
        </span>
      </div>

      <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-foreground transition-colors duration-200 group-hover:text-accent">
        <Link to={href} className="outline-none after:absolute after:inset-0 after:content-['']">
          {home.nameZh} <span className="font-num tnum">{scoreLine(match)}</span> {away.nameZh}
        </Link>
      </h3>
      {pens && <p className="mt-0.5 text-caption text-text-3">{pens}</p>}

      <div className="relative z-10 mt-2 flex items-center gap-4">
        <TeamChip team={toTeamRef(home)} crestSize={24} />
        <span className="text-caption text-text-3">vs</span>
        <TeamChip team={toTeamRef(away)} crestSize={24} />
      </div>

      <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-text-2">{excerpt}</p>

      <div className="mt-3 flex items-center gap-3 border-t border-border pt-3 text-caption text-text-3">
        <span className="rounded-full border border-border px-2 py-0.5">來源 {analysis.sources.length} 項</span>
        <span>約 {readingMinutes(analysis)} 分鐘閱讀</span>
        <ChevronRight
          className="ml-auto h-4 w-4 text-accent transition-transform duration-200 group-hover:translate-x-0.5"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
    </motion.article>
  );
}

/** Featured report — 最新一場四強/季軍戰級數分析（analysis.md §2） */
export function FeaturedAnalysisCard({
  entry,
  dataMode,
  meta,
}: {
  entry: AnalysisEntry;
  dataMode: DataMode;
  meta: UiSourceMeta;
}) {
  const { analysis, match, home, away } = entry;
  const href = `/analysis/${match.matchId}`;
  const summary = analysis.quickSummary.content
    ? stripCitations(analysis.quickSummary.content.text)
    : '摘要資料不足';
  const pens = penaltiesLine(match);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      aria-label="最新分析"
      className="group relative overflow-hidden rounded-md border border-border bg-surface"
    >
      <div className="grid md:grid-cols-[55%_1fr]">
        {/* 左：duotone 處理嘅 analysis texture */}
        <div className="relative min-h-48 overflow-hidden md:min-h-full">
          <motion.img
            src={asset("/analysis-texture.jpg")}
            alt=""
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            transition={{ duration: 0.8, ease: EASE }}
            className="absolute inset-0 h-full w-full object-cover opacity-75 grayscale-[30%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" aria-hidden />
          <span className="absolute left-4 top-4 rounded-full border border-gold/50 bg-bg/70 px-2.5 py-1 text-caption font-semibold text-gold backdrop-blur-sm">
            最新分析
          </span>
        </div>

        {/* 右：標題 + 摘要 + meta + CTA */}
        <div className="relative flex flex-col p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <StageChip entry={entry} />
            <Badge dataMode={dataMode} meta={meta} />
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-foreground md:text-3xl">
            <Link to={href} className="outline-none transition-colors duration-200 after:absolute after:inset-0 after:content-[''] hover:text-accent">
              {home.nameZh} <span className="font-num tnum">{scoreLine(match)}</span> {away.nameZh}
            </Link>
          </h2>
          {pens && <p className="mt-1 text-caption text-text-3">{pens}</p>}

          <blockquote className="mt-4 border-l-[3px] border-accent bg-surface-2/60 p-3 text-sm leading-relaxed text-text-2">
            {summary}
          </blockquote>

          <div className="relative z-10 mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-text-3">
            <span className="flex items-center gap-2">
              <TeamChip team={toTeamRef(home)} crestSize={24} />
              <span>vs</span>
              <TeamChip team={toTeamRef(away)} crestSize={24} />
            </span>
            <span>發佈 {relativePast(analysis.generatedAt)}</span>
            <span>約 {readingMinutes(analysis)} 分鐘閱讀</span>
            <span>來源 {analysis.sources.length} 項</span>
          </div>

          <div className="relative z-10 mt-5">
            <Link
              to={href}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent-strong"
            >
              閱讀完整分析
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                strokeWidth={1.5}
                aria-hidden
              />
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
