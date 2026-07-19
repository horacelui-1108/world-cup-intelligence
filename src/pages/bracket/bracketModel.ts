/**
 * 淘汰賽樹模型 — 純函數。
 * 由 provider.getBracket() / getMatches() 嘅 Match[] 推導：
 * 1. 每場勝者（含加時、互射十二碼）
 * 2. 樹狀排序（由決賽向下遞歸搵 feeder，保證連線唔交叉；搵唔到就用 kickoff 順序 fallback）
 * 3. 各節點像素座標 + 連線座標（固定幾何：欄闊、欄距、行高全部常數）
 * 4. 冠軍路徑（決賽完場後，冠軍贏過嘅每條連線）
 */
import type { Match, Stage } from '@/types/football';

// ---------------------------------------------------------------------------
// 幾何常數（Brac ketNode 嘅 CSS 寬高必須同呢度一致）
// ---------------------------------------------------------------------------
export const NODE_W = 220;
export const NODE_H = 88;
export const SLOT_GAP = 16;
export const COL_GAP = 64;
export const HEADER_H = 52;
export const PAD_TOP = 8;
export const CHAMPION_H = 116;
export const THIRD_PLACE_GAP = 28;

export const ROUND_ORDER: Stage[] = ['R32', 'R16', 'QF', 'SF', 'F'];

export const ROUND_LABELS: Record<string, string> = {
  R32: '32強',
  R16: '16強',
  QF: '8強',
  SF: '四強',
  F: '決賽',
  '3P': '季軍戰',
};

export type NodeStatus = 'decided' | 'live' | 'tbd';

export interface BracketNodeData {
  match: Match;
  x: number;
  y: number;
  status: NodeStatus;
  winnerId?: string;
}

export interface BracketLink {
  id: string;
  fromMatchId: string;
  toMatchId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** feeder 已分出勝負 → accent 線 */
  decided: boolean;
  /** 冠軍晉級路線 → gold 線 */
  championPath: boolean;
}

export interface BracketLayout {
  /** 每輪（按 ROUND_ORDER 順序）嘅節點，已按視覺位置排序 */
  rounds: BracketNodeData[][];
  thirdPlace?: BracketNodeData;
  champion?: { winnerId?: string; x: number; y: number; decided: boolean };
  links: BracketLink[];
  width: number;
  height: number;
  /** matchId → 佢嘅兩條上游連線（hover「road here」用） */
  incomingLinks: ReadonlyMap<string, BracketLink[]>;
}

// ---------------------------------------------------------------------------
// 勝者推導
// ---------------------------------------------------------------------------

/** 完場後嘅勝者 teamId；未分勝負（未賽/和局無十二碼）回傳 undefined */
export function winnerOf(m: Match): string | undefined {
  if (m.status !== 'ft') return undefined;
  const { home, away, penalties } = m.score;
  if (home > away) return m.homeTeamId;
  if (away > home) return m.awayTeamId;
  if (penalties) return penalties.home > penalties.away ? m.homeTeamId : m.awayTeamId;
  return undefined;
}

export function nodeStatusOf(m: Match): NodeStatus {
  if (m.status === 'ft') return 'decided';
  if (m.status === 'live' || m.status === 'ht') return 'live';
  return 'tbd';
}

function byKickoff(a: Match, b: Match): number {
  return a.kickoffUtc.localeCompare(b.kickoffUtc) || a.matchId.localeCompare(b.matchId);
}

// ---------------------------------------------------------------------------
// 樹狀排序
// ---------------------------------------------------------------------------

/**
 * 搵出 round 入面邊兩場係 nextMatch 嘅 feeder：
 * feeder 嘅勝者 = nextMatch 嘅主/客隊。搵唔齊就用 index fallback（相鄰兩場）。
 */
function findFeeders(prevRound: Match[], nextMatch: Match, nextIdx: number): [Match | undefined, Match | undefined] {
  const participants = [nextMatch.homeTeamId, nextMatch.awayTeamId];
  const found: Match[] = [];
  for (const teamId of participants) {
    const feeder = prevRound.find((m) => !found.includes(m) && winnerOf(m) === teamId);
    if (feeder) found.push(feeder);
  }
  if (found.length === 2) return [found[0], found[1]];
  // fallback：相鄰配對
  return [prevRound[nextIdx * 2], prevRound[nextIdx * 2 + 1]];
}

/**
 * 由決賽向下遞歸排序，保證連線唔交叉。
 * 回傳每輪嘅視覺排序（同原始 kickoff 排序可能唔同）。
 */
