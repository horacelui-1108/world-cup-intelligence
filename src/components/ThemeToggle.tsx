import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useLang } from '@/lib/lang';
import { cn } from '@/lib/utils';

/**
 * design.md §6.11 — sun/moon crossfade 0.2s; persists to localStorage
 * (handled by ThemeProvider) and updates color-scheme meta.
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLang();
  const dark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? t('theme.toLight') : t('theme.toDark')}
      aria-pressed={!dark}
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent',
        'text-text-2 transition-colors duration-200 hover:border-border hover:text-foreground',
        className,
      )}
    >
      <Sun
        className={cn(
          'absolute h-[18px] w-[18px] transition-all duration-200',
          dark ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-90 opacity-0',
        )}
        strokeWidth={1.5}
        aria-hidden
      />
      <Moon
        className={cn(
          'absolute h-[18px] w-[18px] transition-all duration-200',
          dark ? 'scale-50 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100',
        )}
        strokeWidth={1.5}
        aria-hidden
      />
    </button>
  );
}
