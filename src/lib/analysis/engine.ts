/**
 * 賽後分析引擎 — 規則式生成器，嚴格遵守 analysis-framework.md：
 * - 只由已核實結構化數據生成，絕不虛構（G-01 每個數字可追溯）。
 * - 缺數據 → 固定「資料不足」（M0），唔生成替代敘述（G-02）。
 * - xG 只有 provider 提供先顯示（G-03）；每句數據陳述帶 fieldPath 溯源（G-04）。
 * - 禁引語（G-05）、禁意圖斷言（G-06）、禁氣氛虛構（G-07）、因果降級「其後」（G-08）。
 * - G-11 三步驗證 pipeline：數字審計 + 禁止語句掃描 + 來源覆蓋，失敗 → blocked。
 * - 繁體中文輸出；分鐘顯示還原補時格式（90+2、120+5）。
 */
import type { Match, MatchEvent, Player, Team, Tournament, DataMode } from '../../types/football';
import type {
  AnalysisSection,
  Claim,
  DataTier,
  KeyPlayer,
  KeySubstitution,
  MatchAnalysis,
  SourceRef,
  TurningPoint,
} from './types';

export interface AnalysisContext {
  teams: ReadonlyMap<string, Team>;
  players: ReadonlyMap<string, Player>;
  /** 全賽事 matches，用於推導晉級事實（nextMatch） */
  matches: Match[];
  tournament?: Tournament;
  dataMode: DataMode;
  /** 可注入固定時間（測試用）；預設即時生成 */
  generatedAt?: string;
}

const STAGE_LABEL: Record<string, string> = {
  GROUP: '分組賽',
  R32: '三十二強',
  R16: '十六強',
  QF: '八強',
  SF: '四強',
  '3P': '季軍戰',
  F: '決賽',
};

const STAGE_ORDER: Record<string, number> = { GROUP: 0, R32: 1, R16: 2, QF: 3, SF: 4, '3P': 5, F: 6 };

const ZH_NUM = ['零', '一', '兩', '三', '四', '五', '六', '七', '八', '九', '十'];
function zhNum(n: number): string {
  return n >= 0 && n <= 10 ? ZH_NUM[n] : String(n);
}

/** 分鐘顯示：非加時賽事 91+ → 90+x；加時賽事加時分鐘直寫（93'），120+ → 120+x */
function fmtMinute(minute: number, aet: boolean): string {
  if (aet) {
    if (minute > 120) return `120+${minute - 120}`;
    return String(minute);
  }
  if (minute > 90) return `90+${minute - 90}`;
  return String(minute);
}

function insufficient<T>(): AnalysisSection<T> {
  return { status: 'insufficient_data', content: null };
}

function ok<T>(content: T): AnalysisSection<T> {
  return { status: 'ok', content };
}

