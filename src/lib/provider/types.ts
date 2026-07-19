/**
 * Data Provider Adapter — 所有組件經 provider 取數；
 * 每個查詢結果帶 SourceMeta + dataMode + lastUpdated（design §7）。
 */
import type {
  DataMode,
  GroupLetter,
  Match,
  MatchStatus,
  NewsItem,
  Player,
  SourceMeta,
  Stage,
  Team,
  Tournament,
} from '../../types/football';
import type { GroupStanding } from '../standings';
import type { MatchAnalysis } from '../analysis/types';

/** Provider 查詢結果封套：數據 + 來源 + 模式 + 更新時間 */
export interface ProviderResult<T> {
  data: T;
  source: SourceMeta;
  dataMode: DataMode;
  lastUpdated: string;
}

export interface MatchFilter {
  stage?: Stage;
  group?: GroupLetter;
  teamId?: string;
  status?: MatchStatus;
  fromUtc?: string;
  toUtc?: string;
}

export interface BracketRound {
  stage: Stage;
  label: string;
  matches: Match[];
}

export interface Bracket {
  rounds: BracketRound[];
  final?: Match;
  thirdPlace?: Match;
}

export interface TopScorer {
  player: Player;
  goals: number;
  assists?: number;
}

/** 能力旗標：UI 據此決定顯示邊啲欄位（如 hasXG=false → xG 行完全唔顯示，G-03） */
export interface CapabilityFlags {
  hasXG: boolean;
  hasRatings: boolean;
  hasFormations: boolean;
  live: boolean;
}

export interface FootballDataProvider {
  readonly capabilities: CapabilityFlags;
  readonly mode: DataMode;
  getTournament(): Promise<ProviderResult<Tournament>>;
  getMatches(filter?: MatchFilter): Promise<ProviderResult<Match[]>>;
  getMatch(id: string): Promise<ProviderResult<Match>>;
  getStandings(): Promise<ProviderResult<GroupStanding[]>>;
  getBracket(): Promise<ProviderResult<Bracket>>;
  getTeam(id: string): Promise<ProviderResult<Team>>;
  getPlayer(id: string): Promise<ProviderResult<Player>>;
  getTopScorers(): Promise<ProviderResult<TopScorer[]>>;
  getNews(): Promise<ProviderResult<NewsItem[]>>;
  getAnalysis(matchId: string): Promise<ProviderResult<MatchAnalysis>>;
  listAnalyses(): Promise<ProviderResult<MatchAnalysis[]>>;
}

/** API key 缺失時拋出（provider/index.ts catch 後 fallback demo） */
export class MissingApiKeyError extends Error {
  constructor(message = 'VITE_FOOTBALL_API_KEY 未設定') {
    super(message);
    this.name = 'MissingApiKeyError';
  }
}

/** API 速率限制用盡 */
export class RateLimitError extends Error {
  constructor(message = 'API rate limit 用盡') {
    super(message);
    this.name = 'RateLimitError';
  }
}
