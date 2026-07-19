/**
 * Provider → UI 適配層（純函數，無 React）。
 *
 * 首頁所有 section 經 `useHomeData()` 攞到嘅數據都喺呢度成形：
 * - football 領域類型（@/types/football）→ scaffold UI 類型（@/lib/types）
 * - 隊徽路徑 /crests/crest-{teamId}.svg（48 隊全有）
 * - 球場/球員中文名由 src/data 靜態 lookup（provider 層本身亦基於同一 snapshot）
 * - demo 模式（dataMode === 'demo'）所有 badge 一律 'DEMO'（G-12：標示「示範數據」）
 */
import type { Match, DataMode, DataStatus as ProviderDataStatus } from '@/types/football';
import type { MatchAnalysis } from '@/lib/analysis/types';
import type { TopScorer } from '@/lib/provider/types';
import type { DataStatus, MatchRef, SourceMeta, TeamRef } from '@/lib/types';
import type { NewsItem } from '@/types/football';
import { teamsById } from '@/data/teams';
import { venuesById } from '@/data/venues';
import { playersById } from '@/data/players';

const STAGE_LABEL: Record<Match['stage'], string> = {
  GROUP: '小組賽',
  R32: '三十二強',
  R16: '十六強',
  QF: '八強',
  SF: '四強',
  '3P': '季軍戰',
  F: '決賽',
};

export function stageLabel(match: Pick<Match, 'stage' | 'group'>): string {
  return match.stage === 'GROUP' ? (match.group ? `小組賽 ${match.group} 組` : '小組賽') : STAGE_LABEL[match.stage];
}

/** provider dataStatus → UI DataStatus；demo 模式一律 DEMO（G-12） */
export function toUiDataStatus(dataMode: DataMode, status: ProviderDataStatus): DataStatus {
  if (dataMode === 'demo' || status === 'STALE') return 'DEMO';
  return status;
}

export function toUiMeta(
  source: Match['source'],
  resultLastUpdated: string,
  dataMode: DataMode,
  matchId?: string,
): SourceMeta {
  return {
    source: source.source,
    sourceUrl: source.sourceUrl,
    retrievedAt: source.retrievedAt,
    lastUpdated: source.lastUpdated ?? resultLastUpdated,
    dataStatus: toUiDataStatus(dataMode, source.dataStatus),
    matchId,
  };
}

/** 隊徽：/crests/crest-{teamId}.svg（48 隊全有） */
export function crestPath(teamId: string): string {
  return `/crests/crest-${teamId}.svg`;
}

export function toTeamRef(teamId: string): TeamRef {
  const team = teamsById.get(teamId);
  if (!team) {
    return { id: teamId, name: teamId, shortName: teamId.slice(0, 3).toUpperCase(), crest: '/crest-generic.svg' };
  }
  return { id: team.id, name: team.nameZh, shortName: team.code3, crest: crestPath(team.id), ranking: team.rank };
}

export function teamGroupLabel(teamId: string): string | null {
  const team = teamsById.get(teamId);
  return team ? `${team.group} 組` : null;
}

export function venueLabel(venueId: string): string {
  const venue = venuesById.get(venueId);
  return venue ? `${venue.stadium}, ${venue.city}` : venueId;
}

export function venueCapacity(venueId: string): string | null {
  const capacity = venuesById.get(venueId)?.capacity;
  return capacity != null ? capacity.toLocaleString('en-US') : null;
}

/** 入球者一行（中文名優先）：如「美斯 ×2、艾華利斯」；無記錄 → undefined */
function scorerLines(match: Match): string[] | undefined {
  const goals = (match.scorers ?? []).filter((s) => s.kind !== 'own_goal');
  if (goals.length === 0) return undefined;
  const byPlayer = new Map<string, { name: string; count: number }>();
  for (const g of goals) {
    const key = g.playerId ?? g.playerName;
    const entry = byPlayer.get(key) ?? {
      name: (g.playerId ? playersById.get(g.playerId)?.nameZh : undefined) ?? g.playerName,
      count: 0,
    };
    entry.count += 1;
    byPlayer.set(key, entry);
  }
  return [...byPlayer.values()].map((p) => (p.count > 1 ? `${p.name} ×${p.count}` : p.name));
}

