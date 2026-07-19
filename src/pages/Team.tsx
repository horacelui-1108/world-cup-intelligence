import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { MotionConfig } from 'framer-motion';
import type { Match, SourceMeta, Team } from '@/types/football';
import type { DataMode } from '@/types/football';
import type { GroupStanding } from '@/lib/standings';
import type { MatchAnalysis } from '@/lib/analysis/types';
import { getProvider } from '@/lib/provider';
import { computeBestThirds, getTeamStanding } from '@/lib/standings';
import { getPlayersByTeam } from '@/data/players';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { MatchRowSkeleton } from '@/components/Skeletons';
import { Crest } from '@/components/TeamChip';
import { cn } from '@/lib/utils';
import TeamHero from './team/TeamHero';
import TeamMatches from './team/TeamMatches';
import SquadTable from './team/SquadTable';
import TeamStats from './team/TeamStats';
import RelatedAnalyses, { type AnalysisEntry } from './team/RelatedAnalyses';
import { computeTeamSummary, teamRefById, teamsById } from './team/data';
import { ProvenanceLine } from './team/widgets';

type TabKey = 'fixtures' | 'squad' | 'stats' | 'analysis';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'fixtures', label: '賽程及賽果' },
  { key: 'squad', label: '球員名單' },
  { key: 'stats', label: '數據' },
  { key: 'analysis', label: '分析' },
];

function tabFromHash(hash: string): TabKey {
  const key = hash.replace('#', '') as TabKey;
  return TABS.some((t) => t.key === key) ? key : 'fixtures';
}

interface TeamData {
  team: Team;
  matches: Match[];
  standings: GroupStanding[];
  analyses: MatchAnalysis[];
  source: SourceMeta;
  dataMode: DataMode;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'notfound' }
  | { status: 'ok'; data: TeamData };

function isNotFoundError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /搵唔到|not found/i.test(msg);
}

