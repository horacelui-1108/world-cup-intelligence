import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Match } from '@/types/football';
import { getTeamById } from '@/data/teams';
import { useTimezone } from '@/lib/timezone';
import { kickoffLabel } from '@/lib/format';
import { teamRefOf } from '@/pages/standings/teamRef';
import type { NodeStatus } from '@/pages/bracket/bracketModel';

interface BracketNodeProps {
  match: Match;
  status: NodeStatus;
  winnerId?: string;
  roundLabel: string;
  /** 季軍戰節點用虛線框 */
  dashed?: boolean;
  onHover?: (matchId: string | null) => void;
  style?: CSSProperties;
}

function StatusChip({ match, status, tzLabel }: { match: Match; status: NodeStatus; tzLabel: string }) {
  if (status === 'decided') {
    return (
      <span className="inline-flex items-center rounded-full border border-border-strong px-1.5 py-px text-[10px] font-medium text-text-2">
        完場
      </span>
    );
  }
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-live px-1.5 py-px text-[10px] font-semibold text-live">
        <span aria-hidden className="h-1 w-1 rounded-full bg-live animate-live-pulse" />
        {match.status === 'ht' ? '半場' : 'LIVE'}
      </span>
    );
  }
  if (match.status === 'postponed') {
    return (
      <span className="inline-flex items-center rounded-full border border-border px-1.5 py-px text-[10px] font-medium text-text-3">
        延期
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-warn px-1.5 py-px text-[10px] font-medium text-warn"
      title={`開賽時間（${tzLabel}）`}
    >
      待定
    </span>
  );
}

function TeamRow({
  teamId,
  score,
  isWinner,
  decided,
}: {
  teamId: string;
  score?: number;
  isWinner: boolean;
  decided: boolean;
}) {
  const known = getTeamById(teamId) !== undefined;
  const team = teamRefOf(teamId);

  if (!known) {
    return (
      <span className="flex items-center gap-1.5 rounded-sm border border-dashed border-border px-1.5 py-1">
        <span className="text-caption text-text-3">待定</span>
      </span>
    );
  }

  return (
    <Link
      to={`/teams/${team.id}`}
      onClick={(e) => e.stopPropagation()}
      aria-label={`前往${team.name}球隊頁`}
      className="pointer-events-auto relative z-10 flex min-w-0 items-center gap-1.5 rounded-sm px-1 py-0.5 transition-colors duration-200 hover:bg-surface-2"
    >
      <img src={team.crest} alt="" width={20} height={20} loading="lazy" className="h-5 w-5 shrink-0 rounded-full" />
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-caption',
          decided ? (isWinner ? 'font-semibold text-foreground' : 'text-text-3') : 'font-medium text-text-2',
        )}
      >
        {team.name}
      </span>
      {decided && isWinner && <Check className="h-3 w-3 shrink-0 text-accent" strokeWidth={2.5} aria-hidden />}
      {decided && (
        <span
          className={cn(
            'shrink-0 font-num text-sm font-bold tnum',
            isWinner ? 'text-foreground' : 'text-text-3',
          )}
        >
          {score}
        </span>
      )}
    </Link>
  );
}

/**
 * bracket.md §2 — 淘汰賽節點（220×78）：crest、隊名或 TBD、比分、
 * 十二碼比分、狀態（decided/live/tbd）。click → /matches/:matchId。
 */
export default function BracketNode({ match, status, winnerId, roundLabel, dashed, onHover, style }: BracketNodeProps) {
  const { timeZone, label: tzLabel } = useTimezone();
  const decided = status === 'decided';
  const teamsKnown = getTeamById(match.homeTeamId) !== undefined && getTeamById(match.awayTeamId) !== undefined;
  const clickable = teamsKnown; // TBD 節點唔可以 click

  const home = teamRefOf(match.homeTeamId);
  const away = teamRefOf(match.awayTeamId);
  const pens = match.score.penalties;
  const wentExtraTime = match.score.extraTime != null && !pens;

  const ariaLabel = decided
    ? `${roundLabel}：${home.name} ${match.score.home} 比 ${match.score.away} ${away.name}${
        pens ? `，互射十二碼 ${pens.home} 比 ${pens.away}` : ''
      }，完場`
    : status === 'live'
      ? `${roundLabel}：${home.name} 對 ${away.name}，直播中`
      : `${roundLabel}：${home.name} 對 ${away.name}，${kickoffLabel(match.kickoffUtc, timeZone)}（${tzLabel}）開賽`;

  const body = (
    <>
      {/* 頂行：開賽時間 caption + 狀態 chip */}
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="font-num text-[10px] tnum text-text-3">
          {kickoffLabel(match.kickoffUtc, timeZone)}
          <span className="ml-1">{tzLabel}</span>
        </span>
        <StatusChip match={match} status={status} tzLabel={tzLabel} />
      </div>
      <div className="mt-1 space-y-0.5">
        <TeamRow
          teamId={match.homeTeamId}
          score={match.score.home}
          isWinner={winnerId === match.homeTeamId}
          decided={decided}
        />
        <TeamRow
          teamId={match.awayTeamId}
          score={match.score.away}
          isWinner={winnerId === match.awayTeamId}
          decided={decided}
        />
      </div>
      {pens && decided && (
        <p className="mt-0.5 px-1 font-num text-[10px] tnum text-text-3">
          互射十二碼 {pens.home}–{pens.away}
        </p>
      )}
      {wentExtraTime && decided && <p className="mt-0.5 px-1 text-[10px] text-text-3">加時分勝負</p>}
    </>
  );

  return (
    <motion.div
      style={style}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => onHover?.(match.matchId)}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        'absolute rounded-md border bg-surface transition-colors duration-200',
        dashed ? 'border-dashed border-border-strong' : 'border-border',
        clickable && 'hover:border-border-strong',
      )}
    >
      {clickable ? (
        <div className="relative h-full w-full p-1.5">
          <Link to={`/matches/${match.matchId}`} aria-label={ariaLabel} className="absolute inset-0 rounded-md" />
          <div className="pointer-events-none relative flex h-full flex-col">{body}</div>
        </div>
      ) : (
        <div className="h-full w-full p-1.5" role="group" aria-label={ariaLabel}>
          {body}
        </div>
      )}
    </motion.div>
  );
}
