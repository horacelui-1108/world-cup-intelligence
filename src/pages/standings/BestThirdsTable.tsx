import { Fragment } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StandingRow } from '@/lib/standings';
import { Crest } from '@/components/TeamChip';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { teamRefOf } from '@/pages/standings/teamRef';
import type { QualStatus } from '@/pages/standings/useStandingsData';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const QUALIFY_COUNT = 8;

function gdLabel(gd: number): string {
  if (gd > 0) return `+${gd}`;
  if (gd < 0) return `−${Math.abs(gd)}`;
  return '0';
}

interface BestThirdsTableProps {
  rows: StandingRow[];
  qualMap: ReadonlyMap<string, QualStatus>;
  /** 12 組係咪全部完場（比較已解出） */
  resolved: boolean;
  onJumpToRules: () => void;
}

/**
 * standings.md §3 — 最佳第三名排名表：12 支小組第三名合併排序，
 * 頭 8 隊晉級 32 強；第 8 行後設「晉級線」。
 */
export default function BestThirdsTable({ rows, qualMap, resolved, onJumpToRules }: BestThirdsTableProps) {
  const navigate = useNavigate();

  return (
    <section
      aria-label="最佳第三名排名"
      className="overflow-hidden rounded-md border border-border border-t-2 border-t-gold bg-surface"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold text-foreground">最佳第三名</h2>
          <span className="rounded-full border border-accent/50 px-2 py-0.5 text-caption font-medium text-accent">
            8 隊晉級
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="最佳第三名規則說明"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-3 transition-colors duration-200 hover:text-foreground"
                >
                  <Info className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-64 text-caption">
                12 支小組第三名按積分、得失球差、入球排序，頭 8 隊晉級 32 強。
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <button
            type="button"
            onClick={onJumpToRules}
            className="inline-flex min-h-9 items-center rounded-md px-2 text-sm font-medium text-accent transition-colors duration-200 hover:text-accent-strong"
          >
            排名規則 ↓
          </button>
        </div>
      </header>

      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">
          最佳第三名排名表：12 支小組第三名合併排名，頭 8 隊晉級 32 強
        </caption>
        <thead>
          <tr className="border-b border-border text-label text-text-2">
            <th scope="col" className="w-9 py-2 pl-3 pr-1 text-left font-medium">
              #
            </th>
            <th scope="col" className="w-10 px-1 py-2 text-center font-medium">
              組
            </th>
            <th scope="col" className="px-2 py-2 text-left font-medium">
              球隊
            </th>
            <th scope="col" className="w-9 px-1 py-2 text-center font-medium">
              賽
            </th>
            <th scope="col" className="hidden w-20 px-1 py-2 text-center font-medium md:table-cell">
              勝和負
            </th>
            <th scope="col" className="hidden w-16 px-1 py-2 text-center font-medium md:table-cell">
              入/失
            </th>
            <th scope="col" className="w-11 px-1 py-2 text-center font-medium">
              差
            </th>
            <th scope="col" className="w-11 px-1 py-2 text-center font-semibold text-accent">
              分
            </th>
            <th scope="col" className="w-16 py-2 pl-1 pr-3 text-right font-medium">
              狀態
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const team = teamRefOf(row.teamId);
            const qualifies = i < QUALIFY_COUNT;
            const status = qualMap.get(row.teamId) ?? 'pending';
            const statusLabel = !resolved || status === 'pending' ? '待定' : qualifies ? '晉級' : '出局';
            return (
              <Fragment key={row.teamId}>
                {i === QUALIFY_COUNT && (
                  <tr key="qualification-line" aria-hidden>
                    <td colSpan={9} className="relative p-0">
                      <motion.div
                        initial={{ opacity: 0.2 }}
                        whileInView={{ opacity: [0.2, 1, 0.6] }}
                        viewport={{ once: true, amount: 1 }}
                        transition={{ duration: 1.1, ease: EASE }}
                        className="relative h-6"
                      >
                        <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-accent/70" />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-2 text-caption font-medium tracking-wider text-accent">
                          晉級線
                        </span>
                      </motion.div>
                    </td>
                  </tr>
                )}
                <motion.tr
                  key={row.teamId}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.3, delay: Math.min(i, 11) * 0.03, ease: EASE }}
                  onClick={() => navigate(`/teams/${row.teamId}`)}
                  className={cn(
                    'h-12 cursor-pointer border-b border-border transition-colors duration-200 last:border-b-0 hover:bg-surface-2',
                    !qualifies && 'text-text-3',
                  )}
                >
                  <td className="relative py-2 pl-3 pr-1">
                    {qualifies && <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-accent" />}
                    <span className="font-num tnum text-text-3">{i + 1}</span>
                  </td>
                  <td className="px-1 py-2 text-center">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-sm border border-border font-display text-caption font-semibold text-text-2">
                      {row.group}
                    </span>
                  </td>
                  <th scope="row" className="px-2 py-2 text-left font-normal">
                    <Link
                      to={`/teams/${row.teamId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex min-w-0 items-center gap-2 rounded-sm transition-colors duration-200 hover:text-accent"
                    >
                      <Crest team={team} size={24} />
                      <span
                        className={cn(
                          'truncate text-sm font-medium',
                          qualifies ? 'text-foreground' : 'text-text-2',
                        )}
                      >
                        {team.name}
                      </span>
                    </Link>
                  </th>
                  <td className="px-1 py-2 text-center font-num tnum text-text-2">{row.played}</td>
                  <td className="hidden px-1 py-2 text-center font-num tnum text-text-2 md:table-cell">
                    {row.won}-{row.drawn}-{row.lost}
                  </td>
                  <td className="hidden px-1 py-2 text-center font-num tnum text-text-2 md:table-cell">
                    {row.goalsFor}/{row.goalsAgainst}
                  </td>
                  <td className="px-1 py-2 text-center font-num tnum text-text-2">{gdLabel(row.goalDifference)}</td>
                  <td className="px-1 py-2 text-center font-num text-base font-bold tnum text-foreground">
                    {row.points}
                  </td>
                  <td className="py-2 pl-1 pr-3 text-right">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-1.5 py-px text-[10px] font-medium',
                        statusLabel === '晉級' && 'border-accent/50 text-accent',
                        statusLabel === '出局' && 'border-border text-text-3',
                        statusLabel === '待定' && 'border-warn text-warn',
                      )}
                    >
                      {statusLabel}
                    </span>
                  </td>
                </motion.tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
