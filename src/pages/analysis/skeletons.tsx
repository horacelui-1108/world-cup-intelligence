/**
 * 分析頁 skeleton — 形狀對應最終排版（design §6.8：唔好齋用 spinner）。
 */
import { cn } from '@/lib/utils';

function Bone({ className }: { className?: string }) {
  return <div className={cn('skeleton-shimmer rounded-md', className)} aria-hidden />;
}

/** 列表頁：featured + 卡片流 */
export function AnalysisListSkeleton() {
  return (
    <div aria-busy="true" aria-label="分析載入中">
      {/* featured */}
      <div className="grid overflow-hidden rounded-md border border-border bg-surface md:grid-cols-[55%_1fr]">
        <Bone className="min-h-48 rounded-none md:min-h-72" />
        <div className="space-y-3 p-5 md:p-6">
          <Bone className="h-5 w-24" />
          <Bone className="h-8 w-4/5" />
          <Bone className="h-16 w-full" />
          <Bone className="h-3 w-3/5" />
          <Bone className="h-11 w-36" />
        </div>
      </div>
      {/* filter bar */}
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bone key={i} className="h-9 w-20 rounded-full" />
        ))}
      </div>
      {/* cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-md border border-border bg-surface p-4">
            <div className="flex items-center gap-2">
              <Bone className="h-5 w-16 rounded-full" />
              <Bone className="h-5 w-20 rounded-full" />
              <Bone className="ml-auto h-3 w-14" />
            </div>
            <Bone className="mt-3 h-6 w-4/5" />
            <div className="mt-3 flex items-center gap-3">
              <Bone className="h-6 w-6 rounded-full" />
              <Bone className="h-3 w-12" />
              <Bone className="h-6 w-6 rounded-full" />
              <Bone className="h-3 w-12" />
            </div>
            <Bone className="mt-3 h-3 w-full" />
            <Bone className="mt-2 h-3 w-3/5" />
            <Bone className="mt-3 h-3 w-2/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** 詳情頁：hero + TL;DR + 段落（長短不一） */
export function AnalysisArticleSkeleton() {
  return (
    <div aria-busy="true" aria-label="分析文章載入中">
      {/* hero */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-14 md:py-20">
          <Bone className="h-5 w-20 rounded-full" />
          <Bone className="mt-5 h-10 w-3/4 max-w-full" />
          <Bone className="mt-3 h-4 w-2/3 max-w-full" />
          <Bone className="mt-6 h-3 w-1/2 max-w-full" />
        </div>
      </div>
      <div className="mx-auto max-w-[68ch] px-4 py-8">
        {/* TL;DR */}
        <Bone className="h-24 w-full border-l-[3px] border-transparent" />
        {/* sections */}
        {Array.from({ length: 4 }).map((_, s) => (
          <div key={s} className="mt-10">
            <Bone className="h-6 w-40" />
            <div className="mt-4 space-y-2.5">
              <Bone className="h-3.5 w-full" />
              <Bone className="h-3.5 w-11/12" />
              <Bone className="h-3.5 w-full" />
              <Bone className="h-3.5 w-4/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
