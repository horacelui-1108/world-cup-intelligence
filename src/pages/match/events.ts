import type { EventType, Match, MatchEvent, VarOutcome } from '@/types/football';

export interface TimelineEntry {
  key: string;
  minute: number | null;
  event: MatchEvent;
  /** 由 scorers 補完嘅入球（events 無 goal 類事件時） */
  synthesized: boolean;
}

export function isGoalType(t: EventType): boolean {
  return t === 'goal' || t === 'pen_goal' || t === 'own_goal' || t === 'pen_miss';
}

export function isCardType(t: EventType): boolean {
  return t === 'yellow' || t === 'second_yellow' || t === 'red';
}

/**
 * 事件時間軸整合：
 * - match.events 有 goal 類事件 → 時間軸 = events（scorers 由 events 推導,唔會重複）
 * - events 無 goal 類但 scorers 有 → 將 scorers 補入（如 M92/M97/M100）
 * 排序：分鐘升序,未核實分鐘（null）排最後,同分鐘保持原始順序（stable sort）。
 */
export function buildTimeline(match: Match): TimelineEntry[] {
  const events = match.events ?? [];
  const hasGoalEvents = events.some((e) => isGoalType(e.type));
  const entries: TimelineEntry[] = events.map((event, i) => ({
    key: `e-${i}`,
    minute: event.minute,
    event,
    synthesized: false,
  }));
  if (!hasGoalEvents && match.scorers) {
    match.scorers.forEach((s, i) => {
      entries.push({
        key: `s-${i}`,
        minute: s.minute,
        event: {
          minute: s.minute,
          type: s.kind,
          teamId: s.teamId,
          playerId: s.playerId,
          playerName: s.playerName,
          assistPlayerId: s.assistPlayerId,
          assistName: s.assistName,
        },
        synthesized: true,
      });
    });
  }
  return entries.sort((a, b) => {
    if (a.minute == null && b.minute == null) return 0;
    if (a.minute == null) return 1;
    if (b.minute == null) return -1;
    return a.minute - b.minute;
  });
}

/**
 * 入球後即時比分（如「1–0」）。只有當所有入球事件分鐘已核實先計算,
 * 避免喺分鐘未知時顯示可能錯誤嘅比分順序（數據誠信）。
 */
export function scoreAfterByKey(match: Match, entries: TimelineEntry[]): Map<string, string> {
  const map = new Map<string, string>();
  const goalEntries = entries.filter((e) => isGoalType(e.event.type) && e.event.type !== 'pen_miss');
  if (goalEntries.length === 0 || goalEntries.some((e) => e.minute == null)) return map;
  let home = 0;
  let away = 0;
  for (const e of entries) {
    const t = e.event.type;
    if (!isGoalType(t) || t === 'pen_miss') continue;
    // 烏龍球記入對方
    const creditHome =
      t === 'own_goal' ? e.event.teamId !== match.homeTeamId : e.event.teamId === match.homeTeamId;
    if (creditHome) home += 1;
    else away += 1;
    map.set(e.key, `${home}–${away}`);
  }
  return map;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  goal: '入球',
  pen_goal: '十二碼入球',
  pen_miss: '十二碼射失',
  own_goal: '烏龍球',
  yellow: '黃牌',
  second_yellow: '兩黃一紅',
  red: '紅牌',
  sub: '換人',
  var: 'VAR 覆核',
};

export const VAR_OUTCOME_LABELS: Record<VarOutcome, string> = {
  goal_confirmed: '入球有效',
  goal_disallowed: '取消入球',
  penalty_confirmed: '十二碼維持',
  penalty_cancelled: '十二碼取消',
  red_confirmed: '紅牌確認',
  controversy: '爭議判罰',
};
