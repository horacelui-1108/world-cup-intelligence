/**
 * Provider 嘅 SourceMeta（@/types/football）→ DataStatusBadge 嘅 SourceMeta
 * （@/lib/types）嘅形狀轉換：
 * - demo 模式一律顯示 DEMO 章（G-12）
 * - STALE 喺 badge 體系冇對應 variant，映射做 PENDING
 */
import type { SourceMeta as BadgeMeta, DataStatus as BadgeStatus } from '@/lib/types';
import type { DataMode, SourceMeta as ProviderMeta } from '@/types/football';

export function toBadgeStatus(status: ProviderMeta['dataStatus'], dataMode: DataMode): BadgeStatus {
  if (dataMode === 'demo') return 'DEMO';
  if (status === 'STALE') return 'PENDING';
  return status;
}

export function toBadgeMeta(source: ProviderMeta, dataMode: DataMode): BadgeMeta {
  return {
    source: source.source,
    sourceUrl: source.sourceUrl,
    retrievedAt: source.retrievedAt,
    lastUpdated: source.lastUpdated ?? source.retrievedAt,
    dataStatus: toBadgeStatus(source.dataStatus, dataMode),
  };
}
