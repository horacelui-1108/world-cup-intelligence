import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import HeroFinal from './home/HeroFinal';
import SmoothScroll from './home/SmoothScroll';
import TodayMatches from './home/TodayMatches';
import NextMatch from './home/NextMatch';
import LatestResults from './home/LatestResults';
import TrendingTeams from './home/TrendingTeams';
import LatestAnalysis from './home/LatestAnalysis';
import KeyUpdates from './home/KeyUpdates';
import { useHomeData } from './home/useHomeData';
import {
  ArticleCardSkeleton,
  HeroSkeleton,
  MatchCardSkeleton,
  MatchRowSkeleton,
  TeamTileSkeleton,
} from '@/components/Skeletons';

function HomeSkeletons() {
  return (
    <div aria-busy="true" aria-label="首頁資料載入中">
      <HeroSkeleton />
      <div className="mx-auto max-w-7xl space-y-10 px-4 pb-10 md:px-6">
        <MatchCardSkeleton />
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <MatchRowSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <TeamTileSkeleton key={i} />
          ))}
        </div>
        <ArticleCardSkeleton />
      </div>
    </div>
  );
}

export default function Home() {
  const { loading, error, retry } = useHomeData();
  const [finalStarted, setFinalStarted] = useState(false);

  if (loading) return <HomeSkeletons />;

  return (
    <>
      <SmoothScroll />

      {/* inline error banner — rest of page still renders */}
      {error && (
        <div role="alert" className="border-b border-live/40 bg-live/10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2.5 md:px-6">
            <AlertTriangle className="h-4 w-4 text-live" strokeWidth={1.5} aria-hidden />
            <p className="text-sm text-foreground">部分資料未能載入</p>
            <button
              type="button"
              onClick={() => void retry()}
              className="rounded-md border border-accent px-3 py-1 text-xs font-medium text-accent hover:bg-accent/10"
            >
              重試
            </button>
          </div>
        </div>
      )}

      <HeroFinal onCountdownZero={() => setFinalStarted(true)} />
      <TodayMatches />
      <NextMatch next={null} finalStarted={finalStarted} />
      <LatestResults />
      <TrendingTeams />
      <LatestAnalysis />
      <KeyUpdates />
    </>
  );
}
