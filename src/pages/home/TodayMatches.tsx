import { motion } from 'framer-motion';
import MatchCard from '@/components/MatchCard';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import DataStatusBadge from '@/components/DataStatusBadge';
import { MatchCardSkeleton } from '@/components/Skeletons';
import SectionHeader from './SectionHeader';
import { useTimezone } from '@/lib/timezone';
import { fullDateLabel } from '@/lib/format';
import type { AsyncSlice } from './useHomeData';
import type { HomeMatchesData } from './adapters';

/** Home Section 2 — 今日比賽（provider lastUpdated 當日嘅場次,UTC 日期） */
export default function TodayMatches({ slice }: { slice: AsyncSlice<HomeMatchesData> }) {
  const { timeZone } = useTimezone();
  const { data, loading, error, retry } = slice;

  return (
    <section aria-labelledby="today-heading" className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <SectionHeader
        id="today-heading"
        title="今日比賽"
        caption={data ? fullDateLabel(data.todayAnchorIso, timeZone) : undefined}
        badge={
          data ? (
            <>
              <span aria-hidden>·</span>
              <DataStatusBadge
                status={data.sourceMeta.dataStatus}
                meta={data.sourceMeta}
              />
            </>
          ) : undefined
        }
        linkLabel="全部賽程"
        linkTo="/schedule"
      />
      {loading ? (
        <MatchCardSkeleton />
      ) : error ? (
        <ErrorState title="今日比賽未能載入" error={error} onRetry={retry} compact />
      ) : !data || data.todayMatches.length === 0 ? (
        <div className="space-y-3">
          <EmptyState
            title="今日沒有比賽"
            description="今日賽程休息,不妨重溫已完場賽事。"
            ctaLabel="查看全部賽程"
            ctaHref="/schedule"
          />
          {data?.nextScheduled && (
            <div>
              <p className="mb-2 text-caption text-text-3">下一場</p>
              <MatchCard match={data.nextScheduled} variant="compact" />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {data.todayMatches.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <MatchCard match={m} variant="banner" />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
