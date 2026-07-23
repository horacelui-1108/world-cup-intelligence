/**
 * 球隊頁 + 球員頁共用嘅純數據適配層。
 *
 * 職責：
 * - provider 領域模型（types/football）→ scaffold 組件模型（lib/types）嘅轉換
 * - 由已完場賽事推導球隊戰績（純計算，唔虛構任何統計）
 * - 階段 / 分鐘 / 球場等顯示格式
 */
import type { GoalEvent, Match, Player, SourceMeta, Team } from '@/types/football';
import type { DataStatus, MatchRef, TeamRef } from '@/lib/types';
import { teams } from '@/data/teams';
import { playersById } from '@/data/players';
import { getVenueById } from '@/data/venues';
import { asset } from '@/lib/asset';

export const teamsById: ReadonlyMap<string, Team> = new Map(teams.map((t) => [t.id, t]));

/** 階段顯示名（同 analysis engine 嘅用語一致） */
export const STAGE_LABELS: Record<string, string> = {
  GROUP: '分組賽',
  R32: '三十二強',
  R16: '十六強',
  QF: '八強',
  SF: '四強',
  '3P': '季軍戰',
  F: '決賽',
};

/** 淘汰賽階段順序（分組賽排最前） */
export const STAGE_ORDER: Record<string, number> = {
  GROUP: 0,
  R32: 1,
  R16: 2,
  QF: 3,
  SF: 4,
  '3P': 5,
  F: 6,
};

export function stageLabel(match: Match): string {
  if (match.stage === 'GROUP') return match.group ? `分組賽 ${match.group} 組` : '分組賽';
  return STAGE_LABELS[match.stage] ?? match.stage;
}

/** 隊徽路徑 — 48 隊全部有 /crests/crest-{teamId}.svg */
export function crestSrc(teamId: string): string {
  return asset(`/crests/crest-${teamId}.svg`);
}

export function toTeamRef(team: Team): TeamRef {
  return {
    id: team.id,
    name: team.nameZh,
    shortName: team.code3,
    crest: crestSrc(team.id),
    ranking: team.rank,
  };
}

/** 以 teamId 直接砌 TeamRef（對手等場景；未知 id 用 id 做名） */
export function teamRefById(teamId: string): TeamRef {
  const team = teamsById.get(teamId);
  if (!team) {
    return { id: teamId, name: teamId, shortName: teamId.toUpperCase(), crest: crestSrc(teamId) };
  }
  return toTeamRef(team);
}

export function venueLabel(venueId: string): string {
  const venue = getVenueById(venueId);
  return venue ? `${venue.stadium}，${venue.city}` : venueId;
}

/** lib/types DataStatus 冇 STALE；STALE（live 失敗 fallback demo）以 DEMO 標示 */
export function badgeStatus(dataStatus: SourceMeta['dataStatus']): DataStatus {
  return dataStatus === 'STALE' ? 'DEMO' : dataStatus;
}

/** 分鐘顯示：92 → 90+2'；125 → 120+5'；null 由 caller 決定唔顯示 */
export function formatMinute(minute: number): string {
  if (minute > 120) return `120+${minute - 120}'`;
  if (minute > 90) return `90+${minute - 90}'`;
  return `${minute}'`;
}

/** 入球者顯示名（優先中文名，fallback 原文名） */
export function scorerName(playerId: string | undefined, fallback: string): string {
  if (playerId) {
    const player = playersById.get(playerId);
    if (player) return player.nameZh;
  }
  return fallback;
}

/** MatchCard 用嘅入球者字串，如「美斯 ×2」 */
export function scorerStrings(match: Match): string[] | undefined {
  const scorers = match.scorers;
  if (!scorers || scorers.length === 0) return undefined;
  const counts = new Map<string, { name: string; count: number }>();
  for (const s of scorers) {
    if (s.kind === 'own_goal') continue;
    const key = s.playerId ?? s.playerName;
    const entry = counts.get(key) ?? { name: scorerName(s.playerId, s.playerName), count: 0 };
    entry.count += 1;
    counts.set(key, entry);
  }
  return [...counts.values()].map((e) => (e.count > 1 ? `${e.name} ×${e.count}` : e.name));
}

function toMeta(source: SourceMeta, matchId: string): MatchRef['meta'] {
  return {
    source: source.source,
    sourceUrl: source.sourceUrl,
    retrievedAt: source.retrievedAt,
    lastUpdated: source.lastUpdated ?? source.retrievedAt,
    dataStatus: badgeStatus(source.dataStatus),
    matchId,
  };
}

/** provider Match → MatchCard 用嘅 MatchRef */
export function toMatchRef(match: Match): MatchRef {
  const status: MatchRef['status'] =
    match.status === 'ft'
      ? 'finished'
      : match.status === 'live' || match.status === 'ht'
        ? 'live'
        : 'scheduled';
  return {
    id: match.matchId,
    stage: stageLabel(match),
    group: match.group,
    home: teamRefById(match.homeTeamId),
    away: teamRefById(match.awayTeamId),
    kickoffUtc: match.kickoffUtc,
    venue: venueLabel(match.venueId),
    status,
    homeScore: status === 'scheduled' ? undefined : match.score.home,
    awayScore: status === 'scheduled' ? undefined : match.score.away,
    scorers: scorerStrings(match),
    meta: toMeta(match.source, match.matchId),
  };
}

// ---------------------------------------------------------------------------
// 球隊戰績推導
// ---------------------------------------------------------------------------

export type MatchResult = 'W' | 'D' | 'L';

export interface TeamMatchResult {
  result: MatchResult;
  /** 互射十二碼分出勝負（法定時間和局） */
  decidedByPenalties: boolean;
  penaltiesWinnerId?: string;
}

