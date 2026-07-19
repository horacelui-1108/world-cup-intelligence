import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface SectionHeaderProps {
  id: string;
  title: string;
  caption?: string;
  /** 來源 caption / DataStatusBadge（渲染喺 caption 行右側） */
  badge?: ReactNode;
  linkLabel?: string;
  linkTo?: string;
}

export default function SectionHeader({ id, title, caption, badge, linkLabel, linkTo }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 md:mb-6">
      <div>
        <h2 id={id} className="font-display text-xl font-semibold text-foreground md:text-2xl">
          {title}
        </h2>
        {(caption || badge) && (
          <p className="mt-1 flex flex-wrap items-center gap-2 text-caption text-text-3">
            {caption}
            {badge}
          </p>
        )}
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
