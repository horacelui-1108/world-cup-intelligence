import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  /** ISO 8601 UTC target instant */
  targetIso: string;
  /** lg = 48px hero numerals; sm = 24px mini */
  size?: 'lg' | 'sm';
  className?: string;
  /** Label shown once the target is reached (default 已開賽) */
  zeroLabel?: string;
  onZero?: () => void;
}

function pad2(n: number) {
  return String(Math.max(0, n)).padStart(2, '0');
}

/** Single rolling digit — translateY roll, 0.3s (disabled under reduced-motion). */
function Digit({ value, size }: { value: number; size: 'lg' | 'sm' }) {
  return (
    <span
      className={cn(
        'inline-block overflow-hidden align-baseline',
        size === 'lg' ? 'h-[1em] text-5xl' : 'h-[1em] text-2xl',
      )}
      aria-hidden
    >
      <span
        className="block transition-transform duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateY(-${value}em)` }}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className="block h-[1em] leading-none">
            {i}
          </span>
        ))}
      </span>
    </span>
  );
}

function Unit({ digits, label, size }: { digits: string; label: string; size: 'lg' | 'sm' }) {
  return (
    <span className="flex flex-col items-center gap-1.5">
      <span className="flex font-num font-bold text-gold">
        {digits.split('').map((d, i) => (
          <Digit key={i} value={Number(d)} size={size} />
        ))}
      </span>
      <span className={cn('text-text-3 uppercase', size === 'lg' ? 'text-[10px] tracking-[0.14em]' : 'text-[9px] tracking-[0.12em]')}>
        {label}
      </span>
    </span>
  );
}

/**
 * design.md §6.7 — four blocks (日/時/分/秒), gold tabular numerals,
 * hairline separators, rolling digits; at zero swaps to「已開賽」.
 * aria-live="polite": announces remaining time once per minute.
 */
export default function CountdownTimer({ targetIso, size = 'lg', className, zeroLabel = '已開賽', onZero }: CountdownTimerProps) {
  const target = useMemo(() => new Date(targetIso).getTime(), [targetIso]);
  const [now, setNow] = useState(() => Date.now());
  const zeroFired = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = Math.max(0, target - now);
  const isZero = remaining <= 0;

  useEffect(() => {
    if (isZero && !zeroFired.current) {
      zeroFired.current = true;
      onZero?.();
    }
  }, [isZero, onZero]);

  const totalSec = Math.floor(remaining / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  // Screen-reader announcement, updates once per minute
  const srText = isZero
    ? zeroLabel
    : `距離開賽仲有 ${days > 0 ? `${days} 日 ` : ''}${hours} 小時 ${minutes} 分鐘`;

  if (isZero) {
    return (
      <div className={cn('flex flex-col items-center gap-2', className)} aria-live="polite">
        <span className="inline-flex items-center gap-2 rounded-full border border-live/50 px-4 py-1.5">
          <span className="h-2 w-2 rounded-full bg-live animate-live-pulse" aria-hidden />
          <span className={cn('font-num font-bold text-live', size === 'lg' ? 'text-2xl' : 'text-base')}>{zeroLabel}</span>
        </span>
      </div>
    );
  }

  const sep = (
    <span
      aria-hidden
      className={cn('w-px self-stretch bg-border', size === 'lg' ? 'mx-3 md:mx-5' : 'mx-2')}
    />
  );

  return (
    <div className={cn('inline-flex items-stretch', className)}>
      <span className="sr-only" aria-live="polite">
        {srText}
      </span>
      <Unit digits={days > 99 ? String(days) : pad2(days)} label="日" size={size} />
      {sep}
      <Unit digits={pad2(hours)} label="時" size={size} />
      {sep}
      <Unit digits={pad2(minutes)} label="分" size={size} />
      {sep}
      <Unit digits={pad2(seconds)} label="秒" size={size} />
    </div>
  );
}
