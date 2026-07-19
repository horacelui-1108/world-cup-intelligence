/**
 * 104 場賽事數據 — 2026 FIFA 世界盃（小組賽 72 + 淘汰賽 31 已完成 + 決賽 scheduled）
 *
 * 數據誠信聲明：
 * - 所有比分、日期、球場、入球者均來自 data-research-brief.md（ESPN 核實，dataStatus: VERIFIED）。
 * - 【小組賽具體開球時間為近似值，結構預留精確值】：日期準確，UTC 時間按當日
 *   11:00 / 14:00 / 17:00 / 20:00 / 23:00 / 02:00（翌日）合理編排；淘汰賽開球時間同屬近似，
 *   惟 M103 季軍戰（17:00 ET = 21:00 UTC）與 M104 決賽（15:00 ET = 19:00 UTC）為 brief 核實時間。
 * - 入球分鐘未核實（brief 無提供）嘅事件 minute = null，絕不虛構。
 * - 補時分鐘以整數儲存：90+2' → 92；120+5' → 125（顯示時還原）。
 * - brief 無提供嘅統計（控球、射門、xG 等）一律唔填（undefined = 唔顯示）。
 */
import type {
  GoalEvent,
  GroupLetter,
  Match,
  MatchEvent,
  SourceMeta,
  Stage,
  Tournament,
} from '../types/football';

const ESPN_URL =
  'https://www.espn.com/soccer/story/_/id/48939282/2026-fifa-world-cup-fixtures-results-match-schedule-group-stage-knockout-rounds-bracket';

export const ESPN_VERIFIED: SourceMeta = {
  source: 'ESPN',
  sourceUrl: ESPN_URL,
  retrievedAt: '2026-07-19T00:00:00Z',
  dataStatus: 'VERIFIED',
};

export const ESPN_PENDING: SourceMeta = {
  source: 'ESPN',
  sourceUrl: ESPN_URL,
  retrievedAt: '2026-07-19T00:00:00Z',
  dataStatus: 'PENDING',
};

/** 賽事 config — 驅動 nav tournament switcher、組別字母、淘汰賽規模、球場（design §7） */
export const tournament: Tournament = {
  id: 'wc2026',
  name: 'FIFA 世界盃 2026',
  nameEn: 'FIFA World Cup 2026',
  year: 2026,
  groups: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
  venues: [
    'azteca', 'metlife', 'att', 'mercedes', 'arrowhead', 'nrg', 'levis', 'sofi',
    'lincoln', 'lumen', 'gillette', 'hardrock', 'bcplace', 'bbva', 'akron', 'bmo',
  ],
  stages: ['GROUP', 'R32', 'R16', 'QF', 'SF', '3P', 'F'],
  totalMatches: 104,
  hostCountries: ['美國', '加拿大', '墨西哥'],
  startDate: '2026-06-11',
  endDate: '2026-07-19',
};

// ---------------------------------------------------------------------------
// 小組賽 72 場（M1–M72）
// tuple: [matchNo, dateISO, timeUTC, group, venueId, homeId, homeGoals, awayGoals, awayId]
// ---------------------------------------------------------------------------
type GroupRow = [number, string, string, GroupLetter, string, string, number, number, string];

