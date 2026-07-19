import { Globe } from 'lucide-react';
import SegmentedControl from '@/components/SegmentedControl';
import { useTimezone } from '@/lib/timezone';
import { cn } from '@/lib/utils';
import type { TzMode } from '@/lib/timezone';

/**
 * 本地 ↔ HKT (Asia/Hong_Kong) one-tap switch.
 * State lives in TimezoneContext and persists to localStorage.
 */
export default function TimezoneToggle({
  className,
  showIcon = true,
}: {
  className?: string;
  showIcon?: boolean;
}) {
  const { mode, setMode } = useTimezone();

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      {showIcon && <Globe className="h-3.5 w-3.5 text-text-3" strokeWidth={1.5} aria-hidden />}
      <SegmentedControl<TzMode>
        ariaLabel="時區切換:本地時間或香港時間"
        size="sm"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'local', label: '本地' },
          { value: 'hkt', label: 'HKT' },
        ]}
      />
    </span>
  );
}
