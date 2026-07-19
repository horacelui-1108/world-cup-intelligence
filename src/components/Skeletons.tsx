import { cn } from '@/lib/utils';

/**
 * design.md §6.8 — shimmer skeleton blocks shaped to match final layouts.
 * Never spinners alone.
 */

function Bone({ className }: { className?: string }) {
  return <div className={cn('skeleton-shimmer rounded-md', className)} aria-hidden />;
}

/** Single match row: crest + names + time/score */
export function MatchRowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-md border border-border bg-surface p-3', className)}>
      <Bone className="h-6 w-6 rounded-full" />
      <div className="flex-1 space-y-2">
        <Bone className="h-3 w-2/5" />
        <Bone className="h-3 w-3/5" />
      </div>
      <Bone className="h-6 w-12" />
    </div>
  );
}

/** Wide match banner card (home 今日比賽 shape) */
export function MatchCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-md border border-border bg-surface p-5', className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bone className="h-10 w-10 rounded-full" />
          <Bone className="h-4 w-20" />
        </div>
        <Bone className="h-8 w-16" />
        <div className="flex items-center gap-3">
          <Bone className="h-4 w-20" />
          <Bone className="h-10 w-10 rounded-full" />
        </div>
      </div>
      <Bone className="mt-4 h-3 w-1/2" />
    </div>
  );
}

/** Standings/table rows */
export function TableSkeleton({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-md border border-border bg-surface', className)}>
      <div className="border-b border-border p-3">
        <Bone className="h-3 w-1/3" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Bone className="h-3 w-4" />
            <Bone className="h-6 w-6 rounded-full" />
            <Bone className="h-3 flex-1" />
            <Bone className="h-3 w-8" />
            <Bone className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Stat comparison bars */
export function StatBarSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-4 rounded-md border border-border bg-surface p-5', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Bone className="mx-auto h-3 w-24" />
          <div className="flex items-center gap-2">
            <Bone className="h-2.5 flex-1" />
            <Bone className="h-2.5 flex-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Hero block (text bars + countdown) */
export function HeroSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-24', className)}>
      <Bone className="h-3 w-48" />
      <Bone className="mt-5 h-10 w-72 max-w-full" />
      <Bone className="mt-3 h-6 w-56 max-w-full" />
      <div className="mt-8 flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-16 w-14" />
        ))}
      </div>
      <Bone className="mt-8 h-11 w-44" />
    </div>
  );
}

/** Article/analysis card */
export function ArticleCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-md border border-border bg-surface', className)}>
      <Bone className="aspect-video w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Bone className="h-4 w-4/5" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-3/5" />
      </div>
    </div>
  );
}

/** Team tile */
export function TeamTileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center rounded-md border border-border bg-surface p-5', className)}>
      <Bone className="h-16 w-16 rounded-full" />
      <Bone className="mt-3 h-4 w-20" />
      <Bone className="mt-2 h-3 w-14" />
    </div>
  );
}
