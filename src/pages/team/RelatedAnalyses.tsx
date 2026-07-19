import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { Match } from '@/types/football';
import type { MatchAnalysis } from '@/lib/analysis/types';
import EmptyState from '@/components/EmptyState';
import { useTimezone } from '@/lib/timezone';
import { kickoffLabel } from '@/lib/format';
import { stageLabel, teamsById } from './data';

export interface AnalysisEntry {
  analysis: MatchAnalysis;
  match: Match;
}

interface RelatedAnalysesProps {
  entries: AnalysisEntry[];
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * team.md Tab D / player.md — 相關分析列表。
 * 卡片連去 /analysis/:slug（slug 即 matchId），標題用對賽組合 + 比分，
 * 摘要用 engine 生成嘅 quickSummary（100 字預覽 line-clamp）。
 */
export default function RelatedAnalyses({
  entries,
  emptyTitle = '暫無相關分析',
  emptyDescription = '呢項賽事暫時未有同呢度相關嘅賽後分析。',
}: RelatedAnalysesProps) {
  const { timeZone } = useTimezone();

  if (entries.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ul className="space-y-3">
      {entries.map(({ analysis, match }, i) => {
        const home = teamsById.get(match.homeTeamId);
        const away = teamsById.get(match.awayTeamId);
        const title = `${home?.nameZh ?? match.homeTeamId} ${match.score.home}–${match.score.away} ${away?.nameZh ?? match.awayTeamId}`;
        const excerpt = analysis.quickSummary.content?.text;
        return (
          <motion.li
            key={match.matchId}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-5% 0px' }}
            transition={{ duration: 0.3, delay: Math.min(i, 5) * 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              to={`/analysis/${match.matchId}`}
              className="group block rounded-md border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong md:p-5"
              aria-label={`分析：${title}`}
            >
              <p className="text-caption text-gold">
                {stageLabel(match)} · {kickoffLabel(match.kickoffUtc, timeZone)}
              </p>
              <h3 className="mt-1.5 font-display text-lg font-semibold text-foreground transition-colors group-hover:text-accent">
                {title}
              </h3>
              {excerpt && (
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-text-2">{excerpt}</p>
              )}
              <p className="mt-3 flex items-center justify-between border-t border-border pt-3 text-caption text-text-3">
                <span>來源 {analysis.sources.length} 個 · {analysis.dataTier} 級數據</span>
                <span className="inline-flex items-center gap-1 font-medium text-accent transition-colors group-hover:text-accent-strong">
                  閱讀完整分析
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                </span>
              </p>
            </Link>
          </motion.li>
        );
      })}
    </ul>
  );
}
