import { getDataMode, getLastUpdated } from '@/lib/provider';

/**
 * 兼容層 — `Layout.tsx`（不可改動）仍由此模組 import footer provenance。
 * 首頁本身已全面改用 `useHomeData()`（真實 data provider 層）；
 * 呢度只保留 Footer 需要嘅靜態導出，數值直接來自 provider 層。
 */

/** provider 層 lastUpdated（demo 用 snapshot 擷取時間；live 用即時時間） */
export const LAST_UPDATED = getLastUpdated();

/** 目前 provider 嘅來源名稱（demo 模式標示「示範數據」，G-12） */
export const SOURCE_NAME = getDataMode() === 'demo' ? 'Demo Provider（ESPN 數據）' : 'API-Football';
