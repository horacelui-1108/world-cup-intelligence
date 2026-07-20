import { Link } from 'react-router';
import type { Lineup, Match, Player } from '@/types/football';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/EmptyState';
import { Crest } from '@/components/TeamChip';
import { players } from '@/data/players';
import { toTeamRef, uiStatus } from '@/pages/schedule/model';

const playersById: ReadonlyMap<string, Player> = new Map(players.map((p) => [p.id, p]));

const POSITION_LABELS: Record<Player['position'], string> = {
  GK: '門將',
  DF: '後衛',
  MF: '中場',
  FW: '前鋒',
};

function PlayerRow({ playerId }: { playerId: string }) {
  const p = playersById.get(playerId);
  return (
    <li className="flex items-center gap-2.5 py-1.5">
      {p?.number != null ? (
        <span className="w-6 text-center font-num text-sm font-semibold text-text-2 tnum">{p.number}</span>
      ) : (
        <span className="w-6" aria-hidden />
      )}
      <Link
        to={`/players/${playerId}`}
        className="min-w-0 flex-1 truncate text-sm text-foreground transition-colors hover:text-accent"
      >
        {p?.nameZh ?? playerId}
      </Link>
      {p && (
        <span className="rounded-full border border-border px-1.5 py-px text-[10px] font-medium text-text-3">
          {POSITION_LABELS[p.position]}
        </span>
      )}
    </li>
  );
}

function TeamLineup({ teamId, lineup }: { teamId: string; lineup?: Lineup }) {
  const team = toTeamRef(teamId);
  if (!lineup) {
    return (
      <div className="rounded-md border border-dashed border-border p-4 text-center text-caption text-text-3">
        未提供 {team.name} 陣容
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <Crest team={team} size={24} />
        <h3 className="text-sm font-semibold text-foreground">{team.name}</h3>
        {lineup.formation && (
          <span
            title={`陣式:${lineup.formation}`}
            className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 font-num text-caption font-semibold text-accent tnum"
          >
            {lineup.formation}
          </span>
        )}
        {lineup.coach && <span className="ml-auto text-caption text-text-3">教練:{lineup.coach}</span>}
      </div>
      <h4 className="mt-4 text-label text-text-3">正選</h4>
      <ul className="mt-1 divide-y divide-border/60">
        {lineup.starters.map((id) => (
          <PlayerRow key={id} playerId={id} />
        ))}
      </ul>
      {lineup.bench && lineup.bench.length > 0 && (
        <>
          <h4 className="mt-4 text-label text-text-3">後備</h4>
          <ul className="mt-1 divide-y divide-border/60">
            {lineup.bench.map((id) => (
              <PlayerRow key={id} playerId={id} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/**
 * match.md §4 — 陣容 tab。無 lineups 數據 → EmptyState「資料不足」;
 * 有就顯示正選/後備/陣式/教練（教練欄位為 optional，無核實來源就唔顯示）。
 */
export default function LineupsTab({ match }: { match: Match }) {
  const status = uiStatus(match.status);

  if (status === 'scheduled' || status === 'postponed') {
    return (
      <EmptyState
        title={status === 'postponed' ? '比賽延期' : '比賽尚未開始'}
        description="陣容將於開賽前約 1 小時公佈。"
        ctaLabel="返回賽程"
        ctaHref="/schedule"
      />
    );
  }

  const home = match.lineups?.home;
  const away = match.lineups?.away;
  if (!home && !away) {
    return (
      <EmptyState
        title="資料不足"
        description="Demo 數據未涵蓋本場陣容資料。"
      />
    );
  }

  return (
    <div className={cn('grid gap-6 md:grid-cols-2')}>
      <TeamLineup teamId={match.homeTeamId} lineup={home} />
      <TeamLineup teamId={match.awayTeamId} lineup={away} />
    </div>
  );
}
