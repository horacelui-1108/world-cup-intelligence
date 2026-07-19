import { AnimatePresence, motion } from 'framer-motion';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import MatchCard from '@/components/MatchCard';
import CountdownTimer from '@/components/CountdownTimer';
import TimezoneToggle from '@/components/TimezoneToggle';
import { MatchCardSkeleton } from '@/components/Skeletons';
import type { MatchRef } from '@/lib/types';
import type { AsyncSlice } from './useHomeData';
import type { HomeMatchesData } from './adapters';

interface NextMatchProps {
  slice: AsyncSlice<HomeMatchesData>;
  /** next scheduled match（已排除決賽本身）,或 null 當賽事已無下一場 */
  next: MatchRef | null;
  /** true once the featured final has kicked off (countdown hit zero 或 provider 顯示已開賽) */
  finalStarted: boolean;
}

/**
 * Home Section 3 — 下一場比賽. While the final is still pending it IS the
 * next match, so this section hides (layout collapse); once it kicks off,
 * the module swaps to the「本屆賽事已無下一場」EmptyState + CTA.
 */
export default function NextMatch({ slice, next, finalStarted }: NextMatchProps) {
  const { loading, error, retry } = slice;
  const visible = loading || Boolean(error) || Boolean(next) || finalStarted;

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.section
          aria-labelledby="next-heading"
          className="mx-auto max-w-7xl overflow-hidden px-4 md:px-6"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          layout="position"
        >
          <div className="py-6 md:py-10">
            <h2 id="next-heading" className="mb-4 font-display text-xl font-semibold text-foreground md:mb-6 md:text-2xl">
              下一場
            </h2>
            {loading ? (
              <MatchCardSkeleton />
            ) : error ? (
              <ErrorState title="下一場資料未能載入" error={error} onRetry={retry} compact />
            ) : next ? (
              <div className="grid items-center gap-4 md:grid-cols-2">
                <MatchCard match={next} variant="compact" />
                <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-surface p-5">
                  <CountdownTimer targetIso={next.kickoffUtc} size="sm" />
                  <p className="text-caption text-text-3">{next.venue}</p>
                  <TimezoneToggle />
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.06 }}
              >
                <EmptyState
                  title="本屆賽事已無下一場"
                  description="決賽經已開賽,本屆再無其他場次。你可以隨時重溫每一場比賽的數據與分析。"
                  ctaLabel="重溫全部 104 場賽事"
                  ctaHref="/schedule"
                />
              </motion.div>
            )}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