const groupRows: GroupRow[] = [
  [1, '06-11', '17:00', 'A', 'azteca', 'mex', 2, 0, 'rsa'],
  [2, '06-11', '20:00', 'A', 'akron', 'kor', 2, 1, 'cze'],
  [3, '06-12', '17:00', 'B', 'bmo', 'can', 1, 1, 'bih'],
  [4, '06-12', '20:00', 'D', 'sofi', 'usa', 4, 1, 'par'],
  [5, '06-13', '17:00', 'B', 'levis', 'qat', 1, 1, 'sui'],
  [6, '06-13', '20:00', 'C', 'metlife', 'bra', 1, 1, 'mar'],
  [7, '06-13', '23:00', 'C', 'gillette', 'hai', 0, 1, 'sco'],
  [8, '06-14', '02:00', 'D', 'bcplace', 'aus', 2, 0, 'tur'],
  [9, '06-14', '17:00', 'E', 'nrg', 'ger', 7, 1, 'cuw'],
  [10, '06-14', '20:00', 'F', 'att', 'ned', 2, 2, 'jpn'],
  [11, '06-14', '23:00', 'E', 'lincoln', 'civ', 1, 0, 'ecu'],
  [12, '06-15', '02:00', 'F', 'bbva', 'swe', 5, 1, 'tun'],
  [13, '06-15', '17:00', 'H', 'mercedes', 'esp', 0, 0, 'cpv'],
  [14, '06-15', '20:00', 'G', 'lumen', 'bel', 1, 1, 'egy'],
  [15, '06-15', '23:00', 'H', 'hardrock', 'ksa', 1, 1, 'uru'],
  [16, '06-16', '02:00', 'G', 'sofi', 'irn', 2, 2, 'nzl'],
  [17, '06-16', '17:00', 'I', 'metlife', 'fra', 3, 1, 'sen'],
  [18, '06-16', '20:00', 'I', 'gillette', 'irq', 1, 4, 'nor'],
  [19, '06-16', '23:00', 'J', 'arrowhead', 'arg', 3, 0, 'alg'],
  [20, '06-17', '02:00', 'J', 'levis', 'aut', 3, 1, 'jor'],
  [21, '06-17', '17:00', 'K', 'nrg', 'por', 1, 1, 'cod'],
  [22, '06-17', '20:00', 'L', 'att', 'eng', 4, 2, 'cro'],
  [23, '06-17', '23:00', 'L', 'bmo', 'gha', 1, 0, 'pan'],
  [24, '06-18', '02:00', 'K', 'azteca', 'uzb', 1, 3, 'col'],
  [25, '06-18', '17:00', 'A', 'mercedes', 'cze', 1, 1, 'rsa'],
  [26, '06-18', '20:00', 'B', 'sofi', 'sui', 4, 1, 'bih'],
  [27, '06-18', '23:00', 'B', 'bcplace', 'can', 6, 0, 'qat'],
  [28, '06-19', '02:00', 'A', 'akron', 'mex', 1, 0, 'kor'],
  [29, '06-19', '17:00', 'D', 'lumen', 'usa', 2, 0, 'aus'],
  [30, '06-19', '20:00', 'C', 'gillette', 'sco', 0, 1, 'mar'],
  [31, '06-19', '23:00', 'C', 'lincoln', 'bra', 3, 0, 'hai'],
  [32, '06-20', '02:00', 'D', 'levis', 'tur', 0, 1, 'par'],
  [33, '06-20', '17:00', 'F', 'nrg', 'ned', 5, 1, 'swe'],
  [34, '06-20', '20:00', 'E', 'bmo', 'ger', 2, 1, 'civ'],
  [35, '06-20', '23:00', 'E', 'arrowhead', 'ecu', 0, 0, 'cuw'],
  [36, '06-21', '02:00', 'F', 'bbva', 'tun', 0, 4, 'jpn'],
  [37, '06-21', '17:00', 'H', 'mercedes', 'esp', 4, 0, 'ksa'],
  [38, '06-21', '20:00', 'G', 'sofi', 'bel', 0, 0, 'irn'],
  [39, '06-21', '23:00', 'H', 'hardrock', 'uru', 2, 2, 'cpv'],
  [40, '06-22', '02:00', 'G', 'bcplace', 'nzl', 1, 3, 'egy'],
  [41, '06-22', '17:00', 'J', 'att', 'arg', 2, 0, 'aut'],
  [42, '06-22', '20:00', 'I', 'lincoln', 'fra', 3, 0, 'irq'],
  [43, '06-22', '23:00', 'I', 'metlife', 'nor', 3, 2, 'sen'],
  [44, '06-23', '02:00', 'J', 'levis', 'jor', 1, 2, 'alg'],
  [45, '06-23', '17:00', 'K', 'nrg', 'por', 5, 0, 'uzb'],
  [46, '06-23', '20:00', 'L', 'gillette', 'eng', 0, 0, 'gha'],
  [47, '06-23', '23:00', 'L', 'bmo', 'pan', 0, 1, 'cro'],
  [48, '06-24', '02:00', 'K', 'akron', 'col', 1, 0, 'cod'],
  [49, '06-24', '11:00', 'B', 'bcplace', 'sui', 2, 1, 'can'],
  [50, '06-24', '14:00', 'B', 'lumen', 'bih', 3, 1, 'qat'],
  [51, '06-24', '17:00', 'C', 'hardrock', 'sco', 0, 3, 'bra'],
  [52, '06-24', '20:00', 'C', 'mercedes', 'mar', 4, 2, 'hai'],
  [53, '06-24', '23:00', 'A', 'azteca', 'cze', 0, 3, 'mex'],
  [54, '06-25', '02:00', 'A', 'bbva', 'rsa', 1, 0, 'kor'],
  [55, '06-25', '11:00', 'E', 'metlife', 'ecu', 2, 1, 'ger'],
  [56, '06-25', '14:00', 'E', 'lincoln', 'cuw', 0, 2, 'civ'],
  [57, '06-25', '17:00', 'F', 'att', 'jpn', 1, 1, 'swe'],
  [58, '06-25', '20:00', 'F', 'arrowhead', 'tun', 1, 3, 'ned'],
  [59, '06-25', '23:00', 'D', 'sofi', 'tur', 3, 2, 'usa'],
  [60, '06-26', '02:00', 'D', 'levis', 'par', 0, 0, 'aus'],
  [61, '06-26', '11:00', 'I', 'gillette', 'nor', 1, 4, 'fra'],
  [62, '06-26', '14:00', 'I', 'bmo', 'sen', 5, 0, 'irq'],
  [63, '06-26', '17:00', 'H', 'nrg', 'cpv', 0, 0, 'ksa'],
  [64, '06-26', '20:00', 'H', 'akron', 'uru', 0, 1, 'esp'],
  [65, '06-26', '23:00', 'G', 'lumen', 'egy', 1, 1, 'irn'],
  [66, '06-27', '02:00', 'G', 'bcplace', 'nzl', 1, 5, 'bel'],
  [67, '06-27', '11:00', 'L', 'metlife', 'pan', 0, 2, 'eng'],
  [68, '06-27', '14:00', 'L', 'lincoln', 'cro', 2, 1, 'gha'],
  [69, '06-27', '17:00', 'K', 'hardrock', 'col', 0, 0, 'por'],
  [70, '06-27', '20:00', 'K', 'mercedes', 'cod', 3, 1, 'uzb'],
  [71, '06-27', '23:00', 'J', 'arrowhead', 'alg', 3, 3, 'aut'],
  [72, '06-28', '02:00', 'J', 'att', 'jor', 1, 3, 'arg'],
];

