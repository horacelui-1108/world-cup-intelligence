import { useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { formatInTimeZone } from 'date-fns-tz';
import type { Match } from '@/types/football';
import { cn } from '@/lib/utils';
import { useTimezone } from '@/lib/timezone';
import ScheduleRow from './ScheduleRow';
import { isKnockout, uiStatus } from './model';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

interface DateGroup {
  key: string;
  label: string;
  matches: Match[];
  /** 當日有淘汰賽 → 金色日期標題 */
  knockoutDay: boolean;
  /** 當日有決賽 → 「決賽日」標記 */
  finalDay: boolean;
}

function groupByDate(matches: Match[], timeZone: string): DateGroup[] {
  const map = new Map<string, DateGroup>();
  for (const m of matches) {
    const d = new Date(m.kickoffUtc);
    const key = formatInTimeZone(d, timeZone, 'yyyy-MM-dd');
    const dayIdx = Number(formatInTimeZone(d, timeZone, 'i')) % 7;
    const label = `${formatInTimeZone(d, timeZone, 'M月d日')} ${WEEKDAYS[dayIdx]}`;
    const g = map.get(key) ?? { key, label, matches: [], knockoutDay: false, finalDay: false };
    g.matches.push(m);
    if (isKnockout(m)) g.knockoutDay = true;
    if (m.stage === 'F') g.finalDay = true;
    map.set(key, g);
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

/** 一組賽事（共用於「正在進行」同日期組） */
function MatchGroupCard({ matches }: { matches: Match[] }) {
  const reduce = useReducedMotion();
  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      <ul className="divide-y divide-border">
        <AnimatePresence initial={false}>
          {matches.map((m, i) => (
            <motion.li
              key={m.matchId}
              layout={reduce ? false : 'position'}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
              transition={{
                duration: 0.25,
                ease: EASE,
                delay: reduce || i >= 12 ? 0 : i * 0.04,
                layout: { duration: 0.25, ease: EASE },
              }}
            >
              <ScheduleRow match={m} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

/**
 * schedule.md §2/§4 — 日期視圖：live 場次浮上頂（「正在進行」紅色組頭），
 * 其餘按日期分組；日期標題喺淘汰賽日顯金色、今日有「今日」chip。
 */
export default function DateView({ matches }: { matches: Match[] }) {
  const { timeZone } = useTimezone();
  const reduce = useReducedMotion();

  const { live, groups, todayKey } = useMemo(() => {
    const liveMatches = matches
      .filter((m) => uiStatus(m.status) === 'live')
      .sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc));
    const rest = matches.filter((m) => uiStatus(m.status) !== 'live');
    return {
      live: liveMatches,
      groups: groupByDate(rest, timeZone),
      todayKey: formatInTimeZone(new Date(), timeZone, 'yyyy-MM-dd'),
    };
  }, [matches, timeZone]);

  return (
    <div className="space-y-6">
      {live.length > 0 && (
        <section aria-label="正在進行">
          <h2 className="mb-2 flex items-center gap-2 text-label text-live">
            <span className="h-1.5 w-1.5 rounded-full bg-live animate-live-pulse" aria-hidden />
            正在進行
          </h2>
          <MatchGroupCard matches={live} />
        </section>
      )}

      <AnimatePresence initial={false}>
        {groups.map((g) => (
          <motion.section
            key={g.key}
            layout={reduce ? false : 'position'}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.25, ease: EASE }}
            aria-label={g.label}
          >
            <h2
              className={cn(
                'mb-2 flex items-center gap-2 text-label',
                g.knockoutDay ? 'text-gold' : 'text-text-2',
              )}
            >
              {g.label}
              {g.finalDay && <span className="text-gold">· 決賽日</span>}
              {g.key === todayKey && (
                <span className="rounded-full border border-accent/50 bg-accent/10 px-2 py-0.5 text-caption font-medium normal-case tracking-normal text-accent">
                  今日
                </span>
              )}
            </h2>
            <MatchGroupCard matches={g.matches} />
          </motion.section>
        ))}
      </AnimatePresence>
    </div>
  );
}