export function orderRounds(roundMatches: Match[][]): Match[][] {
  const last = ROUND_ORDER.length - 1;
  const ordered: Match[][] = roundMatches.map((list) => [...list].sort(byKickoff));

  // 由最後一輪（決賽）開始，逐輪確定上一輪嘅視覺次序
  for (let r = last; r >= 1; r--) {
    const nextRound = ordered[r];
    const prevRound = ordered[r - 1];
    const used = new Set<string>();
    const newOrder: Match[] = [];
    nextRound.forEach((nm, idx) => {
      const [f1, f2] = findFeeders(prevRound, nm, idx);
      for (const f of [f1, f2]) {
        if (f && !used.has(f.matchId)) {
          used.add(f.matchId);
          newOrder.push(f);
        }
      }
    });
    // 孤兒場次（數據缺口）排最後
    for (const m of prevRound) {
      if (!used.has(m.matchId)) newOrder.push(m);
    }
    ordered[r - 1] = newOrder;
  }
  return ordered;
}

// ---------------------------------------------------------------------------
// 版面計算
// ---------------------------------------------------------------------------

function colX(roundIdx: number): number {
  return roundIdx * (NODE_W + COL_GAP);
}

export function buildLayout(input: { rounds: Match[]; thirdPlace?: Match }[]): BracketLayout | null {
  if (input.length === 0) return null;
  const roundMatches = input.map((r) => r.rounds);
  const thirdPlaceMatch = input.find((r) => r.thirdPlace)?.thirdPlace;

  const ordered = orderRounds(roundMatches);
  const last = ordered.length - 1;
  const slotH = NODE_H + SLOT_GAP;

  // 高度 = 第一輪（最多節點）嘅總高
  const firstCount = Math.max(ordered[0]?.length ?? 1, 1);
  const height = HEADER_H + PAD_TOP + firstCount * slotH - SLOT_GAP;
  const width = (ordered.length + 1) * NODE_W + ordered.length * COL_GAP; // +1 冠軍欄

  // 節點座標：第一輪按 slot；之後每輪取兩個 feeder 中心嘅平均值
  const posById = new Map<string, { x: number; y: number }>();
  const rounds: BracketNodeData[][] = ordered.map((list, r) =>
    list.map((m, i) => {
      let y: number;
      if (r === 0) {
        y = HEADER_H + PAD_TOP + i * slotH;
      } else {
        const prev = ordered[r - 1];
        const idxInNext = i;
        const [f1, f2] = findFeeders(prev, m, idxInNext);
        const p1 = f1 ? posById.get(f1.matchId) : undefined;
        const p2 = f2 ? posById.get(f2.matchId) : undefined;
        if (p1 && p2) {
          y = (p1.y + p2.y) / 2;
        } else if (p1) {
          y = p1.y - slotH / 2;
        } else {
          // 公式 fallback：第 r 輪第 i 個嘅標準位置
          const span = Math.pow(2, r) * slotH;
          y = HEADER_H + PAD_TOP + i * span + (span - slotH) / 2;
        }
      }
      posById.set(m.matchId, { x: colX(r), y });
      return { match: m, x: colX(r), y, status: nodeStatusOf(m), winnerId: winnerOf(m) };
    }),
  );

  // 決賽 + 冠軍
  const finalRound = rounds[last];
  const finalNode = finalRound?.[0];
  const championId = finalNode?.winnerId;

  // 連線
  const links: BracketLink[] = [];
  const incomingLinks = new Map<string, BracketLink[]>();
  for (let r = 1; r < ordered.length; r++) {
    rounds[r].forEach((node, idx) => {
      const prev = ordered[r - 1];
      const [f1, f2] = findFeeders(prev, node.match, idx);
      const incoming: BracketLink[] = [];
      for (const f of [f1, f2]) {
        if (!f) continue;
        const p = posById.get(f.matchId);
        if (!p) continue;
        const w = winnerOf(f);
        const link: BracketLink = {
          id: `${f.matchId}->${node.match.matchId}`,
          fromMatchId: f.matchId,
          toMatchId: node.match.matchId,
          x1: p.x + NODE_W,
          y1: p.y + NODE_H / 2,
          x2: node.x,
          y2: node.y + NODE_H / 2,
          decided: w !== undefined,
          championPath: championId !== undefined && w === championId,
        };
        links.push(link);
        incoming.push(link);
      }
      incomingLinks.set(node.match.matchId, incoming);
    });
  }

  // 季軍戰：決賽欄下方，同決賽節點垂直對齊
  let thirdPlace: BracketNodeData | undefined;
  if (thirdPlaceMatch && finalNode) {
    thirdPlace = {
      match: thirdPlaceMatch,
      x: finalNode.x,
      y: finalNode.y + NODE_H + THIRD_PLACE_GAP,
      status: nodeStatusOf(thirdPlaceMatch),
      winnerId: winnerOf(thirdPlaceMatch),
    };
  }

  // 冠軍卡：最右欄，同決賽節點垂直對齊
  const champion = finalNode
    ? {
        winnerId: championId,
        x: colX(last + 1),
        y: finalNode.y + NODE_H / 2 - CHAMPION_H / 2,
        decided: championId !== undefined,
      }
    : undefined;

  return {
    rounds,
    thirdPlace,
    champion,
    links,
    width,
    height: Math.max(height, (thirdPlace?.y ?? 0) + NODE_H + PAD_TOP),
    incomingLinks,
  };
}
