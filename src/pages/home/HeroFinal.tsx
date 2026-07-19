import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown, MapPin, Users } from 'lucide-react';
import CountdownTimer from '@/components/CountdownTimer';
import DataStatusBadge from '@/components/DataStatusBadge';
import TimezoneToggle from '@/components/TimezoneToggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTimezone } from '@/lib/timezone';
import { kickoffLabel, relativePast } from '@/lib/format';
import { FINAL_MATCH, FINAL_VENUE_CAPACITY, LAST_UPDATED } from './data';
import type { TeamRef } from '@/lib/types';

gsap.registerPlugin(ScrollTrigger);

/**
 * Home Section 1 — Final Countdown hero.
 * GSAP + ScrollTrigger pinned storytelling (desktop 150vh); mobile gets a
 * single entrance stagger. GSAP is isolated to this component tree —
 * no Framer Motion is used here (react-dev.md library isolation rule).
 */
export default function HeroFinal({ onCountdownZero }: { onCountdownZero: () => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const crestLRef = useRef<HTMLAnchorElement>(null);
  const crestRRef = useRef<HTMLAnchorElement>(null);
  const countdownRef = useRef<HTMLDivElement>(null);
  const { timeZone, label } = useTimezone();
  const [updatedLabel, setUpdatedLabel] = useState(() => relativePast(LAST_UPDATED));

  // Last-updated chip ticks every 30s
  useLayoutEffect(() => {
    const id = window.setInterval(() => setUpdatedLabel(relativePast(LAST_UPDATED)), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: '(min-width: 768px)',
        isMobile: '(max-width: 767px)',
        reduce: '(prefers-reduced-motion: reduce)',
      },
      (ctx) => {
        const { isDesktop, reduce } = ctx.conditions as {
          isDesktop: boolean;
          isMobile: boolean;
          reduce: boolean;
        };
        if (reduce) return; // everything renders statically

        const q = gsap.utils.selector(sectionRef);

        // Load entrance (both layouts): words + content rise in, 0.5s staggered
        gsap.fromTo(
          [q('.hero-intro'), q('.hero-word'), q('.hero-anim'), countdownRef.current]
            .flat()
            .filter(Boolean),
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out' },
        );

        if (isDesktop) {
          // Pinned scrub storytelling (150vh). Elements stay visible at rest;
          // scroll adds: crests converging from ±40px, countdown settle,
          // overlay darkening to ~80%.
          const tl = gsap.timeline({
            defaults: { ease: 'power2.out' },
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top top',
              end: '+=150%',
              pin: true,
              scrub: 0.5,
              anticipatePin: 1,
            },
          });
          // 0 → 40%: headline words settle upward slightly after entrance
          tl.fromTo(q('.hero-word'), { y: 6 }, { y: 0, stagger: 0.03, duration: 0.4, immediateRender: true }, 0)
            // 40 → 70%: crests converge from ±40px, scale 0.9 → 1
            .fromTo(crestLRef.current, { scale: 0.9, x: -40 }, { scale: 1, x: 0, duration: 0.3, immediateRender: true }, 0.4)
            .fromTo(crestRRef.current, { scale: 0.9, x: 40 }, { scale: 1, x: 0, duration: 0.3, immediateRender: true }, 0.4)
            // 70 → 100%: countdown settles, overlay darkens
            .fromTo(countdownRef.current, { scale: 0.96 }, { scale: 1, duration: 0.3, immediateRender: true }, 0.7)
            .fromTo(dimRef.current, { opacity: 0 }, { opacity: 0.2, duration: 0.3, immediateRender: true }, 0.7);
        }
      },
    );

    return () => mm.revert();
  }, []);

  const crestLink = (team: TeamRef, ref: React.RefObject<HTMLAnchorElement | null>) => (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            ref={ref}
            to={`/teams/${team.id}`}
            aria-label={`${team.name}球隊頁`}
            className="hero-anim group block rounded-full ring-1 ring-border-strong transition-shadow duration-300 hover:ring-gold hover:shadow-[0_0_0_6px_color-mix(in_srgb,var(--gold)_15%,transparent)]"
          >
            <img
              src={team.crest}
              alt={`${team.name}隊徽`}
              width={96}
              height={96}
              className="h-20 w-20 rounded-full md:h-24 md:w-24"
            />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-caption">
          {team.name} · FIFA 排名第 {team.ranking}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="relative flex min-h-[calc(100svh-3.5rem)] items-center justify-center overflow-hidden md:min-h-[calc(100svh-4rem)]"
    >
      {/* background: hero-final.jpg at 45% + --bg gradient overlay 92%→60% */}
      <img
        src="/hero-final.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 'var(--hero-img-opacity)' }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--bg) var(--hero-ov-from), transparent), color-mix(in srgb, var(--bg) var(--hero-ov-to), transparent))' }}
      />
      <div ref={dimRef} aria-hidden className="absolute inset-0 bg-bg opacity-0" />
      {/* pitch-lines watermark bottom-right 8% */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-24 -bottom-24 h-[480px] w-[720px] bg-text opacity-[0.08]"
        style={{
          WebkitMaskImage: 'url(/pitch-lines.svg)',
          maskImage: 'url(/pitch-lines.svg)',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center md:px-6">
        <p className="hero-intro text-label text-gold">2026 FIFA WORLD CUP · 決賽</p>

        <h1 id="hero-title" className="mt-4 font-display font-bold text-foreground">
          <span className="block overflow-hidden text-4xl leading-[1.15] md:text-6xl">
            {'決賽日'.split('').map((c, i) => (
              <span key={i} className="hero-word inline-block will-change-transform">
                {c}
              </span>
            ))}
          </span>
          <span className="mt-2 block overflow-hidden text-2xl leading-[1.2] md:text-4xl">
            {['西班牙', 'vs', '阿根廷'].map((w, i) => (
              <span key={i} className="hero-word inline-block will-change-transform">
                {w}
                {i < 2 && ' '}
              </span>
            ))}
          </span>
        </h1>

        <div className="mt-8 flex items-center gap-6 md:gap-10">
          {crestLink(FINAL_MATCH.home, crestLRef)}
          <span className="hero-anim font-num text-lg font-semibold text-text-3">VS</span>
          {crestLink(FINAL_MATCH.away, crestRRef)}
        </div>

        <div ref={countdownRef} className="mt-10">
          <CountdownTimer targetIso={FINAL_MATCH.kickoffUtc} size="lg" onZero={onCountdownZero} />
        </div>

        <p className="hero-intro mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-text-2">
          <span key={label} className="animate-in fade-in duration-200">
            開賽:{kickoffLabel(FINAL_MATCH.kickoffUtc, timeZone)} {label}
          </span>
          <TimezoneToggle />
        </p>

        <div className="hero-intro mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-caption text-text-3">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            {FINAL_MATCH.venue}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            容量 {FINAL_VENUE_CAPACITY}
          </span>
          <DataStatusBadge status={FINAL_MATCH.meta.dataStatus} meta={FINAL_MATCH.meta} />
        </div>

        <div className="hero-intro mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/matches/final"
            className="inline-flex min-h-11 items-center rounded-md bg-accent px-6 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent-strong"
          >
            進入 Match Centre
          </Link>
          <Link
            to="/bracket"
            className="inline-flex min-h-11 items-center rounded-md border border-border-strong px-6 text-sm font-medium text-foreground transition-colors duration-200 hover:border-accent hover:text-accent"
          >
            查看淘汰賽之路
          </Link>
        </div>
      </div>

      {/* bottom-left last-updated chip */}
      <p className="hero-intro absolute bottom-14 left-4 z-10 text-caption text-text-3 md:bottom-6 md:left-6">
        最後更新:{updatedLabel} · Demo Data
      </p>

      {/* scroll cue */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 max-md:hidden" aria-hidden>
        <span className="h-8 w-px bg-border-strong" />
        <ChevronDown className="h-4 w-4 animate-bob text-text-3" strokeWidth={1.5} />
      </div>
    </section>
  );
}
