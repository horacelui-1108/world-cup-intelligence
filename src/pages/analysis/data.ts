/**
 * 分析頁數據載入層 — 經 provider adapter 攞數（design §7）。
 * - 列表：getProvider().listAnalyses() + getMatches() + getTeam()
 * - 詳情：getAnalysisForMatch(matchId)（已過 G-11 驗證）
 * blocked 分析唔會出現喺列表（詳情頁直達時顯示「未能通過驗證」頁）。
 */
import { getProvider } from '@/lib/provider';
import { getAnalysisForMatch } from '@/lib/analysis';
import type { MatchAnalysis } from '@/lib/analysis/types';
import type { DataMode, Match, SourceMeta, Team } from '@/types/football';
import { fallbackTeam, type AnalysisEntry } from './model';

export class AnalysisNotFoundError extends Error {
  constructor(matchId: string) {
    super(`搵唔到分析:${matchId}`);
    this.name = 'AnalysisNotFoundError';
  }
}

export interface AnalysisListData {
  /** 已過濾 blocked 嘅可發布分析 */
  entries: AnalysisEntry[];
  source: SourceMeta;
  dataMode: DataMode;
  lastUpdated: string;
}

async function resolveTeams(ids: string[]): Promise<Map<string, Team>> {
  const provider = getProvider();
  const pairs = await Promise.all(
    ids.map(async (id) => {
      try {
        const r = await provider.getTeam(id);
        return [id, r.data] as const;
      } catch {
        return [id, fallbackTeam(id)] as const;
      }
    }),
  );
  return new Map(pairs);
}

/** 載入全部可發布分析（blocked 唔顯示，貫徹全站） */
export async function loadAnalysisList(): Promise<AnalysisListData> {
  const provider = getProvider();
  const [anRes, mRes] = await Promise.all([provider.listAnalyses(), provider.getMatches()]);
  const matchesById = new Map<string, Match>(mRes.data.map((m) => [m.matchId, m]));
  const usable = anRes.data.filter((a) => a.analysisStatus !== 'blocked' && matchesById.has(a.matchId));

  const teamIds = new Set<string>();
  for (const a of usable) {
    const m = matchesById.get(a.matchId);
    if (!m) continue;
    teamIds.add(m.homeTeamId);
    teamIds.add(m.awayTeamId);
  }
  const teams = await resolveTeams([...teamIds]);

  const entries: AnalysisEntry[] = usable.map((analysis) => {
    const match = matchesById.get(analysis.matchId) as Match;
    return {
      analysis,
      match,
      home: teams.get(match.homeTeamId) ?? fallbackTeam(match.homeTeamId),
      away: teams.get(match.awayTeamId) ?? fallbackTeam(match.awayTeamId),
    };
  });

  return { entries, source: anRes.source, dataMode: anRes.dataMode, lastUpdated: anRes.lastUpdated };
}

export interface AnalysisDetailData {
  analysis: MatchAnalysis;
  match: Match;
  home: Team;
  away: Team;
  source: SourceMeta;
  dataMode: DataMode;
  lastUpdated: string;
  /** 可發布分析（按比賽日期升序），用於上一篇/下一篇導航 */
  entries: AnalysisEntry[];
}

export async function loadAnalysisDetail(matchId: string): Promise<AnalysisDetailData> {
  const provider = getProvider();
  let matchRes;
  try {
    matchRes = await provider.getMatch(matchId);
  } catch {
    throw new AnalysisNotFoundError(matchId);
  }
  const [analysis, list] = await Promise.all([getAnalysisForMatch(matchId), loadAnalysisList()]);
  const teams = await resolveTeams([matchRes.data.homeTeamId, matchRes.data.awayTeamId]);
  return {
    analysis,
    match: matchRes.data,
    home: teams.get(matchRes.data.homeTeamId) ?? fallbackTeam(matchRes.data.homeTeamId),
    away: teams.get(matchRes.data.awayTeamId) ?? fallbackTeam(matchRes.data.awayTeamId),
    source: matchRes.source,
    dataMode: matchRes.dataMode,
    lastUpdated: matchRes.lastUpdated,
    entries: list.entries,
  };
}
