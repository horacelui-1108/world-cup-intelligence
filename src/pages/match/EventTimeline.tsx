import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Goal, Repeat2, Tv, XCircle } from 'lucide-react';
import type { Match, MatchEvent } from '@/types/football';
import { cn } from '@/lib/utils';
import { useTimezone } from '@/lib/timezone';
import { kickoffLabelWithWeekday } from '@/lib/format';
import EmptyState from '@/components/EmptyState';
import FilterChip from '@/components/FilterChip';
import { formatMinute, playerDisplayName, uiStatus } from '@/pages/schedule/model';
import type { TimelineEntry } from './events';
import { EVENT_TYPE_LABELS, VAR_OUTCOME_LABELS, buildTimeline, isCardType, isGoalType, scoreAfterByKey } from './events';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type EventFilter = 'all' | 'goals' | 'cards' | 'subs' | 'var';

const FILTERS: { value: EventFilter; label: string; match: (t: MatchEvent['type']) => boolean }[] = [
  { value: 'all', label: '全部', match: () => true },
  { value: 'goals', label: '入球', match: (t) => isGoalType(t) },
  { value: 'cards', label: '牌', match: (t) => isCardType(t) },
  { value: 'subs', label: '換人', match: (t) => t === 'sub' },
  { value: 'var', label: 'VAR', match: (t) => t === 'var' },
];

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** 球員名（有 playerId 則連到球員頁） */
function PlayerName({ id, name, className }: { id?: string; name: string; className?: string }) {
  const display = playerDisplayName(id, name);
  if (!id) return <span className={className}>{display}</span>;
  return (
    <Link to={`/players/${id}`} className={cn(className, 'transition-colors hover:text-accent')}>
      {display}
    </Link>
  );
}

/** 黃/紅牌圖形（12×16px,唔單靠顏色:有文字標籤） */
function CardGlyph({ type }: { type: 'yellow' | 'second_yellow' | 'red' }) {
  if (type === 'yellow') {
    return <span aria-hidden className="inline-block h-4 w-3 rounded-[2px] bg-warn" />;
  }
  if (type === 'red') {
    return <span aria-hidden className="inline-block h-4 w-3 rounded-[2px] bg-live" />;
  }
  return (
    <span aria-hidden className="relative inline-block h-4 w-4">
      <span className="absolute left-0 top-0.5 h-3.5 w-2.5 rounded-[2px] bg-warn" />
      <span className="absolute right-0 top-0 h-3.5 w-2.5 rounded-[2px] bg-live" />
    </span>
  );
}

function EventIcon({ event }: { event: MatchEvent }) {
  const t = event.type;
  if (t === 'goal' || t === 'pen_goal') {
    return <Goal className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} aria-hidden />;
  }
  if (t === 'own_goal') {
    return <Goal className="h-4 w-4 shrink-0 text-warn" strokeWidth={1.5} aria-hidden />;
  }
  if (t === 'pen_miss') {
    return <XCircle className="h-4 w-4 shrink-0 text-warn" strokeWidth={1.5} aria-hidden />;
  }
  if (t === 'yellow' || t === 'second_yellow' || t === 'red') {
    return <CardGlyph type={t} />;
  }
  if (t === 'sub') {
    return <Repeat2 className="h-4 w-4 shrink-0 text-text-2" strokeWidth={1.5} aria-hidden />;
  }
  return <Tv className="h-4 w-4 shrink-0 text-text-2" strokeWidth={1.5} aria-hidden />;
}

function EventCard({
  entry,
  side,
  scoreAfter,
  isDesktop,
  index,
}: {
  entry: TimelineEntry;
  side: 'home' | 'away';
  scoreAfter?: string;
  isDesktop: boolean;
  index: number;
}) {
  const reduce = useReducedMotion();
  const e = entry.event;
  const goal = isGoalType(e.type);
  const x = reduce ? 0 : isDesktop ? (side === 'home' ? -20 : 20) : 20;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, x }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, ease: EASE, delay: reduce ? 0 : Math.min(index, 12) * 0.05 }}
      className={cn(
        'group rounded-md border border-border bg-surface p-3 transition-colors duration-200 hover:border-border-strong',
        goal && 'border-l-2 border-l-gold',
        side === 'home' ? 'md:text-right' : 'text-left',
      )}
    >
      <div className={cn('flex items-start gap-2.5', side === 'home' && 'md:flex-row-reverse')}>
        <span className="mt-0.5">
          <EventIcon event={e} />
        </span>
        <div className={cn('min-w-0 flex-1', side === 'home' && 'md:text-right')}>
          <p className="text-sm font-medium text-foreground">
            <PlayerName id={e.playerId} name={e.playerName || EVENT_TYPE_LABELS[e.type]} />
            {e.playerName && (
              <span className="ml-2 text-caption font-normal text-text-3">{EVENT_TYPE_LABELS[e.type]}</span>
            )}
          </p>
          {e.type === 'sub' && (e.playerName || e.assistName) && (
            <p className="mt-0.5 text-caption text-text-2">
              {e.playerName && <>上:{playerDisplayName(e.playerId, e.playerName)}</>}
              {e.playerName && e.assistName && ' / '}
              {e.assistName && <>下:{playerDisplayName(e.assistPlayerId, e.assistName)}</>}
            </p>
          )}
          {e.assistName && e.type !== 'sub' && (
            <p className="mt-0.5 text-caption text-text-2">
              助攻:{playerDisplayName(e.assistPlayerId, e.assistName)}
            </p>
          )}
          {e.type === 'var' && (
            <p className="mt-1">
              <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-caption font-medium text-text-2">
                {e.varOutcome ? VAR_OUTCOME_LABELS[e.varOutcome] : 'VAR 覆核'}
              </span>
            </p>
          )}
          {e.detail && <p className="mt-1 text-caption leading-relaxed text-text-2">{e.detail}</p>}
        </div>
        {goal && scoreAfter && (
          <span className="shrink-0 rounded-full border border-gold/50 px-2 py-0.5 font-num text-caption font-semibold text-gold tnum">
            {scoreAfter}
          </span>
        )}
      </div>
    </motion.div>
  );
}

