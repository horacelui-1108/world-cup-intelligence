/**
 * 分析頁共用 view-model helpers — 對應 analysis-framework.md 嘅輸出結構。
 * 呢度只係渲染層：唔生成任何分析內容，只將 engine 輸出格式化。
 */
import type { MatchAnalysis, SourceRef, DataTier, KeyPlayer } from '@/lib/analysis/types';
import type { Match, Stage, Team } from '@/types/football';
import type { TeamRef } from '@/lib/types';

/** 階段標籤（列表 chip 用） */
export const STAGE_LABEL: Record<Stage, string> = {
  GROUP: '小組賽',
  R32: '32強',
  R16: '16強',
  QF: '8強',
  SF: '4強',
  '3P': '季軍戰',
  F: '決賽',
};

export const STAGE_ORDER: Record<Stage, number> = {
  GROUP: 0,
  R32: 1,
  R16: 2,
  QF: 3,
  SF: 4,
  '3P': 5,
  F: 6,
};

/** 列表篩選可選階段（順序即 chip 順序） */
export const FILTER_STAGES: { value: Stage; label: string }[] = [
  { value: 'GROUP', label: '小組賽' },
  { value: 'R32', label: '32強' },
  { value: 'R16', label: '16強' },
  { value: 'QF', label: '8強' },
  { value: 'SF', label: '4強' },
  { value: '3P', label: '季軍戰' },
];

/** 一條可發布嘅分析 + 佢嘅比賽同球隊資料 */
export interface AnalysisEntry {
  analysis: MatchAnalysis;
  match: Match;
  home: Team;
  away: Team;
}

/** 數據層 Team → UI TeamRef（crest 用 /crests/crest-{teamId}.svg 約定） */
export function toTeamRef(t: Team): TeamRef {
  return {
    id: t.id,
    name: t.nameZh,
    shortName: t.code3,
    crest: `/crests/crest-${t.id}.svg`,
    ranking: t.rank,
  };
}

export function fallbackTeam(id: string): Team {
  return { id, code3: id.slice(0, 3).toUpperCase(), nameZh: id, nameEn: id, group: 'A', flagColors: [] };
}

/** 比分字串 */
export function scoreLine(m: Match): string {
  return `${m.score.home}–${m.score.away}`;
}

export function penaltiesLine(m: Match): string | null {
  if (!m.score.penalties) return null;
  return `互射十二碼 ${m.score.penalties.home}–${m.score.penalties.away}`;
}

/** 摘錄用：移除行內〔Sn〕標記（詳情頁會以可點擊 chip 呈現） */
export function stripCitations(text: string): string {
  return text.replace(/〔S\d+〕/g, '');
}

/** 同 engine 去重 key 一致：sourceId|entity|entityId|fieldPath */
export function sourceKey(r: SourceRef): string {
  return `${r.sourceId}|${r.entity}|${r.entityId ?? ''}|${r.fieldPath}`;
}

/** 喺 analysis.sources 搵到對應清單行（0-based；搵唔到 -1） */
export function sourceListIndex(sources: SourceRef[], ref: SourceRef): number {
  const key = sourceKey(ref);
  return sources.findIndex((r) => sourceKey(r) === key);
}

/** 閱讀時間（中文字約 350 字/分鐘，最少 1 分鐘） */
export function readingMinutes(a: MatchAnalysis): number {
  let chars = 0;
  const add = (t: string) => {
    chars += stripCitations(t).length;
  };
  if (a.quickSummary.content) add(a.quickSummary.content.text);
  a.fullReport.content?.paragraphs.forEach((c) => add(c.text));
  a.tactical.content?.claims.forEach((c) => add(c.text));
  a.turningPoints.content?.forEach((tp) => add(tp.description.text));
  a.keyPlayers.content?.forEach((kp) => kp.stats.forEach((c) => add(c.text)));
  a.keySubstitutions.content?.forEach((ks) => add(ks.impact.text));
  a.dataConclusions.content?.forEach((dc) => add(dc.claim.text));
  a.nextMatch.content?.facts.forEach((c) => add(c.text));
  return Math.max(1, Math.round(chars / 350));
}

/** 來源實體標籤（framework §i：provider、數據實體） */
const ENTITY_LABEL: Record<string, string> = {
  match: '比賽資料',
  'match.events': '比賽事件',
  'match.stats': '比賽統計',
  'player.stats': '球員統計',
};

export function entityLabel(entity: string): string {
  return ENTITY_LABEL[entity] ?? entity;
}

export const SELECTION_BASIS_LABEL: Record<KeyPlayer['selectionBasis'], string> = {
  official_motm: '官方最佳球員',
  goals: '入球',
  assists: '助攻',
  rating: '評分',
  goalkeeper_saves: '門將撲救',
};

export const TIER_LABEL: Record<DataTier, string> = {
  T0: 'T0 完整',
  T1: 'T1 標準',
  T2: 'T2 基本',
  T3: 'T3 極簡',
};

/** 分鐘顯示：還原補時格式（92 → 90+2；aet 時 93 直寫、125 → 120+5） */
export function minuteLabel(minute: number, aet: boolean): string {
  if (aet) {
    if (minute > 120) return `120+${minute - 120}`;
    return String(minute);
  }
  if (minute > 90) return `90+${minute - 90}`;
  return String(minute);
}