function TeamSkeleton() {
  return (
    <div aria-busy="true" aria-label="球隊資料載入中">
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
          <div className="skeleton-shimmer mt-6 h-20 rounded-md" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl space-y-2 px-4 py-8 md:px-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <MatchRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function Team() {
  const { teamId } = useParams<{ teamId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(0);
  // request-key pattern：上一次的結果若同當前請求 key 唔同，即當 loading，
  // 唔需要喺 effect 入面同步 setState（react-hooks/set-state-in-effect）。
  const requestKey = `${teamId ?? ''}#${attempt}`;
  const [result, setResult] = useState<{ key: string; state: LoadState } | null>(null);
  const state: LoadState = useMemo(
    () => (result && result.key === requestKey ? result.state : { status: 'loading' }),
    [result, requestKey],
  );
  const tab = tabFromHash(location.hash);

  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;

    (async () => {
      try {
        const provider = getProvider();
        const teamRes = await provider.getTeam(teamId);
        const [matchesRes, standingsRes, analysesRes] = await Promise.all([
          provider.getMatches({ teamId }),
          provider.getStandings(),
          provider.listAnalyses(),
        ]);
        if (cancelled) return;
        setResult({
          key: requestKey,
          state: {
            status: 'ok',
            data: {
              team: teamRes.data,
              matches: matchesRes.data,
              standings: standingsRes.data,
              analyses: analysesRes.data,
              source: teamRes.source,
              dataMode: teamRes.dataMode,
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
  }, [teamId, requestKey]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  const selectTab = useCallback(
    (key: TabKey) => {
      navigate(`#${key}`, { replace: true });
    },
    [navigate],
  );

  const derived = useMemo(() => {
    if (state.status !== 'ok') return null;
    const { team, matches, standings, analyses } = state.data;
    const summary = computeTeamSummary(team.id, matches);
    // 最佳第三名晉級標記：computeBestThirds 會按 2026 賽制排 12 隊小組第三
    const bestThirdQualified = computeBestThirds(standings).some(
      (r) => r.teamId === team.id && r.qualification === 'best-third',
    );
    const standingBase = getTeamStanding(standings, team.id);
    const standing = standingBase
      ? {
          ...standingBase,
          qualification:
            standingBase.qualification ?? (bestThirdQualified ? ('best-third' as const) : undefined),
        }
      : undefined;
    const squad = getPlayersByTeam(team.id);
    const matchById = new Map(matches.map((m) => [m.matchId, m]));
    const analysisEntries: AnalysisEntry[] = analyses
      .filter((a) => matchById.has(a.matchId))
      .map((a) => ({ analysis: a, match: matchById.get(a.matchId) as Match }))
      .sort((a, b) => b.match.kickoffUtc.localeCompare(a.match.kickoffUtc));
    const relatedTeams = team.group
      ? [...teamsById.values()].filter((t) => t.group === team.group && t.id !== team.id)
      : [];
    return { summary, standing, squad, analysisEntries, relatedTeams };
  }, [state]);

  if (state.status === 'loading') {
    return <TeamSkeleton />;
  }

  if (state.status === 'notfound') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <EmptyState
          title="找不到這支球隊"
          description={`冇編號「${teamId ?? ''}」嘅球隊資料，可能係連結有誤。`}
          ctaLabel="返回排名"
          ctaHref="/standings"
        />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <ErrorState error={state.error} onRetry={retry} />
      </div>
    );
  }

  const { team, matches, source, dataMode } = state.data;
  const d = derived as NonNullable<typeof derived>;

  return (
    <MotionConfig reducedMotion="user">
      <article>
        <TeamHero team={team} summary={d.summary} standing={d.standing} source={source} dataMode={dataMode} />

        {/* Sticky tab bar（hash-synced）— 位於 navbar（h-14 / md:h-16）之下 */}
        <div className="sticky top-14 z-40 border-b border-border bg-bg/95 backdrop-blur md:top-16">
          <div
            role="tablist"
            aria-label="球隊資料分頁"
            className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 md:px-6"
          >
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  aria-controls={`team-panel-${t.key}`}
                  id={`team-tab-${t.key}`}
                  type="button"
                  onClick={() => selectTab(t.key)}
                  className={cn(
                    'relative shrink-0 px-3 py-3 text-sm font-medium transition-colors duration-200',
                    active ? 'text-accent' : 'text-text-2 hover:text-foreground',
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      'absolute inset-x-3 bottom-0 h-0.5 rounded-full transition-colors duration-200',
                      active ? 'bg-accent' : 'bg-transparent',
                    )}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
          <div
            role="tabpanel"
            id={`team-panel-${tab}`}
            aria-labelledby={`team-tab-${tab}`}
          >
            {tab === 'fixtures' && <TeamMatches teamId={team.id} matches={matches} />}
            {tab === 'squad' && <SquadTable players={d.squad} />}
            {tab === 'stats' && <TeamStats teamId={team.id} matches={matches} />}
            {tab === 'analysis' && <RelatedAnalyses entries={d.analysisEntries} />}
          </div>

          {/* 同組球隊 */}
          {d.relatedTeams.length > 0 && (
            <section aria-labelledby="related-teams" className="mt-10 border-t border-border pt-6">
              <h2 id="related-teams" className="mb-4 font-display text-lg font-semibold text-foreground">
                同組球隊
              </h2>
              <ul className="flex flex-wrap gap-2">
                {d.relatedTeams.map((t) => {
                  const ref = teamRefById(t.id);
                  return (
                    <li key={t.id}>
                      <Link
                        to={`/teams/${t.id}`}
                        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm transition-colors duration-200 hover:border-border-strong hover:text-accent"
                      >
                        <Crest team={ref} size={24} />
                        <span className="font-medium text-foreground">{t.nameZh}</span>
                        <span className="font-num text-caption text-text-3">{t.code3}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <ProvenanceLine source={source} dataMode={dataMode} className="mt-8 border-t border-border pt-4" />
        </div>
      </article>
    </MotionConfig>
  );
}
