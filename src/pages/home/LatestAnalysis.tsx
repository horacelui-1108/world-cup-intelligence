import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import SectionHeader from './SectionHeader';
import SourceTag from '@/components/SourceTag';
import DataStatusBadge from '@/components/DataStatusBadge';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { ArticleCardSkeleton } from '@/components/Skeletons';
import { useTimezone } from '@/lib/timezone';
import { kickoffLabel } from '@/lib/format';
import type { AsyncSlice } from './useHomeData';
import type { AnalysisCardData } from './adapters';

/**
 * Home Section 6 — 最新賽後分析（listAnalyses() 最新 4 篇:featured 1 + compact 3）。
 * slug = matchId,cards 導去 /analysis/:slug。
 */
export default function LatestAnalysis({ slice }: { slice: AsyncSlice<AnalysisCardData[]> }) {
  const { timeZone } = useTimezone();
  const { data, loading, error, retry } = slice;
  const featured: AnalysisCardData | undefined = data?.[0];
  const compact = data?.slice(1) ?? [];

  return (
    <section aria-labelledby="analysis-heading" className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <SectionHeader
        id="analysis-heading"
        title="最新賽後分析"
        badge={featured ? <DataStatusBadge status={featured.status} meta={featured.meta} /> : undefined}
        linkLabel="全部分析"
        linkTo="/analysis"
      />

      {loading ? (
        <ArticleCardSkeleton />
      ) : error ? (
        <ErrorState title="分析未能載入" error={error} onRetry={retry} compact />
      ) : !featured ? (
        <EmptyState
          compact
          title="暫無賽後分析"
          description="未有已完場賽事嘅分析,稍後再睇。"
          ctaLabel="全部分析"
          ctaHref="/analysis"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {/* featured article (span 2) */}
          <motion.div
            initial={{ clipPath: 'inset(8% 8% 8% 8%)', opacity: 0 }}
            whileInView={{ clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-2"
          >
            <div className="overflow-hidden rounded-md border border-border bg-surface transition-colors duration-200 hover:border-border-strong">
              {/* BUG-1：Link 只包標題/摘要區；sources 行（SourceTag popover）移出 Link，
                  否則點〔Sn〕會被卡片導航騎劫 */}
              <Link to={`/analysis/${featured.slug}`} className="group block">
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src="/analysis-texture.jpg"
                    alt=""
                    aria-hidden
                    className="h-full w-full object-cover opacity-70 transition-transform [transition-duration:400ms] group-hover:scale-[1.03]"
                  />
                  <span className="absolute bottom-2 left-2 rounded-full border border-gold/50 bg-bg/70 px-2 py-0.5 text-caption text-gold">
                    {featured.matchCaption}
                  </span>
                </div>
                <div className="px-5 pt-5">
                  <h3 className="font-display text-xl font-semibold text-foreground md:text-2xl">
                    <span className="bg-[linear-gradient(var(--accent),var(--accent))] bg-[length:0%_2px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] [transition-duration:250ms] group-hover:bg-[length:100%_2px]">
                      {featured.title}
                    </span>
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-2">{featured.excerpt}</p>
                </div>
              </Link>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 px-5 pb-5 text-caption text-text-3">
                <span>{featured.byline}</span>
                <span aria-hidden>·</span>
                <span>{kickoffLabel(featured.publishedAt, timeZone)}</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" strokeWidth={1.5} aria-hidden />
                  {featured.readingMinutes} 分鐘
                </span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-0.5">
                  {featured.sources.map((s, i) => (
                    <SourceTag key={s.name} index={i + 1} source={s} />
                  ))}
                  <span className="text-text-3">
                    {featured.sourceCount > featured.sources.length
                      ? `等 ${featured.sourceCount} 個來源`
                      : `${featured.sourceCount} 個來源`}
                  </span>
                </span>
              </div>
            </div>
          </motion.div>

          {/* compact rows */}
          <motion.ul
            className="flex flex-col gap-3"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          >
            {compact.map((a) => (
              <motion.li
                key={a.slug}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
                }}
              >
                <Link
                  to={`/analysis/${a.slug}`}
                  className="group flex gap-3 rounded-md border border-border bg-surface p-3 transition-colors duration-200 hover:border-border-strong"
                >
                  <img
                    src="/analysis-texture.jpg"
                    alt=""
                    aria-hidden
                    className="h-20 w-24 shrink-0 rounded-sm object-cover opacity-70 transition-transform [transition-duration:400ms] group-hover:scale-[1.03]"
                  />
                  <div className="min-w-0">
                    <p className="text-caption text-gold">{a.matchCaption}</p>
                    <h3 className="mt-1 line-clamp-2 text-sm font-medium text-foreground">
                      <span className="bg-[linear-gradient(var(--accent),var(--accent))] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] [transition-duration:250ms] group-hover:bg-[length:100%_1px]">
                        {a.title}
                      </span>
                    </h3>
                    <p className="mt-1 text-caption text-text-3">
                      {a.byline} · {a.readingMinutes} 分鐘
                    </p>
                  </div>
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      )}
    </section>
  );
}