const groupMatches: Match[] = groupRows.map(
  ([n, date, time, group, venueId, homeTeamId, home, away, awayTeamId]) => ({
    matchId: `M${n}`,
    stage: 'GROUP' as Stage,
    group,
    kickoffUtc: `2026-${date}T${time}:00Z`,
    venueId,
    homeTeamId,
    awayTeamId,
    status: 'ft',
    score: { home, away },
    source: ESPN_VERIFIED,
  }),
);

// ---------------------------------------------------------------------------
// 淘汰賽 M73–M104（入球事件依 brief；minute null = 分鐘未核實）
// ---------------------------------------------------------------------------

/** 由事件列表推導 scorers（goal / pen_goal / own_goal） */
function toScorers(events: MatchEvent[]): GoalEvent[] {
  return events
    .filter((e) => e.type === 'goal' || e.type === 'pen_goal' || e.type === 'own_goal')
    .map((e) => ({
      minute: e.minute,
      teamId: e.teamId,
      playerId: e.playerId,
      playerName: e.playerName,
      assistPlayerId: e.assistPlayerId,
      assistName: e.assistName,
      kind: e.type as GoalEvent['kind'],
    }));
}

function goal(
  minute: number | null,
  teamId: string,
  playerId: string,
  playerName: string,
  assistName?: string,
  kind: 'goal' | 'pen_goal' | 'own_goal' = 'goal',
): MatchEvent {
  return { minute, type: kind, teamId, playerId, playerName, assistName };
}

