import { motion } from 'framer-motion';
import type { SourceMeta, Team } from '@/types/football';
import type { DataMode } from '@/types/football';
import type { StandingRow } from '@/lib/standings';
import DataStatusBadge from '@/components/DataStatusBadge';
import { cn } from '@/lib/utils';
import { badgeStatus, crestSrc, type TeamSummary } from './data';
import { FormDots, StatCell } from './widgets';
import FavoriteToggle from './FavoriteToggle';

interface TeamHeroProps {
  team: Team;
  summary: TeamSummary;
  standing?: StandingRow;
  source: SourceMeta;
  dataMode: DataMode;
}

function standingLabel(standing: StandingRow | undefined, group: string): string | null {
  if (!standing) return `${group} 組`;
  const pos = standing.position;
  if (pos === 1) return `${group} 組首名`;
  if (pos === 2) return `${group} 組次名`;
  if (standing.qualification === 'best-third') return `${group} 組第 3 · 最佳第三名晉級`;
  return `${group} 組第 ${pos} 名`;
}

/**
 * team.md §1 — crest 120px（ring hairline）+ serif 隊名 + meta chips +
 * form dots + DataStatusBadge + 4+ 格 stat strip（count-up）。
 * 領隊 / FIFA 排名等無核實數據嘅欄位一律唔顯示（唔虛構）。
 */
export default function TeamHero({ team, summary, standing, source, dataMode }: TeamHeroProps) {
  const chips: string[] = [
    `FIFA 代碼 ${team.code3}`,
    standingLabel(standing, team.group) ?? `${team.group} 組`,
  ];
  if (team.rank !== undefined) chips.push(`FIFA 排名 ${team.rank}`);
  if (standing?.tiebreakNote) chips.push('名次待抽籤');

  return (
    <header className="border-b border-border bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
          <motion.img
            src={crestSrc(team.id)}
            alt={`${team.nameZh}隊徽`}
            width={120}
            height={120}
            className="h-24 w-24 shrink-0 rounded-full ring-1 ring-border-strong md:h-[120px] md:w-[120px]"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <motion.h1
                  className="font-display text-3xl font-bold text-foreground md:text-4xl"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  {team.nameZh}
                </motion.h1>
                <p className="mt-1 font-num text-sm tracking-wide text-text-3">{team.nameEn}</p>
              </div>
              <FavoriteToggle teamId={team.id} teamName={team.nameZh} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-caption font-medium text-text-2"
                >
                  {chip}
                </span>
              ))}
              <FormDots form={summary.form} className="ml-1" />
              <DataStatusBadge
                status={dataMode === 'demo' ? 'DEMO' : badgeStatus(source.dataStatus)}
                meta={{
                  source: source.source,
                  sourceUrl: source.sourceUrl,
                  retrievedAt: source.retrievedAt,
                  lastUpdated: source.lastUpdated ?? source.retrievedAt,
                  dataStatus: dataMode === 'demo' ? 'DEMO' : badgeStatus(source.dataStatus),
                }}
              />
            </div>
          </div>
        </div>

        {/* Stat strip — 由已完場賽事純計算 */}
        <dl
          className={cn(
            'mt-6 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-md border border-border bg-surface',
            'md:grid-cols-6',
          )}
          aria-label="球隊戰績摘要"
        >
          <StatCell label="出賽" value={summary.played} delay={0} />
          <StatCell label="勝" value={summary.won} delay={0.08} />
          <StatCell label="和" value={summary.drawn} delay={0.16} />
          <StatCell label="負" value={summary.lost} delay={0.24} />
          <StatCell label="入球" value={summary.goalsFor} delay={0.32} />
          <StatCell label="失球" value={summary.goalsAgainst} delay={0.4} />
        </dl>
      </div>
    </header>
  );
}
