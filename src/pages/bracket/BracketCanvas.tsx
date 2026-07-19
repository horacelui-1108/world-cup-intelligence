import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import { formatInTimeZone } from 'date-fns-tz';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Match } from '@/types/football';
import { useTimezone } from '@/lib/timezone';
import { teamRefOf } from '@/pages/standings/teamRef';
import BracketNode from '@/pages/bracket/BracketNode';
import {
  CHAMPION_H,
  COL_GAP,
  NODE_H,
  NODE_W,
  ROUND_LABELS,
  ROUND_ORDER,
  type BracketLayout,
} from '@/pages/bracket/bracketModel';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function roundDateRange(matches: Match[], timeZone: string): string {
  if (matches.length === 0) return '';
  const sorted = [...matches].sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc));
  const f = (iso: string) => formatInTimeZone(new Date(iso), timeZone, 'M月d日');
  const first = f(sorted[0].kickoffUtc);
  const last = f(sorted[sorted.length - 1].kickoffUtc);
  return first === last ? first : `${first}–${last}`;
}

/** 連線 elbow 路徑：右出 → 橫 → 直 → 橫 → 入 */
function elbow(l: { x1: number; y1: number; x2: number; y2: number }): string {
  const midX = (l.x1 + l.x2) / 2;
  return `M ${l.x1} ${l.y1} H ${midX} V ${l.y2} H ${l.x2}`;
}

interface BracketCanvasProps {
  layout: BracketLayout;
  final?: Match;
}

const TABS = [
  { key: 'R32', label: '32強', colIdx: 0 },
  { key: 'R16', label: '16強', colIdx: 1 },
  { key: 'QF', label: '8強', colIdx: 2 },
  { key: 'SF', label: '四強', colIdx: 3 },
  { key: 'F', label: '決賽', colIdx: 4 },
  { key: '3P', label: '季軍戰', colIdx: 4 },
] as const;

/**
 * bracket.md §2 — 互動淘汰賽圖。
 * Desktop 全覽；mobile 每輪一 column 橫向 scroll + scroll-snap + 輪次 tab 快跳。
 */