// ---------------------------------------------------------------------------
// 生成器
// ---------------------------------------------------------------------------
export function generateAnalysis(match: Match, ctx: AnalysisContext): MatchAnalysis {
  // 觸發規則：只有 FT（完場）先觸發分析生成
  if (match.status !== 'ft') return notFinishedAnalysis(match, ctx);
  const aet = match.score.extraTime !== undefined;
  const teamZh = (id: string): string => ctx.teams.get(id)?.nameZh ?? id;
  const playerZh = (id: string | undefined, fallback: string): string =>
    (id ? ctx.players.get(id)?.nameZh : undefined) ?? fallback;

  const ref = (fieldPath: string, entity = 'match', entityId: string = match.matchId): SourceRef => ({
    sourceId: 'S1',
    entity,
    entityId,
    fieldPath,
    retrievedAt: match.source.retrievedAt,
    dataMode: ctx.dataMode,
  });

  const label = STAGE_LABEL[match.stage] ?? match.stage;
  const homeZh = teamZh(match.homeTeamId);
  const awayZh = teamZh(match.awayTeamId);
  const scoreStr = `${match.score.home}–${match.score.away}`;

  const events = match.events ?? [];
  const scorers = match.scorers ?? [];
  const goalEvents: MatchEvent[] = events.filter(
    (e) => e.type === 'goal' || e.type === 'pen_goal' || e.type === 'own_goal',
  );
  const timedGoals = goalEvents
    .filter((e) => e.minute !== null)
    .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));

  // 數據完整度分級
  const hasEvents = events.length > 0 || scorers.length > 0;
  const hasStats = match.stats !== undefined && Object.values(match.stats).some((v) => v != null);
  const hasLineups = (match.lineups?.home?.starters.length ?? 0) > 0;
  const tier: DataTier =
    hasStats && hasLineups && hasEvents ? 'T0' : hasStats && hasEvents ? 'T1' : hasEvents ? 'T2' : 'T3';

  const winnerId =
    match.score.home > match.score.away
      ? match.homeTeamId
      : match.score.away > match.score.home
        ? match.awayTeamId
        : match.score.penalties
          ? match.score.penalties.home > match.score.penalties.away
            ? match.homeTeamId
            : match.awayTeamId
          : undefined;

  // ---- (a) 快速摘要 ----
  const scorerBits: string[] = [];
  {
    const byPlayer = new Map<string, { name: string; team: string; minutes: (number | null)[]; pen: boolean }>();
    for (const s of scorers) {
      if (s.kind === 'own_goal') continue;
      const key = s.playerId ?? s.playerName;
      const entry = byPlayer.get(key) ?? {
        name: playerZh(s.playerId, s.playerName),
        team: teamZh(s.teamId),
        minutes: [],
        pen: false,
      };
      entry.minutes.push(s.minute);
      if (s.kind === 'pen_goal') entry.pen = true;
      byPlayer.set(key, entry);
    }
    for (const { name, team, minutes, pen } of byPlayer.values()) {
      const count = minutes.length;
      const minuteStr = minutes.every((m) => m !== null)
        ? `（${minutes.map((m) => fmtMinute(m as number, aet)).join('、')}分鐘）`
        : '';
      const countStr = count > 1 ? `入${zhNum(count)}球` : '建功';
      scorerBits.push(`${team}${name}${countStr}${pen ? '（十二碼）' : ''}${minuteStr}`);
    }
  }

  let summaryText = `【${label}】${homeZh} ${scoreStr} ${awayZh}〔S1〕。`;
  if (scorerBits.length > 0) summaryText += `${scorerBits.join('；')}〔S1〕。`;
  if (match.score.penalties) {
    summaryText += `雙方踢成 ${scoreStr}，${teamZh(winnerId as string)}互射十二碼贏 ${match.score.penalties.home}–${match.score.penalties.away}〔S1〕。`;
  }
  if (match.stage === '3P' && winnerId) {
    summaryText += `${teamZh(winnerId)}奪得季軍〔S1〕。`;
  } else if (winnerId && match.stage !== 'GROUP' && match.stage !== 'F') {
    summaryText += `${teamZh(winnerId)}晉級〔S1〕。`;
  }
  const quickSummary = ok({
    text: summaryText,
    sourceRefs: [ref('score'), ...(scorerBits.length ? [ref('scorers')] : [])],
  });

  // ---- (b) 完整賽後分析（T2 縮至 150–300 字；T3 唔出） ----
  let fullReport: MatchAnalysis['fullReport'] = insufficient();
  const paragraphs: Claim[] = [];
  if (tier !== 'T3') {
    paragraphs.push({
      text:
        `呢場${label}賽事由${homeZh}對${awayZh}，最終比數 ${scoreStr}〔S1〕。` +
        (aet ? `比賽需要加時，加時入球 ${match.score.extraTime?.home}–${match.score.extraTime?.away}〔S1〕。` : ''),
      sourceRefs: [ref('score')],
    });
    // 時間軸敘述（有分鐘嘅入球）
    let h = 0;
    let a = 0;
    for (const e of timedGoals) {
      const scoringTeam =
        e.type === 'own_goal' ? (e.teamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId) : e.teamId;
      if (scoringTeam === match.homeTeamId) h += 1;
      else a += 1;
      const action = e.type === 'pen_goal' ? '射入十二碼' : e.type === 'own_goal' ? '擺烏龍' : '取得入球';
      const assist = e.assistName ? `（助攻：${playerZh(e.assistPlayerId, e.assistName)}）` : '';
      paragraphs.push({
        text: `第${fmtMinute(e.minute as number, aet)}分鐘，${playerZh(e.playerId, e.playerName)}（${teamZh(e.teamId)}）${action}${assist}，比數改寫成 ${h}–${a}〔S1〕。`,
        sourceRefs: [ref('events')],
      });
    }
    // 無分鐘嘅入球者
    const untimed = scorers.filter((s) => s.minute === null);
    if (untimed.length > 0) {
      const bits = untimed.map((s) => {
        const assist = s.assistName ? `（助攻：${playerZh(s.assistPlayerId, s.assistName)}）` : '';
        return `${playerZh(s.playerId, s.playerName)}（${teamZh(s.teamId)}）${s.kind === 'pen_goal' ? '射入十二碼' : '建功'}${assist}`;
      });
      paragraphs.push({
        text: `入球記錄（分鐘未核實）：${bits.join('；')}〔S1〕。`,
        sourceRefs: [ref('scorers')],
      });
    }
    // VAR / 紅牌事件
    for (const e of events) {
      if (e.type === 'var') {
        const who = e.playerName ? `${playerZh(e.playerId, e.playerName)}（${teamZh(e.teamId)}）` : '賽事';
        const minuteStr = e.minute !== null ? `第${fmtMinute(e.minute, aet)}分鐘，` : '';
        const outcome =
          e.varOutcome === 'goal_disallowed'
            ? '入球經 VAR 覆核後被取消'
            : e.varOutcome === 'penalty_confirmed'
              ? '十二碼判罰經 VAR 覆核後維持'
              : e.varOutcome === 'red_confirmed'
                ? '紅牌判罰經 VAR 覆核後維持'
                : '出現 VAR 爭議判罰';
        paragraphs.push({ text: `${minuteStr}${who}${outcome}〔S1〕。`, sourceRefs: [ref('events')] });
      } else if (e.type === 'red' || e.type === 'second_yellow') {
        const minuteStr = e.minute !== null ? `第${fmtMinute(e.minute, aet)}分鐘，` : '';
        paragraphs.push({
          text: `${minuteStr}${playerZh(e.playerId, e.playerName)}（${teamZh(e.teamId)}）被紅牌逐出〔S1〕，${teamZh(e.teamId)}其後十人應戰〔S1〕。`,
          sourceRefs: [ref('events')],
        });
      }
    }
    if (match.score.penalties) {
      paragraphs.push({
        text: `互射十二碼階段，${homeZh}射入 ${match.score.penalties.home} 球、${awayZh}射入 ${match.score.penalties.away} 球〔S1〕。`,
        sourceRefs: [ref('score.penalties')],
      });
    }
    fullReport = ok({ paragraphs });
  }

  // ---- (c) 戰術部署：只描述可觀察事實；無陣式/統計 → 資料不足 ----
  let tactical: MatchAnalysis['tactical'] = insufficient();
  if (hasStats || hasLineups) {
    const claims: Claim[] = [];
    const poss = match.stats?.possession;
    if (poss) {
      claims.push({
        text: `${homeZh}控球率 ${poss.home}%，${awayZh}控球率 ${poss.away}%〔S1〕。`,
        sourceRefs: [ref('stats.possession', 'match.stats')],
      });
    }
    const shots = match.stats?.shots;
    if (shots) {
      claims.push({
        text: `射門次數：${homeZh} ${shots.home} 次，${awayZh} ${shots.away} 次〔S1〕。`,
        sourceRefs: [ref('stats.shots', 'match.stats')],
      });
    }
    tactical = ok({
      claims,
      formationsAvailable: hasLineups,
      xgAvailable: match.stats?.xg != null,
    });
  }

  // ---- (d) 勝負轉捩點（1–3 點；候選＝入球＋紅牌＋十二碼，需有分鐘） ----
  let turningPoints: MatchAnalysis['turningPoints'] = insufficient();
  {
    interface Cand {
      tp: TurningPoint;
      weight: number;
    }
    const cands: Cand[] = [];
    let h = 0;
    let a = 0;
    const trailedAtSomePoint = new Set<string>();
    for (const e of timedGoals) {
      const scoringTeam =
        e.type === 'own_goal' ? (e.teamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId) : e.teamId;
      const before = `${h}–${a}`;
      const myBefore = scoringTeam === match.homeTeamId ? h : a;
      const opBefore = scoringTeam === match.homeTeamId ? a : h;
      if (myBefore < opBefore) trailedAtSomePoint.add(scoringTeam);
      if (scoringTeam === match.homeTeamId) h += 1;
      else a += 1;
      const after = `${h}–${a}`;
      const myAfter = scoringTeam === match.homeTeamId ? h : a;
      const opAfter = scoringTeam === match.homeTeamId ? a : h;
      // 排序：落後→追和→領先嘅入球 > 紅牌 > 其他
      let weight = 3;
      if (myAfter > opAfter && myBefore <= opBefore) weight = trailedAtSomePoint.has(scoringTeam) ? 0 : 1;
      else if (myAfter === opAfter && myBefore < opBefore) weight = 1;
      const action = e.type === 'pen_goal' ? '射入十二碼' : '取得入球';
      cands.push({
        weight,
        tp: {
          eventType: e.type === 'pen_goal' ? 'penalty' : 'goal',
          minute: e.minute as number,
          description: {
            text: `第${fmtMinute(e.minute as number, aet)}分鐘，${playerZh(e.playerId, e.playerName)}（${teamZh(e.teamId)}）${action}〔S1〕。事件前比數 ${before}，事件後 ${after}〔S1〕。`,
            sourceRefs: [ref('events')],
          },
          scoreBefore: before,
          scoreAfter: after,
          rank: 0,
        },
      });
    }
    for (const e of events) {
      if ((e.type === 'red' || e.type === 'second_yellow') && e.minute !== null) {
        cands.push({
          weight: 2,
          tp: {
            eventType: 'red_card',
            minute: e.minute,
            description: {
              text: `第${fmtMinute(e.minute, aet)}分鐘，${playerZh(e.playerId, e.playerName)}（${teamZh(e.teamId)}）被紅牌逐出〔S1〕。${teamZh(e.teamId)}其後十人應戰。`,
              sourceRefs: [ref('events')],
            },
            scoreBefore: scoreStr,
            rank: 0,
          },
        });
      }
    }
    cands.sort((x, y) => x.weight - y.weight || x.tp.minute - y.tp.minute);
    const picked = cands.slice(0, 3).map((c, i) => ({ ...c.tp, rank: i + 1 }));
    if (picked.length > 0) turningPoints = ok(picked);
  }

  // ---- (e) 關鍵球員（1–3 人；入球 > 助攻） ----
  let keyPlayers: MatchAnalysis['keyPlayers'] = insufficient();
  {
    const goalsBy = new Map<string, { name: string; teamId: string; goals: number; assists: number; playerId: string }>();
    const touch = (pid: string, name: string, teamId: string) => {
      const e = goalsBy.get(pid) ?? { name, teamId, goals: 0, assists: 0, playerId: pid };
      goalsBy.set(pid, e);
      return e;
    };
    for (const s of scorers) {
      if (s.kind !== 'own_goal') touch(s.playerId ?? s.playerName, playerZh(s.playerId, s.playerName), s.teamId).goals += 1;
      if (s.assistName) touch(s.assistPlayerId ?? s.assistName, playerZh(s.assistPlayerId, s.assistName), s.teamId).assists += 1;
    }
    const ranked = [...goalsBy.values()]
      .filter((p) => p.goals > 0 || p.assists > 0)
      .sort((x, y) => y.goals - x.goals || y.assists - x.assists)
      .slice(0, 3);
    if (ranked.length > 0) {
      const list: KeyPlayer[] = ranked.map((p) => {
        const stats: Claim[] = [];
        if (p.goals > 0) {
          stats.push({
            text: `今場攻入${p.goals === 2 ? '兩' : zhNum(p.goals)}球〔S1〕`,
            sourceRefs: [ref('scorers')],
          });
        }
        if (p.assists > 0) {
          stats.push({
            text: `交出${p.assists === 2 ? '兩' : zhNum(p.assists)}次助攻〔S1〕`,
            sourceRefs: [ref('scorers')],
          });
        }
        return {
          playerId: p.playerId,
          name: p.name,
          team: p.teamId === match.homeTeamId ? ('home' as const) : ('away' as const),
          selectionBasis: p.goals > 0 ? ('goals' as const) : ('assists' as const),
          stats,
        };
      });
      keyPlayers = ok(list);
    }
  }

  // ---- (f) 重要換人（0–2 次）：換入球員其後有入球/助攻/牌，或換人後 15 分鐘內比數改變 ----
  const keySubstitutions: KeySubstitution[] = [];
  {
    const subs = events.filter((e) => e.type === 'sub' && e.minute !== null);
    for (const sub of subs.slice(0, 2)) {
      const subMinute = sub.minute as number;
      const inName = playerZh(sub.playerId, sub.playerName);
      const laterImpact = timedGoals.find(
        (g) => (g.minute as number) > subMinute && (g.playerId === sub.playerId || g.assistPlayerId === sub.playerId),
      );
      const scoreChangedSoon = timedGoals.some(
        (g) => (g.minute as number) > subMinute && (g.minute as number) <= subMinute + 15,
      );
      if (laterImpact) {
        keySubstitutions.push({
          minute: subMinute,
          playerIn: inName,
          playerOut: sub.detail ?? '',
          impact: {
            text: `第${fmtMinute(subMinute, aet)}分鐘，${teamZh(sub.teamId)}以${inName}入替〔S1〕；${inName}其後於第${fmtMinute(laterImpact.minute as number, aet)}分鐘取得入球或助攻〔S1〕。`,
            sourceRefs: [ref('events')],
          },
        });
      } else if (scoreChangedSoon) {
        keySubstitutions.push({
          minute: subMinute,
          playerIn: inName,
          playerOut: sub.detail ?? '',
          impact: {
            text: `第${fmtMinute(subMinute, aet)}分鐘，${teamZh(sub.teamId)}以${inName}入替〔S1〕；換人後十五分鐘內場上比數改變〔S1〕。`,
            sourceRefs: [ref('events')],
          },
        });
      }
    }
  }

  // ---- (g) 數據支持嘅結論（3–5 點；只用存在嘅 stats 欄位，每點最多 2 個欄位） ----
  let dataConclusions: MatchAnalysis['dataConclusions'] = insufficient();
  if (hasStats && match.stats) {
    const st = match.stats;
    const out: { claim: Claim; fields: string[] }[] = [];
    const poss = st.possession;
    if (poss) {
      const leader = poss.home >= poss.away ? homeZh : awayZh;
      const loserLost =
        (poss.home >= 60 && match.score.home < match.score.away) || (poss.away >= 60 && match.score.away < match.score.home);
      out.push({
        claim: {
          text: loserLost
            ? `${leader}全場控球率達${Math.max(poss.home, poss.away)}%〔S1〕，但最終以 ${scoreStr} 落敗〔S1〕，控球優勢未能轉化為入球。`
            : `${leader}控球率 ${Math.max(poss.home, poss.away)}%，對手 ${Math.min(poss.home, poss.away)}%〔S1〕。`,
          sourceRefs: [ref('stats.possession', 'match.stats'), ref('score')],
        },
        fields: ['stats.possession'],
      });
    }
    const shots = st.shots;
    if (shots) {
      const big = Math.max(shots.home, shots.away);
      const small = Math.min(shots.home, shots.away);
      const bigTeam = shots.home >= shots.away ? homeZh : awayZh;
      const smallTeam = shots.home >= shots.away ? awayZh : homeZh;
      out.push({
        claim: {
          text:
            small > 0 && big / small > 2
              ? `${bigTeam}全場射門 ${big} 次，係${smallTeam}（${small} 次）嘅超過兩倍〔S1〕。`
              : `${bigTeam}射門 ${big} 次，${smallTeam}射門 ${small} 次〔S1〕。`,
          sourceRefs: [ref('stats.shots', 'match.stats')],
        },
        fields: ['stats.shots'],
      });
    }
    const sot = st.shotsOnTarget;
    if (sot) {
      out.push({
        claim: {
          text: `射正次數：${homeZh} ${sot.home} 次，${awayZh} ${sot.away} 次〔S1〕。`,
          sourceRefs: [ref('stats.shotsOnTarget', 'match.stats')],
        },
        fields: ['stats.shotsOnTarget'],
      });
    }
    const xg = st.xg;
    // G-03：provider 有 xG 先顯示
    if (xg) {
      out.push({
        claim: {
          text: `預期入球（xG）：${homeZh} ${xg.home}，${awayZh} ${xg.away}〔S1〕。`,
          sourceRefs: [ref('stats.xg', 'match.stats')],
        },
        fields: ['stats.xg'],
      });
    }
    if (out.length > 0) dataConclusions = ok(out.slice(0, 5));
  }

  // ---- (h) 下一場影響（只寫事實；禁止預測） ----
  let nextMatch: MatchAnalysis['nextMatch'] = insufficient();
  if (match.stage !== 'GROUP' && match.stage !== 'F' && winnerId) {
    const facts: Claim[] = [];
    const curOrder = STAGE_ORDER[match.stage];
    const later = ctx.matches
      .filter((m) => STAGE_ORDER[m.stage] > curOrder)
      .sort((x, y) => STAGE_ORDER[x.stage] - STAGE_ORDER[y.stage] || x.kickoffUtc.localeCompare(y.kickoffUtc));
    const winnerNext = later.find(
      (m) => m.stage !== '3P' && (m.homeTeamId === winnerId || m.awayTeamId === winnerId),
    );
    const nextRef = (m: Match, fieldPath: string) => ref(fieldPath, 'match', m.matchId);
    if (match.stage === '3P') {
      facts.push({ text: `${teamZh(winnerId)}奪得今屆季軍〔S1〕。`, sourceRefs: [ref('score')] });
    } else if (winnerNext) {
      facts.push({
        text: `${teamZh(winnerId)}晉級${STAGE_LABEL[winnerNext.stage]}〔S1〕。`,
        sourceRefs: [nextRef(winnerNext, winnerNext.homeTeamId === winnerId ? 'homeTeamId' : 'awayTeamId')],
      });
    }
    const loserId = winnerId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
    if (match.stage === 'SF') {
      const thirdPlace = later.find((m) => m.stage === '3P' && (m.homeTeamId === loserId || m.awayTeamId === loserId));
      if (thirdPlace) {
        facts.push({ text: `${teamZh(loserId)}轉戰季軍戰〔S1〕。`, sourceRefs: [nextRef(thirdPlace, 'stage')] });
      }
    } else if (match.stage !== '3P') {
      const loserContinues = later.some((m) => m.homeTeamId === loserId || m.awayTeamId === loserId);
      if (!loserContinues) {
        facts.push({ text: `${teamZh(loserId)}喺${label}止步〔S1〕。`, sourceRefs: [ref('score')] });
      }
    }
    // 已確定停賽：紅牌且該隊仍有下一场
    const suspensions: NonNullable<MatchAnalysis['nextMatch']['content']>['confirmedSuspensions'] = [];
    for (const e of events) {
      if (e.type === 'red' || e.type === 'second_yellow') {
        const teamContinues = later.some((m) => m.homeTeamId === e.teamId || m.awayTeamId === e.teamId);
        if (teamContinues && e.playerName) {
          suspensions.push({
            playerId: e.playerId ?? e.playerName,
            name: playerZh(e.playerId, e.playerName),
            reason: 'red_card',
            sourceRefs: [ref('events')],
          });
        }
      }
    }
    if (facts.length > 0) {
      const oppId = winnerNext
        ? winnerNext.homeTeamId === winnerId
          ? winnerNext.awayTeamId
          : winnerNext.homeTeamId
        : undefined;
      nextMatch = ok({
        facts,
        confirmedSuspensions: suspensions,
        nextFixture:
          winnerNext && oppId
            ? {
                opponent: teamZh(oppId),
                kickoffUtc: winnerNext.kickoffUtc,
                sourceRefs: [nextRef(winnerNext, 'kickoffUtc')],
              }
            : undefined,
      });
    }
  }

  // ---- (i) 來源清單：聚合所有 Claim.sourceRefs 去重 ----
  const allClaims: Claim[] = [];
  const allRefs: SourceRef[] = [];
  const collectClaims = (arr: Claim[]): void => {
    arr.forEach((c) => allClaims.push(c));
  };
  if (quickSummary.content) allClaims.push(quickSummary.content);
  if (fullReport.content) collectClaims(fullReport.content.paragraphs);
  if (tactical.content) collectClaims(tactical.content.claims);
  if (turningPoints.content) turningPoints.content.forEach((tp) => allClaims.push(tp.description));
  if (keyPlayers.content) keyPlayers.content.forEach((kp) => collectClaims(kp.stats));
  keySubstitutions.forEach((ks) => allClaims.push(ks.impact));
  if (dataConclusions.content) dataConclusions.content.forEach((dc) => allClaims.push(dc.claim));
  if (nextMatch.content) {
    collectClaims(nextMatch.content.facts);
    nextMatch.content.confirmedSuspensions.forEach((s) =>
      s.sourceRefs.forEach((r) => allRefs.push(r)),
    );
    nextMatch.content.nextFixture?.sourceRefs.forEach((r) => allRefs.push(r));
  }
  allClaims.forEach((c) => c.sourceRefs.forEach((r) => allRefs.push(r)));
  const seen = new Set<string>();
  const sources: SourceRef[] = [];
  for (const r of allRefs) {
    const key = `${r.sourceId}|${r.entity}|${r.entityId ?? ''}|${r.fieldPath}`;
    if (!seen.has(key)) {
      seen.add(key);
      sources.push(r);
    }
  }

  const anyInsufficient = [fullReport, tactical, turningPoints, keyPlayers, dataConclusions, nextMatch].some(
    (s) => s.status === 'insufficient_data',
  );

  const analysis: MatchAnalysis = {
    matchId: match.matchId,
    generatedAt: ctx.generatedAt ?? new Date().toISOString(),
    dataTier: tier,
    dataMode: ctx.dataMode,
    analysisStatus: anyInsufficient ? 'degraded' : 'complete',
    quickSummary,
    fullReport,
    tactical,
    turningPoints,
    keyPlayers,
    keySubstitutions: ok(keySubstitutions),
    dataConclusions,
    nextMatch,
    sources,
  };

  return validateAnalysis(analysis, match);
}

