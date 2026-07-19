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

/**
 * 首頁 — 所有 section 經 useHomeData() 接駁真實 data provider 層。
 * 每個 section 獨立 loading skeleton → content / ErrorState（retry 真 refetch）；
 * 一個 slice 失敗只會喺頂部顯示橫額 + 該 section 顯示 ErrorState,其餘照舊渲染。
 */
export default function Home() {
  const home = useHomeData();
  const [countdownZero, setCountdownZero] = useState(false);

  const erroredSlices = [home.matches, home.trending, home.analyses, home.news].filter((s) => s.error);
  const retryErrored = () => erroredSlices.forEach((s) => s.retry());

  const matchesData = home.matches.data;
  const final = matchesData?.final ?? null;
  // 決賽已開賽：倒數歸零,或 provider 顯示狀態已非 scheduled
  const finalStarted = countdownZero || (final ? final.status !== 'scheduled' : false);
  // 下一場 = 最早 scheduled 場次;若即係決賽本身(hero 已展示)則隱藏本 section
  const nextScheduled = matchesData?.nextScheduled ?? null;
  const next = nextScheduled && nextScheduled.id !== final?.id ? nextScheduled : null;

  return (
    <>
      <SmoothScroll />

      {/* inline error banner — rest of page still renders */}
      {erroredSlices.length > 0 && (
        <div role="alert" className="border-b border-live/40 bg-live/10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2.5 md:px-6">
            <AlertTriangle className="h-4 w-4 text-live" strokeWidth={1.5} aria-hidden />
            <p className="text-sm text-foreground">部分資料未能載入</p>
            <button
              type="button"
              onClick={retryErrored}
              className="rounded-md border border-accent px-3 py-1 text-xs font-medium text-accent hover:bg-accent/10"
            >
              重試
            </button>
          </div>
        </div>
      )}

      <HeroFinal slice={home.matches} finalStarted={finalStarted} onCountdownZero={() => setCountdownZero(true)} />
      <TodayMatches slice={home.matches} />
      <NextMatch slice={home.matches} next={next} finalStarted={finalStarted} />
      <LatestResults slice={home.matches} />
      <TrendingTeams slice={home.trending} />
      <LatestAnalysis slice={home.analyses} />
      <KeyUpdates slice={home.news} />
    </>
  );
}
