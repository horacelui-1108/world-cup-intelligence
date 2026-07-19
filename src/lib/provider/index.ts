/**
 * Provider 選擇入口：
 * - 有 VITE_FOOTBALL_API_KEY → ApiFootballProvider（內建失敗 fallback demo + STALE 標記）
 * - 無 key → demoProvider（人手策展 snapshot，dataMode: 'demo'）
 */
import type { DataMode } from '../../types/football';
import { ESPN_VERIFIED } from '../../data/matches';
import { ApiFootballProvider } from './apiFootballProvider';
import { demoProvider } from './demoProvider';
import { MissingApiKeyError, type FootballDataProvider } from './types';

let instance: FootballDataProvider | null = null;

export function getProvider(): FootballDataProvider {
  if (instance) return instance;
  try {
    instance = new ApiFootballProvider();
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      instance = demoProvider;
    } else {
      throw err;
    }
  }
  return instance;
}

/** 目前 provider 嘅數據模式（demo 時 UI 必須標示「Demo Data」，G-12） */
export function getDataMode(): DataMode {
  return getProvider().mode;
}

/** provider 層 lastUpdated：demo 用 snapshot 擷取時間；live 用即時時間 */
export function getLastUpdated(): string {
  const provider = getProvider();
  return provider.mode === 'demo' ? ESPN_VERIFIED.retrievedAt : new Date().toISOString();
}

/** 測試用：重置 provider 單例 */
export function resetProvider(): void {
  instance = null;
}

export type { FootballDataProvider, ProviderResult, MatchFilter, Bracket, TopScorer } from './types';
export { MissingApiKeyError, RateLimitError } from './types';
