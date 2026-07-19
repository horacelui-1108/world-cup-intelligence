import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion';
import { Star } from 'lucide-react';
import SectionHeader from './SectionHeader';
import ErrorState from '@/components/ErrorState';
import DataStatusBadge from '@/components/DataStatusBadge';
import { TeamTileSkeleton } from '@/components/Skeletons';
import { Crest } from '@/components/TeamChip';
import { useFavorites } from '@/lib/favorites';
import { cn } from '@/lib/utils';
import type { AsyncSlice } from './useHomeData';
import type { FormResult, TrendingData } from './adapters';

const formColor: Record<FormResult, string> = { W: 'bg-win', D: 'bg-draw', L: 'bg-live' };
const formLabel: Record<FormResult, string> = { W: '勝', D: '和', L: '負' };

/** stat number count-up 0.6s on first viewport entry */
function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => String(Math.round(v)));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, { duration: 0.6, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [inView, mv, value]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

/**
 * Home Section 5 — 熱門球隊（四強隊伍,來自 provider）。
 * 用戶收藏（localStorage,favorites.ts）置頂;toggle 即時重新排序。
 */
export default function TrendingTeams({ slice }: { slice: AsyncSlice<TrendingData> }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { data, loading, error, retry } = slice;

  // 收藏置頂（stable sort:favorites 先,其餘保持 provider 排序）
  const teams = (data?.teams ?? [])
    .map((item, index) => ({ item, index, fav: isFavorite(item.team.id) }))
    .sort((a, b) => Number(b.fav) - Number(a.fav) || a.index - b.index)
    .map((x) => x.item);

  return (
    <section aria-labelledby="teams-heading" className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <SectionHeader
        id="teams-heading"
        title="熱門球隊"
        caption="依關注度與近期表現排序"
        badge={data ? <DataStatusBadge status={data.status} meta={data.meta} /> : undefined}
      />
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <TeamTileSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState title="球隊資料未能載入" error={error} onRetry={retry} compact />
      ) : (
        <motion.ul
          className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        >
          {teams.map(({ team, groupLabel, form, keyStat }) => {
            const fav = isFavorite(team.id);
            return (
              <motion.li
                key={team.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
                }}
                className="relative rounded-md border border-border bg-surface transition-colors duration-200 hover:border-border-strong"
              >
                {/* favorite toggle — real, persisted to localStorage */}
                <button
                  type="button"
                  onClick={() => toggleFavorite(team.id)}
                  aria-pressed={fav}
                  aria-label={fav ? `取消收藏${team.name}` : `收藏${team.name}`}
                  className="absolute top-3 right-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-md text-text-3 transition-colors duration-200 hover:text-gold"
                >
                  <Star
                    className={cn('h-[18px] w-[18px] transition-colors duration-200', fav && 'fill-gold text-gold')}
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </button>

                <Link to={`/teams/${team.id}`} className="flex flex-col items-center px-4 pt-6 pb-5 text-center">
                  <motion.span
                    whileHover={{ rotate: [-6, 0] }}
                    transition={{ type: 'spring', stiffness: 320, damping: 12 }}
                    className="block"
                  >
                    <Crest team={team} size={64} />
                  </motion.span>
                  <span className="mt-3 font-display text-lg font-semibold text-foreground">{team.name}</span>
                  <span className="mt-0.5 text-caption text-text-3">
                    {team.ranking != null ? `FIFA 排名第 ${team.ranking}` : (groupLabel ?? team.shortName)}
                  </span>
                  {form.length > 0 && (
                    <span
                      className="mt-2 flex items-center gap-1"
                      role="img"
                      aria-label={`近五場:${form.map((f) => formLabel[f]).join('、')}`}
                    >
                      {form.map((f, i) => (
                        <span key={i} title={formLabel[f]} className={cn('h-1.5 w-1.5 rounded-full', formColor[f])} />
                      ))}
                    </span>
                  )}
                  <span className="mt-3 border-t border-border pt-3 text-center">
                    <span className="font-num text-2xl font-bold text-gold tnum">
                      <CountUp value={keyStat.value} />
                    </span>
                    <span className="ml-1 text-sm text-text-2">{keyStat.unit}</span>
                    <span className="block text-caption text-text-3">{keyStat.player}</span>
                  </span>
                </Link>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </section>
  );
}
