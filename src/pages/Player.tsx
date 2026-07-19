import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { MotionConfig } from 'framer-motion';
import type { Match, Player as PlayerType, SourceMeta, Team } from '@/types/football';
import type { DataMode } from '@/types/football';
import type { TopScorer } from '@/lib/provider/types';
import type { MatchAnalysis } from '@/lib/analysis/types';
import { getProvider } from '@/lib/provider';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { MatchRowSkeleton } from '@/components/Skeletons';
import PlayerHero from './player/PlayerHero';
import PlayerStatsCards from './player/PlayerStatsCards';
import MatchLog from './player/MatchLog';
import Leaderboard from './player/Leaderboard';
import RelatedAnalyses, { type AnalysisEntry } from './team/RelatedAnalyses';
import { findPlayerContributions } from './team/data';
import { ProvenanceLine } from './team/widgets';

interface PlayerData {
  player: PlayerType;
  team: Team;
  matches: Match[];
  scorers: TopScorer[];
  analyses: MatchAnalysis[];
  source: SourceMeta;
  dataMode: DataMode;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'notfound' }
  | { status: 'ok'; data: PlayerData };

function isNotFoundError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /搵唔到|not found/i.test(msg);
}

function PlayerSkeleton() {
  return (
    <div aria-busy="true" aria-label="球員資料載入中">
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
          <div className="flex items-center gap-6">
            <div className="skeleton-shimmer h-24 w-24 rounded-full md:h-[120px] md:w-[120px]" />
            <div className="flex-1 space-y-3">
              <div className="skeleton-shimmer h-9 w-56 max-w-full rounded-md" />
              <div className="skeleton-shimmer h-4 w-32 rounded-md" />
              <div className="skeleton-shimmer h-6 w-72 max-w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-24 rounded-md" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <MatchRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Player() {
  const { playerId } = useParams<{ playerId: string }>();
  const [attempt, setAttempt] = useState(0);
  // request-key pattern：上一次的結果若同當前請求 key 唔同，即當 loading，
  // 唔需要喺 effect 入面同步 setState（react-hooks/set-state-in-effect）。
  const requestKey = `${playerId ?? ''}#${attempt}`;
  const [result, setResult] = useState<{ key: string; state: LoadState } | null>(null);
  const state: LoadState = useMemo(
    () => (result && result.key === requestKey ? result.state : { status: 'loading' }),
    [result, requestKey],
  );

  useEffect(() => {
    if (!playerId) return;
    let cancelled = false;

    (async () => {
      try {
        const provider = getProvider();
        const playerRes = await provider.getPlayer(playerId);
        const [teamRes, matchesRes, scorersRes, analysesRes] = await Promise.all([
          provider.getTeam(playerRes.data.teamId),
          provider.getMatches({ teamId: playerRes.data.teamId }),
          provider.getTopScorers(),
          provider.listAnalyses(),
        ]);
        if (cancelled) return;
        setResult({
          key: requestKey,
          state: {
            status: 'ok',
            data: {
              player: playerRes.data,
              team: teamRes.data,
              matches: matchesRes.data,
              scorers: scorersRes.data,
              analyses: analysesRes.data,
              source: playerRes.source,
              dataMode: playerRes.dataMode,
            },
          },
        });
      } catch (e) {
        if (cancelled) return;
        if (isNotFoundError(e)) setResult({ key: requestKey, state: { status: 'notfound' } });
        else
          setResult({
            key: requestKey,
            state: { status: 'error', error: e instanceof Error ? e.message : String(e) },
          });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [playerId, requestKey]);

  const derived = useMemo(() => {
    if (state.status !== 'ok') return null;
    const { player, matches, scorers, analyses } = state.data;
    const contributions = findPlayerContributions(player, matches);
    const contributionIds = new Set(contributions.map((c) => c.match.matchId));
    const matchById = new Map(matches.map((m) => [m.matchId, m]));
    const analysisEntries: AnalysisEntry[] = analyses
      .filter((a) => contributionIds.has(a.matchId))
      .map((a) => ({ analysis: a, match: matchById.get(a.matchId) as Match }))
      .sort((a, b) => b.match.kickoffUtc.localeCompare(a.match.kickoffUtc));
    const scorerRank = scorers.findIndex((s) => s.player.id === player.id);
    const isTopScorer =
      scorers.length > 0 && player.stats?.goals !== undefined && player.stats.goals === scorers[0].goals;
    return {
      contributions,
      analysisEntries,
      scorerRank: scorerRank >= 0 ? scorerRank + 1 : undefined,
      isTopScorer,
    };
  }, [state]);

  if (state.status === 'loading') {
    return <PlayerSkeleton />;
  }

  if (state.status === 'notfound') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <EmptyState
          title="找不到這位球員"
          description={`冇編號「${playerId ?? ''}」嘅球員資料，可能係連結有誤。`}
          ctaLabel="返回主頁"
          ctaHref="/"
        />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <ErrorState error={state.error} onRetry={() => setAttempt((a) => a + 1)} />
      </div>
    );
  }

  const { player, team, scorers, source, dataMode } = state.data;
  const d = derived as NonNullable<typeof derived>;

  return (
    <MotionConfig reducedMotion="user">
      <article>
        <PlayerHero
          player={player}
          team={team}
          scorerRank={d.scorerRank}
          source={source}
          dataMode={dataMode}
        />

        <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 md:px-6 md:py-8">
          <section aria-labelledby="player-stats">
            <h2 id="player-stats" className="mb-4 font-display text-xl font-semibold text-foreground md:text-2xl">
              賽事統計
            </h2>
            <PlayerStatsCards player={player} isTopScorer={d.isTopScorer} />
          </section>

          <section aria-labelledby="player-match-log">
            <h2
              id="player-match-log"
              className="mb-1 font-display text-xl font-semibold text-foreground md:text-2xl"
            >
              逐場紀錄
            </h2>
            <p className="mb-4 text-caption text-text-3">列出有入球或助攻貢獻嘅場次</p>
            <MatchLog player={player} contributions={d.contributions} />
          </section>

          <Leaderboard player={player} scorers={scorers} />

          <section aria-labelledby="player-analyses">
            <h2
              id="player-analyses"
              className="mb-1 font-display text-xl font-semibold text-foreground md:text-2xl"
            >
              相關分析
            </h2>
            <p className="mb-4 text-caption text-text-3">同呢位球員有入球或助攻貢獻嘅場次相關嘅賽後分析</p>
            <RelatedAnalyses
              entries={d.analysisEntries}
              emptyTitle="暫無相關分析"
              emptyDescription="呢位球員暫時未有相關嘅賽後分析。"
            />
          </section>

          <ProvenanceLine source={source} dataMode={dataMode} className="border-t border-border pt-4" />
        </div>
      </article>
    </MotionConfig>
  );
}
