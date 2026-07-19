/**
 * 共享 AnalysisContext 構建（provider 同 analysis/index 都用，避免循環依賴）。
 */
import { matches, tournament } from '../../data/matches';
import { playersById } from '../../data/players';
import { teamsById } from '../../data/teams';
import type { DataMode } from '../../types/football';
import type { AnalysisContext } from './engine';

export function buildAnalysisContext(dataMode: DataMode, generatedAt?: string): AnalysisContext {
  return {
    teams: teamsById,
    players: playersById,
    matches,
    tournament,
    dataMode,
    generatedAt,
  };
}
