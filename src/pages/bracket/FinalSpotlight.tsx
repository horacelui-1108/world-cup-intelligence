import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Match } from '@/types/football';
import CountdownTimer from '@/components/CountdownTimer';
import { useTimezone } from '@/lib/timezone';
import { fullDateLabel, timeLabel } from '@/lib/format';
import { getVenueById } from '@/data/venues';
import { teamRefOf } from '@/pages/standings/teamRef';
import { winnerOf } from '@/pages/bracket/bracketModel';
import { asset } from '@/lib/asset';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * bracket.md §4 — 決賽焦點卡：hero 圖 + 對賽 + 倒數/開賽時間 + CTA。
 * 完場後切換做冠軍狀態（金框 + 「2026 世界冠軍」）。
 */
export default function FinalSpotlight({ final }: { final: Match }) {
  const { timeZone, label: tzLabel } = useTimezone();
  const decided = final.status === 'ft';
  const winnerId = winnerOf(final);
  const winner = winnerId ? teamRefOf(winnerId) : undefined;
  const home = teamRefOf(final.homeTeamId);
  const away = teamRefOf(final.awayTeamId);
  const venue = getVenueById(final.venueId);

  return (
    <motion.section
      aria-label="決賽焦點"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={cn(
        'overflow-hidden rounded-md border bg-surface transition-colors duration-200 hover:border-border-strong',
        decided ? 'border-gold' : 'border-border',
      )}
    >
      <div className="grid md:grid-cols-[2fr_3fr]">
        {/* hero 圖 */}
        <div className="relative h-44 md:h-full md:min-h-64">
          <img
            src={asset("/hero-final.jpg")}
            alt="決賽球場暮色"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[color-mix(in_srgb,var(--bg)_60%,transparent)] to-transparent md:bg-gradient-to-r" />
        </div>

        {/* 內容 */}
        <div className="flex flex-col justify-center gap-4 p-5 md:p-6">
          {decided && winner ? (
            <>
              <p className="text-label text-gold">決賽 · 完場</p>
              <div className="flex items-center gap-4">
                <img
                  src={winner.crest}
                  alt={`${winner.name}隊徽`}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full max-md:h-12 max-md:w-12"
                />
                <div>
                  <p className="font-display text-2xl font-bold text-gold md:text-3xl">2026 世界冠軍</p>
                  <p className="mt-0.5 font-display text-xl font-semibold text-foreground md:text-2xl">
                    {winner.name}
                  </p>
                </div>
              </div>
              <p className="font-num text-sm tnum text-text-2">
                {home.name} {final.score.home}–{final.score.away} {away.name}
                {final.score.penalties &&
                  `（互射十二碼 ${final.score.penalties.home}–${final.score.penalties.away}）`}
              </p>
            </>
          ) : (
            <>
              <p className="text-label text-gold">決賽</p>
              <h2 className="font-display text-xl font-semibold text-foreground md:text-2xl">
                {home.name} 對 {away.name}
              </h2>
              <div className="space-y-1.5 text-sm text-text-2">
                <p>
                  {fullDateLabel(final.kickoffUtc, timeZone)} {timeLabel(final.kickoffUtc, timeZone)}
                  <span className="ml-1 text-caption text-text-3">（{tzLabel}）</span>
                </p>
                {venue && (
                  <p className="inline-flex items-center gap-1.5 text-caption text-text-3">
                    <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                    {venue.stadium} · {venue.city}
                  </p>
                )}
              </div>
              <div aria-label="決賽倒數">
                <CountdownTimer targetIso={final.kickoffUtc} size="sm" zeroLabel="已開賽" />
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              to={`/matches/${final.matchId}`}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent-strong"
            >
              Match Centre
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </Link>
            {decided && (
              <Link
                to="/analysis"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border px-5 text-sm font-medium text-text-2 transition-colors duration-200 hover:border-border-strong hover:text-foreground"
              >
                賽後分析
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </Link>
            )}
            {!decided && (
              <span className="inline-flex items-center gap-1.5 text-caption text-text-3">
                <Trophy className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} aria-hidden />
                決賽未賽 — 冠軍路徑待決
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
