import type { MatchRef, SourceMeta, TeamRef } from '@/lib/types';
import type { SourceRef } from '@/components/SourceTag';

/**
 * Local page mock — structure follows design.md §7 SourceMeta concept.
 * The real provider adapter (built by the data-layer agent) will bind to
 * these same shapes; until then the home page renders from this module.
 */

const NOW_RETRIEVED = '2026-07-19T06:29:00Z'; // 14:29 HKT

function meta(dataStatus: SourceMeta['dataStatus'], matchId?: string): SourceMeta {
  return {
    source: 'Demo Provider',
    sourceUrl: 'https://provider.example.com/wc26',
    retrievedAt: NOW_RETRIEVED,
    lastUpdated: NOW_RETRIEVED,
    dataStatus,
    matchId,
  };
}

export const LAST_UPDATED = NOW_RETRIEVED;
export const SOURCE_NAME = 'Demo Provider';

export const TEAMS: Record<string, TeamRef> = {
  esp: { id: 'esp', name: '西班牙', shortName: 'ESP', crest: '/crest-esp.svg', ranking: 1 },
  arg: { id: 'arg', name: '阿根廷', shortName: 'ARG', crest: '/crest-arg.svg', ranking: 2 },
  eng: { id: 'eng', name: '英格蘭', shortName: 'ENG', crest: '/crest-eng.svg', ranking: 4 },
  fra: { id: 'fra', name: '法國', shortName: 'FRA', crest: '/crest-fra.svg', ranking: 3 },
  por: { id: 'por', name: '葡萄牙', shortName: 'POR', crest: '/crest-generic.svg', ranking: 6 },
  bra: { id: 'bra', name: '巴西', shortName: 'BRA', crest: '/crest-generic.svg', ranking: 5 },
};

/** 決賽:西班牙 vs 阿根廷,2026-07-19 15:00 ET = 19:00 UTC,MetLife Stadium */
export const FINAL_MATCH: MatchRef = {
  id: 'final',
  stage: '決賽',
  home: TEAMS.esp,
  away: TEAMS.arg,
  kickoffUtc: '2026-07-19T19:00:00Z',
  venue: 'MetLife Stadium, New York New Jersey',
  status: 'scheduled',
  meta: meta('PENDING', 'final'),
};

export const FINAL_VENUE_CAPACITY = '82,500';

export const LATEST_RESULTS: MatchRef[] = [
  {
    id: 'm103-third-place',
    stage: '季軍戰',
    home: TEAMS.fra,
    away: TEAMS.eng,
    kickoffUtc: '2026-07-18T19:00:00Z',
    venue: 'Hard Rock Stadium, Miami',
    status: 'finished',
    homeScore: 4,
    awayScore: 6,
    scorers: ['麥巴比 ×2', '比寧咸 ×2', '簡尼 ×2'],
    meta: meta('VERIFIED', 'm103-third-place'),
  },
  {
    id: 'm101-semi-1',
    stage: '四強',
    home: TEAMS.esp,
    away: TEAMS.fra,
    kickoffUtc: '2026-07-14T19:00:00Z',
    venue: 'SoFi Stadium, Los Angeles',
    status: 'finished',
    homeScore: 2,
    awayScore: 1,
    scorers: ['耶馬', '奧莫', '麥巴比'],
    meta: meta('VERIFIED', 'm101-semi-1'),
  },
  {
    id: 'm102-semi-2',
    stage: '四強',
    home: TEAMS.arg,
    away: TEAMS.eng,
    kickoffUtc: '2026-07-15T19:00:00Z',
    venue: 'AT&T Stadium, Dallas',
    status: 'finished',
    homeScore: 2,
    awayScore: 0,
    scorers: ['艾瓦雷斯', '麥亞里士打'],
    meta: meta('VERIFIED', 'm102-semi-2'),
  },
  {
    id: 'm097-qf-1',
    stage: '半準決賽',
    home: TEAMS.eng,
    away: TEAMS.por,
    kickoffUtc: '2026-07-11T19:00:00Z',
    venue: 'MetLife Stadium, New York New Jersey',
    status: 'finished',
    homeScore: 2,
    awayScore: 0,
    scorers: ['沙卡', '比寧咸'],
    meta: meta('FINAL', 'm097-qf-1'),
  },
  {
    id: 'm098-qf-2',
    stage: '半準決賽',
    home: TEAMS.fra,
    away: TEAMS.bra,
    kickoffUtc: '2026-07-11T23:00:00Z',
    venue: 'Estadio Azteca, Mexico City',
    status: 'finished',
    homeScore: 1,
    awayScore: 0,
    scorers: ['麥巴比'],
    meta: meta('FINAL', 'm098-qf-2'),
  },
  {
    id: 'm096-r16-8',
    stage: '十六強',
    home: TEAMS.arg,
    away: TEAMS.por,
    kickoffUtc: '2026-07-07T19:00:00Z',
    venue: 'Lumen Field, Seattle',
    status: 'finished',
    homeScore: 3,
    awayScore: 1,
    scorers: ['美斯 ×2', '艾瓦雷斯'],
    meta: meta('FINAL', 'm096-r16-8'),
  },
];

