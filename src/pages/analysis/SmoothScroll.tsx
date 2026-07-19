/**
 * Lenis 平滑捲動（analysis-detail §3：分析文章啟用）。
 * 同 home 版嘅分別：呢頁冇 GSAP，所以唔駁 ScrollTrigger。
 * prefers-reduced-motion 時停用；unmount 嚴格 cleanup。
 */
import { useEffect } from 'react';
import Lenis from 'lenis';

export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}
