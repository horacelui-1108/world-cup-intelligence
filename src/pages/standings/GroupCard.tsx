import { Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StandingRow } from '@/lib/standings';
import { Crest } from '@/components/TeamChip';
import FormDots from '@/pages/standings/FormDots';
import { teamRefOf } from '@/pages/standings/teamRef';
import type { FormResult } from '@/components/TeamChip';
import type { QualStatus } from '@/pages/standings/useStandingsData';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function gdLabel(gd: number): string {
  if (gd > 0) return `+${gd}`;
  if (gd < 0) return `−${Math.abs(gd)}`;
  return '0';
}

/** 晉級狀態標記 — 文字 + 色點成對（顏色唔係唯一載體） */
function QualTag({ status, position }: { status: QualStatus; position: number }) {
  if (status === 'auto') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-accent/50 px-1.5 py-px text-[10px] font-medium text-accent">
        晉級
      </span>
    );
  }
  if (status === 'best-third') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-accent/50 px-1.5 py-px text-[10px] font-medium text-accent">
        晉級
      </span>
    );
  }
  if (status === 'out') {
    return (
      <span className="inline-flex items-center rounded-full border border-border px-1.5 py-px text-[10px] font-medium text-text-3">
        出局
      </span>
    );
  }
  // pending：第 3 名標「待定」（最佳第三名比較位），其餘唔標
  if (position === 3) {
    return (
      <span className="inline-flex items-center rounded-full border border-warn px-1.5 py-px text-[10px] font-medium text-warn">
        待定
      </span>
    );
  }
  return null;
}

/** 排名行左側嘅席位色條：1–2 名墨綠實線（直接晉級）；第 3 名金色虛線（最佳第三名比較位） */
function ZoneBar({ position }: { position: number }) {
  if (position <= 2) {
    return <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-accent" />;
  }
  if (position === 3) {
    return <span aria-hidden className="absolute inset-y-0 left-0 border-l-[3px] border-dashed border-gold" />;
  }
  return null;
}

interface GroupCardProps {
  group: string;
  rows: StandingRow[];
  formMap: ReadonlyMap<string, FormResult[]>;
  qualMap: ReadonlyMap<string, QualStatus>;
}

/**
 * standings.md §2 — 小組排名卡：A–L 組各自一表。
 * Desktop 全欄位；mobile 壓欄（排名／球隊／賽／差／分／近況）。
 */
export default function GroupCard({ group, rows, formMap, qualMap }: GroupCardProps) {
  const navigate = useNavigate();

  return (
    <section aria-label={`${group} 組排名`} className="overflow-hidden rounded-md border border-border bg-surface">
      {/* 卡片頭：字母徽章 + 組名 + 查看該組賽程 */}
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-md border border-gold bg-surface-2 font-display text-base font-semibold text-gold"
          >
            {group}
          </span>
          <h2 className="font-display text-lg font-semibold text-foreground">{group} 組</h2>
        </div>
        <Link
          to={`/schedule?group=${group}`}
          className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-sm font-medium text-accent transition-colors duration-200 hover:text-accent-strong"
        >
          查看該組賽程
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
        </Link>
      </header>

      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">
          {group} 組排名表：排名、球隊、已賽場數、勝、和、負、入球、失球、得失球差、積分、近況
        </caption>
        <thead>
          <tr className="border-b border-border text-label text-text-2">
            <th scope="col" className="w-9 py-2 pl-3 pr-1 text-left font-medium">
              #
            </th>
            <th scope="col" className="px-2 py-2 text-left font-medium">
              球隊
            </th>
            <th scope="col" className="w-9 px-1 py-2 text-center font-medium">
              賽
            </th>
            <th scope="col" className="hidden w-9 px-1 py-2 text-center font-medium md:table-cell">
              勝
            </th>
            <th scope="col" className="hidden w-9 px-1 py-2 text-center font-medium md:table-cell">
              和
            </th>
            <th scope="col" className="hidden w-9 px-1 py-2 text-center font-medium md:table-cell">
              負
            </th>
            <th scope="col" className="hidden w-9 px-1 py-2 text-center font-medium md:table-cell">
              得
            </th>
            <th scope="col" className="hidden w-9 px-1 py-2 text-center font-medium md:table-cell">
              失
            </th>
            <th scope="col" className="w-11 px-1 py-2 text-center font-medium">
              差
            </th>
            <th scope="col" className="w-11 px-1 py-2 text-center font-semibold text-accent">
              分
            </th>
            <th scope="col" className="w-32 py-2 pl-2 pr-3 text-right font-medium">
              近況
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const team = teamRefOf(row.teamId);
            const status = qualMap.get(row.teamId) ?? 'pending';
            return (
              <motion.tr
                key={row.teamId}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.3, delay: Math.min(i, 11) * 0.03, ease: EASE }}
                onClick={() => navigate(`/teams/${row.teamId}`)}
                className={cn(
                  'h-12 cursor-pointer border-b border-border transition-colors duration-200 last:border-b-0 hover:bg-surface-2',
                  i % 2 === 1 && 'bg-surface-2',
                )}
              >
                <td className="relative py-2 pl-3 pr-1">
                  <ZoneBar position={row.position} />
                  <span className="font-num tnum text-text-3">{row.position}</span>
                </td>
                <th scope="row" className="px-2 py-2 text-left font-normal">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Link
                      to={`/teams/${row.teamId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex min-w-0 items-center gap-2 rounded-sm transition-colors duration-200 hover:text-accent"
                    >
                      <Crest team={team} size={24} />
                      <span className="truncate text-sm font-medium text-foreground">{team.name}</span>
                      <span className="hidden font-num text-caption text-text-3 sm:inline">{team.shortName}</span>
                    </Link>
                    <motion.span
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      <QualTag status={status} position={row.position} />
                    </motion.span>
                    {row.tiebreakNote && (
                      <span className="w-full text-caption text-warn">{row.tiebreakNote}</span>
                    )}
                  </span>
                </th>
                <td className="px-1 py-2 text-center font-num tnum text-text-2">{row.played}</td>
                <td className="hidden px-1 py-2 text-center font-num tnum text-text-2 md:table-cell">{row.won}</td>
                <td className="hidden px-1 py-2 text-center font-num tnum text-text-2 md:table-cell">{row.drawn}</td>
                <td className="hidden px-1 py-2 text-center font-num tnum text-text-2 md:table-cell">{row.lost}</td>
                <td className="hidden px-1 py-2 text-center font-num tnum text-text-2 md:table-cell">
                  {row.goalsFor}
                </td>
                <td className="hidden px-1 py-2 text-center font-num tnum text-text-2 md:table-cell">
                  {row.goalsAgainst}
                </td>
                <td className="px-1 py-2 text-center font-num tnum text-text-2">{gdLabel(row.goalDifference)}</td>
                <td className="px-1 py-2 text-center font-num text-base font-bold tnum text-foreground">
                  {row.points}
                </td>
                <td className="py-2 pl-2 pr-3 text-right">
                  <FormDots form={formMap.get(row.teamId) ?? []} className="justify-end" />
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
