/**
 * Demo Provider — serve 內建人手策展 snapshot（src/data/*）。
 * 所有回傳標 dataMode: 'demo'（G-12：UI 必須標示「Demo Data」）；
 * match 級 source.dataStatus 保留 VERIFIED/PENDING（數據本身經核實）。
 */
import { matches, tournament, ESPN_VERIFIED } from '../../data/matches';
import { news } from '../../data/news';
import { players } from '../../data/players';
import { teams } from '../../data/teams';
import type { Match, NewsItem, Player, SourceMeta, Team, Tournament } from '../../types/football';
import { computeStandings, type GroupStanding } from '../standings';
import { generateAnalysis } from '../analysis/engine';
import { buildAnalysisContext } from '../analysis/context';
import type { MatchAnalysis } from '../analysis/types';
import type {
  Bracket,
  CapabilityFlags,
  FootballDataProvider,
  MatchFilter,
  ProviderResult,
  TopScorer,
} from './types';

const STAGE_LABELS: Record<string, string> = {
  R32: '三十二強',
  R16: '十六強',
  QF: '八強',
  SF: '四強',
  '3P': '季軍戰',
  F: '決賽',
};

function wrap<T>(data: T, source: SourceMeta = ESPN_VERIFIED): ProviderResult<T> {
  return {
    data,
    source,
    dataMode: 'demo',
    lastUpdated: source.lastUpdated ?? source.retrievedAt,
  };
}

function applyFilter(list: Match[], filter?: MatchFilter): Match[] {
  if (!filter) return list;
  return list.filter((m) => {
    if (filter.stage && m.stage !== filter.stage) return false;
    if (filter.group && m.group !== filter.group) return false;
    if (filter.status && m.status !== filter.status) return false;
    if (filter.teamId && m.homeTeamId !== filter.teamId && m.awayTeamId !== filter.teamId) return false;
    if (filter.fromUtc && m.kickoffUtc < filter.fromUtc) return false;
    if (filter.toUtc && m.kickoffUtc > filter.toUtc) return false;
    return true;
  });
}

class DemoProvider implements FootballDataProvider {
  readonly capabilities: CapabilityFlags = {
    hasXG: false,
    hasRatings: false,
    hasFormations: false,
    live: false,
  };
  readonly mode = 'demo' as const;

  async getTournament(): Promise<ProviderResult<Tournament>> {
    return wrap(tournament);
  }

  async getMatches(filter?: MatchFilter): Promise<ProviderResult<Match[]>> {
    return wrap(applyFilter(matches, filter));
  }

  async getMatch(id: string): Promise<ProviderResult<Match>> {
    const match = matches.find((m) => m.matchId === id);
    if (!match) throw new Error(`搵唔到賽事：${id}`);
    return wrap(match, match.source);
  }

  async getStandings(): Promise<ProviderResult<GroupStanding[]>> {
    return wrap(computeStandings(matches, teams));
  }

  /** 由淘汰賽 matches 推導 bracket */
  async getBracket(): Promise<ProviderResult<Bracket>> {
    const order = ['R32', 'R16', 'QF', 'SF', '3P', 'F'] as const;
    const rounds = order.map((stage) => ({
      stage,
      label: STAGE_LABELS[stage],
      matches: matches
        .filter((m) => m.stage === stage)
        .sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc) || a.matchId.localeCompare(b.matchId)),
    }));
    return wrap({
      rounds,
      final: matches.find((m) => m.stage === 'F'),
      thirdPlace: matches.find((m) => m.stage === '3P'),
    });
  }

  async getTeam(id: string): Promise<ProviderResult<Team>> {
    const team = teams.find((t) => t.id === id);
    if (!team) throw new Error(`搵唔到球隊：${id}`);
    return wrap(team);
  }

  async getPlayer(id: string): Promise<ProviderResult<Player>> {
    const player = players.find((p) => p.id === id);
    if (!player) throw new Error(`搵唔到球員：${id}`);
    return wrap(player);
  }

  async getTopScorers(): Promise<ProviderResult<TopScorer[]>> {
    const scorers = players
      .filter((p) => p.stats?.goals !== undefined)
      .map((p) => ({ player: p, goals: p.stats?.goals ?? 0, assists: p.stats?.assists }))
      .sort((a, b) => b.goals - a.goals || (b.assists ?? 0) - (a.assists ?? 0));
    return wrap(scorers);
  }

  async getNews(): Promise<ProviderResult<NewsItem[]>> {
    return wrap([...news].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)));
  }

  async getAnalysis(matchId: string): Promise<ProviderResult<MatchAnalysis>> {
    const { data: match, source } = await this.getMatch(matchId);
    const analysis = generateAnalysis(match, buildAnalysisContext('demo'));
    return wrap(analysis, source);
  }

  async listAnalyses(): Promise<ProviderResult<MatchAnalysis[]>> {
    const ctx = buildAnalysisContext('demo');
    return wrap(matches.filter((m) => m.status === 'ft').map((m) => generateAnalysis(m, ctx)));
  }
}

export const demoProvider: FootballDataProvider = new DemoProvider();
