import EmptyState from '@/components/EmptyState';

interface StubPageProps {
  title: string;
  caption?: string;
}

/** Shared placeholder for routes owned by page agents. */
export default function StubPage({ title, caption }: StubPageProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{title}</h1>
      {caption && <p className="mt-2 text-sm text-text-2">{caption}</p>}
      <EmptyState
        className="mt-8"
        title="內容建設中"
        description="此頁面正在開發,即將推出完整內容。"
        ctaLabel="返回主頁"
        ctaHref="/"
      />
    </div>
  );
}
