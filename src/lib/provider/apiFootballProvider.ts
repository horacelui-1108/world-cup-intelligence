/**
 * API-Football v3 adapter（骨架）— https://www.api-football.com/documentation-v3
 *
 * - 讀 import.meta.env.VITE_FOOTBALL_API_KEY；無 key → constructor 拋 MissingApiKeyError
 *   （由 provider/index.ts catch 並 fallback demoProvider）。
 * - 實現 league=1&season=2026 嘅 fixtures / standings 查詢 + response 映射。
 * - TTL cache（localStorage）：賽後數據 24h、有 live 場次 60s。
 * - Exponential backoff retry（最多 3 次）；尊重 x-ratelimit-remaining header。
 * - 任何失敗 fallback 去 demoProvider 並將 source.dataStatus 標 STALE。
 * - 注意：API-Football 免費層無 xG（hasXG: false）。
 */
import type {
  Match,
  NewsItem,
  Player,
  SourceMeta,
  Stage,
  Team,
  Tournament,
} from '../../types/football';
import { tournament as demoTournament } from '../../data/matches';
import { teams as demoTeams } from '../../data/teams';
import { venues as demoVenues } from '../../data/venues';
import type { GroupStanding, StandingRow } from '../standings';
import { generateAnalysis } from '../analysis/engine';
import { buildAnalysisContext } from '../analysis/context';
import type { MatchAnalysis } from '../analysis/types';
import { demoProvider } from './demoProvider';
import {
  MissingApiKeyError,
  RateLimitError,
  type Bracket,
  type CapabilityFlags,
  type FootballDataProvider,
  type MatchFilter,
  type ProviderResult,
  type TopScorer,
} from './types';

const API_BASE = 'https://v3.football.api-sports.io';
const LEAGUE_ID = 1; // World Cup
const SEASON = 2026;
const TTL_FINISHED_MS = 24 * 60 * 60 * 1000; // 賽後數據 24h
const TTL_LIVE_MS = 60 * 1000; // live 60s
const MAX_RETRIES = 3;
const CACHE_PREFIX = 'afp:v1:';

const API_SOURCE = (status: SourceMeta['dataStatus']): SourceMeta => ({
  source: 'API-Football',
  sourceUrl: 'https://www.api-football.com/documentation-v3',
  retrievedAt: new Date().toISOString(),
  dataStatus: status,
  licenseNote: 'API-Football free tier (100 req/day)',
});

// --- storage shim（非瀏覽器環境 fallback 記憶體 cache） ---
const memoryCache = new Map<string, string>();
const storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> =
  typeof localStorage !== 'undefined'
    ? localStorage
    : {
        getItem: (k) => memoryCache.get(k) ?? null,
        setItem: (k, v) => void memoryCache.set(k, v),
        removeItem: (k) => void memoryCache.delete(k),
      };

interface CacheEntry<T> {
  t: number;
  ttl: number;
  data: T;
}

function cacheGet<T>(key: string): { fresh: T | null; stale: T | null } {
  try {
    const raw = storage.getItem(CACHE_PREFIX + key);
    if (!raw) return { fresh: null, stale: null };
    const entry = JSON.parse(raw) as CacheEntry<T>;
    const expired = Date.now() - entry.t > entry.ttl;
    return { fresh: expired ? null : entry.data, stale: entry.data };
  } catch {
    return { fresh: null, stale: null };
  }
}

function cacheSet<T>(key: string, data: T, ttl: number): void {
  try {
    storage.setItem(CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), ttl, data } satisfies CacheEntry<T>));
  } catch {
    // 儲存失敗（quota 等）唔影響主流程
  }
}

// --- API-Football response 型別（局部） ---
interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string };
    venue: { name: string | null; city: string | null } | null;
  };
  league: { round: string };
  teams: { home: { name: string }; away: { name: string } };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

interface ApiStandingRow {
  rank: number;
  team: { name: string };
  points: number;
  goalsDiff: number;
  group: string;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
}

interface ApiStandingsResponse {
  response: { league: { standings: ApiStandingRow[][] } }[];
}

interface ApiFixturesResponse {
  response: ApiFixture[];
}

// 英文名 → 內部 team id（映射唔到就唔好出，fallback demo）
const TEAM_ID_BY_EN_NAME = new Map(demoTeams.map((t) => [t.nameEn.toLowerCase(), t.id]));
const VENUE_ID_BY_NAME = new Map(demoVenues.map((v) => [v.stadium.toLowerCase(), v.id]));

function mapStatus(short: string): Match['status'] {
  switch (short) {
    case 'FT':
    case 'AET':
    case 'PEN':
      return 'ft';
    case 'NS':
      return 'scheduled';
    case 'PST':
    case 'ABD':
      return 'postponed';
    case 'HT':
      return 'ht';
    default:
      return 'live';
  }
}

