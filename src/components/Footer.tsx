import { Link } from 'react-router';
import { formatInTimeZone } from 'date-fns-tz';
import { useLang } from '@/lib/lang';
import type { ChromeKey } from '@/lib/lang';
import DataStatusBadge from '@/components/DataStatusBadge';
import type { DataStatus } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const SITEMAP: { to: string; key: ChromeKey }[] = [
  { to: '/', key: 'nav.home' },
  { to: '/schedule', key: 'nav.schedule' },
  { to: '/standings', key: 'nav.standings' },
  { to: '/bracket', key: 'nav.bracket' },
  { to: '/analysis', key: 'nav.analysis' },
];

const LEGEND: { status: DataStatus; meaning: string }[] = [
  { status: 'LIVE', meaning: '比賽進行中,數據即時更新' },
  { status: 'FINAL', meaning: '比賽已完場,比分確認' },
  { status: 'VERIFIED', meaning: '數據已核實來源' },
  { status: 'PENDING', meaning: '等待官方或供應商確認' },
  { status: 'DEMO', meaning: '示範數據,非即時真實資料' },
];

interface FooterProps {
  /** provider lastUpdated ISO — shown in provenance block */
  lastUpdated?: string;
  sourceName?: string;
  /** home addition: full data-source legend row (design §8 home) */
  showLegend?: boolean;
}

/**
 * design.md §6.2 — three zones: provenance, sitemap + tournament note,
 * disclaimer. Caption size, --text-3.
 */
export default function Footer({
  lastUpdated = '2026-07-19T06:32:00Z',
  sourceName = 'Demo Provider',
  showLegend = false,
}: FooterProps) {
  const { t } = useLang();
  const updatedHkt = formatInTimeZone(new Date(lastUpdated), 'Asia/Hong_Kong', 'yyyy-MM-dd HH:mm');

  return (
    <footer className="border-t border-border bg-surface pb-[calc(64px+env(safe-area-inset-bottom)+2rem)] text-text-3 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {showLegend && (
          <div className="mb-8 rounded-md border border-border bg-surface-2/40 p-4">
            <p className="text-label text-text-2">數據狀態說明</p>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
              {LEGEND.map((l) => (
                <li key={l.status} className="flex items-center gap-2">
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={0} className="inline-flex rounded-full">
                          <DataStatusBadge status={l.status} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-56 text-caption">
                        {l.meaning}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="text-caption">{l.meaning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-3">
          {/* 1. provenance */}
          <div>
            <p className="text-label text-text-2">{t('footer.sources')}</p>
            <p className="mt-2 text-caption">
              資料來源: {sourceName} · 最後更新 {updatedHkt} HKT
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <DataStatusBadge status="DEMO" />
              <DataStatusBadge status="VERIFIED" />
              <DataStatusBadge status="PENDING" />
            </div>
          </div>

          {/* 2. sitemap + tournament note */}
          <div>
            <p className="text-label text-text-2">網站地圖</p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
              {SITEMAP.map((s) => (
                <li key={s.to}>
                  <Link to={s.to} className="text-caption text-text-2 transition-colors hover:text-accent">
                    {t(s.key)}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-caption">{t('footer.adapterNote')}</p>
          </div>

          {/* 3. disclaimer */}
          <div>
            <p className="text-label text-text-2">免責聲明</p>
            <p className="mt-2 text-caption">{t('footer.disclaimer')}</p>
            <p className="mt-2 text-caption">
              © 2026 {t('app.fullName')} · Not affiliated with FIFA.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
