import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { Player, SourceMeta, Team } from '@/types/football';
import type { DataMode } from '@/types/football';
import DataStatusBadge from '@/components/DataStatusBadge';
import { Crest } from '@/components/TeamChip';
import { badgeStatus, POSITION_LABELS, toTeamRef } from '../team/data';
import { asset } from '@/lib/asset';

interface PlayerHeroProps {
  player: Player;
  team: Team;
  /** 射手榜排名（1-based）；未上榜 → undefined */
  scorerRank?: number;
  source: SourceMeta;
  dataMode: DataMode;
}

/**
 * player.md §1 — silhouette avatar（hairline ring + 號碼 badge）、serif 姓名、
 * team chip（→ 球隊頁）、meta grid（位置 / 年齡 / 球會 — 有先顯示）、
 * 射手榜頭 3 名 gold chip、DataStatusBadge。
 */
export default function PlayerHero({ player, team, scorerRank, source, dataMode }: PlayerHeroProps) {
  const metaItems: { label: string; value: string }[] = [];
  if (player.age !== undefined) metaItems.push({ label: '年齡', value: `${player.age} 歲` });
  if (player.club !== undefined) metaItems.push({ label: '球會', value: player.club });

  return (
    <header className="border-b border-border bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
          <motion.div
            className="relative shrink-0"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src={asset("/player-silhouette.svg")}
              alt={`${player.nameZh}頭像`}
              width={120}
              height={120}
              className="h-24 w-24 rounded-full border border-border-strong bg-surface-2 object-cover md:h-[120px] md:w-[120px]"
            />
            {player.number !== undefined && (
              <span className="absolute -bottom-1 -right-1 flex h-8 min-w-8 items-center justify-center rounded-full border border-border bg-surface px-1.5 font-num text-sm font-bold tnum text-foreground">
                {player.number}
              </span>
            )}
          </motion.div>

          <div className="min-w-0 flex-1">
            <motion.h1
              className="font-display text-3xl font-bold text-foreground md:text-4xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {player.nameZh}
            </motion.h1>
            <p className="mt-1 font-num text-sm tracking-wide text-text-3">{player.nameEn}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                to={`/teams/${team.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3 text-sm font-medium text-foreground transition-colors duration-200 hover:border-border-strong hover:text-accent"
                aria-label={`所屬國家隊：${team.nameZh}`}
              >
                <Crest team={toTeamRef(team)} size={24} />
                {team.nameZh}
              </Link>
              <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-caption font-medium text-text-2">
                {POSITION_LABELS[player.position]}
              </span>
              {scorerRank !== undefined && scorerRank <= 3 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/60 bg-gold/10 px-2.5 py-1 text-caption font-semibold text-gold">
                  <Trophy className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                  射手榜第 {scorerRank}
                </span>
              )}
              <DataStatusBadge
                status={dataMode === 'demo' ? 'DEMO' : badgeStatus(source.dataStatus)}
                meta={{
                  source: source.source,
                  sourceUrl: source.sourceUrl,
                  retrievedAt: source.retrievedAt,
                  lastUpdated: source.lastUpdated ?? source.retrievedAt,
                  dataStatus: dataMode === 'demo' ? 'DEMO' : badgeStatus(source.dataStatus),
                }}
              />
            </div>

            {metaItems.length > 0 && (
              <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                {metaItems.map((item) => (
                  <div key={item.label} className="flex items-baseline gap-2">
                    <dt className="text-caption text-text-3">{item.label}</dt>
                    <dd className="text-sm text-text-2">{item.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
