import EmptyState from '@/components/EmptyState';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
      <EmptyState
        titleAs="h1"
        title="找不到頁面"
        description="你所尋找的頁面不存在或已被移動。"
        ctaLabel="返回主頁"
        ctaHref="/"
      />
    </div>
  );
}