export function toMatchRef(match: Match, dataMode: DataMode, resultLastUpdated: string): MatchRef {
  return {
    id: match.matchId,
    stage: stageLabel(match),
    group: match.group,
    home: toTeamRef(match.homeTeamId),
    away: toTeamRef(match.awayTeamId),
    kickoffUtc: match.kickoffUtc,
    venue: venueLabel(match.venueId),
    status:
      match.status === 'ft' ? 'finished' : match.status === 'live' || match.status === 'ht' ? 'live' : 'scheduled',
    homeScore: match.status === 'scheduled' || match.status === 'postponed' ? undefined : match.score.home,
    awayScore: match.status === 'scheduled' || match.status === 'postponed' ? undefined : match.score.away,
    scorers: scorerLines(match),
    meta: toUiMeta(match.source, resultLastUpdated, dataMode, match.matchId),
  };
}

// ---------------------------------------------------------------------------
// Section 1–4：matches slice
// ---------------------------------------------------------------------------

export interface HomeMatchesData {
  /** 決賽（hero 倒數 target）；搵唔到 → null（section 自行處理） */
  final: MatchRef | null;
  /** 決賽球場容量（formatted,如 82,500） */
  finalVenueCapacity: string | null;
  /** provider lastUpdated 當日（UTC 日期）嘅場次 */
  todayMatches: MatchRef[];
  /** 今日比賽 header 日期 caption 用嘅 ISO */
  todayAnchorIso: string;
  /** 最早一場 scheduled 場次（可能即係決賽本身，由 Home 判斷顯示與否） */
  nextScheduled: MatchRef | null;
  /** 最近 6 場 FT（kickoff desc） */
  latestResults: MatchRef[];
  lastUpdated: string;
  dataMode: DataMode;
  sourceName: string;
  /** result 級來源（section caption / badge tooltip 用） */
  sourceMeta: SourceMeta;
}

export function buildHomeMatches(
  matches: Match[],
  info: { dataMode: DataMode; lastUpdated: string; source: Match['source'] },
): HomeMatchesData {
  const { dataMode, lastUpdated } = info;
  const ordered = [...matches].sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc));
  const toRef = (m: Match) => toMatchRef(m, dataMode, lastUpdated);

  const finalMatch = ordered.find((m) => m.stage === 'F') ?? null;
  const todayAnchor = lastUpdated.slice(0, 10); // 「今日」＝ provider 數據日期（UTC）
  const today = ordered.filter((m) => m.kickoffUtc.slice(0, 10) === todayAnchor);
  const nextScheduled = ordered.find((m) => m.status === 'scheduled') ?? null;
  const latestResults = ordered
    .filter((m) => m.status === 'ft')
    .sort((a, b) => b.kickoffUtc.localeCompare(a.kickoffUtc))
    .slice(0, 6);

  return {
    final: finalMatch ? toRef(finalMatch) : null,
    finalVenueCapacity: finalMatch ? venueCapacity(finalMatch.venueId) : null,
    todayMatches: today.map(toRef),
    todayAnchorIso: today[0]?.kickoffUtc ?? lastUpdated,
    nextScheduled: nextScheduled ? toRef(nextScheduled) : null,
    latestResults: latestResults.map(toRef),
    lastUpdated,
    dataMode,
    sourceName: info.source.source,
    sourceMeta: toUiMeta(info.source, lastUpdated, dataMode),
  };
}

// ---------------------------------------------------------------------------
// Section 5：熱門球隊
// ---------------------------------------------------------------------------

export type FormResult = 'W' | 'D' | 'L';

