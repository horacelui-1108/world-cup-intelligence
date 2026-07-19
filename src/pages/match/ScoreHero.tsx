import { Link } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import type { GoalEvent, Match } from '@/types/football';
import type { SourceMeta as UiSourceMeta } from '@/lib/types';
import { cn } from '@/lib/utils';
import { kickoffLabelWithWeekday } from '@/lib/format';
import CountdownTimer from '@/components/CountdownTimer';
import DataStatusBadge from '@/components/DataStatusBadge';
import { Crest } from '@/components/TeamChip';
import {
  formatMinute,
  isKnockout,
  playerDisplayName,
  stageFullLabel,
  toTeamRef,
  uiStatus,
  venueOf,
} from '@/pages/schedule/model';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const HKT = 'Asia/Hong_Kong';

interface ScoreHeroProps {
  match: Match;
  meta: UiSourceMeta;
  /** 賽後分析連結（finished 且 analysis 存在時提供） */
  analysisHref?: string;
}

function StatusChip({ match }: { match: Match }) {
  const status = uiStatus(match.status);
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-live/50 px-2.5 py-0.5 text-caption font-semibold text-live">
        <span className="h-1.5 w-1.5 rounded-full bg-live animate-live-pulse" aria-hidden />
        {match.status === 'ht' ? '半場' : 'LIVE'}
      </span>
    );
  }
  if (status === 'finished') {
    return (
      <span className="inline-flex items-center rounded-full border border-border-strong px-2.5 py-0.5 text-caption font-medium text-text-2">
        完場
      </span>
    );
  }
  if (status === 'postponed') {
    return (
      <span className="inline-flex items-center rounded-full border border-warn/50 px-2.5 py-0.5 text-caption font-medium text-warn">
        延期
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-caption font-medium text-text-3">
      比賽未開始
    </span>
  );
}