/**
 * match.md §3 — 事件時間軸：主客分列（desktop）、mobile 單欄;
 * 分鐘未核實顯示「--'」;類型篩選 chips。
 */
export default function EventTimeline({ match }: { match: Match }) {
  const { timeZone } = useTimezone();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [filter, setFilter] = useState<EventFilter>('all');
  const status = uiStatus(match.status);

  const entries = useMemo(() => buildTimeline(match), [match]);
  const scores = useMemo(() => scoreAfterByKey(match, entries), [match, entries]);

  const counts = useMemo(() => {
    const c: Record<EventFilter, number> = { all: entries.length, goals: 0, cards: 0, subs: 0, var: 0 };
    for (const e of entries) {
      if (isGoalType(e.event.type)) c.goals += 1;
      if (isCardType(e.event.type)) c.cards += 1;
      if (e.event.type === 'sub') c.subs += 1;
      if (e.event.type === 'var') c.var += 1;
    }
    return c;
  }, [entries]);

  if (status === 'scheduled' || status === 'postponed') {
    return (
      <EmptyState
        title={status === 'postponed' ? '比賽延期' : '比賽尚未開始'}
        description={`開賽時間:${kickoffLabelWithWeekday(match.kickoffUtc, timeZone)}。事件時間軸將於開賽後更新。`}
        ctaLabel="返回賽程"
        ctaHref="/schedule"
      />
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        title="暫無事件數據"
        description="資料來源未提供本場事件明細(Demo 數據未涵蓋)。"
      />
    );
  }

  const visible = entries.filter((e) => FILTERS.find((f) => f.value === filter)?.match(e.event.type));

  return (
    <div>
      {/* 類型篩選 */}
      <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="篩選事件類型">
        {FILTERS.map((f) => (
          <FilterChip
            key={f.value}
            label={f.label}
            selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            count={counts[f.value]}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-md border border-border bg-surface px-4 py-8 text-center text-sm text-text-3">
          此分類沒有事件
        </p>
      ) : (
        <ol aria-label="比賽事件時間軸">
          <AnimatePresence initial={false}>
            {visible.map((entry, i) => {
              const side = entry.event.teamId === match.awayTeamId ? 'away' : 'home';
              return (
                <motion.li
                  key={entry.key}
                  layout
                  exit={{ opacity: 0, height: 0, overflow: 'hidden', transition: { duration: 0.2 } }}
                  className="relative pb-4 last:pb-0"
                >
                  {/* 中線(mobile 左 / desktop 中) */}
                  <span
                    aria-hidden
                    className="absolute left-6 top-0 h-full w-px -translate-x-1/2 bg-border md:left-1/2"
                  />
                  <div className="grid grid-cols-[3rem_1fr] items-start gap-x-3 md:grid-cols-[1fr_3rem_1fr] md:gap-x-4">
                    <div className="flex justify-center md:col-start-2 md:row-start-1">
                      <time
                        className="relative z-10 mt-1 flex h-7 min-w-12 items-center justify-center rounded-full border border-border bg-surface px-1.5 font-num text-xs font-semibold text-text-2 tnum transition-colors duration-200 group-hover:text-accent"
                        aria-label={`第 ${entry.minute ?? '未知'} 分鐘`}
                      >
                        {formatMinute(entry.minute)}
                      </time>
                    </div>
                    <div
                      className={cn(
                        'min-w-0',
                        side === 'home' ? 'md:col-start-1 md:row-start-1' : 'md:col-start-3 md:row-start-1',
                      )}
                    >
                      <EventCard entry={entry} side={side} scoreAfter={scores.get(entry.key)} isDesktop={isDesktop} index={i} />
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      )}
    </div>
  );
}