// ---------------------------------------------------------------------------
// 未完場分析 placeholder（只有 FT 先生成；UI 唔應該發布 blocked 分析）
// ---------------------------------------------------------------------------
function notFinishedAnalysis(match: Match, ctx: AnalysisContext): MatchAnalysis {
  return {
    matchId: match.matchId,
    generatedAt: ctx.generatedAt ?? new Date().toISOString(),
    dataTier: 'T3',
    dataMode: ctx.dataMode,
    analysisStatus: 'blocked',
    blockedReasons: [`比賽未完場（status: ${match.status}），唔會生成賽後分析`],
    quickSummary: insufficient(),
    fullReport: insufficient(),
    tactical: insufficient(),
    turningPoints: insufficient(),
    keyPlayers: insufficient(),
    keySubstitutions: insufficient(),
    dataConclusions: insufficient(),
    nextMatch: insufficient(),
    sources: [],
  };
}

// ---------------------------------------------------------------------------
// G-11 三步驗證 pipeline
// ---------------------------------------------------------------------------

/** G-13 禁止語句詞表：估算詞、意圖斷言、氣氛虛構、過強因果、無條件未來斷言、無來源歷史比較、主觀評級 */
const BANNED_PHRASES: string[] = [
  '大約', '估計', '相信', '刻意', '旨在', '為咗', '全場沸騰', '因此導致', '因此',
  '必勝', '篤定', '史上首次', '預測', '勢必', '大熱', '穩贏', '氣氛熱烈', '球迷歡呼',
  '內訌', '受傷缺陣', '據推測', '理應', '應該會', '可能會', '無疑', '堪稱一絕',
];

