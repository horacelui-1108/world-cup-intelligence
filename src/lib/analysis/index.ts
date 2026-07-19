/**
 * 分析入口：用 provider 攞 match → engine 生成 → G-11 驗證 → 回傳。
 */
import { getProvider } from '../provider';
import type { MatchAnalysis } from './types';
import { buildAnalysisContext } from './context';
import { generateAnalysis } from './engine';

/** 取得某場賽事嘅賽後分析（已過 G-11 驗證；blocked 分析 UI 唔應該發布） */
export async function getAnalysisForMatch(matchId: string): Promise<MatchAnalysis> {
  const provider = getProvider();
  const result = await provider.getMatch(matchId);
  const ctx = buildAnalysisContext(result.dataMode);
  return generateAnalysis(result.data, ctx);
}

export { buildAnalysisContext } from './context';
export type { MatchAnalysis } from './types';
export { generateAnalysis, validateAnalysis } from './engine';