export default function BracketCanvas({ layout, final }: BracketCanvasProps) {
  const { timeZone } = useTimezone();
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const thirdPlaceRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('R32');
  const rafId = useRef<number>(0);

  const colX = (idx: number) => idx * (NODE_W + COL_GAP);

  /** hover 節點嘅上游「road here」連線集（遞歸到 32 強） */
  const hoverChain = useMemo(() => {
    if (!hoveredId) return new Set<string>();
    const set = new Set<string>();
    const queue = [hoveredId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      for (const link of layout.incomingLinks.get(id) ?? []) {
        if (!set.has(link.id)) {
          set.add(link.id);
          queue.push(link.fromMatchId);
        }
      }
    }
    return set;
  }, [hoveredId, layout.incomingLinks]);

  const championTeam = layout.champion?.winnerId ? teamRefOf(layout.champion.winnerId) : undefined;
  const championDecided = layout.champion?.decided ?? false;

  const scrollToCol = (colIdx: number) => {
    scrollRef.current?.scrollTo({ left: Math.max(colX(colIdx) - 12, 0), behavior: 'smooth' });
  };

  const onTabClick = (key: string, colIdx: number) => {
    setActiveTab(key);
    if (key === '3P' && thirdPlaceRef.current) {
      thirdPlaceRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'start' });
    } else {
      scrollToCol(colIdx);
    }
  };

  /** scroll 同步 active tab（搵最接近 scrollLeft 嘅欄） */
  const onScroll = () => {
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      const left = el.scrollLeft;
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i <= 4; i++) {
        const d = Math.abs(colX(i) - left);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      setActiveTab(TABS[best].key);
    });
  };

  useEffect(() => () => cancelAnimationFrame(rafId.current), []);

  return (
    <div>
      {/* 輪次 tabs（mobile 快跳；desktop 同步高亮） */}
      <nav aria-label="跳至輪次" className="mb-4 overflow-x-auto">
        <div className="flex w-max items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              aria-pressed={activeTab === tab.key}
              onClick={() => onTabClick(tab.key, tab.colIdx)}
              className={cn(
                'relative inline-flex min-h-9 items-center rounded-full border px-3.5 text-sm font-medium transition-colors duration-200',
                activeTab === tab.key
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-text-2 hover:border-border-strong hover:text-foreground',
              )}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.span
                  layoutId="round-tab-thumb"
                  transition={{ duration: 0.22, ease: EASE }}
                  className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent"
                  aria-hidden
                />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* bracket 畫布 */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        role="region"
        aria-label="淘汰賽對陣圖，可橫向捲動；每場賽事可 Tab 聚焦，Enter 開啟賽事詳情"
        className="snap-x snap-mandatory overflow-x-auto rounded-md border border-border bg-bg lg:snap-none"
      >
        <p className="sr-only">
          對陣圖由 32 強至決賽共五輪，另設季軍戰。使用 Tab 鍵依次聚焦每場賽事，Enter 開啟詳情。
        </p>
        <div className="relative" style={{ width: layout.width, height: layout.height }}>
          {/* pitch-lines 水印 5% */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-text opacity-[0.05]"
            style={{
              WebkitMaskImage: 'url(/pitch-lines.svg)',
              maskImage: 'url(/pitch-lines.svg)',
              WebkitMaskSize: 'cover',
              maskSize: 'cover',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
            }}
          />

          {/* mobile scroll-snap 標記（每欄一個） */}
          {ROUND_ORDER.map((_, i) => (
            <div
              key={i}
              aria-hidden
              className="absolute top-0 h-full w-px snap-start lg:snap-align-none"
              style={{ left: colX(i) }}
            />
          ))}

          {/* 欄標題：輪次 + 日期範圍 */}
          {layout.rounds.map((round, r) => (
            <div key={ROUND_ORDER[r]} className="absolute top-0" style={{ left: colX(r), width: NODE_W }}>
              <p className="font-display text-base font-semibold text-foreground">
                {ROUND_LABELS[ROUND_ORDER[r]]}
                <span className="ml-1.5 font-num text-caption font-normal text-text-3">{round.length} 場</span>
              </p>
              <p className="mt-0.5 font-num text-caption tnum text-text-3">
                {roundDateRange(round.map((n) => n.match), timeZone)}
              </p>
            </div>
          ))}
          {/* 冠軍欄標題 */}
          <div className="absolute top-0" style={{ left: colX(layout.rounds.length), width: NODE_W }}>
            <p className="font-display text-base font-semibold text-gold">冠軍</p>
          </div>

          {/* 連線 SVG */}
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0"
            width={layout.width}
            height={layout.height}
          >
            {layout.links.map((link) => {
              const inHover = hoverChain.has(link.id);
              const stroke = link.championPath
                ? 'var(--gold)'
                : inHover
                  ? 'var(--accent-strong)'
                  : link.decided
                    ? 'var(--accent)'
                    : 'var(--border-strong)';
              return (
                <motion.path
                  key={link.id}
                  d={elbow(link)}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={link.championPath || link.decided || inHover ? 2 : 1.5}
                  initial={reduceMotion ? false : { pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{
                    duration: link.championPath ? 1.6 : 0.8,
                    delay: link.championPath ? 0.6 : 0.3,
                    ease: EASE,
                  }}
                />
              );
            })}
            {/* 決賽 → 冠軍 連線 */}
            {layout.champion && (
              <motion.path
                d={`M ${colX(layout.rounds.length - 1) + NODE_W} ${layout.champion.y + CHAMPION_H / 2} H ${layout.champion.x}`}
                fill="none"
                stroke={championDecided ? 'var(--gold)' : 'var(--border-strong)'}
                strokeWidth={championDecided ? 2 : 1.5}
                strokeDasharray={championDecided ? undefined : '4 4'}
                initial={reduceMotion ? false : { pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: championDecided ? 1.6 : 0.8, delay: 0.8, ease: EASE }}
              />
            )}
            {/* 決賽 → 季軍戰 虛線 */}
            {layout.thirdPlace && layout.rounds.at(-1)?.[0] && (
              <motion.path
                d={`M ${layout.thirdPlace.x + NODE_W / 2} ${layout.rounds.at(-1)![0].y + NODE_H} V ${layout.thirdPlace.y}`}
                fill="none"
                stroke="var(--border-strong)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                initial={reduceMotion ? false : { pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.9, ease: EASE }}
              />
            )}
          </svg>

          {/* 節點 */}
          {layout.rounds.map((round, r) =>
            round.map((node) => (
              <BracketNode
                key={node.match.matchId}
                match={node.match}
                status={node.status}
                winnerId={node.winnerId}
                roundLabel={ROUND_LABELS[ROUND_ORDER[r]]}
                onHover={setHoveredId}
                style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H }}
              />
            )),
          )}

          {/* 季軍戰節點（虛線） */}
          {layout.thirdPlace && (
            <div
              ref={thirdPlaceRef}
              className="absolute text-center"
              style={{ left: layout.thirdPlace.x, top: layout.thirdPlace.y - 24, width: NODE_W }}
            >
              <p className="mb-1 text-caption font-medium tracking-wider text-text-3">
                <span className="rounded-sm bg-bg px-1.5">季軍戰</span>
              </p>
              <BracketNode
                match={layout.thirdPlace.match}
                status={layout.thirdPlace.status}
                winnerId={layout.thirdPlace.winnerId}
                roundLabel={ROUND_LABELS['3P']}
                dashed
                onHover={setHoveredId}
                style={{ position: 'relative', left: 0, top: 0, width: NODE_W, height: NODE_H }}
              />
            </div>
          )}

          {/* 冠軍卡 */}
          {layout.champion && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.9, ease: EASE }}
              className={cn(
                'absolute flex flex-col items-center justify-center gap-1.5 rounded-md border p-3 text-center',
                championDecided ? 'border-gold bg-surface' : 'border-dashed border-border-strong bg-surface',
              )}
              style={{ left: layout.champion.x, top: layout.champion.y, width: NODE_W, height: CHAMPION_H }}
            >
              <Trophy
                className={cn('h-6 w-6', championDecided ? 'text-gold' : 'text-text-3')}
                strokeWidth={1.5}
                aria-hidden
              />
              {championDecided && championTeam ? (
                <>
                  <img
                    src={championTeam.crest}
                    alt={`${championTeam.name}隊徽`}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full"
                  />
                  <p className="font-display text-sm font-semibold text-gold">2026 世界冠軍</p>
                  <Link
                    to={`/teams/${championTeam.id}`}
                    className="font-display text-base font-bold text-foreground transition-colors duration-200 hover:text-accent"
                  >
                    {championTeam.name}
                  </Link>
                </>
              ) : (
                <>
                  <p className="font-display text-sm font-semibold text-text-2">冠軍待定</p>
                  {final && (
                    <p className="font-num text-caption tnum text-text-3">
                      決賽 {formatInTimeZone(new Date(final.kickoffUtc), timeZone, 'M月d日 HH:mm')}
                    </p>
                  )}
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* 圖例 */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-caption text-text-2" aria-label="圖例">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-6 rounded-full bg-accent" />
          已分出勝負
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-6 rounded-full bg-gold" />
          冠軍路徑
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-6 rounded-full border-t-2 border-dashed border-border-strong" />
          待定 / 季軍戰
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CheckDot />
          勝方
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-live animate-live-pulse" />
          直播中
        </span>
      </div>
    </div>
  );
}

function CheckDot() {
  return (
    <span aria-hidden className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-accent/60">
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-accent" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M2 6.5 5 9 10 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
