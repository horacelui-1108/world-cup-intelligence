import { Link } from 'react-router';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MatchRef } from '@/lib/types';
import { useTimezone } from '@/lib/timezone';
import { kickoffLabel, timeLabel } from '@/lib/format';
import { Crest } from '@/components/TeamChip';
import DataStatusBadge from '@/components/DataStatusBadge';

interface MatchCardProps {
  match: MatchRef;
  variant?: 'banner' | 'compact' | 'result';
  className?: string;
}

function ScoreOrTime({ match, big }: { match: MatchRef; big?: boolean }) {
  const { timeZone, label } = useTimezone();
  if (match.status === 'scheduled') {
    return (
      <span
        className={cn('font-num font-bold text-gold tnum', big ? 'text-3xl' : 'text-base')}
        title={`開賽時間(${label})`}
      >
        {timeLabel(match.kickoffUtc, timeZone)}
      </span>
    );
  }
  return (
    <span
      className={cn('font-num font-bold tnum', big ? 'text-3xl' : 'text-base', {
        'text-live': match.status === 'live',
        'text-foreground': match.status === 'finished',
      })}
    >
      {match.homeScore}–{match.awayScore}
    </span>
  );
}

function StatusChip({ match }: { match: MatchRef }) {
  if (match.status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-live/50 px-2 py-0.5 text-caption font-semibold text-live">
        <span className="h-1.5 w-1.5 rounded-full bg-live animate-live-pulse" aria-hidden />
        LIVE {match.minute != null ? `${match.minute}'` : ''}
      </span>
    );
  }
  if (match.status === 'finished') {
    return (
      <span className="inline-flex items-center rounded-full border border-border-strong px-2 py-0.5 text-caption font-medium text-text-2">
        完場
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-caption font-medium text-text-3">
      未開始
    </span>
  );
}

/**
 * design.md §6.4 — scheduled / live / finished states; whole card links to
 * /matches/:id; hover strengthens border and lifts -2px.
 */
export default function MatchCard({ match, variant = 'compact', className }: MatchCardProps) {
  const { timeZone, label } = useTimezone();
  const knockout = !match.group;

  if (variant === 'banner') {
    return (
      <Link
        to={`/matches/${match.id}`}
        aria-label={`${match.home.name} 對 ${match.away.name},${match.stage}`}
        className={cn(
          'group block rounded-md border border-border bg-surface p-5 transition-all duration-200',
          'hover:-translate-y-0.5 hover:border-border-strong',
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <p className={cn('text-caption', knockout ? 'text-gold' : 'text-text-3')}>{match.stage}</p>
          <StatusChip match={match} />
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-6">
          <div className="flex items-center gap-3 transition-transform duration-200 group-hover:-translate-x-1">
            <Crest team={match.home} size={48} className="max-md:!w-9 max-md:!h-9" />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold text-foreground">{match.home.name}</p>
              <p className="font-num text-caption text-text-3">{match.home.shortName}</p>
            </div>
          </div>
          <div className="text-center">
            <ScoreOrTime match={match} big />
            <p className="mt-1 text-caption text-text-3">
              {match.status === 'scheduled'
                ? `${kickoffLabel(match.kickoffUtc, timeZone)} ${label}`
                : match.status === 'live'
                  ? '進行中'
                  : '全場完'}
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 text-right transition-transform duration-200 group-hover:translate-x-1">
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold text-foreground">{match.away.name}</p>
              <p className="font-num text-caption text-text-3">{match.away.shortName}</p>
            </div>
            <Crest team={match.away} size={48} className="max-md:!w-9 max-md:!h-9" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 text-caption text-text-3">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            {match.venue}
          </span>
          <DataStatusBadge status={match.meta.dataStatus} meta={match.meta} />
        </div>
      </Link>
    );
  }

  if (variant === 'result') {
    return (
      <Link
        to={`/matches/${match.id}`}
        aria-label={`${match.home.name} ${match.homeScore} 比 ${match.awayScore} ${match.away.name},${match.stage}`}
        className={cn(
          'group block h-full rounded-md border border-border bg-surface p-4 transition-all duration-200',
          'hover:-translate-y-0.5 hover:border-border-strong',
          className,
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-caption', knockout ? 'text-gold' : 'text-text-3')}>{match.stage}</p>
          <StatusChip match={match} />
        </div>
        <div className="mt-3 space-y-2">
          {([match.home, match.away] as const).map((t, i) => {
            const score = i === 0 ? match.homeScore : match.awayScore;
            const other = i === 0 ? match.awayScore : match.homeScore;
            const winner = (score ?? 0) > (other ?? 0);
            return (
              <div key={t.id} className="flex items-center gap-2">
                <Crest team={t} size={24} />
                <span className={cn('flex-1 truncate text-sm', winner ? 'font-medium text-foreground' : 'text-text-2')}>
                  {t.name}
                </span>
                <span className={cn('font-num text-base font-bold tnum', winner ? 'text-foreground' : 'text-text-2')}>
                  {score}
                </span>
              </div>
            );
          })}
        </div>
        {match.scorers && match.scorers.length > 0 && (
          <p className="mt-3 truncate border-t border-border pt-2 text-caption text-text-3">
            入球:{match.scorers.join('、')}
          </p>
        )}
      </Link>
    );
  }

  // compact
  return (
    <Link
      to={`/matches/${match.id}`}
      aria-label={`${match.home.name} 對 ${match.away.name},${match.stage}`}
      className={cn(
        'group flex items-center gap-3 rounded-md border border-border bg-surface p-3 transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-border-strong',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className={cn('text-caption', knockout ? 'text-gold' : 'text-text-3')}>{match.stage}</p>
        <div className="mt-1 space-y-1">
          <div className="flex items-center gap-2">
            <Crest team={match.home} size={24} />
            <span className="truncate text-sm font-medium text-foreground">{match.home.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Crest team={match.away} size={24} />
            <span className="truncate text-sm font-medium text-foreground">{match.away.name}</span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <ScoreOrTime match={match} />
        <span className="text-caption text-text-3">
          {match.status === 'scheduled' ? label : match.status === 'live' ? '進行中' : '完場'}
        </span>
      </div>
    </Link>
  );
}
