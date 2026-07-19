import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { GroupLetter, Match } from '@/types/football';
import { cn } from '@/lib/utils';
import ScheduleRow from './ScheduleRow';
import { ALL_TEAMS, GROUP_LETTERS, crestPath } from './model';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface GroupBucket {
  letter: GroupLetter;
  teamIds: string[];
  matches: Match[];
}

/**
 * schedule.md §3 — 分組視圖：A–L 十二組 accordion（單開），
 * 組頭有 serif 字母 badge + 4 隊 crest + 場數；展開見賽事 + 排名連結。
 */
export default function GroupView({ matches }: { matches: Match[] }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<GroupLetter | null>(null);

  const groups = useMemo<GroupBucket[]>(
    () =>
      GROUP_LETTERS.map((letter) => ({
        letter,
        teamIds: ALL_TEAMS.filter((t) => t.group === letter).map((t) => t.id),
        matches: matches
          .filter((m) => m.group === letter)
          .sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc)),
      })).filter((g) => g.matches.length > 0),
    [matches],
  );

  // 派生當前展開組：URL/篩選改變後若所選組已無賽事 → 展開第一組
  const openLetter: GroupLetter | null =
    open && groups.some((g) => g.letter === open) ? open : (groups[0]?.letter ?? null);

  if (groups.length === 0) return null;

  return (
    <div className="space-y-3">
      {groups.map((g, gi) => {
        const expanded = g.letter === openLetter;
        return (
          <motion.div
            key={g.letter}
            layout={reduce ? false : 'position'}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.25,
              ease: EASE,
              delay: reduce ? 0 : Math.min(gi, 12) * 0.04,
              layout: { duration: 0.25, ease: EASE },
            }}
            className="overflow-hidden rounded-md border border-border bg-surface"
          >
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={`group-panel-${g.letter}`}
              onClick={() => setOpen(expanded ? null : g.letter)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-surface-2"
            >
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2 font-display text-lg font-bold text-foreground"
              >
                {g.letter}
              </span>
              <span className="flex shrink-0 -space-x-1.5" aria-hidden>
                {g.teamIds.map((id) => (
                  <img
                    key={id}
                    src={crestPath(id)}
                    alt=""
                    width={24}
                    height={24}
                    loading="lazy"
                    className="rounded-full border border-surface"
                  />
                ))}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{g.letter} 組</span>
                <span className="block text-caption text-text-3">{g.matches.length} 場賽事</span>
              </span>
              <motion.span
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="shrink-0 text-text-3"
                aria-hidden
              >
                <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  id={`group-panel-${g.letter}`}
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="overflow-hidden"
                >
                  <ul className="divide-y divide-border border-t border-border">
                    {g.matches.map((m) => (
                      <li key={m.matchId}>
                        <ScheduleRow match={m} />
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-border px-4 py-2.5">
                    <Link
                      to={`/standings?group=${g.letter}`}
                      className={cn(
                        'text-caption font-medium text-accent transition-colors duration-200',
                        'hover:text-accent-strong',
                      )}
                    >
                      查看 {g.letter} 組排名 →
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
