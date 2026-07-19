import { cn } from '@/lib/utils';
import type { DataStatus, SourceMeta } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatInTimeZone } from 'date-fns-tz';

interface DataStatusBadgeProps {
  status: DataStatus;
  meta?: SourceMeta;
  className?: string;
}

const styles: Record<DataStatus, { label: string; className: string; dot?: string; pulse?: boolean }> = {
  LIVE: {
    label: '直播',
    className: 'border-live/50 text-live',
    dot: 'bg-live',
    pulse: true,
  },
  FINAL: {
    label: '完場',
    className: 'border-border-strong text-text-2',
    dot: 'bg-text-3',
  },
  VERIFIED: {
    label: '已核實',
    className: 'border-accent/50 text-accent',
    dot: 'bg-accent',
  },
  PENDING: {
    label: '待定',
    className: 'border-warn/50 text-warn',
    dot: 'bg-warn',
  },
  DEMO: {
    label: '示範數據',
    className: 'border-transparent bg-info-bg text-text-2',
    dot: 'bg-text-3',
  },
};

/**
 * design.md §6.3 — mandatory wherever provider data renders.
 */
export default function DataStatusBadge({ status, meta, className }: DataStatusBadgeProps) {
  const s = styles[status];
  const badge = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-caption font-medium whitespace-nowrap',
        s.className,
        className,
      )}
      data-status={status}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot, s.pulse && 'animate-live-pulse')} aria-hidden />
      {status === 'LIVE' ? 'LIVE' : s.label}
    </span>
  );

  if (status === 'DEMO' && meta) {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="inline-flex cursor-help" aria-label="示範數據來源資料">
              {badge}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-64 text-caption">
            <p className="font-medium">{meta.source}</p>
            {meta.sourceUrl && <p className="break-all opacity-80">{meta.sourceUrl}</p>}
            <p className="opacity-80">
              擷取時間：
              {formatInTimeZone(new Date(meta.retrievedAt), 'Asia/Hong_Kong', 'yyyy-MM-dd HH:mm')} HKT
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
