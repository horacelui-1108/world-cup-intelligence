import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Match } from '@/types/football';
import MatchCard from '@/components/MatchCard';
import EmptyState from '@/components/EmptyState';
import { resultFor, stageLabel, toMatchRef, STAGE_ORDER } from './data';
import { ResultChip, SegmentedControl } from './widgets';

type Filter = 'all' | 'finished' | 'scheduled';

interface TeamMatchesProps {
  teamId: string;
  matches: Match[];
}

/**
 * team.md Tab A — 賽程及賽果：下一場 banner + 按階段分組嘅 MatchCard 列表，
 * 已完場附 勝/和/負 result chip（十二碼決勝另附註），filter chips 真實過濾。
 */
export default function TeamMatches({ teamId, matches }: TeamMatchesProps) {
  const [filter, setFilter] = useState<Filter>('all');

  const sorted = useMemo(
    () => [...matches].sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc)),
    [matches],
  );

  const nextMatch = sorted.find((m) => m.status === 'scheduled');

  const filtered = sorted.filter((m) => {
    if (filter === 'finished') return m.status === 'ft';
    if (filter === 'scheduled') return m.status === 'scheduled';
    return true;
  });

  const groups = useMemo(() => {
    const byStage = new Map<string, Match[]>();
    for (const m of filtered) {
      const key = m.stage === 'GROUP' ? `GROUP-${m.group ?? ''}` : m.stage;
      const arr = byStage.get(key) ?? [];
      arr.push(m);
      byStage.set(key, arr);
    }
    return [...byStage.entries()]
      .map(([key, list]) => ({ key, label: stageLabel(list[0]), list }))
      .sort((a, b) => STAGE_ORDER[a.list[0].stage] - STAGE_ORDER[b.list[0].stage]);
  }, [filtered]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption text-text-3">共 {matches.length} 場賽事</p>
        <SegmentedControl<Filter>
          id="team-matches-filter"
          ariaLabel="篩選賽事"
          options={[
            { value: 'all', label: '全部' },
            { value: 'finished', label: '已完成' },
            { value: 'scheduled', label: '未開始' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>

      {nextMatch && filter !== 'finished' && (
        <section aria-labelledby="team-next-match">
          <h3 id="team-next-match" className="mb-3 font-display text-lg font-semibold text-foreground">
            下一場
          </h3>
          <MatchCard match={toMatchRef(nextMatch)} variant="banner" />
        </section>
      )}

      {groups.length === 0 ? (
        <EmptyState
          compact
          title="暫無比賽"
          description={filter === 'finished' ? '此球隊暫時未有已完成嘅賽事。' : '此球隊暫時未有未開始嘅賽事。'}
        />
      ) : (
        groups.map((group) => (
          <section key={group.key} aria-labelledby={`stage-${group.key}`}>
            <h3
              id={`stage-${group.key}`}
              className="mb-3 font-display text-lg font-semibold text-foreground"
            >
              {group.label}
            </h3>
            <motion.ul layout="position" className="space-y-2">
              <AnimatePresence initial={false}>
                {group.list.map((m) => {
                  const r = resultFor(teamId, m);
                  return (
                    <motion.li
                      key={m.matchId}
                      layout="position"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-center gap-3"
                    >
                      {r ? (
                        <span className="flex w-8 shrink-0 flex-col items-center gap-1">
                          <ResultChip result={r.result} />
                          {r.decidedByPenalties && (
                            <span
                              className="text-[10px] leading-none text-text-3"
                              title={
                                r.penaltiesWinnerId === teamId
                                  ? '互射十二碼勝出'
                                  : '互射十二碼落敗'
                              }
                            >
                              {r.penaltiesWinnerId === teamId ? '十二碼勝' : '十二碼負'}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="w-8 shrink-0" aria-hidden />
                      )}
                      <MatchCard match={toMatchRef(m)} className="min-w-0 flex-1" />
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </motion.ul>
          </section>
        ))
      )}
    </div>
  );
}
