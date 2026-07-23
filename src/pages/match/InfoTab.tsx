import { motion, useReducedMotion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import type { Match } from '@/types/football';
import type { SourceMeta as UiSourceMeta } from '@/lib/types';
import DataStatusBadge from '@/components/DataStatusBadge';
import MatchCard from '@/components/MatchCard';
import { stageFullLabel, statusText, toMatchRef, venueOf } from '@/pages/schedule/model';
import { asset } from '@/lib/asset';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const HKT = 'Asia/Hong_Kong';

interface InfoTabProps {
  match: Match;
  meta: UiSourceMeta;
  /** 同組/同階段其他賽事（已過濾本場） */
  related: Match[];
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 px-4 py-3 md:grid-cols-[10rem_1fr] md:px-5">
      <dt className="text-sm text-text-3">{label}</dt>
      <dd className="min-w-0 text-sm text-foreground">{children}</dd>
    </div>
  );
}

/**
 * match.md §6 — 資訊 tab：賽事資料 definition list + 球場圖(如有) +
 * 數據來源 SourceMeta + 相關賽事 rail。冇嘅欄位(裁判/入場人數/天氣)一律省略。
 */
export default function InfoTab({ match, meta, related }: InfoTabProps) {
  const reduce = useReducedMotion();
  const venue = venueOf(match.venueId);
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const rows: { label: string; node: React.ReactNode }[] = [
    { label: '賽事階段', node: stageFullLabel(match) },
    {
      label: '開賽(香港時間)',
      node: <span className="font-num tnum">{formatInTimeZone(new Date(match.kickoffUtc), HKT, 'yyyy年M月d日 HH:mm')}</span>,
    },
    {
      label: `開賽(本地)`,
      node: (
        <span className="font-num tnum">
          {formatInTimeZone(new Date(match.kickoffUtc), localTz, 'yyyy年M月d日 HH:mm')}
          <span className="ml-1.5 text-caption text-text-3">{localTz}</span>
        </span>
      ),
    },
  ];
  if (venue) {
    rows.push(
      { label: '球場', node: venue.stadium },
      { label: '城市', node: `${venue.city},${venue.country}` },
    );
    if (venue.capacity != null) {
      rows.push({ label: '容量', node: <span className="font-num tnum">{venue.capacity.toLocaleString()}</span> });
    }
  }
  rows.push({ label: '比賽狀態', node: statusText(match) });

  return (
    <div className="space-y-6">
      <motion.dl
        initial={reduce ? false : 'hidden'}
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: reduce ? 0 : 0.04 } },
        }}
        className="divide-y divide-border overflow-hidden rounded-md border border-border bg-surface"
      >
        {rows.map((r) => (
          <motion.div
            key={r.label}
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } },
            }}
          >
            <InfoRow label={r.label}>{r.node}</InfoRow>
          </motion.div>
        ))}
      </motion.dl>

      {/* 球場圖(只有 MetLife 有官方 duotone 圖) */}
      {match.venueId === 'metlife' && (
        <motion.figure
          initial={reduce ? false : { opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
          whileInView={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="overflow-hidden rounded-md border border-border"
        >
          <img
            src={asset("/stadium-metlife.jpg")}
            alt="MetLife Stadium 外觀(綠金雙色調)"
            className="aspect-video w-full object-cover"
            loading="lazy"
          />
          <figcaption className="bg-surface px-4 py-2 text-caption text-text-3">
            MetLife Stadium — 2026 世界盃決賽場地
          </figcaption>
        </motion.figure>
      )}

      {/* 數據來源 */}
      <div className="rounded-md border border-border bg-surface p-4 md:p-5">
        <h3 className="text-label text-text-3">數據來源</h3>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">{meta.source}</span>
          <DataStatusBadge status={meta.dataStatus} meta={meta} />
        </div>
        <dl className="mt-3 space-y-1.5 text-caption text-text-3">
          <div className="flex flex-wrap gap-x-2">
            <dt className="shrink-0">擷取時間</dt>
            <dd className="font-num tnum">{formatInTimeZone(new Date(meta.retrievedAt), HKT, 'yyyy-MM-dd HH:mm')} HKT</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="shrink-0">最後更新</dt>
            <dd className="font-num tnum">{formatInTimeZone(new Date(meta.lastUpdated), HKT, 'yyyy-MM-dd HH:mm')} HKT</dd>
          </div>
        </dl>
        {meta.sourceUrl && (
          <a
            href={meta.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors duration-200 hover:text-accent-strong"
          >
            官方報告連結
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          </a>
        )}
      </div>

      {/* 相關賽事 */}
      {related.length > 0 && (
        <section aria-label="相關賽事">
          <h3 className="mb-3 text-label text-text-3">
            {match.group ? `${match.group} 組其他賽事` : `${stageFullLabel(match)}其他賽事`}
          </h3>
          <div className="-mx-4 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6">
            <div className="flex gap-3">
              {related.map((m) => (
                <div key={m.matchId} className="w-60 shrink-0">
                  <MatchCard match={toMatchRef(m, meta.lastUpdated)} variant="compact" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
