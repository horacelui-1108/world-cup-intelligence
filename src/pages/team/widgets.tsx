/**
 * 球隊頁 + 球員頁共用嘅小型 UI 元件。
 * 全部跟 design.md 嘅 token 系統（hairline border、Inter tabular numerals）。
 */
import { useEffect, useRef } from 'react';
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { SourceMeta } from '@/types/football';
import type { DataMode } from '@/types/football';
import DataStatusBadge from '@/components/DataStatusBadge';
import { useTimezone } from '@/lib/timezone';
import { kickoffLabel } from '@/lib/format';
import { badgeStatus, type MatchResult } from './data';

// ---------------------------------------------------------------------------
// CountUp — design §5：數字進入 viewport 時 count up（一次過）
// ---------------------------------------------------------------------------
interface CountUpProps {
  value: number;
  duration?: number;
  delay?: number;
  /** 小數位（場均等統計用） */
  decimals?: number;
  className?: string;
}

export function CountUp({ value, duration = 0.8, delay = 0, decimals = 0, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduceMotion = useReducedMotion();
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => v.toFixed(decimals));

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    });
    return () => controls.stop();
  }, [inView, reduceMotion, mv, value, duration, delay]);

  return (
    <motion.span ref={ref} className={className}>
      {text}
    </motion.span>
  );
}

// ---------------------------------------------------------------------------
// ResultChip — 勝 W 綠 / 和 D 灰 / 負 L 紅（字母 + 顏色，唔會齋色）
// ---------------------------------------------------------------------------
const RESULT_STYLE: Record<MatchResult, { label: string; className: string }> = {
  W: { label: '勝', className: 'border-win/50 bg-win/10 text-win' },
  D: { label: '和', className: 'border-draw/50 bg-draw/10 text-draw' },
  L: { label: '負', className: 'border-live/50 bg-live/10 text-live' },
};

export function ResultChip({ result, className }: { result: MatchResult; className?: string }) {
  const s = RESULT_STYLE[result];
  return (
    <span
      className={cn(
        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-caption font-bold',
        s.className,
        className,
      )}
      aria-label={`賽果：${s.label}`}
      title={s.label}
    >
      {s.label}
    </span>
  );
}

/** 近況圓點（最舊 → 最新），同 TeamChip 嘅 form dots 一致 */
export function FormDots({ form, className }: { form: MatchResult[]; className?: string }) {
  if (form.length === 0) return null;
  const dotColor: Record<MatchResult, string> = { W: 'bg-win', D: 'bg-draw', L: 'bg-live' };
  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      role="img"
      aria-label={`近況：${form.map((f) => RESULT_STYLE[f].label).join('、')}`}
    >
      {form.map((f, i) => (
        <span key={i} title={RESULT_STYLE[f].label} className={cn('h-1.5 w-1.5 rounded-full', dotColor[f])} />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// ProvenanceLine — 資料來源 caption + DataStatusBadge（design §7 溯源）
// ---------------------------------------------------------------------------
interface ProvenanceLineProps {
  source: SourceMeta;
  dataMode: DataMode;
  className?: string;
}

export function ProvenanceLine({ source, dataMode, className }: ProvenanceLineProps) {
  const { timeZone, label } = useTimezone();
  const shown = dataMode === 'demo' ? 'DEMO' : badgeStatus(source.dataStatus);
  return (
    <p
      className={cn('flex flex-wrap items-center gap-2 text-caption text-text-3', className)}
      data-testid="provenance-line"
    >
      <DataStatusBadge
        status={shown}
        meta={{
          source: source.source,
          sourceUrl: source.sourceUrl,
          retrievedAt: source.retrievedAt,
          lastUpdated: source.lastUpdated ?? source.retrievedAt,
          dataStatus: shown,
        }}
      />
      <span>
        資料來源：{source.source} · 擷取於 {kickoffLabel(source.retrievedAt, timeZone)}（{label}）
        {dataMode === 'demo' ? ' · 示範數據快照' : ''}
      </span>
    </p>
  );
}

// ---------------------------------------------------------------------------
// SegmentedControl — design §6.9 pill track + sliding thumb
// ---------------------------------------------------------------------------
interface SegmentedControlProps<T extends string> {
  /** 唯一 id — sliding thumb 嘅 framer-motion layoutId */
  id: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  id,
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-0.5 rounded-full bg-surface-2 p-0.5', className)}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative min-h-8 rounded-full px-3 text-xs font-medium transition-colors duration-200',
              active ? 'text-foreground' : 'text-text-3 hover:text-text-2',
            )}
          >
            {active && (
              <motion.span
                layoutId={`segmented-${id}`}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 rounded-full border border-border-strong bg-surface"
                aria-hidden
              />
            )}
            <span className="relative">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatCell — hero stat strip 嘅一格（label + count-up 數字）
// ---------------------------------------------------------------------------
interface StatCellProps {
  label: string;
  value: number;
  decimals?: number;
  delay?: number;
  highlight?: boolean;
}

export function StatCell({ label, value, decimals = 0, delay = 0, highlight = false }: StatCellProps) {
  return (
    <div className="flex flex-col items-center gap-1 px-2 py-3">
      <CountUp
        value={value}
        decimals={decimals}
        delay={delay}
        className={cn('font-num text-2xl font-bold tnum md:text-[28px]', highlight ? 'text-gold' : 'text-foreground')}
      />
      <span className="text-label text-text-3">{label}</span>
    </div>
  );
}