function mapStage(round: string): { stage: Stage; group?: string } {
  const r = round.toLowerCase();
  if (r.includes('group')) {
    const gm = round.match(/group\s+([a-l])/i);
    return { stage: 'GROUP', group: gm?.[1]?.toUpperCase() };
  }
  if (r.includes('32')) return { stage: 'R32' };
  if (r.includes('16') || r.includes('round of 16')) return { stage: 'R16' };
  if (r.includes('quarter')) return { stage: 'QF' };
  if (r.includes('semi')) return { stage: 'SF' };
  if (r.includes('3rd')) return { stage: '3P' };
  if (r.includes('final')) return { stage: 'F' };
  return { stage: 'GROUP' };
}

export class ApiFootballProvider implements FootballDataProvider {
  readonly capabilities: CapabilityFlags = {
    hasXG: false, // API-Football 無 xG
    hasRatings: false,
    hasFormations: true,
    live: true,
  };
  readonly mode = 'live' as const;

  private readonly apiKey: string;

  constructor(apiKey?: string) {
    const key = apiKey ?? (import.meta.env?.VITE_FOOTBALL_API_KEY as string | undefined);
    if (!key) throw new MissingApiKeyError();
    this.apiKey = key;
  }

  /** 帶 retry + backoff + rate limit 尊重嘅請求；失敗回傳 stale cache（如有）。ttl 可按回應內容決定 */
  private async request<T>(path: string, cacheKey: string, ttl: number | ((json: T) => number)): Promise<T> {
    const { fresh, stale } = cacheGet<T>(cacheKey);
    if (fresh !== null) return fresh;

    let lastError: unknown = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
      }
      try {
        const res = await fetch(`${API_BASE}${path}`, {
          headers: { 'x-apisports-key': this.apiKey },
        });
        const remaining = res.headers.get('x-ratelimit-remaining');
        if (remaining !== null && Number(remaining) <= 0) {
          throw new RateLimitError();
        }
        if (!res.ok) throw new Error(`API-Football HTTP ${res.status}`);
        const json = (await res.json()) as T;
        cacheSet(cacheKey, json, typeof ttl === 'function' ? ttl(json) : ttl);
        return json;
      } catch (err) {
        lastError = err;
        if (err instanceof RateLimitError) break; // rate limit 唔 retry
      }
    }
    if (stale !== null) return stale;
    throw lastError instanceof Error ? lastError : new Error('API-Football 請求失敗');
  }

  /** 任何失敗 fallback 去 demoProvider 並標 STALE */
  private async withFallback<T>(
    live: () => Promise<ProviderResult<T>>,
    demo: (p: FootballDataProvider) => Promise<ProviderResult<T>>,
  ): Promise<ProviderResult<T>> {
    try {
      return await live();
    } catch {
      const res = await demo(demoProvider);
      return {
        ...res,
        source: { ...res.source, dataStatus: 'STALE', lastUpdated: new Date().toISOString() },
      };
    }
  }

  private mapFixture(f: ApiFixture): Match | null {
    const homeId = TEAM_ID_BY_EN_NAME.get(f.teams.home.name.toLowerCase());
    const awayId = TEAM_ID_BY_EN_NAME.get(f.teams.away.name.toLowerCase());
    if (!homeId || !awayId) return null;
    const { stage, group } = mapStage(f.league.round);
    const venueId = f.fixture.venue?.name
      ? (VENUE_ID_BY_NAME.get(f.fixture.venue.name.toLowerCase()) ?? 'metlife')
      : 'metlife';
    return {
      matchId: `api-${f.fixture.id}`,
      stage,
      group: group as Match['group'],
      kickoffUtc: new Date(f.fixture.date).toISOString(),
      venueId,
      homeTeamId: homeId,
      awayTeamId: awayId,
      status: mapStatus(f.fixture.status.short),
      score: {
        home: f.goals.home ?? 0,
        away: f.goals.away ?? 0,
        halfTime:
          f.score.halftime.home !== null && f.score.halftime.away !== null
            ? { home: f.score.halftime.home, away: f.score.halftime.away }
            : undefined,
        extraTime:
          f.score.extratime.home !== null && f.score.extratime.away !== null
            ? { home: f.score.extratime.home, away: f.score.extratime.away }
            : undefined,
        penalties:
          f.score.penalty.home !== null && f.score.penalty.away !== null
            ? { home: f.score.penalty.home, away: f.score.penalty.away }
            : undefined,
      },
      source: API_SOURCE(mapStatus(f.fixture.status.short) === 'ft' ? 'FINAL' : 'LIVE'),
    };
  }

  async getTournament(): Promise<ProviderResult<Tournament>> {
    return this.withFallback(
      async () => ({ data: demoTournament, source: API_SOURCE('LIVE'), dataMode: 'live', lastUpdated: new Date().toISOString() }),
      (p) => p.getTournament(),
    );
  }

  async getMatches(filter?: MatchFilter): Promise<ProviderResult<Match[]>> {
    return this.withFallback(
      async () => {
        const json = await this.request<ApiFixturesResponse>(
          `/fixtures?league=${LEAGUE_ID}&season=${SEASON}`,
          'fixtures-all',
          // 有 live 場次 → 60s TTL；全部賽後數據 → 24h TTL
          (j) =>
            j.response.some((f) => ['1H', '2H', 'HT', 'LIVE', 'ET', 'INT'].includes(f.fixture.status.short))
              ? TTL_LIVE_MS
              : TTL_FINISHED_MS,
        );
        const mapped = json.response
          .map((f) => this.mapFixture(f))
          .filter((m): m is Match => m !== null)
          .filter((m) => {
            if (!filter) return true;
            if (filter.stage && m.stage !== filter.stage) return false;
            if (filter.group && m.group !== filter.group) return false;
            if (filter.status && m.status !== filter.status) return false;
            if (filter.teamId && m.homeTeamId !== filter.teamId && m.awayTeamId !== filter.teamId) return false;
            if (filter.fromUtc && m.kickoffUtc < filter.fromUtc) return false;
            if (filter.toUtc && m.kickoffUtc > filter.toUtc) return false;
            return true;
          });
        return {
          data: mapped,
          source: API_SOURCE('LIVE'),
          dataMode: 'live',
          lastUpdated: new Date().toISOString(),
        };
      },
      (p) => p.getMatches(filter),
    );
  }

  async getMatch(id: string): Promise<ProviderResult<Match>> {
    return this.withFallback(
      async () => {
        const all = await this.getMatches();
        const match = all.data.find((m) => m.matchId === id);
        if (!match) throw new Error(`搵唔到賽事：${id}`);
        return { ...all, data: match, source: match.source };
      },
      (p) => p.getMatch(id),
    );
  }

  async getStandings(): Promise<ProviderResult<GroupStanding[]>> {
    return this.withFallback(
      async () => {
        const json = await this.request<ApiStandingsResponse>(
          `/standings?league=${LEAGUE_ID}&season=${SEASON}`,
          'standings',
          TTL_FINISHED_MS,
        );
        const groups = json.response[0]?.league.standings ?? [];
        const standings: GroupStanding[] = groups.map((rows) => ({
          group: (rows[0]?.group?.replace(/^Group\s+/i, '') ?? 'A') as GroupStanding['group'],
          rows: rows.map(
            (r): StandingRow => ({
              teamId: TEAM_ID_BY_EN_NAME.get(r.team.name.toLowerCase()) ?? r.team.name.toLowerCase(),
              group: (r.group?.replace(/^Group\s+/i, '') ?? 'A') as StandingRow['group'],
              position: r.rank,
              played: r.all.played,
              won: r.all.win,
              drawn: r.all.draw,
              lost: r.all.lose,
              goalsFor: r.all.goals.for,
              goalsAgainst: r.all.goals.against,
              goalDifference: r.goalsDiff,
              points: r.points,
              qualification: r.rank <= 2 ? 'auto' : undefined,
            }),
          ),
        }));
        return {
          data: standings,
          source: API_SOURCE('LIVE'),
          dataMode: 'live',
          lastUpdated: new Date().toISOString(),
        };
      },
      (p) => p.getStandings(),
    );
  }

  async getBracket(): Promise<ProviderResult<Bracket>> {
    return this.withFallback(
      async () => demoProvider.getBracket(),
      (p) => p.getBracket(),
    );
  }

  async getTeam(id: string): Promise<ProviderResult<Team>> {
    return this.withFallback(
      async () => demoProvider.getTeam(id),
      (p) => p.getTeam(id),
    );
  }

  async getPlayer(id: string): Promise<ProviderResult<Player>> {
    return this.withFallback(
      async () => demoProvider.getPlayer(id),
      (p) => p.getPlayer(id),
    );
  }

  async getTopScorers(): Promise<ProviderResult<TopScorer[]>> {
    return this.withFallback(
      async () => demoProvider.getTopScorers(),
      (p) => p.getTopScorers(),
    );
  }

  async getNews(): Promise<ProviderResult<NewsItem[]>> {
    return this.withFallback(
      async () => demoProvider.getNews(),
      (p) => p.getNews(),
    );
  }

  async getAnalysis(matchId: string): Promise<ProviderResult<MatchAnalysis>> {
    const result = await this.getMatch(matchId);
    const analysis = generateAnalysis(result.data, buildAnalysisContext(result.dataMode));
    return { ...result, data: analysis };
  }

  async listAnalyses(): Promise<ProviderResult<MatchAnalysis[]>> {
    const result = await this.getMatches({ status: 'ft' });
    const ctx = buildAnalysisContext(result.dataMode);
    return { ...result, data: result.data.map((m) => generateAnalysis(m, ctx)) };
  }
}

export { MissingApiKeyError, RateLimitError };
