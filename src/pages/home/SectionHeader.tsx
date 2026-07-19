import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';

interface SectionHeaderProps {
  id: string;
  title: string;
  caption?: string;
  linkLabel?: string;
  linkTo?: string;
}

export default function SectionHeader({ id, title, caption, linkLabel, linkTo }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 md:mb-6">
      <div>
        <h2 id={id} className="font-display text-xl font-semibold text-foreground md:text-2xl">
          {title}
        </h2>
        {caption && <p className="mt-1 text-caption text-text-3">{caption}</p>}
      </div>
      {linkLabel && linkTo && (
        <Link
          to={linkTo}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-strong"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        </Link>
      )}
    </div>
  );
}