export interface TrendingTeamData {
  team: TeamRef;
  /** 無核實 FIFA 排名時顯示組別（真實數據，唔虛構排名） */
  groupLabel: string | null;
  /** 近 5 場（oldest → newest），十二碼勝方計 W */
  form: FormResult[];
  keyStat: { player: string; value: number; unit: string };
}

/** 熱門球隊 slice：tiles + section 級來源 badge */
export interface TrendingData {
  teams: TrendingTeamData[];
  status: DataStatus;
  meta: SourceMeta;
}

function teamForm(matches: Match[], teamId: string): FormResult[] {
  return matches
    .filter((m) => m.status === 'ft' && (m.homeTeamId === teamId || m.awayTeamId === teamId))
    .sort((a, b) => b.kickoffUtc.localeCompare(a.kickoffUtc))
    .slice(0, 5)
    .reverse()
    .map((m) => {
      const isHome = m.homeTeamId === teamId;
      const gf = isHome ? m.score.home : m.score.away;
      const ga = isHome ? m.score.away : m.score.home;
      if (gf > ga) return 'W';
      if (gf < ga) return 'L';
      if (m.score.penalties) {
        const pf = isHome ? m.score.penalties.home : m.score.penalties.away;
        const pa = isHome ? m.score.penalties.away : m.score.penalties.home;
        return pf > pa ? 'W' : 'L';
      }
      return 'D';
    });
}

/** 該隊今屆總入球（FT 場次，唔計互射十二碼） */
function teamTournamentGoals(matches: Match[], teamId: string): number {
  return matches
    .filter((m) => m.status === 'ft')
    .reduce((sum, m) => sum + (m.homeTeamId === teamId ? m.score.home : m.awayTeamId === teamId ? m.score.away : 0), 0);
}

/**
 * 熱門球隊 = 四強隊伍（決賽兩隊置前，然後四強止步兩隊）；
 * 如四強名單唔夠 4 隊（live 模式早期），以射手榜球員所屬隊伍補上。
 * 用戶收藏置頂喺 component 層做（favorites 係 client state）。
 */
export function buildTrending(matches: Match[], scorers: TopScorer[], limit = 4): TrendingTeamData[] {
  const final = matches.find((m) => m.stage === 'F');
  const semiMatches = matches
    .filter((m) => m.stage === 'SF')
    .sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc));

  const ids: string[] = [];
  const push = (id: string | undefined) => {
    if (id && !ids.includes(id)) ids.push(id);
  };
  push(final?.homeTeamId);
  push(final?.awayTeamId);
  for (const sf of semiMatches) {
    push(sf.homeTeamId);
    push(sf.awayTeamId);
  }
  // live 模式補底：射手榜球隊
  for (const s of scorers) {
    if (ids.length >= limit) break;
    push(s.player.teamId);
  }

  return ids.slice(0, limit).map((teamId) => {
    const top = scorers.find((s) => s.player.teamId === teamId && s.goals > 0);
    return {
      team: toTeamRef(teamId),
      groupLabel: teamGroupLabel(teamId),
      form: teamForm(matches, teamId),
      keyStat: top
        ? { player: top.player.nameZh, value: top.goals, unit: '球' }
        : { player: '全隊入球', value: teamTournamentGoals(matches, teamId), unit: '球' },
    };
  });
}

// ---------------------------------------------------------------------------
// Section 6：最新賽後分析
// ---------------------------------------------------------------------------

export interface AnalysisCardData {
  /** slug = matchId（/analysis/:slug） */
  slug: string;
  title: string;
  /** quickSummary 摘錄（〔S1〕標記改由 SourceTag chip 顯示） */
  excerpt: string;
  matchCaption: string;
  byline: string;
  publishedAt: string;
  readingMinutes: number;
  sourceCount: number;
  /** 首兩個來源（SourceTag popover） */
  sources: { name: string; url?: string; retrievedAt?: string }[];
  status: DataStatus;
  meta: SourceMeta;
}

