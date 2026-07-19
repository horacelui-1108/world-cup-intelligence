import { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
  title?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
}

/**
 * design.md §6.9 — surface-2 track, sliding thumb (layoutId, 0.22s), 12px labels.
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
  ariaLabel,
}: SegmentedControlProps<T>) {
  const id = useId();
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center rounded-full bg-surface-2 p-0.5', className)}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={opt.disabled}
            title={opt.title}
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative rounded-full font-medium transition-colors duration-200',
              size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
              active ? 'text-foreground' : 'text-text-3 hover:text-text-2',
              opt.disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 rounded-full border border-border bg-surface shadow-xs"
                aria-hidden
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
