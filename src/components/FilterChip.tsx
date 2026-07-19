import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  count?: number;
  className?: string;
}

/**
 * design.md §6.9 — pill, border; selected = accent border + accent text +
 * 8% accent bg; tap scale 0.96.
 */
export default function FilterChip({ label, selected, onClick, count, className }: FilterChipProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors duration-200',
        selected
          ? 'border-accent bg-accent/10 text-accent'
          : 'border-border text-text-2 hover:border-border-strong hover:text-foreground',
        className,
      )}
    >
      {label}
      {typeof count === 'number' && (
        <span className={cn('font-num text-caption', selected ? 'text-accent' : 'text-text-3')}>{count}</span>
      )}
    </motion.button>
  );
}
