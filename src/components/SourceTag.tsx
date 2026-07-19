import { useId } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatInTimeZone } from 'date-fns-tz';
import { cn } from '@/lib/utils';

export interface SourceRef {
  name: string;
  url?: string;
  retrievedAt?: string;
}

interface SourceTagProps {
  /** 1-based citation index, renders 〔S1〕 etc. */
  index: number;
  source: SourceRef;
  className?: string;
}

/**
 * design.md §6.10 — superscript citation chip used inside analysis.
 * Hover/tap opens popover with source name, URL, retrievedAt.
 */
export default function SourceTag({ index, source, className }: SourceTagProps) {
  const id = useId();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-describedby={id}
          className={cn(
            'inline-flex items-baseline rounded px-0.5 align-super text-[0.68em] font-semibold text-accent',
            'hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2',
            'cursor-pointer transition-colors duration-200',
            className,
          )}
          aria-label={`來源 S${index}:${source.name}`}
        >
          〔S{index}〕
        </button>
      </PopoverTrigger>
      <PopoverContent id={id} side="top" className="w-72 border-border bg-popover p-3 text-caption">
        <p className="text-label text-text-3">來源 S{index}</p>
        <p className="mt-1 text-sm font-medium text-foreground">{source.name}</p>
        {source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block break-all text-accent underline-offset-2 hover:underline"
          >
            {source.url}
          </a>
        )}
        {source.retrievedAt && (
          <p className="mt-1 text-text-3">
            擷取時間:{formatInTimeZone(new Date(source.retrievedAt), 'Asia/Hong_Kong', 'yyyy-MM-dd HH:mm')} HKT
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