interface KoSpec {
  n: number;
  stage: Stage;
  kickoffUtc: string;
  venueId: string;
  homeTeamId: string;
  awayTeamId: string;
  home: number;
  away: number;
  extraTime?: { home: number; away: number };
  penalties?: { home: number; away: number };
  events?: MatchEvent[];
  scorers?: GoalEvent[];
}

function ko(spec: KoSpec): Match {
  const { n, stage, kickoffUtc, venueId, homeTeamId, awayTeamId, home, away, extraTime, penalties, events, scorers } = spec;
  return {
    matchId: `M${n}`,
    stage,
    kickoffUtc,
    venueId,
    homeTeamId,
    awayTeamId,
    status: 'ft',
    score: { home, away, extraTime, penalties },
    events,
    scorers: scorers ?? (events ? toScorers(events) : undefined),
    source: ESPN_VERIFIED,
  };
}

const knockoutMatches: Match[] = [
  // --- 32 強 ---
  ko({
    n: 73, stage: 'R32', kickoffUtc: '2026-06-28T20:00:00Z', venueId: 'sofi',
    homeTeamId: 'rsa', awayTeamId: 'can', home: 0, away: 1,
    events: [goal(92, 'can', 'eustaquio', 'Stephen Eustáquio')],
  }),
  ko({
    n: 74, stage: 'R32', kickoffUtc: '2026-06-29T17:00:00Z', venueId: 'nrg',
    homeTeamId: 'bra', awayTeamId: 'jpn', home: 2, away: 1,
    events: [
      goal(29, 'jpn', 'sano', 'Sano'),
      goal(56, 'bra', 'casemiro', 'Casemiro'),
      goal(95, 'bra', 'martinelli', 'Gabriel Martinelli'),
    ],
  }),
  ko({
    n: 75, stage: 'R32', kickoffUtc: '2026-06-29T20:00:00Z', venueId: 'gillette',
    homeTeamId: 'ger', awayTeamId: 'par', home: 1, away: 1,
    penalties: { home: 3, away: 4 },
    events: [
      goal(42, 'par', 'enciso', 'Julio Enciso'),
      goal(54, 'ger', 'havertz', 'Kai Havertz'),
    ],
  }),
  ko({
    n: 76, stage: 'R32', kickoffUtc: '2026-06-29T23:00:00Z', venueId: 'bbva',
    homeTeamId: 'ned', awayTeamId: 'mar', home: 1, away: 1,
    penalties: { home: 2, away: 3 },
    events: [
      goal(72, 'ned', 'gakpo', 'Cody Gakpo'),
      goal(91, 'mar', 'diop', 'Diop'),
    ],
  }),
  ko({
    n: 77, stage: 'R32', kickoffUtc: '2026-06-30T17:00:00Z', venueId: 'att',
    homeTeamId: 'civ', awayTeamId: 'nor', home: 1, away: 2,
    events: [
      goal(39, 'nor', 'nusa', 'Antonio Nusa'),
      goal(74, 'civ', 'diallo', 'Diallo'),
      goal(86, 'nor', 'haaland', 'Erling Haaland'),
    ],
  }),
  ko({
    n: 78, stage: 'R32', kickoffUtc: '2026-06-30T20:00:00Z', venueId: 'metlife',
    homeTeamId: 'fra', awayTeamId: 'swe', home: 3, away: 0,
    events: [
      goal(45, 'fra', 'mbappe', 'Kylian Mbappé'),
      goal(53, 'fra', 'barcola', 'Bradley Barcola'),
      goal(74, 'fra', 'mbappe', 'Kylian Mbappé'),
    ],
  }),
  ko({
    n: 79, stage: 'R32', kickoffUtc: '2026-06-30T23:00:00Z', venueId: 'azteca',
    homeTeamId: 'mex', awayTeamId: 'ecu', home: 2, away: 0,
    events: [
      goal(22, 'mex', 'quinones', 'Quiñones'),
      goal(31, 'mex', 'jimenez', 'Jiménez'),
    ],
  }),
  ko({
    n: 80, stage: 'R32', kickoffUtc: '2026-07-01T17:00:00Z', venueId: 'mercedes',
    homeTeamId: 'eng', awayTeamId: 'cod', home: 2, away: 1,
    events: [
      goal(7, 'cod', 'cipenga', 'Cipenga'),
      goal(75, 'eng', 'kane', 'Harry Kane'),
      goal(86, 'eng', 'kane', 'Harry Kane'),
    ],
  }),
  ko({
    n: 81, stage: 'R32', kickoffUtc: '2026-07-01T20:00:00Z', venueId: 'lumen',
    homeTeamId: 'bel', awayTeamId: 'sen', home: 3, away: 2,
    extraTime: { home: 1, away: 0 },
    events: [
      goal(25, 'sen', 'diarra', 'Diarra'),
      goal(51, 'sen', 'sarr', 'Sarr'),
      goal(86, 'bel', 'lukaku', 'Romelu Lukaku'),
      goal(89, 'bel', 'tielemans', 'Youri Tielemans'),
      goal(125, 'bel', 'tielemans', 'Youri Tielemans', undefined, 'pen_goal'),
    ],
  }),
  ko({
    n: 82, stage: 'R32', kickoffUtc: '2026-07-01T23:00:00Z', venueId: 'levis',
    homeTeamId: 'usa', awayTeamId: 'bih', home: 2, away: 0,
    events: [
      goal(45, 'usa', 'balogun', 'Folarin Balogun'),
      goal(82, 'usa', 'tillman', 'Malik Tillman'),
    ],
  }),
  ko({ n: 83, stage: 'R32', kickoffUtc: '2026-07-02T17:00:00Z', venueId: 'sofi', homeTeamId: 'esp', awayTeamId: 'aut', home: 3, away: 0 }),
  ko({ n: 84, stage: 'R32', kickoffUtc: '2026-07-02T20:00:00Z', venueId: 'bmo', homeTeamId: 'por', awayTeamId: 'cro', home: 2, away: 1 }),
  ko({ n: 85, stage: 'R32', kickoffUtc: '2026-07-02T23:00:00Z', venueId: 'bcplace', homeTeamId: 'sui', awayTeamId: 'alg', home: 2, away: 0 }),
  ko({
    n: 86, stage: 'R32', kickoffUtc: '2026-07-03T17:00:00Z', venueId: 'att',
    homeTeamId: 'aus', awayTeamId: 'egy', home: 1, away: 1,
    penalties: { home: 2, away: 4 },
  }),
  ko({ n: 87, stage: 'R32', kickoffUtc: '2026-07-03T20:00:00Z', venueId: 'hardrock', homeTeamId: 'arg', awayTeamId: 'cpv', home: 3, away: 2 }),
  ko({ n: 88, stage: 'R32', kickoffUtc: '2026-07-03T23:00:00Z', venueId: 'arrowhead', homeTeamId: 'col', awayTeamId: 'gha', home: 1, away: 0 }),
  // --- 16 強 ---
  ko({ n: 89, stage: 'R16', kickoffUtc: '2026-07-04T17:00:00Z', venueId: 'nrg', homeTeamId: 'can', awayTeamId: 'mar', home: 0, away: 3 }),
  ko({ n: 90, stage: 'R16', kickoffUtc: '2026-07-04T20:00:00Z', venueId: 'lincoln', homeTeamId: 'par', awayTeamId: 'fra', home: 0, away: 1 }),
  ko({
    n: 91, stage: 'R16', kickoffUtc: '2026-07-05T17:00:00Z', venueId: 'metlife',
    homeTeamId: 'bra', awayTeamId: 'nor', home: 1, away: 2,
    // brief：Haaland 兩球均由 Schjelderup 助攻；入球分鐘未核實（minute = null）
    scorers: [
      { minute: null, teamId: 'nor', playerId: 'haaland', playerName: 'Erling Haaland', assistPlayerId: 'schjelderup', assistName: 'Andreas Schjelderup', kind: 'goal' },
      { minute: null, teamId: 'nor', playerId: 'haaland', playerName: 'Erling Haaland', assistPlayerId: 'schjelderup', assistName: 'Andreas Schjelderup', kind: 'goal' },
    ],
  }),
  ko({
    n: 92, stage: 'R16', kickoffUtc: '2026-07-05T20:00:00Z', venueId: 'azteca',
    homeTeamId: 'mex', awayTeamId: 'eng', home: 2, away: 3,
    // brief：Bellingham 梅開二度、Kane 十二碼（經 VAR 覆核）；分鐘未核實
    events: [
      { minute: null, type: 'var', teamId: 'eng', playerId: 'kane', playerName: 'Harry Kane', detail: 'Kane 十二碼判罰經 VAR 覆核後維持', varOutcome: 'penalty_confirmed' },
    ],
    scorers: [
      { minute: null, teamId: 'eng', playerId: 'bellingham', playerName: 'Jude Bellingham', kind: 'goal' },
      { minute: null, teamId: 'eng', playerId: 'bellingham', playerName: 'Jude Bellingham', kind: 'goal' },
      { minute: null, teamId: 'eng', playerId: 'kane', playerName: 'Harry Kane', kind: 'pen_goal' },
    ],
  }),
  ko({
    n: 93, stage: 'R16', kickoffUtc: '2026-07-06T17:00:00Z', venueId: 'att',
    homeTeamId: 'por', awayTeamId: 'esp', home: 0, away: 1,
    events: [goal(91, 'esp', 'merino', 'Mikel Merino')],
  }),
  ko({ n: 94, stage: 'R16', kickoffUtc: '2026-07-06T20:00:00Z', venueId: 'lumen', homeTeamId: 'usa', awayTeamId: 'bel', home: 1, away: 4 }),
  ko({
    n: 95, stage: 'R16', kickoffUtc: '2026-07-07T17:00:00Z', venueId: 'mercedes',
    homeTeamId: 'arg', awayTeamId: 'egy', home: 3, away: 2,
    // brief：阿根廷落後 0-2 大逆轉，有 VAR 爭議；入球者及分鐘未核實
    events: [
      { minute: null, type: 'var', teamId: 'arg', playerName: '', detail: '賽事中出現 VAR 爭議判罰（具體細節未核實）', varOutcome: 'controversy' },
    ],
  }),
  ko({
    n: 96, stage: 'R16', kickoffUtc: '2026-07-07T20:00:00Z', venueId: 'bcplace',
    homeTeamId: 'sui', awayTeamId: 'col', home: 0, away: 0,
    penalties: { home: 4, away: 3 },
  }),
];

