import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Match } from '@/types/football';
import { useTimezone } from '@/lib/timezone';
import { kickoffLabel } from '@/lib/format';
import { teamNameOf } from '@/pages/standings/teamRef';
import { ROUND_LABELS, ROUND_ORDER, winnerOf, type BracketLayout } from '@/pages/bracket/bracketModel';

function matchLine(m: Match): { text: string; decided: boolean } {
  const home = teamNameOf(m.homeTeamId);
  const away = teamNameOf(m.awayTeamId);
  if (m.status === 'ft') {
    const pens = m.score.penalties;
    return {
      decided: true,
      text: `${home} ${m.score.home} 比 ${m.score.away} ${away}${pens ? `（互射十二碼 ${pens.home} 比 ${pens.away}）` : ''}`,
    };
  }
  if (m.status === 'live' || m.status === 'ht') {
    return { decided: false, text: `${home} 對 ${away}（直播中）` };
  }
  return { decided: false, text: `${home} 對 ${away}` };
}

/**
 * bracket.md §5 a11y — 文字版淘汰賽圖：巢狀列表列晒所有輪次（兼顧 SEO）。
 */
export default function BracketTextView({ layout }: { layout: BracketLayout }) {
  const { timeZone, label: tzLabel } = useTimezone();

  const renderMatch = (m: Match) => {
    const { text, decided } = matchLine(m);
    const winner = winnerOf(m);
    return (
      <li key={m.matchId} className="border-b border-border py-2.5 last:border-b-0">
        <Link
          to={`/matches/${m.matchId}`}
          className="group flex flex-wrap items-baseline gap-x-2 rounded-sm"
        >
          <span className={cn('text-sm', decided ? 'font-medium text-foreground' : 'text-text-2')}>{text}</span>
          <span className="text-caption text-text-3">
            {decided
              ? winner
                ? `${teamNameOf(winner)}晉級`
                : '完場'
              : `${kickoffLabel(m.kickoffUtc, timeZone)} ${tzLabel}`}
          </span>
          <span className="inline-flex items-center gap-0.5 text-caption text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            詳情
            <ArrowRight className="h-3 w-3" strokeWidth={1.5} aria-hidden />
          </span>
        </Link>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      {layout.rounds.map((round, r) => (
        <section key={ROUND_ORDER[r]} aria-label={ROUND_LABELS[ROUND_ORDER[r]]}>
          <h3 className="font-display text-base font-semibold text-foreground">
            {ROUND_LABELS[ROUND_ORDER[r]]}
            <span className="ml-1.5 font-num text-caption font-normal text-text-3">{round.length} 場</span>
          </h3>
          <ol className="mt-2 rounded-md border border-border bg-surface px-4">{round.map((n) => renderMatch(n.match))}</ol>
        </section>
      ))}
      {layout.thirdPlace && (
        <section aria-label="季軍戰">
          <h3 className="font-display text-base font-semibold text-foreground">季軍戰</h3>
          <ol className="mt-2 rounded-md border border-dashed border-border-strong bg-surface px-4">
            {renderMatch(layout.thirdPlace.match)}
          </ol>
        </section>
      )}
      {layout.champion?.winnerId && (
        <p className="rounded-md border border-gold bg-surface px-4 py-3 text-center font-display text-base font-semibold text-gold">
          2026 世界冠軍:{teamNameOf(layout.champion.winnerId)}
        </p>
      )}
    </div>
  );
}
