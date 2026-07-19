/**
 * 賽後分析 Data Model — 對應 analysis-framework.md §Data Model。
 * DataMode 單一來源自 types/football。
 */
import type { DataMode } from '../../types/football';

export type { DataMode };

export interface SourceRef {
  sourceId: string;
  /** 數據實體，如 'match'、'match.events'、'player.stats' */
  entity: string;
  entityId?: string;
  /** 欄位級溯源（G-04），如 'score.home' */
  fieldPath: string;
  retrievedAt: string;
  dataMode: DataMode;
}

export interface Claim {
  text: string;
  /** 空 array → G-11 來源覆蓋檢查攔截 */
  sourceRefs: SourceRef[];
}

export interface QuickSummary {
  text: string;
  sourceRefs: SourceRef[];
}

export interface TurningPoint {
  eventType: 'goal' | 'red_card' | 'penalty';
  minute: number;
  description: Claim;
  scoreBefore: string;
  scoreAfter?: string;
  rank: number;
}

export interface KeyPlayer {
  playerId: string;
  name: string;
  team: 'home' | 'away';
  selectionBasis: 'official_motm' | 'goals' | 'assists' | 'rating' | 'goalkeeper_saves';
  stats: Claim[];
  rating?: { value: number; sourceRef: SourceRef };
}

export interface KeySubstitution {
  minute: number;
  playerIn: string;
  playerOut: string;
  impact: Claim;
}

export interface DataConclusion {
  claim: Claim;
  fields: string[];
}

export interface NextMatchImpact {
  facts: Claim[];
  confirmedSuspensions: {
    playerId: string;
    name: string;
    reason: 'yellow_accumulation' | 'red_card';
    sourceRefs: SourceRef[];
  }[];
  nextFixture?: { opponent: string; kickoffUtc: string; sourceRefs: SourceRef[] };
}

export interface TacticalAnalysis {
  claims: Claim[];
  formationsAvailable: boolean;
  xgAvailable: boolean;
}

export interface AnalysisSection<T> {
  status: 'ok' | 'insufficient_data';
  content: T | null;
}

export type DataTier = 'T0' | 'T1' | 'T2' | 'T3';
export type AnalysisStatus = 'complete' | 'degraded' | 'blocked';

export interface MatchAnalysis {
  matchId: string;
  generatedAt: string;
  dataTier: DataTier;
  dataMode: DataMode;
  analysisStatus: AnalysisStatus;
  blockedReasons?: string[];
  quickSummary: AnalysisSection<QuickSummary>;
  fullReport: AnalysisSection<{ paragraphs: Claim[] }>;
  tactical: AnalysisSection<TacticalAnalysis>;
  turningPoints: AnalysisSection<TurningPoint[]>;
  keyPlayers: AnalysisSection<KeyPlayer[]>;
  keySubstitutions: AnalysisSection<KeySubstitution[]>;
  dataConclusions: AnalysisSection<DataConclusion[]>;
  nextMatch: AnalysisSection<NextMatchImpact>;
  /** 由 pipeline 聚合所有 Claim.sourceRefs 去重生成 */
  sources: SourceRef[];
}