/**
 * 由球隊角度判斷一場 ft 賽事嘅勝和負。
 * 法定/加時比賽和局但有互射十二碼：result 維持 'D'（足球統計慣例），
 * decidedByPenalties 供 UI 補充「十二碼晉級/出局」。
 */
export function resultFor(teamId: string, match: Match): TeamMatchResult | null {
  if (match.status !== 'ft') return null;
  const isHome = match.homeTeamId === teamId;
  const gf = isHome ? match.score.home : match.score.away;
  const ga = isHome ? match.score.away : match.score.home;
  const pens = match.score.penalties;
  if (gf > ga) return { result: 'W', decidedByPenalties: false };
  if (gf < ga) return { result: 'L', decidedByPenalties: false };
  if (pens) {
    const winnerId = pens.home > pens.away ? match.homeTeamId : match.awayTeamId;
    return { result: 'D', decidedByPenalties: true, penaltiesWinnerId: winnerId };
  }
  return { result: 'D', decidedByPenalties: false };
}

export interface TeamSummary {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  /** 對手零入球嘅場數（純計算） */
  cleanSheets: number;
  /** 場均入球（已完場計） */
  goalsPerMatch: number;
  /** 近 5 場走勢，最舊 → 最新 */
  form: MatchResult[];
}

/** 由該隊已完場賽事純計算戰績摘要（唔虛構其他統計） */
export function computeTeamSummary(teamId: string, matches: Match[]): TeamSummary {
  const played = matches
    .filter((m) => m.status === 'ft')
    .sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc));
  const acc: TeamSummary = {
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    cleanSheets: 0,
    goalsPerMatch: 0,
    form: [],
  };
  for (const m of played) {
    const isHome = m.homeTeamId === teamId;
    const gf = isHome ? m.score.home : m.score.away;
    const ga = isHome ? m.score.away : m.score.home;
    const r = resultFor(teamId, m);
    acc.played += 1;
    acc.goalsFor += gf;
    acc.goalsAgainst += ga;
    if (ga === 0) acc.cleanSheets += 1;
    if (r?.result === 'W') acc.won += 1;
    else if (r?.result === 'L') acc.lost += 1;
    else acc.drawn += 1;
    if (r) acc.form.push(r.result);
  }
  acc.goalDifference = acc.goalsFor - acc.goalsAgainst;
  acc.goalsPerMatch = acc.played > 0 ? acc.goalsFor / acc.played : 0;
  acc.form = acc.form.slice(-5);
  return acc;
}

/** 進球分佈（15 分鐘一段）— 只計算 scorers 入面分鐘已核實嘅入球 */
export interface GoalSegment {
  label: string;
  count: number;
}

export function computeGoalDistribution(teamId: string, matches: Match[]): GoalSegment[] {
  const segments: GoalSegment[] = [
    { label: "0–15'", count: 0 },
    { label: "16–30'", count: 0 },
    { label: "31–45'", count: 0 },
    { label: "46–60'", count: 0 },
    { label: "61–75'", count: 0 },
    { label: "76–90+'", count: 0 },
  ];
  for (const m of matches) {
    if (m.status !== 'ft' || !m.scorers) continue;
    for (const s of m.scorers) {
      if (s.teamId !== teamId || s.kind === 'own_goal' || s.minute === null) continue;
      // 分鐘 1–15 → 第 1 段；16–30 → 第 2 段；…；75 分鐘起（包括 90+x）歸最後一段
      const seg = s.minute <= 15 ? 0 : Math.min(5, Math.floor((s.minute - 1) / 15));
      segments[Math.max(0, seg)].count += 1;
    }
  }
  return segments;
}

// ---------------------------------------------------------------------------
// 球員逐場貢獻推導
// ---------------------------------------------------------------------------

export interface PlayerMatchContribution {
  match: Match;
  goals: GoalEvent[];
  assists: GoalEvent[];
}

const GOAL_KINDS = new Set(['goal', 'pen_goal', 'own_goal']);

/** 由賽事搵出該球員有入球 / 助攻事件嘅場次（按時間排序） */
export function findPlayerContributions(player: Player, matches: Match[]): PlayerMatchContribution[] {
  const out: PlayerMatchContribution[] = [];
  for (const m of matches) {
    if (m.status !== 'ft') continue;
    const goalEvents: GoalEvent[] =
      m.scorers ??
      (m.events ?? [])
        .filter((e) => GOAL_KINDS.has(e.type))
        .map((e) => ({
          minute: e.minute,
          teamId: e.teamId,
          playerId: e.playerId,
          playerName: e.playerName,
          assistPlayerId: e.assistPlayerId,
          assistName: e.assistName,
          kind: e.type as GoalEvent['kind'],
        }));
    const goals = goalEvents.filter(
      (g) => g.kind !== 'own_goal' && (g.playerId === player.id || g.playerName === player.nameEn),
    );
    const assists = goalEvents.filter(
      (g) =>
        (g.assistPlayerId !== undefined && g.assistPlayerId === player.id) ||
        (g.assistPlayerId === undefined && g.assistName !== undefined && g.assistName === player.nameEn),
    );
    if (goals.length > 0 || assists.length > 0) {
      out.push({ match: m, goals, assists });
    }
  }
  return out.sort((a, b) => a.match.kickoffUtc.localeCompare(b.match.kickoffUtc));
}

/** 位置顯示名 */
export const POSITION_LABELS: Record<Player['position'], string> = {
  GK: '門將',
  DF: '後衛',
  MF: '中場',
  FW: '前鋒',
};

export const POSITION_ORDER: Record<Player['position'], number> = { GK: 0, DF: 1, MF: 2, FW: 3 };