function stripCitations(text: string): string {
  return text.replace(/〔S\d+〕/g, '').replace(/\s{2,}/g, ' ').trim();
}

/** 取最新 4 篇可發布分析（featured 1 + compact 3）；按對應賽事 kickoff 倒序 */
export function buildAnalysisCards(analyses: MatchAnalysis[], matches: Match[], dataMode: DataMode): AnalysisCardData[] {
  const byId = new Map(matches.map((m) => [m.matchId, m]));
  return analyses
    .filter((a) => a.analysisStatus !== 'blocked' && a.quickSummary.status === 'ok' && a.quickSummary.content)
    .map((a) => ({ analysis: a, match: byId.get(a.matchId) }))
    .filter((x): x is { analysis: MatchAnalysis; match: Match } => Boolean(x.match))
    .sort((x, y) => y.match.kickoffUtc.localeCompare(x.match.kickoffUtc))
    .slice(0, 4)
    .map(({ analysis, match }) => {
      const home = toTeamRef(match.homeTeamId);
      const away = toTeamRef(match.awayTeamId);
      const scoreStr = `${match.score.home}–${match.score.away}`;
      const pens = match.score.penalties;
      const chars =
        (analysis.quickSummary.content?.text.length ?? 0) +
        (analysis.fullReport.content?.paragraphs.reduce((sum, p) => sum + p.text.length, 0) ?? 0);
      return {
        slug: match.matchId,
        title: `${stageLabel(match)}：${home.name} ${scoreStr} ${away.name}${pens ? `（互射十二碼 ${pens.home}–${pens.away}）` : ''}`,
        excerpt: stripCitations(analysis.quickSummary.content?.text ?? ''),
        matchCaption: `${stageLabel(match)} · ${home.shortName} ${scoreStr} ${away.shortName}`,
        byline: '分析團隊',
        publishedAt: analysis.generatedAt,
        readingMinutes: Math.max(2, Math.round(chars / 450)),
        sourceCount: analysis.sources.length,
        sources: analysis.sources.slice(0, 2).map((s) => ({
          name: `${match.source.source} · ${s.entity}.${s.fieldPath}`,
          url: match.source.sourceUrl,
          retrievedAt: s.retrievedAt,
        })),
        status: toUiDataStatus(dataMode, match.source.dataStatus),
        meta: toUiMeta(match.source, analysis.generatedAt, dataMode, match.matchId),
      };
    });
}

// ---------------------------------------------------------------------------
// Section 7：賽事重要消息
// ---------------------------------------------------------------------------

export interface NewsCardData {
  id: string;
  category: '傷停' | '賽會' | '場地' | '賽事';
  headline: string;
  timestamp: string;
  summary: string;
  relatedMatchId?: string;
  thumb?: string;
  status: DataStatus;
  meta: SourceMeta;
}

function classifyNews(item: NewsItem): NewsCardData['category'] {
  const text = `${item.title}${item.summary}`;
  if (/傷|缺陣|停賽/.test(text)) return '傷停';
  if (/球場|草皮|場地|Stadium/i.test(text)) return '場地';
  if (/FIFA|賽會|裁判|公佈/.test(text)) return '賽會';
  return '賽事';
}

export function buildNewsCards(news: NewsItem[], dataMode: DataMode, finalMatchId: string | null, limit = 7): NewsCardData[] {
  return news.slice(0, limit).map((item) => {
    const text = `${item.title}${item.summary}`;
    return {
      id: item.id,
      category: classifyNews(item),
      headline: item.title,
      timestamp: item.publishedAt,
      summary: item.summary,
      relatedMatchId: finalMatchId && /決賽/.test(text) ? finalMatchId : undefined,
      thumb: /MetLife/i.test(text) ? '/stadium-metlife.jpg' : undefined,
      status: toUiDataStatus(dataMode, item.source.dataStatus),
      meta: toUiMeta(item.source, item.publishedAt, dataMode),
    };
  });
}
