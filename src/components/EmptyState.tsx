import { Link } from 'react-router';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  ctaLabel?: string;
  /** Internal route for the CTA */
  ctaHref?: string;
  onCta?: () => void;
  className?: string;
  compact?: boolean;
}

/**
 * design.md §6.8 — centered pitch-lines SVG (subtle), serif headline,
 * body caption, one accent CTA.
 */
export default function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
  onCta,
  className,
  compact = false,
}: EmptyStateProps) {
  const cta = ctaLabel ? (
    ctaHref ? (
      <Link
        to={ctaHref}
        className="inline-flex min-h-11 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent-strong"
      >
        {ctaLabel}
      </Link>
    ) : (
      <button
        type="button"
        onClick={onCta}
        className="inline-flex min-h-11 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent-strong"
      >
        {ctaLabel}
      </button>
    )
  ) : null;

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-md border border-border bg-surface text-center',
        compact ? 'px-4 py-8' : 'px-6 py-14',
        className,
      )}
    >
      {/* pitch-lines watermark — masked so it inherits the theme text color */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-text opacity-[0.07]"
        style={{
          WebkitMaskImage: 'url(/pitch-lines.svg)',
          maskImage: 'url(/pitch-lines.svg)',
          WebkitMaskSize: 'cover',
          maskSize: 'cover',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      />
      <h3 className={cn('relative font-display font-semibold text-foreground', compact ? 'text-lg' : 'text-xl md:text-2xl')}>
        {title}
      </h3>
      {description && <p className="relative mt-2 max-w-md text-sm text-text-2">{description}</p>}
      {cta && <div className="relative mt-5">{cta}</div>}
    </div>
  );
}