export interface TrendingTeam {
  team: TeamRef;
  form: ('W' | 'D' | 'L')[];
  keyStat: { player: string; value: number; unit: string };
}

export const TRENDING_TEAMS: TrendingTeam[] = [
  { team: TEAMS.esp, form: ['W', 'W', 'W', 'W', 'W'], keyStat: { player: '耶馬', value: 5, unit: '球' } },
  { team: TEAMS.arg, form: ['W', 'W', 'W', 'W', 'W'], keyStat: { player: '艾瓦雷斯', value: 6, unit: '球' } },
  { team: TEAMS.eng, form: ['D', 'W', 'W', 'L', 'W'], keyStat: { player: '比寧咸', value: 5, unit: '球' } },
  { team: TEAMS.fra, form: ['W', 'W', 'W', 'L', 'L'], keyStat: { player: '麥巴比', value: 8, unit: '球' } },
];

export const ANALYSIS_SOURCES: SourceRef[] = [
  { name: 'FIFA Technical Report', url: 'https://www.fifa.com/technical', retrievedAt: NOW_RETRIEVED },
  { name: 'Opta Stats', url: 'https://www.optasports.com', retrievedAt: NOW_RETRIEVED },
  { name: 'FBref Match Data', url: 'https://fbref.com', retrievedAt: NOW_RETRIEVED },
  { name: 'WhoScored Ratings', url: 'https://www.whoscored.com', retrievedAt: NOW_RETRIEVED },
  { name: 'StatsBomb Open Data', url: 'https://statsbomb.com', retrievedAt: NOW_RETRIEVED },
  { name: 'The Athletic 賽後報導', url: 'https://theathletic.com', retrievedAt: NOW_RETRIEVED },
  { name: '賽會官方公告', url: 'https://www.fifa.com/news', retrievedAt: NOW_RETRIEVED },
  { name: '現場記者報告', url: 'https://provider.example.com/pitchside', retrievedAt: NOW_RETRIEVED },
];

export interface AnalysisArticle {
  slug: string;
  title: string;
  excerpt: string;
  byline: string;
  publishedAt: string;
  readingMinutes: number;
  sourceCount: number;
  matchCaption: string;
}

export const FEATURED_ANALYSIS: AnalysisArticle = {
  slug: 'england-france-third-place-goal-fest',
  title: '英格蘭六球激戰淘汰法國:季軍戰的進攻盛宴',
  excerpt:
    '一場季軍戰踢出十個入球。英格蘭以 6–4 擊敗法國,比寧咸與簡尼各建兩功,但真正決定勝負的是英格蘭下半場前場逼搶的強度提升:最後三十分鐘 xG 達 2.1,遠超法國的 0.6。本文從陣式輪換、二點球爭奪與換人時機三方面拆解這場入球盛宴,並檢視兩軍防線在無壓力比賽中的結構性漏洞。',
  byline: '分析團隊',
  publishedAt: '2026-07-19T02:10:00Z',
  readingMinutes: 8,
  sourceCount: 8,
  matchCaption: '季軍戰 · 法國 4–6 英格蘭',
};