/** 抽出分析中所有 Claim（用於來源覆蓋檢查同數字審計） */
function collectAllClaims(analysis: MatchAnalysis): Claim[] {
  const claims: Claim[] = [];
  if (analysis.quickSummary.content) claims.push(analysis.quickSummary.content);
  analysis.fullReport.content?.paragraphs.forEach((c) => claims.push(c));
  analysis.tactical.content?.claims.forEach((c) => claims.push(c));
  analysis.turningPoints.content?.forEach((tp) => claims.push(tp.description));
  analysis.keyPlayers.content?.forEach((kp) => kp.stats.forEach((c) => claims.push(c)));
  analysis.keySubstitutions.content?.forEach((ks) => claims.push(ks.impact));
  analysis.dataConclusions.content?.forEach((dc) => claims.push(dc.claim));
  analysis.nextMatch.content?.facts.forEach((c) => claims.push(c));
  return claims;
}

/** 建立該場允許出現嘅數字白名單（G-01 數字溯源） */
function buildAllowedNumbers(match: Match): Set<number> {
  const s = new Set<number>();
  const sc = match.score;
  for (const v of [
    sc.home, sc.away,
    sc.halfTime?.home, sc.halfTime?.away,
    sc.extraTime?.home, sc.extraTime?.away,
    sc.penalties?.home, sc.penalties?.away,
  ]) {
    if (v !== undefined) s.add(v);
  }
  const goalLike = [...(match.events ?? []), ...(match.scorers ?? [])];
  for (const e of goalLike) {
    if (e.minute != null) {
      s.add(e.minute);
      // 補時寫法拆解：92 → 90、2；125 → 120、5
      if (e.minute > 120) {
        s.add(120);
        s.add(e.minute - 120);
      }
      if (e.minute > 90) {
        s.add(90);
        s.add(e.minute - 90);
      }
    }
  }
  // 單球球員入球/助攻次數（計算值）
  const counts = new Map<string, number>();
  for (const g of match.scorers ?? []) {
    if (g.kind === 'own_goal') continue;
    const k = g.playerId ?? g.playerName;
    counts.set(k, (counts.get(k) ?? 0) + 1);
    if (g.assistName) {
      const ak = g.assistPlayerId ?? g.assistName;
      counts.set(`a:${ak}`, (counts.get(`a:${ak}`) ?? 0) + 1);
    }
  }
  counts.forEach((v) => s.add(v));
  // 衍生計算值：總入球、差距、互射十二碼總和
  s.add(sc.home + sc.away);
  s.add(Math.abs(sc.home - sc.away));
  if (sc.penalties) s.add(sc.penalties.home + sc.penalties.away);
  if (sc.extraTime) s.add(sc.extraTime.home + sc.extraTime.away);
  // 事件數量
  s.add(goalLike.length);
  s.add((match.events ?? []).length);
  // 統計欄位數字 + 差距 + 總和（計算值）
  if (match.stats) {
    for (const v of Object.values(match.stats)) {
      if (v) {
        s.add(v.home);
        s.add(v.away);
        s.add(Math.abs(v.home - v.away));
        s.add(v.home + v.away);
      }
    }
  }
  return s;
}

