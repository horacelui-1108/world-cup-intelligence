import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import type { Match } from '@/types/football';
import { cn } from '@/lib/utils';
import { useTimezone } from '@/lib/timezone';
import { kickoffLabelWithWeekday, timeLabel } from '@/lib/format';
import { Crest } from '@/components/TeamChip';
import {
  formatMinute,
  isKnockout,
  stageChipLabel,
  stageFullLabel,
  statusText,
  toTeamRef,
  uiStatus,
} from './model';

interface ScheduleRowProps {
  match: Match;
  /** live 賽事嘅即時分鐘（provider 無提供時顯示 LIVE） */
  liveMinute?: number | null;
}

/**
 * schedule.md §2 — 賽程核心 row：
 * [開賽時間/狀態] [主隊 crest+名] [比分/VS] [客隊 crest+名] [階段 chip] [chevron]
 * 全行為通往 /matches/:matchId 嘅連結。
 */
export default function ScheduleRow({ match, liveMinute }: ScheduleRowProps) {
  const { timeZone } = useTimezone();
  const status = uiStatus(match.status);
  const knockout = isKnockout(match);
  const home = toTeamRef(match.homeTeamId);
  const away = toTeamRef(match.awayTeamId);

  const ariaLabel = [
    `${kickoffLabelWithWeekday(match.kickoffUtc, timeZone)}（${timeZone === 'Asia/Hong_Kong' ? 'HKT' : '本地'}）`,
    `${home.name} 對 ${away.name}`,
    stageFullLabel(match),
    status === 'finished' || status === 'live'
      ? `${statusText(match)}，比數 ${match.score.home} 比 ${match.score.away}`
      : statusText(match),
  ].join('，');

  return (
    <Link
      to={`/matches/${match.matchId}`}
      aria-label={ariaLabel}
      className="group flex min-h-16 items-center gap-2 px-3 py-2.5 transition-colors duration-200 hover:bg-surface-2 md:min-h-14 md:gap-3 md:px-4"
    >
      {/* 時間 / 狀態欄（Inter tabular 14px；live 紅色） */}
      <span className="flex w-12 shrink-0 flex-col items-center justify-center" aria-hidden>
        {status === 'scheduled' && (
          <span className="font-num text-sm font-medium text-foreground tnum">
            {timeLabel(match.kickoffUtc, timeZone)}
          </span>
        )}
        {status === 'live' && (
          <span className="inline-flex items-center gap-1 font-num text-sm font-semibold text-live tnum">
            <span className="h-1.5 w-1.5 rounded-full bg-live animate-live-pulse" />
            {liveMinute != null ? formatMinute(liveMinute) : 'LIVE'}
          </span>
        )}
        {status === 'finished' && (
          <span className="font-num text-caption font-semibold tracking-wide text-text-3">FT</span>
        )}
        {status === 'postponed' && <span className="text-caption font-medium text-warn">延期</span>}
      </span>

      {/* 主隊（右對齊） */}
      <span className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
        <span className="truncate text-sm font-medium text-foreground">{home.name}</span>
        <Crest team={home} size={24} />
      </span>

      {/* 比分 / VS */}
      <span className="w-14 shrink-0 text-center" aria-hidden>
        {status === 'live' || status === 'finished' ? (
          <span
            className={cn(
              'font-num text-lg font-bold tnum',
              status === 'live' ? 'text-live' : 'text-foreground',
            )}
          >
            {match.score.home}–{match.score.away}
          </span>
        ) : (
          <span className="text-caption font-medium tracking-wide text-text-3">VS</span>
        )}
      </span>

      {/* 客隊（左對齊） */}
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <Crest team={away} size={24} />
        <span className="truncate text-sm font-medium text-foreground">{away.name}</span>
      </span>

      {/* 階段 chip（淘汰賽金色邊） */}
      <span
        aria-hidden
        className={cn(
          'hidden shrink-0 rounded-full border px-2 py-0.5 text-caption font-medium md:inline-flex',
          knockout ? 'border-gold/50 text-gold' : 'border-border text-text-3',
        )}
      >
        {stageChipLabel(match)}
      </span>

      <ChevronRight
        className="h-4 w-4 shrink-0 text-text-3 transition-transform duration-200 group-hover:translate-x-0.5"
        strokeWidth={1.5}
        aria-hidden
      />
    </Link>
  );
}
