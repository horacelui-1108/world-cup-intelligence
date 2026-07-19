import { Link } from 'react-router';
import { motion } from 'framer-motion';
import type { GoalEvent, Player } from '@/types/football';
import EmptyState from '@/components/EmptyState';
import { Crest } from '@/components/TeamChip';
import { useTimezone } from '@/lib/timezone';
import { kickoffLabel } from '@/lib/format';
import { formatMinute, resultFor, stageLabel, teamRefById, type PlayerMatchContribution } from '../team/data';
import { ResultChip } from '../team/widgets';

interface MatchLogProps {
  player: Player;
  contributions: PlayerMatchContribution[];
}

/** 貢獻事件字串，如「入球 ×2（55'、85'）」、「助攻 ×1」、「十二碼入球」 */
function contributionLabel(goals: GoalEvent[], assists: GoalEvent[]): string {
  const parts: string[] = [];
  if (goals.length > 0) {
    const pens = goals.filter((g) => g.kind === 'pen_goal').length;
    const regular = goals.length - pens;
    const minutes = goals.map((g) => g.minute).filter((m): m is number => m !== null);
    const minuteStr = minutes.length > 0 ? `（${minutes.map(formatMinute).join('、')}）` : '';
    if (regular > 0) parts.push(`入球${regular > 1 ? ` ×${regular}` : ''}${minuteStr}`);
    if (pens > 0) parts.push(`十二碼入球${pens > 1 ? ` ×${pens}` : ''}`);
  }
  if (assists.length > 0) {
    parts.push(`助攻${assists.length > 1 ? ` ×${assists.length}` : ''}`);
  }
  return parts.join(' · ');
}

/**
 * player.md §3 — 逐場紀錄：列出該球員有入球 / 助攻事件嘅場次。
 * 對手欄 → 球隊頁；行本身 → Match Centre（stretched-link pattern）。
 */
export default function MatchLog({ player, contributions }: MatchLogProps) {
  const { timeZone } = useTimezone();

  if (contributions.length === 0) {
    return (
      <EmptyState
        compact
        title="本賽事暫無入球或助攻紀錄"
        description="逐場紀錄只列出有入球或助攻貢獻嘅場次；呢位球員暫時未有相關紀錄。"
      />
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-md border border-border bg-surface md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">{player.nameZh}逐場入球及助攻紀錄</caption>
          <thead>
            <tr className="border-b border-border text-left text-label text-text-3">
              <th scope="col" className="px-4 py-2.5 font-medium">日期</th>
              <th scope="col" className="px-4 py-2.5 font-medium">階段</th>
              <th scope="col" className="px-4 py-2.5 font-medium">對手</th>
              <th scope="col" className="px-4 py-2.5 font-medium">賽果</th>
              <th scope="col" className="px-4 py-2.5 font-medium">貢獻</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contributions.map(({ match, goals, assists }) => {
              const isHome = match.homeTeamId === player.teamId;
              const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
              const opponent = teamRefById(opponentId);
              const r = resultFor(player.teamId, match);
              const gf = isHome ? match.score.home : match.score.away;
              const ga = isHome ? match.score.away : match.score.home;
              return (
                <tr key={match.matchId} className="group relative transition-colors duration-150 hover:bg-surface-2">
                  <td className="px-4 py-3 font-num text-text-2 tnum">
                    <Link
                      to={`/matches/${match.matchId}`}
                      className="after:absolute after:inset-0"
                      aria-label={`${stageLabel(match)}對${opponent.name}，Match Centre`}
                    >
                      {kickoffLabel(match.kickoffUtc, timeZone)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-2">{stageLabel(match)}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/teams/${opponent.id}`}
                      className="relative z-10 inline-flex items-center gap-2 rounded-sm transition-colors hover:text-accent"
                      aria-label={`對手：${opponent.name}球隊頁`}
                    >
                      <Crest team={opponent} size={24} />
                      <span className="font-medium text-foreground">{opponent.name}</span>
                      <span className="font-num text-caption text-text-3">{opponent.shortName}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      {r && <ResultChip result={r.result} />}
                      <span className="font-num font-semibold tnum text-foreground">
                        {gf}–{ga}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-accent">{contributionLabel(goals, assists)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <ul className="space-y-2 md:hidden">
        {contributions.map(({ match, goals, assists }, i) => {
          const isHome = match.homeTeamId === player.teamId;
          const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
          const opponent = teamRefById(opponentId);
          const r = resultFor(player.teamId, match);
          const gf = isHome ? match.score.home : match.score.away;
          const ga = isHome ? match.score.away : match.score.home;
          return (
            <motion.li
              key={match.matchId}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-5% 0px' }}
              transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-md border border-border bg-surface p-3 transition-colors duration-150 hover:border-border-strong"
            >
              <Link
                to={`/matches/${match.matchId}`}
                className="absolute inset-0 rounded-md"
                aria-label={`${stageLabel(match)}對${opponent.name}，Match Centre`}
              />
              <div className="pointer-events-none flex items-center justify-between gap-2 text-caption text-text-3">
                <span>{kickoffLabel(match.kickoffUtc, timeZone)}</span>
                <span>{stageLabel(match)}</span>
              </div>
              <div className="pointer-events-none mt-2 flex items-center justify-between gap-3">
                <Link
                  to={`/teams/${opponent.id}`}
                  className="pointer-events-auto relative z-10 inline-flex min-w-0 items-center gap-2 rounded-sm"
                  aria-label={`對手：${opponent.name}球隊頁`}
                >
                  <Crest team={opponent} size={24} />
                  <span className="truncate text-sm font-medium text-foreground">{opponent.name}</span>
                </Link>
                <span className="inline-flex shrink-0 items-center gap-2">
                  {r && <ResultChip result={r.result} />}
                  <span className="font-num text-base font-bold tnum text-foreground">
                    {gf}–{ga}
                  </span>
                </span>
              </div>
              <p className="pointer-events-none mt-2 text-sm text-accent">{contributionLabel(goals, assists)}</p>
            </motion.li>
          );
        })}
      </ul>
    </>
  );
}
