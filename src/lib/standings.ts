/**
 * 小組排名推導 — 純函數，輸入 matches 輸出 StandingRow[]。
 *
 * 規則（2026 賽制）：勝 3 和 1 負 0；同分依次：得失球差 → 入球 → （抽籤 placeholder，
 * 以 teamId 字典序穩定排序並標記 tiebreakNote，待官方抽籤結果取代）。
 * 12 組各自前 2 名 + 8 隊最佳第 3 名晉級 32 強。
 */
import type { GroupLetter, Match, Team } from '../types/football';

export interface StandingRow {
  teamId: string;
  group: GroupLetter;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  /** 'auto' = 小組前二；'best-third' = 最佳第三名晉級；undefined = 未晉級/未確定 */
  qualification?: 'auto' | 'best-third';
  /** 完全相同戰績時嘅抽籤 placeholder 提示 */
  tiebreakNote?: string;
}

export interface GroupStanding {
  group: GroupLetter;
  rows: StandingRow[];
}

interface Acc {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

function emptyAcc(): Acc {
  return { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
}

function applyMatch(acc: Acc, gf: number, ga: number): void {
  acc.played += 1;
  acc.goalsFor += gf;
  acc.goalsAgainst += ga;
  if (gf > ga) {
    acc.won += 1;
    acc.points += 3;
  } else if (gf === ga) {
    acc.drawn += 1;
    acc.points += 1;
  } else {
    acc.lost += 1;
  }
}

/** 同分比較：積分 → 得失球差 → 入球 → 抽籤 placeholder（teamId 序，非官方結果） */
function compareRows(a: StandingRow, b: StandingRow): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return a.teamId.localeCompare(b.teamId);
}

function fullyTied(a: StandingRow, b: StandingRow): boolean {
  return a.points === b.points && a.goalDifference === b.goalDifference && a.goalsFor === b.goalsFor;
}

/** 由小組賽賽果計算 12 組排名 */
export function computeStandings(matches: Match[], teamList: Team[]): GroupStanding[] {
  const byGroup = new Map<GroupLetter, Team[]>();
  for (const t of teamList) {
    const arr = byGroup.get(t.group) ?? [];
    arr.push(t);
    byGroup.set(t.group, arr);
  }

  const result: GroupStanding[] = [];
  for (const [group, groupTeams] of [...byGroup.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const accMap = new Map<string, Acc>(groupTeams.map((t) => [t.id, emptyAcc()]));
    for (const m of matches) {
      if (m.stage !== 'GROUP' || m.group !== group || m.status !== 'ft') continue;
      const homeAcc = accMap.get(m.homeTeamId);
      const awayAcc = accMap.get(m.awayTeamId);
      if (!homeAcc || !awayAcc) continue;
      applyMatch(homeAcc, m.score.home, m.score.away);
      applyMatch(awayAcc, m.score.away, m.score.home);
    }

    const rows: StandingRow[] = groupTeams.map((t) => {
      const a = accMap.get(t.id) ?? emptyAcc();
      return {
        teamId: t.id,
        group,
        position: 0,
        played: a.played,
        won: a.won,
        drawn: a.drawn,
        lost: a.lost,
        goalsFor: a.goalsFor,
        goalsAgainst: a.goalsAgainst,
        goalDifference: a.goalsFor - a.goalsAgainst,
        points: a.points,
      };
    });

    rows.sort(compareRows);
    rows.forEach((row, i) => {
      row.position = i + 1;
      row.qualification = i < 2 ? 'auto' : undefined;
      // 抽籤 placeholder：與相鄰球隊完全同分時標記
      const prev = rows[i - 1];
      const next = rows[i + 1];
      if ((prev && fullyTied(prev, row)) || (next && fullyTied(row, next))) {
        row.tiebreakNote = '相同戰績，最終名次待抽籤決定（placeholder 排序）';
      }
    });

    result.push({ group, rows });
  }
  return result;
}

/**
 * 最佳第三名排名表：12 支小組第 3 名按積分 → 得失球差 → 入球排序，
 * 頭 8 隊晉級 32 強（qualification = 'best-third'）。
 */
export function computeBestThirds(standings: GroupStanding[]): StandingRow[] {
  const thirds = standings
    .map((g) => g.rows.find((r) => r.position === 3))
    .filter((r): r is StandingRow => r !== undefined);

  thirds.sort(compareRows);
  thirds.forEach((row, i) => {
    if (i < 8) row.qualification = 'best-third';
    const prev = thirds[i - 1];
    const next = thirds[i + 1];
    if ((prev && fullyTied(prev, row)) || (next && fullyTied(row, next))) {
      row.tiebreakNote = '相同戰績，最終名次待抽籤決定（placeholder 排序）';
    }
  });
  return thirds;
}

/** 取得某隊喺小組嘅排名行 */
export function getTeamStanding(standings: GroupStanding[], teamId: string): StandingRow | undefined {
  for (const g of standings) {
    const row = g.rows.find((r) => r.teamId === teamId);
    if (row) return row;
  }
  return undefined;
}
