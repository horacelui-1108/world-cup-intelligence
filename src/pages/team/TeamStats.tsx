import { useMemo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { Match } from '@/types/football';
import EmptyState from '@/components/EmptyState';
import { cn } from '@/lib/utils';
import { computeGoalDistribution, computeTeamSummary } from './data';
import { CountUp } from './widgets';

interface TeamStatsProps {
  teamId: string;
  matches: Match[];
}

interface StatCardDef {
  label: string;
  value: number;
  decimals?: number;
  caption?: string;
  signed?: boolean;
}

/**
 * team.md Tab C — 球隊統計摘要：全部數字由已完場賽事純計算
 * （出賽 / 勝和負 / 入球 / 失球 / 得失球差 / 零封 / 場均入球），唔虛構其他統計。
 */
export default function TeamStats({ teamId, matches }: TeamStatsProps) {
  const summary = useMemo(() => computeTeamSummary(teamId, matches), [teamId, matches]);
  const distribution = useMemo(() => computeGoalDistribution(teamId, matches), [teamId, matches]);
  const distTotal = distribution.reduce((sum, s) => sum + s.count, 0);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInView = useInView(chartRef, { once: true, margin: '-10% 0px' });

  if (summary.played === 0) {
    return (
      <EmptyState
        title="尚未有已完成的比賽"
        description="球隊統計會喺第一場比賽完場後自動計算。"
      />
    );
  }

  const cards: StatCardDef[] = [
    { label: '出賽', value: summary.played },
    { label: '勝', value: summary.won },
    { label: '和', value: summary.drawn },
    { label: '負', value: summary.lost },
    { label: '入球', value: summary.goalsFor },
    { label: '失球', value: summary.goalsAgainst },
    { label: '得失球差', value: summary.goalDifference, signed: true },
    { label: '零封場次', value: summary.cleanSheets, caption: '對手零入球' },
    {
      label: '場均入球',
      value: summary.goalsPerMatch,
      decimals: 2,
      caption: `共 ${summary.played} 場`,
    },
  ];

  return (
    <div className="space-y-8">
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="球隊統計">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-5% 0px' }}
            transition={{ duration: 0.3, delay: (i % 4) * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-md border border-border bg-surface p-4"
          >
            <dt className="text-label text-text-3">{card.label}</dt>
            <dd className="mt-1.5 font-num text-[32px] leading-none font-bold tnum text-foreground">
              {card.signed && card.value > 0 ? '+' : ''}
              <CountUp value={card.value} decimals={card.decimals ?? 0} />
            </dd>
            {card.caption && <dd className="mt-1.5 text-caption text-text-3">{card.caption}</dd>}
          </motion.div>
        ))}
      </dl>

      {distTotal > 0 && (
        <section aria-labelledby="goal-distribution">
          <h3 id="goal-distribution" className="mb-1 font-display text-lg font-semibold text-foreground">
            進球分佈
          </h3>
          <p className="mb-4 text-caption text-text-3">
            只計算入球分鐘已核實嘅 {distTotal} 個入球（其餘入球分鐘未核實）
          </p>
          <div ref={chartRef} className="space-y-2.5 rounded-md border border-border bg-surface p-4 md:p-5">
            {distribution.map((seg, i) => {
              const pct = distTotal > 0 ? (seg.count / distTotal) * 100 : 0;
              return (
                <div key={seg.label} className="grid grid-cols-[64px_1fr_32px] items-center gap-3">
                  <span className="font-num text-caption tnum text-text-3">{seg.label}</span>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-2/60">
                    <motion.div
                      className={cn('h-full rounded-full', seg.count > 0 ? 'bg-accent' : 'bg-transparent')}
                      initial={{ width: 0 }}
                      animate={chartInView ? { width: `${pct}%` } : { width: 0 }}
                      transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <span className="text-right font-num text-sm font-semibold tnum text-foreground">
                    {seg.count}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