export const COMPACT_ANALYSES: AnalysisArticle[] = [
  {
    slug: 'spain-press-breaks-france',
    title: '西班牙的高位逼搶如何瓦解法國左路',
    excerpt: '四強戰西班牙以 2–1 力克法國,耶馬右路內切成為勝負手。',
    byline: '分析團隊',
    publishedAt: '2026-07-16T03:40:00Z',
    readingMinutes: 6,
    sourceCount: 6,
    matchCaption: '四強 · 西班牙 2–1 法國',
  },
  {
    slug: 'argentina-midfield-control',
    title: '阿根廷中場三角的控球密碼',
    excerpt: '面對英格蘭的體能壓迫,阿根廷以三角站位鎖定中路,兩球淨勝。',
    byline: '分析團隊',
    publishedAt: '2026-07-16T08:15:00Z',
    readingMinutes: 7,
    sourceCount: 5,
    matchCaption: '四強 · 阿根廷 2–0 英格蘭',
  },
  {
    slug: 'metlife-final-preview-five-battles',
    title: '決賽前瞻:西班牙與阿根廷的五個關鍵對位',
    excerpt: '從耶馬對位守將到中場節奏之爭,決賽的五個決定性環節。',
    byline: '分析團隊',
    publishedAt: '2026-07-18T11:00:00Z',
    readingMinutes: 10,
    sourceCount: 8,
    matchCaption: '決賽前瞻 · 西班牙 vs 阿根廷',
  },
];

export interface NewsItem {
  id: string;
  category: '傷停' | '賽會' | '場地';
  headline: string;
  timestamp: string;
  summary: string;
  relatedMatchId?: string;
  thumb?: string;
}

export const KEY_UPDATES: NewsItem[] = [
  {
    id: 'n1',
    category: '場地',
    headline: 'MetLife 球場草皮狀況報告:決賽前最後檢測通過',
    timestamp: '2026-07-19T05:20:00Z',
    summary:
      '賽會草地管理團隊確認 MetLife Stadium 混合草皮通過決賽前最後檢測,硬度與滾球速度均達標。場地將於開賽前三小時進行最後一次澆水。',
    relatedMatchId: 'final',
    thumb: '/stadium-metlife.jpg',
  },
  {
    id: 'n2',
    category: '賽會',
    headline: '決賽裁判團隊公佈:歐洲籍球證執法',
    timestamp: '2026-07-19T04:00:00Z',
    summary:
      'FIFA 公佈決賽裁判團隊名單,由歐洲籍球證擔任主裁判,VAR 團隊同樣來自歐洲足協。第四球證及後備裁判人選亦已確認。',
    relatedMatchId: 'final',
  },
  {
    id: 'n3',
    category: '傷停',
    headline: '阿根廷主力中場訓練缺陣,正選成疑',
    timestamp: '2026-07-18T22:30:00Z',
    summary:
      '阿根廷一名主力中場因肌肉不適缺席賽前最後一課操練,教練團表示將於開賽前作最後評估。如缺陣,預料由後備小將頂上。',
  },
  {
    id: 'n4',
    category: '賽會',
    headline: 'FIFA 確認決賽開球程序及中場表演安排',
    timestamp: '2026-07-18T15:00:00Z',
    summary:
      '賽會確認決賽將按原定時間開球,賽前設有簡短儀式,中場休息延長至 25 分鐘以配合表演環節。球迷入場安檢將提前三小時開始。',
    relatedMatchId: 'final',
  },
];