/** 抽出文本中嘅數字 token（先移除 〔S1〕呢類來源標記） */
function extractNumbers(text: string): number[] {
  const cleaned = text.replace(/〔S\d+〕/g, '');
  const tokens = cleaned.match(/\d+(?:\.\d+)?/g);
  return tokens ? tokens.map(Number) : [];
}

/**
 * G-11 三步驗證：
 * (1) 數字審計 — 文本所有數字必須可溯源至 match 結構化數據（含計算值）
 * (2) 禁止語句掃描 — G-13 詞表
 * (3) 來源覆蓋 — 每個 Claim 必須有 sourceRefs；demo 標示不可移除（G-12）
 * 失敗 → analysisStatus = 'blocked' + blockedReasons
 */
export function validateAnalysis(analysis: MatchAnalysis, match: Match): MatchAnalysis {
  const reasons: string[] = [];
  const claims = collectAllClaims(analysis);

  // (1) 數字審計
  const allowed = buildAllowedNumbers(match);
  const textsToAudit: string[] = claims.map((c) => c.text);
  analysis.turningPoints.content?.forEach((tp) => {
    textsToAudit.push(tp.scoreBefore);
    if (tp.scoreAfter) textsToAudit.push(tp.scoreAfter);
  });
  for (const text of textsToAudit) {
    for (const n of extractNumbers(text)) {
      if (!allowed.has(n)) {
        reasons.push(`G-01 數字溯源失敗：「${text.slice(0, 40)}…」中嘅數字 ${n} 未見於結構化輸入`);
      }
    }
  }

  // (2) 禁止語句掃描
  for (const text of textsToAudit) {
    for (const phrase of BANNED_PHRASES) {
      if (text.includes(phrase)) {
        reasons.push(`G-13 禁止語句：「${text.slice(0, 40)}…」含「${phrase}」`);
      }
    }
  }

  // (3) 來源覆蓋
  for (const c of claims) {
    if (c.sourceRefs.length === 0) {
      reasons.push(`G-11 來源覆蓋失敗：Claim「${c.text.slice(0, 40)}…」無 sourceRefs`);
    }
  }
  if (analysis.analysisStatus !== 'blocked' && analysis.sources.length === 0 && claims.length > 0) {
    reasons.push('G-11 來源覆蓋失敗：sources 清單為空');
  }
  // G-12 demo 標示不可移除
  if (analysis.dataMode === 'demo' && !analysis.sources.some((r) => r.dataMode === 'demo') && claims.length > 0) {
    reasons.push('G-12 demo 標示缺失：dataMode 為 demo 但 sources 無 demo 標記');
  }

  if (reasons.length > 0) {
    return {
      ...analysis,
      analysisStatus: 'blocked',
      blockedReasons: [...(analysis.blockedReasons ?? []), ...reasons],
    };
  }
  return analysis;
}
