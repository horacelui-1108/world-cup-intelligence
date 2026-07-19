/**
 * 賽程頁 + Match Centre 共用嘅 view-model 對應層。
 * 將 provider 嘅 Match（src/types/football）對應到 UI 需要嘅形狀，
 * 並集中處理：階段標籤、分鐘顯示（90+x 還原）、狀態語意、
 * 隊徽路徑、球員中文名查找、SourceMeta → UI meta。
 */
import type {
  GroupLetter,
  Match,
  MatchStatus,
  SourceMeta,
  Stage,
  Team,
  Venue,
} from '@/types/football';
import type { MatchRef, SourceMeta as UiSourceMeta, TeamRef } from '@/lib/types';
import { teams, teamsById } from '@/data/teams';
import { venuesById } from '@/data/venues';
import { players } from '@/data/players';

export const GROUP_LETTERS: GroupLetter[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export const STAGE_LABELS: Record<Stage, string> = {
  GROUP: '小組賽',
  R32: '32強',
  R16: '16強',
  QF: '8強',
  SF: '四強',
  '3P': '季軍戰',
  F: '決賽',
};

/** 賽程 row 用嘅短 chip 標籤：小組 A 組 / 32強 / … / 決賽 */
export function stageChipLabel(match: Pick<Match, 'stage' | 'group'>): string {
  return match.stage === 'GROUP' && match.group ? `小組 ${match.group} 組` : STAGE_LABELS[match.stage];
}

/** Match Centre hero 用嘅完整標籤：小組賽 · A 組 / 32強 / … */
export function stageFullLabel(match: Pick<Match, 'stage' | 'group'>): string {
  return match.stage === 'GROUP' && match.group
    ? `小組賽 · ${match.group} 組`
    : STAGE_LABELS[match.stage];
}

export function isKnockout(match: Pick<Match, 'stage'>): boolean {
  return match.stage !== 'GROUP';
}

/** UI 狀態桶：ft → finished；live/ht → live；postponed 獨立；scheduled 不變 */
export type UiStatus = 'scheduled' | 'live' | 'finished' | 'postponed';

export function uiStatus(status: MatchStatus): UiStatus {
  if (status === 'ft') return 'finished';
  if (status === 'live' || status === 'ht') return 'live';
  if (status === 'postponed') return 'postponed';
  return 'scheduled';
}

export function statusText(match: Pick<Match, 'status'>): string {
  switch (match.status) {
    case 'ft':
      return '完場';
    case 'live':
      return '進行中';
    case 'ht':
      return '半場';
    case 'postponed':
      return '延期';
    default:
      return '未開始';
  }
}

/**
 * 分鐘顯示：90+2' 以整數 92 儲存、120+5' 以 125 儲存（見 data/matches.ts 註解）。
 * null = 分鐘未核實 → 顯示「--'」，絕不虛構。
 * aet=true（加時賽事）：91–120 係加時實際分鐘，直寫（93'）；超過 120 先係 120+x。
 */
export function formatMinute(minute: number | null | undefined, aet = false): string {
  if (minute == null) return "--'";
  if (minute > 120) return `120+${minute - 120}'`;
  if (aet) return `${minute}'`;
  if (minute > 90) return `90+${minute - 90}'`;
  return `${minute}'`;
}

export function teamOf(id: string): Team | undefined {
  return teamsById.get(id);
}

export function venueOf(id: string): Venue | undefined {
  return venuesById.get(id);
}

/** 48 隊隊徽全部喺 /crests/crest-{teamId}.svg */
export function crestPath(teamId: string): string {
  return `/crests/crest-${teamId}.svg`;
}

export function teamNameZh(id: string): string {
  return teamsById.get(id)?.nameZh ?? id;
}

export function venueLine(venueId: string): string {
  const v = venuesById.get(venueId);
  return v ? `${v.stadium} · ${v.city}` : venueId;
}

const playerZhById: ReadonlyMap<string, string> = new Map(players.map((p) => [p.id, p.nameZh]));

/** 事件/入球者顯示名：優先中文名（players 數據），否則用事件自帶嘅原名 */
export function playerDisplayName(playerId: string | undefined, fallback: string): string {
  if (playerId) {
    const zh = playerZhById.get(playerId);
    if (zh) return zh;
  }
  return fallback;
}

export function toTeamRef(teamId: string): TeamRef {
  const t = teamsById.get(teamId);
  return {
    id: teamId,
    name: t?.nameZh ?? teamId,
    shortName: t?.code3 ?? teamId.toUpperCase(),
    crest: crestPath(teamId),
    ranking: t?.rank,
  };
}

type UiDataStatus = UiSourceMeta['dataStatus'];

/** UI DataStatusBadge 未支援 STALE → 以 DEMO 呈現（仍保留來源 tooltip） */
function mapDataStatus(status: SourceMeta['dataStatus']): UiDataStatus {
  return status === 'STALE' ? 'DEMO' : status;
}

export function toUiMeta(source: SourceMeta, lastUpdated?: string): UiSourceMeta {
  return {
    source: source.source,
    sourceUrl: source.sourceUrl,
    retrievedAt: source.retrievedAt,
    lastUpdated: source.lastUpdated ?? lastUpdated ?? source.retrievedAt,
    dataStatus: mapDataStatus(source.dataStatus),
  };
}

/** provider Match → 共享 MatchCard 需要嘅 MatchRef */
export function toMatchRef(m: Match, lastUpdated?: string): MatchRef {
  const status = uiStatus(m.status);
  const played = status === 'live' || status === 'finished';
  return {
    id: m.matchId,
    stage: stageChipLabel(m),
    group: m.group,
    home: toTeamRef(m.homeTeamId),
    away: toTeamRef(m.awayTeamId),
    kickoffUtc: m.kickoffUtc,
    venue: venueLine(m.venueId),
    status: status === 'postponed' ? 'scheduled' : status,
    homeScore: played ? m.score.home : undefined,
    awayScore: played ? m.score.away : undefined,
    scorers: m.scorers?.map((s) => playerDisplayName(s.playerId, s.playerName)),
    meta: toUiMeta(m.source, lastUpdated),
  };
}

/** 全部 48 隊（球隊篩選 dropdown 用） */
export const ALL_TEAMS: Team[] = teams;
