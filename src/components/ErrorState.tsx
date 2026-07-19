import { useState } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  /** Error detail rendered in caption mono */
  error?: string;
  /** Real retry — called when the user presses 重試. May return a promise. */
  onRetry: () => void | Promise<unknown>;
  retryLabel?: string;
  className?: string;
  compact?: boolean;
}

/**
 * design.md §6.8 — live-colored icon, 「資料未能載入」, retry button
 * (accent outline) that performs a genuine retry.
 */
export default function ErrorState({
  title = '資料未能載入',
  error,
  onRetry,
  retryLabel = '重試',
  className,
  compact = false,
}: ErrorStateProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-md border border-border bg-surface text-center',
        compact ? 'px-4 py-8' : 'px-6 py-14',
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-live/40 bg-live/10">
        <AlertTriangle className="h-5 w-5 text-live" strokeWidth={1.5} aria-hidden />
      </span>
      <h3 className={cn('mt-3 font-display font-semibold text-foreground', compact ? 'text-lg' : 'text-xl')}>
        {title}
      </h3>
      {error && (
        <p className="mt-2 max-w-md font-mono text-caption break-all text-text-3">{error}</p>
      )}
      <button
        type="button"
        onClick={handleRetry}
        disabled={retrying}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md border border-accent px-5 text-sm font-medium text-accent transition-colors duration-200 hover:bg-accent/10 disabled:opacity-60"
      >
        <RotateCw className={cn('h-4 w-4', retrying && 'animate-spin')} strokeWidth={1.5} aria-hidden />
        {retrying ? '重試中…' : retryLabel}
      </button>
    </div>
  );
}
