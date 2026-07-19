import { motion } from 'framer-motion';
import type { Player } from '@/types/football';
import EmptyState from '@/components/EmptyState';
import { cn } from '@/lib/utils';
import { CountUp } from '../team/widgets';

interface PlayerStatsCardsProps {
  player: Player;
  /** 球員係咪賽事神射手（並列榜首亦當係） */
  isTopScorer: boolean;
}

interface StatCardDef {
  key: string;
  label: string;
  value: number;
  caption?: string;
  gold?: boolean;
}

/**
 * player.md §2 — 賽事統計卡：只有 PlayerStats 有值嘅欄位先顯示
 * （undefined 嘅欄位整卡唔顯示，唔會當 0）；全無 → EmptyState。
 */
export default function PlayerStatsCards({ player, isTopScorer }: PlayerStatsCardsProps) {
  const stats = player.stats;
  const cards: StatCardDef[] = [];

  if (stats?.appearances !== undefined) {
    cards.push({ key: 'apps', label: '出場', value: stats.appearances });
  }
  if (stats?.goals !== undefined) {
    cards.push({
      key: 'goals',
      label: '入球',
      value: stats.goals,
      gold: isTopScorer,
      caption: isTopScorer ? '賽事神射手' : undefined,
    });
  }
  if (stats?.assists !== undefined) {
    cards.push({ key: 'assists', label: '助攻', value: stats.assists });
  }
  if (stats?.yellow !== undefined) {
    cards.push({ key: 'yellow', label: '黃牌', value: stats.yellow });
  }
  if (stats?.red !== undefined) {
    cards.push({ key: 'red', label: '紅牌', value: stats.red });
  }

  if (cards.length === 0) {
    return (
      <EmptyState
        compact
        title="球員數據資料不足"
        description="供應商暫未提供呢位球員嘅賽事統計（出場、入球、助攻、牌）。"
      />
    );
  }

  return (
    <dl
      className={cn(
        'grid grid-cols-2 gap-3',
        cards.length >= 4 ? 'md:grid-cols-4' : cards.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2',
      )}
      aria-label="賽事統計"
    >
      {cards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-5% 0px' }}
          transition={{ duration: 0.3, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'rounded-md border border-border bg-surface p-4 md:p-5',
            card.gold && 'border-t-2 border-t-gold',
          )}
        >
          <dt className="text-label text-text-3">{card.label}</dt>
          <dd
            className={cn(
              'mt-2 font-num text-4xl leading-none font-bold tnum',
              card.gold ? 'text-gold' : 'text-foreground',
            )}
          >
            <CountUp value={card.value} duration={0.7} delay={i * 0.08} />
          </dd>
          {card.caption && <dd className="mt-2 text-caption text-gold">{card.caption}</dd>}
        </motion.div>
      ))}
    </dl>
  );
}
