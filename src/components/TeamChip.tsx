import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import type { TeamRef } from '@/lib/types';

export type FormResult = 'W' | 'D' | 'L';

const formColor: Record<FormResult, string> = {
  W: 'bg-win',
  D: 'bg-draw',
  L: 'bg-live',
};

const formLabel: Record<FormResult, string> = {
  W: '勝',
  D: '和',
  L: '負',
};

export function Crest({
  team,
  size = 24,
  className,
}: {
  team: TeamRef;
  size?: 24 | 32 | 48 | 64 | 96;
  className?: string;
}) {
  return (
    <img
      src={team.crest}
      alt={`${team.name}隊徽`}
      width={size}
      height={size}
      loading="lazy"
      className={cn('shrink-0 rounded-full', className)}
      style={{ width: size, height: size }}
    />
  );
}

interface TeamChipProps {
  team: TeamRef;
  crestSize?: 24 | 32 | 48;
  showName?: boolean;
  /** last-5 form, oldest → newest */
  form?: FormResult[];
  /** wrap in a Link to the team page (default true) */
  link?: boolean;
  className?: string;
}

/**
 * design.md §6.5 — circular crest + 3-letter code (Inter 600) + optional
 * form dots (W green / D grey / L red). Colour is never the sole carrier:
 * dots carry an accessible title.
 */
export default function TeamChip({
  team,
  crestSize = 24,
  showName = true,
  form,
  link = true,
  className,
}: TeamChipProps) {
  const inner = (
    <>
      <Crest team={team} size={crestSize} />
      {showName && (
        <span className="font-num text-sm font-semibold tracking-wide text-foreground">
          {team.shortName}
        </span>
      )}
      {form && form.length > 0 && (
        <span className="flex items-center gap-1" role="img" aria-label={`近況:${form.map((f) => formLabel[f]).join(' ')}`}>
          {form.slice(-5).map((f, i) => (
            <span key={i} title={formLabel[f]} className={cn('h-1.5 w-1.5 rounded-full', formColor[f])} />
          ))}
        </span>
      )}
    </>
  );

  const cls = cn('inline-flex items-center gap-2', className);
  if (!link) return <span className={cls}>{inner}</span>;
  return (
    <Link to={`/teams/${team.id}`} className={cn(cls, 'rounded-sm transition-colors duration-200 hover:text-accent')}>
      {inner}
    </Link>
  );
}