/** 入球球員欄（主/客各自一欄，最新優先；分鐘未核實顯示 --'） */
function ScorerColumn({
  scorers,
  align,
}: {
  scorers: GoalEvent[];
  align: 'left' | 'right';
}) {
  if (scorers.length === 0) return null;
  const sorted = [...scorers].sort((a, b) => (b.minute ?? -1) - (a.minute ?? -1));

  // 分鐘全部未核實嘅同名球員合併為 ×n（避免重複「--' 比寧咸」兩行）
  const lines: { key: string; label: string; playerId?: string }[] = [];
  const nullMinuteCount = new Map<string, number>();
  for (const s of sorted) {
    const name = playerDisplayName(s.playerId, s.playerName);
    const suffix = s.kind === 'pen_goal' ? '(十二碼)' : s.kind === 'own_goal' ? '(烏龍)' : '';
    if (s.minute == null) {
      const k = `${s.playerId ?? name}|${s.kind}`;
      nullMinuteCount.set(k, (nullMinuteCount.get(k) ?? 0) + 1);
      if (nullMinuteCount.get(k)! > 1) continue;
      const total = sorted.filter(
        (x) => (x.playerId ?? x.playerName) === (s.playerId ?? s.playerName) && x.kind === s.kind && x.minute == null,
      ).length;
      lines.push({
        key: k,
        label: `--' ${name}${total > 1 ? ` ×${total}` : ''}${suffix}`,
        playerId: s.playerId,
      });
    } else {
      lines.push({
        key: `${s.playerId ?? name}-${s.minute}-${lines.length}`,
        label: `${formatMinute(s.minute)} ${name}${suffix}`,
        playerId: s.playerId,
      });
    }
  }

  return (
    <ul className={cn('mt-2 space-y-0.5', align === 'right' ? 'text-right' : 'text-left')}>
      {lines.map((l, i) => (
        <motion.li
          key={l.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
          className="font-num text-caption text-text-2 tnum"
        >
          {l.playerId ? (
            <Link to={`/players/${l.playerId}`} className="transition-colors hover:text-accent">
              {l.label}
            </Link>
          ) : (
            l.label
          )}
        </motion.li>
      ))}
    </ul>
  );
}

/**
 * match.md §1 — Score Hero：階段 micro-label、球場+城市、雙時區開賽、
 * StatusChip、大比分 tabular、入球球員+分鐘、十二碼/半場/加時附註。
 */
export default function ScoreHero({ match, meta, analysisHref }: ScoreHeroProps) {
  const reduce = useReducedMotion();
  const status = uiStatus(match.status);
  const knockout = isKnockout(match);
  const home = toTeamRef(match.homeTeamId);
  const away = toTeamRef(match.awayTeamId);
  const venue = venueOf(match.venueId);
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const homeScorers = (match.scorers ?? []).filter((s) => s.teamId === match.homeTeamId);
  const awayScorers = (match.scorers ?? []).filter((s) => s.teamId === match.awayTeamId);

  const homeWin = status === 'finished' && match.score.home > match.score.away;
  const awayWin = status === 'finished' && match.score.away > match.score.home;
  const played = status === 'live' || status === 'finished';

  return (
    <section aria-label="比賽概要" className="relative overflow-hidden border-b border-border bg-surface">
      {/* pitch-lines 水印（右緣 6%） */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-2/3 bg-text opacity-[0.06]"
        style={{
          WebkitMaskImage: 'url(/pitch-lines.svg)',
          maskImage: 'url(/pitch-lines.svg)',
          WebkitMaskSize: 'cover',
          maskSize: 'cover',
          WebkitMaskPosition: 'right center',
          maskPosition: 'right center',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        {/* 頂部 meta 行 */}
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-caption"
        >
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium',
              knockout ? 'border-gold/50 text-gold' : 'border-border text-text-2',
            )}
          >
            {stageFullLabel(match)}
          </span>
          <span className="inline-flex items-center gap-1 text-text-2">
            <MapPin className="h-3.5 w-3.5 text-text-3" strokeWidth={1.5} aria-hidden />
            {venue ? `${venue.stadium} · ${venue.city}` : match.venueId}
          </span>
          <StatusChip match={match} />
          <DataStatusBadge status={meta.dataStatus} meta={meta} />
        </motion.div>

        {/* 中央比分區 */}
        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-start gap-3 md:mt-8 md:gap-10">
          {/* 主隊 */}
          <div className="flex flex-col items-center md:items-end">
            <motion.div
              initial={reduce ? false : { opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <Link to={`/teams/${home.id}`} aria-label={`${home.name}球隊頁`}>
                <Crest team={home} size={64} className="md:!h-20 md:!w-20" />
              </Link>
            </motion.div>
            <Link
              to={`/teams/${home.id}`}
              className="mt-3 text-center font-display text-lg font-semibold text-foreground transition-colors hover:text-accent md:text-right md:text-2xl"
            >
              {home.name}
            </Link>
            <p className="font-num text-caption tracking-wider text-text-3">{home.shortName}</p>
            <ScorerColumn scorers={homeScorers} align="right" />
          </div>

          {/* 比分 / VS */}
          <div className="flex min-w-28 flex-col items-center justify-start pt-2 md:min-w-40 md:pt-4">
            {played ? (
              <>
                <p
                  aria-live="polite"
                  aria-label={`比分 ${match.score.home} 比 ${match.score.away}`}
                  className="font-num text-[3rem] font-bold leading-none tnum md:text-[4.5rem]"
                >
                  <motion.span
                    initial={reduce ? false : { opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className={cn(status === 'finished' && awayWin ? 'text-text-2' : 'text-foreground')}
                  >
                    {match.score.home}
                  </motion.span>
                  <span className="mx-1 text-text-3 md:mx-2">–</span>
                  <motion.span
                    initial={reduce ? false : { opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}
                    className={cn(status === 'finished' && homeWin ? 'text-text-2' : 'text-foreground')}
                  >
                    {match.score.away}
                  </motion.span>
                </p>
                {status === 'live' && (
                  <p className="mt-2 font-num text-sm font-semibold text-live animate-live-pulse">進行中</p>
                )}
              </>
            ) : (
              <>
                <p className="font-num text-[2.5rem] font-bold leading-none text-text-3 md:text-[3.5rem]">VS</p>
                {status === 'scheduled' && (
                  <div className="mt-3">
                    <CountdownTimer targetIso={match.kickoffUtc} size="sm" zeroLabel="已開賽" />
                  </div>
                )}
              </>
            )}

            {/* 十二碼 / 半場 / 加時附註 */}
            {match.score.penalties && (
              <p className="mt-2 font-num text-caption font-medium text-gold tnum">
                互射十二碼 {match.score.penalties.home}–{match.score.penalties.away}
              </p>
            )}
            {match.score.extraTime && (
              <p className="mt-1 font-num text-caption text-text-3 tnum">
                加時入球 {match.score.extraTime.home}–{match.score.extraTime.away}
              </p>
            )}
            {status === 'finished' && match.score.halfTime && (
              <p className="mt-1 font-num text-caption text-text-3 tnum">
                半場 {match.score.halfTime.home}–{match.score.halfTime.away}
              </p>
            )}
          </div>

          {/* 客隊 */}
          <div className="flex flex-col items-center md:items-start">
            <motion.div
              initial={reduce ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <Link to={`/teams/${away.id}`} aria-label={`${away.name}球隊頁`}>
                <Crest team={away} size={64} className="md:!h-20 md:!w-20" />
              </Link>
            </motion.div>
            <Link
              to={`/teams/${away.id}`}
              className="mt-3 text-center font-display text-lg font-semibold text-foreground transition-colors hover:text-accent md:text-left md:text-2xl"
            >
              {away.name}
            </Link>
            <p className="font-num text-caption tracking-wider text-text-3">{away.shortName}</p>
            <ScorerColumn scorers={awayScorers} align="left" />
          </div>
        </div>

        {/* 雙時區開賽時間 */}
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mt-6 border-t border-border pt-4 text-center text-caption text-text-2"
        >
          <p>
            <span className="text-text-3">香港時間</span>{' '}
            <span className="font-num tnum">{kickoffLabelWithWeekday(match.kickoffUtc, HKT)}</span>
            <span className="mx-2 text-border-strong" aria-hidden>
              |
            </span>
            <span className="text-text-3">本地（{localTz}）</span>{' '}
            <span className="font-num tnum">{kickoffLabelWithWeekday(match.kickoffUtc, localTz)}</span>
          </p>
        </motion.div>

        {/* FT 連結行 */}
        {status === 'finished' && (
          <div className="mt-3 flex items-center justify-center gap-4 text-caption">
            {analysisHref && (
              <Link
                to={analysisHref}
                className="font-medium text-accent transition-colors duration-200 hover:text-accent-strong"
              >
                賽後分析 →
              </Link>
            )}
            <span className="text-text-3">
              相關球隊:
              <Link to={`/teams/${home.id}`} className="ml-1 text-text-2 transition-colors hover:text-accent">
                {home.name}
              </Link>
              <span aria-hidden> · </span>
              <Link to={`/teams/${away.id}`} className="text-text-2 transition-colors hover:text-accent">
                {away.name}
              </Link>
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
