import { useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import SectionHeader from './SectionHeader';
import DataStatusBadge from '@/components/DataStatusBadge';
import { KEY_UPDATES } from './data';
import { useTimezone } from '@/lib/timezone';
import { kickoffLabel } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Home Section 7 — 賽事重要消息 (inline accordion) */
export default function KeyUpdates() {
  const [openId, setOpenId] = useState<string | null>(null);
  const { timeZone } = useTimezone();

  return (
    <section aria-labelledby="updates-heading" className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <SectionHeader id="updates-heading" title="賽事重要消息" caption="賽會、場地及傷停最新動態" />

      <motion.ul
        className="divide-y divide-border rounded-md border border-border bg-surface"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      >
        {KEY_UPDATES.map((item) => {
          const open = openId === item.id;
          return (
            <motion.li
              key={item.id}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : item.id)}
                aria-expanded={open}
                aria-controls={`update-${item.id}`}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors duration-200 hover:bg-surface-2/50"
              >
                {item.thumb && (
                  <img
                    src={item.thumb}
                    alt=""
                    aria-hidden
                    className="h-14 w-20 shrink-0 rounded-sm object-cover max-md:hidden"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-accent/60 px-2 py-0.5 text-caption font-medium text-accent">
                      {item.category}
                    </span>
                    <DataStatusBadge status="DEMO" />
                  </span>
                  <span className="mt-1.5 block text-sm font-medium text-foreground">{item.headline}</span>
                  <span className="mt-0.5 block text-caption text-text-3">
                    {kickoffLabel(item.timestamp, timeZone)}
                  </span>
                </span>
                <ChevronDown
                  className={cn('h-4 w-4 shrink-0 text-text-3 transition-transform duration-300', open && 'rotate-180')}
                  strokeWidth={1.5}
                  aria-hidden
                />
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    id={`update-${item.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/60 px-4 py-3">
                      <p className="max-w-3xl text-sm leading-relaxed text-text-2">{item.summary}</p>
                      {item.relatedMatchId && (
                        <Link
                          to={`/matches/${item.relatedMatchId}`}
                          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-strong"
                        >
                          查看相關比賽 →
                        </Link>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </motion.ul>
    </section>
  );
}
