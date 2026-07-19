/**
 * 由 data-layer 球隊資料推導 TeamRef（TeamChip/Crest 共用形狀）。
 * 隊徽路徑慣例：/crests/crest-{teamId}.svg
 */
import { getTeamById } from '@/data/teams';
import type { TeamRef } from '@/lib/types';

export function crestPath(teamId: string): string {
  return `/crests/crest-${teamId}.svg`;
}

/** 未識別 teamId（例如淘汰賽待定席位）時回傳佔位 */
export function teamRefOf(teamId: string): TeamRef {
  const t = getTeamById(teamId);
  if (!t) {
    return { id: teamId, name: '待定', shortName: 'TBD', crest: crestPath(teamId) };
  }
  return { id: t.id, name: t.nameZh, shortName: t.code3, crest: crestPath(t.id) };
}

/** 只讀名稱，唔需要整個 TeamRef 時用 */
export function teamNameOf(teamId: string): string {
  return getTeamById(teamId)?.nameZh ?? '待定';
}

export function teamCodeOf(teamId: string): string {
  return getTeamById(teamId)?.code3 ?? 'TBD';
}
