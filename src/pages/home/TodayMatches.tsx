import { motion } from 'framer-motion';
import MatchCard from '@/components/MatchCard';
import EmptyState from '@/components/EmptyState';
import SectionHeader from './SectionHeader';
import { useTimezone } from '@/lib/timezone';
import { fullDateLabel } from '@/lib/format';
import { FINAL_MATCH } from './data';

/** Home Section 2 — 今日比賽 */
export default function TodayMatches() {
  const { timeZone } = useTimezone();
  const todaysMatches = [FINAL_MATCH]; // local mock: final day

  return (
    <section aria-labelledby="today-heading" className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <SectionHeader
        id="today-heading"
        title="今日比賽"
        caption={fullDateLabel(FINAL_MATCH.kickoffUtc, timeZone)}
        linkLabel="全部賽程"
        linkTo="/schedule"
      />
      {todaysMatches.length === 0 ? (
        <EmptyState
          title="今日沒有比賽"
          description="今日賽程休息,不妨重溫已完場賽事。"
          ctaLabel="查看全部賽程"
          ctaHref="/schedule"
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <MatchCard match={todaysMatches[0]} variant="banner" />
        </motion.div>
      )}
    </section>
  );
}
