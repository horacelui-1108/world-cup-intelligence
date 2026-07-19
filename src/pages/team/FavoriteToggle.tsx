import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/lib/favorites';

interface FavoriteToggleProps {
  teamId: string;
  teamName: string;
  className?: string;
}

/**
 * 追蹤球隊按鈕 — 經 scaffold useFavorites 真實寫入 localStorage（wc26-favorites）。
 */
export default function FavoriteToggle({ teamId, teamName, className }: FavoriteToggleProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(teamId);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={() => toggleFavorite(teamId)}
      aria-pressed={active}
      aria-label={active ? `取消追蹤${teamName}` : `追蹤${teamName}`}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors duration-200',
        active
          ? 'border-gold/60 bg-gold/10 text-gold hover:bg-gold/15'
          : 'border-border-strong text-text-2 hover:border-accent hover:text-accent',
        className,
      )}
    >
      <Star
        className={cn('h-4 w-4 transition-colors duration-200', active && 'fill-gold text-gold')}
        strokeWidth={1.5}
        aria-hidden
      />
      {active ? '已追蹤' : '追蹤球隊'}
    </motion.button>
  );
}
