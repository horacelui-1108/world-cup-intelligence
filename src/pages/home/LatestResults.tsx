import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MatchCard from '@/components/MatchCard';
import FilterChip from '@/components/FilterChip';
import EmptyState from '@/components/EmptyState';
import SectionHeader from './SectionHeader';
import { LATEST_RESULTS } from './data';

type ResultFilter = 'all' | 'knockout' | 'group';

const GROUP_STAGES = ['小組賽'];

/** Home Section 4 — 最新賽果 */
export default function LatestResults() {
  const [filter, setFilter] = useState<ResultFilter>('all');
  const scrollerRef = useRef<HTMLDivElement>(null);

  const filtered = LATEST_RESULTS.filter((m) => {
    if (filter === 'all') return true;
    if (filter === 'group') return GROUP_STAGES.includes(m.stage);
    return !GROUP_STAGES.includes(m.stage);
  }).slice(0, 6);

  // keyboard-scroll the horizontal row with arrow keys
  const onKeyDown = (e: React.KeyboardEvent) => {
    const el = scrollerRef.current;
    if (!el) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      el.scrollBy({ left: 280, behavior: 'smooth' });
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      el.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  return (
    <section aria-labelledby="results-heading" className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <SectionHeader
        id="results-heading"
        title="最新賽果"
        linkLabel="更多賽果"
        linkTo="/schedule?status=finished"
      />
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="賽果篩選">
        <FilterChip label="全部" selected={filter === 'all'} onClick={() => setFilter('all')} count={LATEST_RESULTS.length} />
        <FilterChip label="淘汰賽" selected={filter === 'knockout'} onClick={() => setFilter('knockout')} />
        <FilterChip label="小組賽" selected={filter === 'group'} onClick={() => setFilter('group')} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          compact
          title="該類別暫無賽果"
          description="小組賽階段經已完結,賽果已歸檔。"
          ctaLabel="查看全部賽程"
          ctaHref="/schedule"
        />
      ) : (
        <div
          ref={scrollerRef}
          role="region"
          aria-label="最新賽果列表,可用左右方向鍵捲動"
          tabIndex={0}
          onKeyDown={onKeyDown}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:snap-none md:grid-cols-3 md:overflow-visible md:pb-0"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((m, i) => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, x: 32 }}
                whileInView={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.25, delay: i < 12 ? i * 0.04 : 0, ease: [0.22, 1, 0.36, 1] }}
                className="w-[270px] shrink-0 snap-start md:w-auto"
              >
                <MatchCard match={m} variant="result" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
