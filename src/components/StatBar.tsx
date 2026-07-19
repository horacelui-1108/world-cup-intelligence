import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatBarProps {
  /** metric label centered above the bars */
  label: string;
  valueA: number;
  valueB: number;
  /** override the bar scale max (defaults to max(a, b)) */
  max?: number;
  /** format the numeric labels (default: raw integer) */
  format?: (v: number) => string;
  className?: string;
}

/**
 * design.md §6.6 — dual horizontal bars from the center axis: team A left
 * (accent), team B right (surface-2 w/ border). Width animates 0 → value on
 * viewport entry, 0.7s.
 */
export default function StatBar({ label, valueA, valueB, max, format, className }: StatBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const scale = max ?? Math.max(valueA, valueB, 1);
  const pctA = Math.min(100, (valueA / scale) * 100);
  const pctB = Math.min(100, (valueB / scale) * 100);
  const fmt = format ?? ((v: number) => String(v));

  return (
    <div ref={ref} className={cn('w-full', className)}>
      <p className="text-center text-caption text-text-3">{label}</p>
      <div className="mt-1.5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center justify-end gap-2">
          <span className="font-num text-sm font-semibold text-foreground tnum">{fmt(valueA)}</span>
          <div className="flex h-2.5 flex-1 justify-end overflow-hidden rounded-full bg-surface-2/40">
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={{ width: 0 }}
              animate={inView ? { width: `${pctA}%` } : { width: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
        <span className="w-px self-stretch bg-border" aria-hidden />
        <div className="flex items-center gap-2">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2/40">
            <motion.div
              className="h-full rounded-full border border-border-strong bg-surface-2"
              initial={{ width: 0 }}
              animate={inView ? { width: `${pctB}%` } : { width: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <span className="font-num text-sm font-semibold text-foreground tnum">{fmt(valueB)}</span>
        </div>
      </div>
    </div>
  );
}
