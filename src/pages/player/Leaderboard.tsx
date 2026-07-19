import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion, useInView } from 'framer-motion';
import type { Player } from '@/types/football';
import type { TopScorer } from '@/lib/provider/types';
import { Crest } from '@/components/TeamChip';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { teamRefById } from '../team/data';
import { SegmentedControl } from '../team/widgets';

interface LeaderboardProps {
  player: Player;
  scorers: TopScorer[];
}

interface BoardRow {
  player: Player;
  value: number;
  rank: number;
}

function BoardCard({
  title,
  rows,
  unit,
  viewer,
  maxValue,
}: {
  title: string;
  rows: BoardRow[];
  unit: string;
  viewer?: Player;
  maxValue: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const top5 = rows.slice(0, 5);
  const viewerRow = viewer ? rows.find((r) => r.player.id === viewer.id) : undefined;
  const viewerOutside = viewerRow !== undefined && viewerRow.rank > 5;
  const shown = viewerOutside ? [...top5, viewerRow] : top5;

  return (
    <div ref={ref} className="rounded-md border border-border bg-surface p-4 md:p-5">
      <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
      <ol className="mt-3 space-y-1.5">
        {shown.map((row, i) => {
          const isViewer = viewer?.id === row.player.id;
          const team = teamRefById(row.player.teamId);
          return (
            <li key={row.player.id}>
              {viewerOutside && i === 5 && (
                <span aria-hidden className="my-1 block border-t border-border" />
              )}
              <Link
                to={`/players/${row.player.id}`}
                aria-current={isViewer ? 'true' : undefined}
                className={cn(
                  'relative flex items-center gap-2.5 overflow-hidden rounded-sm border-l-2 px-2 py-1.5 transition-colors duration-150',
                  isViewer ? 'border-accent bg-accent/10' : 'border-transparent hover:bg-surface-2',
                )}
              >
                <motion.span
                  aria-hidden
                  className="absolute inset-y-0 left-0 bg-surface-2/70"
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${maxValue > 0 ? (row.value / maxValue) * 100 : 0}%` } : { width: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                />
                <span className="relative w-5 text-right font-num text-caption tnum text-text-3">{row.rank}</span>
                <Crest team={team} size={24} className="relative" />
                <span
                  className={cn(
                    'relative min-w-0 flex-1 truncate text-sm',
                    isViewer ? 'font-bold text-foreground' : 'text-text-2',
                  )}
                >
                  {row.player.nameZh}
                  {isViewer && <span className="ml-1.5 text-caption font-medium text-accent">（你正在查看的球員）</span>}
                </span>
                <span className="relative font-num text-sm font-bold tnum text-foreground">
                  {row.value}
                  <span className="ml-1 text-caption font-normal text-text-3">{unit}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * player.md §4 — 賽事榜單位置：神射手 / 助攻王 mini-leaderboard +
 * 「完整榜單」modal（可按入球 / 助攻排序）。球員排名如有會標出。
 */
export default function Leaderboard({ player, scorers }: LeaderboardProps) {
  const [sortKey, setSortKey] = useState<'goals' | 'assists'>('goals');

  const goalRows: BoardRow[] = useMemo(
    () =>
      scorers.map((s, i) => ({ player: s.player, value: s.goals, rank: i + 1 })),
    [scorers],
  );

  const assistRows: BoardRow[] = useMemo(
    () =>
      scorers
        .filter((s) => s.assists !== undefined)
        .map((s) => ({ player: s.player, value: s.assists ?? 0, goals: s.goals }))
        .sort((a, b) => b.value - a.value || b.goals - a.goals)
        .map((s, i) => ({ player: s.player, value: s.value, rank: i + 1 })),
    [scorers],
  );

  const viewerScorerRank = goalRows.find((r) => r.player.id === player.id)?.rank;

  const fullList = useMemo(() => {
    const rows = scorers.map((s) => ({
      player: s.player,
      goals: s.goals,
      assists: s.assists,
    }));
    if (sortKey === 'assists') {
      rows.sort((a, b) => (b.assists ?? -1) - (a.assists ?? -1) || b.goals - a.goals);
    } else {
      rows.sort((a, b) => b.goals - a.goals || (b.assists ?? -1) - (a.assists ?? -1));
    }
    return rows;
  }, [scorers, sortKey]);

  if (goalRows.length === 0) return null;

  return (
    <section aria-labelledby="leaderboard-context">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 id="leaderboard-context" className="font-display text-xl font-semibold text-foreground md:text-2xl">
            賽事榜單
          </h2>
          <p className="mt-1 text-caption text-text-3">
            {viewerScorerRank !== undefined
              ? `${player.nameZh}而家排射手榜第 ${viewerScorerRank}`
              : '呢位球員暫時未上射手榜'}
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="inline-flex min-h-9 shrink-0 items-center rounded-md border border-border-strong px-3 text-sm font-medium text-text-2 transition-colors duration-200 hover:border-accent hover:text-accent"
            >
              完整榜單
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-lg border-border bg-surface">
            <DialogHeader>
              <DialogTitle className="font-display text-foreground">射手榜及助攻榜</DialogTitle>
              <DialogDescription className="text-caption text-text-3">
                只列有核實入球數據嘅球員；助攻欄留空代表未有核實數據。
              </DialogDescription>
            </DialogHeader>
            <SegmentedControl<'goals' | 'assists'>
              id="leaderboard-sort"
              ariaLabel="榜單排序"
              options={[
                { value: 'goals', label: '按入球' },
                { value: 'assists', label: '按助攻' },
              ]}
              value={sortKey}
              onChange={setSortKey}
            />
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-label text-text-3">
                    <th scope="col" className="px-2 py-2 font-medium">#</th>
                    <th scope="col" className="px-2 py-2 font-medium">球員</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">入球</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">助攻</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fullList.map((row, i) => {
                    const team = teamRefById(row.player.teamId);
                    const isViewer = row.player.id === player.id;
                    return (
                      <tr key={row.player.id} className={cn(isViewer && 'bg-accent/10')}>
                        <td className="px-2 py-2 font-num text-caption tnum text-text-3">{i + 1}</td>
                        <td className="px-2 py-2">
                          <Link
                            to={`/players/${row.player.id}`}
                            className="inline-flex items-center gap-2 rounded-sm hover:text-accent"
                          >
                            <Crest team={team} size={24} />
                            <span className={cn('font-medium', isViewer ? 'text-accent' : 'text-foreground')}>
                              {row.player.nameZh}
                            </span>
                            <span className="font-num text-caption text-text-3">{team.shortName}</span>
                          </Link>
                        </td>
                        <td className="px-2 py-2 text-right font-num font-bold tnum text-foreground">{row.goals}</td>
                        <td className="px-2 py-2 text-right font-num tnum text-text-2">{row.assists ?? ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <BoardCard
          title="神射手"
          rows={goalRows}
          unit="球"
          viewer={player}
          maxValue={goalRows[0]?.value ?? 0}
        />
        {assistRows.length > 0 && (
          <BoardCard
            title="助攻王"
            rows={assistRows}
            unit="次"
            viewer={player}
            maxValue={assistRows[0]?.value ?? 0}
          />
        )}
      </div>
    </section>
  );
}
