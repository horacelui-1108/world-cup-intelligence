/**
 * World Cup Intelligence Hub — 領域類型定義
 *
 * 設計原則（對應 analysis-framework.md）：
 * - 所有 Match 均為可序列化純 data（無 class / 無函數）。
 * - 每項數據帶 SourceMeta，UI 依 dataStatus 渲染 DataStatusBadge。
 * - 時間一律 UTC ISO8601 儲存；展示層負責時區轉換（design §7）。
 * - 未核實嘅分鐘用 null 表示（絕不虛構）；stats 欄位 null/undefined = 唔顯示。
 */

/** 數據狀態：LIVE 直播中 / FINAL 完場待核 / VERIFIED 多源核實 / PENDING 未開賽 / DEMO 示範數據 / STALE 過期（live 失敗 fallback） */
export type DataStatus = 'LIVE' | 'FINAL' | 'VERIFIED' | 'PENDING' | 'DEMO' | 'STALE';

/** 數據模式（provider 層）：demo 必須喺 UI 標示「Demo Data」（G-12） */
export type DataMode = 'live' | 'demo';

export interface SourceMeta {
  /** 來源名稱，如 'ESPN'、'API-Football' */
  source: string;
  sourceUrl: string;
  /** 擷取時間 ISO8601 UTC */
  retrievedAt: string;
  lastUpdated?: string;
  dataStatus: DataStatus;
  licenseNote?: string;
}

/** 比賽階段 */
export type Stage = 'GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | '3P' | 'F';

export type GroupLetter =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';

/** 賽事 config — 轉換賽事只需換 config，零組件改動（design §7） */
export interface Tournament {
  id: string;
  /** 繁中名稱，如「FIFA 世界盃 2026」 */
  name: string;
  nameEn: string;
  year: number;
  groups: GroupLetter[];
  /** venue id 清單 */
  venues: string[];
  stages: Stage[];
  totalMatches: number;
  hostCountries: string[];
  startDate: string;
  endDate: string;
}

export interface Team {
  /** 短 id，如 'arg' */
  id: string;
  /** FIFA 三字母代碼，如 'ARG' */
  code3: string;
  nameZh: string;
  nameEn: string;
  group: GroupLetter;
  /** 國旗主色（2–3 個 hex），crest SVG 用 */
  flagColors: string[];
  /** FIFA 排名（如有核實來源先填） */
  rank?: number;
}

export interface Venue {
  id: string;
  /** 英文球場名，如 'MetLife Stadium' */
  stadium: string;
  /** 繁中城市名，如 '東盧瑟福' */
  city: string;
  country: string;
  capacity?: number;
}

export type MatchStatus = 'scheduled' | 'live' | 'ht' | 'ft' | 'postponed';

export interface Score {
  home: number;
  away: number;
  halfTime?: { home: number; away: number };
  /** 加時階段入球（唔包含法定時間） */
  extraTime?: { home: number; away: number };
  /** 互射十二碼結果 */
  penalties?: { home: number; away: number };
}

export type EventType =
  | 'goal'
  | 'pen_goal'
  | 'pen_miss'
  | 'own_goal'
  | 'yellow'
  | 'second_yellow'
  | 'red'
  | 'sub'
  | 'var';

export type VarOutcome =
  | 'goal_confirmed'
  | 'goal_disallowed'
  | 'penalty_confirmed'
  | 'penalty_cancelled'
  | 'red_confirmed'
  | 'controversy';

export interface MatchEvent {
  /**
   * 事件分鐘。常規時間後補時以 90+x 嘅整數儲存（如 90+2' → 92），
   * 加時後補時同理（120+5' → 125）；顯示格式由 engine/UI 還原。
   * null = 分鐘未核實（brief 無提供），絕不虛構。
   */
  minute: number | null;
  type: EventType;
  teamId: string;
  playerId?: string;
  /** 事件涉及球員姓名；團隊級事件（如無名 VAR 爭議）用空字串 */
  playerName: string;
  assistPlayerId?: string;
  assistName?: string;
  /** 補充說明（如 120+5 十二碼、VAR 覆核細節） */
  detail?: string;
  varOutcome?: VarOutcome;
}

/** 入球事件（Match.scorers 用）— MatchEvent 嘅入球子集 */
export interface GoalEvent {
  minute: number | null;
  teamId: string;
  playerId?: string;
  playerName: string;
  assistPlayerId?: string;
  assistName?: string;
  kind: 'goal' | 'pen_goal' | 'own_goal';
}

/** 主客雙方統計值 */
export interface StatPair {
  home: number;
  away: number;
}

/**
 * 全場統計 — 全部 optional；null/undefined = 該行唔顯示（design §7 xG rule 同此）。
 * xG 只有 provider 提供先顯示並標來源（G-03）。
 */
export interface MatchStats {
  possession?: StatPair | null;
  shots?: StatPair | null;
  shotsOnTarget?: StatPair | null;
  corners?: StatPair | null;
  fouls?: StatPair | null;
  offsides?: StatPair | null;
  passAccuracy?: StatPair | null;
  yellowCards?: StatPair | null;
  redCards?: StatPair | null;
  xg?: StatPair | null;
}

export interface Lineup {
  formation?: string;
  /** 正選球員 id */
  starters: string[];
  bench?: string[];
}

export interface Match {
  matchId: string;
  stage: Stage;
  group?: GroupLetter;
  /** 開球時間 ISO8601 UTC */
  kickoffUtc: string;
  venueId: string;
  homeTeamId: string;
  awayTeamId: string;
  status: MatchStatus;
  score: Score;
  scorers?: GoalEvent[];
  events?: MatchEvent[];
  stats?: MatchStats;
  lineups?: { home?: Lineup; away?: Lineup };
  source: SourceMeta;
}

export type Position = 'GK' | 'DF' | 'MF' | 'FW';

export interface Player {
  id: string;
  nameZh: string;
  nameEn: string;
  teamId: string;
  number?: number;
  /** 位置為大致分類（brief 未提供官方名單位置） */
  position: Position;
  age?: number;
  club?: string;
  stats?: PlayerStats;
}

/**
 * 球員統計 — 全部 optional：只填 brief 有嘅數字，
 * 未知一律 undefined，絕不填 0 冒充。
 */
export interface PlayerStats {
  goals?: number;
  assists?: number;
  yellow?: number;
  red?: number;
  minutes?: number;
  appearances?: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  source: SourceMeta;
}
