import { Link } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import { Tv } from 'lucide-react';
import type { Match } from '@/types/football';
import EmptyState from '@/components/EmptyState';
import { formatMinute, playerDisplayName, teamNameZh, uiStatus } from '@/pages/schedule/model';
import { VAR_OUTCOME_LABELS } from './events';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/**
 * VAR tab：列出本場所有 VAR 覆核事件(判決 chip + 說明);
 * 無 VAR 事件 → EmptyState。
 */
export default function VarTab({ match }: { match: Match }) {
  const reduce = useReducedMotion();
  const status = uiStatus(match.status);

  if (status === 'scheduled' || status === 'postponed') {
    return (
      <EmptyState
        title={status === 'postponed' ? '比賽延期' : '比賽尚未開始'}
        description="VAR 事件將於開賽後更新。"
        ctaLabel="返回賽程"
        ctaHref="/schedule"
      />
    );
  }

  const varEvents = (match.events ?? []).filter((e) => e.type === 'var');
  // 加時賽事分鐘直寫（93' 唔係 90+3'）
  const aet = match.score.extraTime !== undefined;

  if (varEvents.length === 0) {
    return (
      <EmptyState
        title="本場沒有 VAR 事件"
        description="資料來源未記錄本場任何 VAR 覆核。"
      />
    );
  }

  return (
    <ol aria-label="VAR 覆核事件" className="space-y-3">
      {varEvents.map((e, i) => (
        <motion.li
          key={`var-${i}`}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE, delay: reduce ? 0 : i * 0.05 }}
          className="rounded-md border border-border bg-surface p-4 transition-colors duration-200 hover:border-border-strong"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2">
              <Tv className="h-4 w-4 text-text-2" strokeWidth={1.5} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-num text-sm font-semibold text-text-2 tnum">
                  {formatMinute(e.minute, aet)}
                </span>
                <span className="inline-flex items-center rounded-full border border-warn/50 bg-warn/10 px-2 py-0.5 text-caption font-medium text-warn">
                  {e.varOutcome ? VAR_OUTCOME_LABELS[e.varOutcome] : 'VAR 覆核'}
                </span>
                <span className="text-caption text-text-3">{teamNameZh(e.teamId)}</span>
              </div>
              {e.playerName && (
                <p className="mt-1.5 text-sm font-medium text-foreground">
                  {e.playerId ? (
                    <Link to={`/players/${e.playerId}`} className="transition-colors hover:text-accent">
                      {playerDisplayName(e.playerId, e.playerName)}
                    </Link>
                  ) : (
                    playerDisplayName(e.playerId, e.playerName)
                  )}
                </p>
              )}
              {e.detail && <p className="mt-1 text-caption leading-relaxed text-text-2">{e.detail}</p>}
            </div>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}