const lateKnockoutMatches: Match[] = [
  // --- 八強 ---
  ko({
    n: 97, stage: 'QF', kickoffUtc: '2026-07-09T20:00:00Z', venueId: 'gillette',
    homeTeamId: 'fra', awayTeamId: 'mar', home: 2, away: 0,
    // brief：Mbappé、Dembélé 建功；分鐘未核實
    scorers: [
      { minute: null, teamId: 'fra', playerId: 'mbappe', playerName: 'Kylian Mbappé', kind: 'goal' },
      { minute: null, teamId: 'fra', playerId: 'dembele', playerName: 'Ousmane Dembélé', kind: 'goal' },
    ],
  }),
  ko({
    n: 98, stage: 'QF', kickoffUtc: '2026-07-10T20:00:00Z', venueId: 'sofi',
    homeTeamId: 'esp', awayTeamId: 'bel', home: 2, away: 1,
    // brief：Merino 奠勝；分鐘未核實
    scorers: [
      { minute: null, teamId: 'esp', playerId: 'merino', playerName: 'Mikel Merino', kind: 'goal' },
    ],
  }),
  ko({
    n: 99, stage: 'QF', kickoffUtc: '2026-07-11T17:00:00Z', venueId: 'hardrock',
    homeTeamId: 'nor', awayTeamId: 'eng', home: 1, away: 2,
    extraTime: { home: 0, away: 1 },
    events: [
      goal(36, 'nor', 'schjelderup', 'Andreas Schjelderup'),
      goal(45, 'eng', 'bellingham', 'Jude Bellingham'),
      { minute: 56, type: 'var', teamId: 'nor', playerId: 'heggem', playerName: 'Heggem', detail: 'Heggem 入球因 Haaland 犯規，經 VAR 覆核後取消', varOutcome: 'goal_disallowed' },
      goal(93, 'eng', 'bellingham', 'Jude Bellingham'),
    ],
  }),
  ko({
    n: 100, stage: 'QF', kickoffUtc: '2026-07-11T20:00:00Z', venueId: 'arrowhead',
    homeTeamId: 'arg', awayTeamId: 'sui', home: 3, away: 1,
    // brief：Mac Allister（Messi 角球助攻）、Álvarez 建功；Ndoye 為瑞士破門；
    // Embolo 紅牌（瑞士十人）；入球分鐘未核實
    events: [
      { minute: null, type: 'red', teamId: 'sui', playerId: 'embolo', playerName: 'Breel Embolo', detail: '瑞士其後十人應戰' },
      { minute: null, type: 'var', teamId: 'sui', playerId: 'embolo', playerName: 'Breel Embolo', detail: 'Embolo 紅牌經 VAR 覆核', varOutcome: 'red_confirmed' },
    ],
    scorers: [
      { minute: null, teamId: 'arg', playerId: 'mac-allister', playerName: 'Alexis Mac Allister', assistPlayerId: 'messi', assistName: 'Lionel Messi', kind: 'goal' },
      { minute: null, teamId: 'arg', playerId: 'alvarez', playerName: 'Julián Álvarez', kind: 'goal' },
      { minute: null, teamId: 'sui', playerId: 'ndoye', playerName: 'Dan Ndoye', kind: 'goal' },
    ],
  }),
  // --- 四強 ---
  ko({
    n: 101, stage: 'SF', kickoffUtc: '2026-07-14T20:00:00Z', venueId: 'att',
    homeTeamId: 'fra', awayTeamId: 'esp', home: 0, away: 2,
    events: [
      goal(22, 'esp', 'oyarzabal', 'Mikel Oyarzabal', undefined, 'pen_goal'),
      goal(58, 'esp', 'porro', 'Pedro Porro'),
    ],
  }),
  ko({
    n: 102, stage: 'SF', kickoffUtc: '2026-07-15T20:00:00Z', venueId: 'mercedes',
    homeTeamId: 'eng', awayTeamId: 'arg', home: 1, away: 2,
    events: [
      goal(55, 'eng', 'gordon', 'Anthony Gordon'),
      { minute: 85, type: 'goal', teamId: 'arg', playerId: 'e-fernandez', playerName: 'Enzo Fernández', assistPlayerId: 'messi', assistName: 'Lionel Messi' },
      { minute: 92, type: 'goal', teamId: 'arg', playerId: 'l-martinez', playerName: 'Lautaro Martínez', assistPlayerId: 'messi', assistName: 'Lionel Messi' },
    ],
  }),
  // --- 季軍戰（17:00 ET = 21:00 UTC，brief 核實時間；入球者明細未齊，留空） ---
  ko({ n: 103, stage: '3P', kickoffUtc: '2026-07-18T21:00:00Z', venueId: 'hardrock', homeTeamId: 'fra', awayTeamId: 'eng', home: 4, away: 6 }),
];

/** 決賽 — 2026-07-19 15:00 ET = 19:00 UTC（brief 核實時間），PENDING */
const finalMatch: Match = {
  matchId: 'M104',
  stage: 'F',
  kickoffUtc: '2026-07-19T19:00:00Z',
  venueId: 'metlife',
  homeTeamId: 'esp',
  awayTeamId: 'arg',
  status: 'scheduled',
  score: { home: 0, away: 0 },
  source: ESPN_PENDING,
};

export const matches: Match[] = [
  ...groupMatches,
  ...knockoutMatches,
  ...lateKnockoutMatches,
  finalMatch,
];

export const matchesById: ReadonlyMap<string, Match> = new Map(matches.map((m) => [m.matchId, m]));

export function getMatchById(matchId: string): Match | undefined {
  return matchesById.get(matchId);
}
