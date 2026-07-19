/**
 * SourceList — 分析資料來源清單（framework §i / analysis-detail §4）。
 * 每行：Sn 編號 · provider · 數據實體 · fieldPath · 擷取時間 · live/demo。
 * 與行內〔Sn〕聯動：父層傳入 highlightIndex 時該行金色閃爍 1.2s。
 * demo 來源行帶「示範數據」badge（G-12 不可移除）。
 */
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { cn } from '@/lib/utils';
import DataStatusBadge from '@/components/DataStatusBadge';
import type { SourceRef } from '@/lib/analysis/types';
import type { SourceMeta as UiSourceMeta } from '@/lib/types';
import { entityLabel } from './model';

const HKT = 'Asia/Hong_Kong';

interface SourceRowProps {
  index: number;
  sourceRef: SourceRef;
  providerName: string;
  providerUrl?: string;
  highlighted: boolean;
}

function SourceRow({ index, sourceRef, providerName, providerUrl, highlighted }: SourceRowProps) {
  const [copied, setCopied] = useState(false);
  const demo = sourceRef.dataMode === 'demo';
  const meta: UiSourceMeta = {
    source: providerName,
    sourceUrl: providerUrl,
    retrievedAt: sourceRef.retrievedAt,
    lastUpdated: sourceRef.retrievedAt,
    dataStatus: 'DEMO',
  };

  const copyCitation = async () => {
    const text = `S${index + 1} — ${providerName} · ${entityLabel(sourceRef.entity)} · ${sourceRef.fieldPath} · 擷取於 ${sourceRef.retrievedAt} · ${sourceRef.dataMode}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard 唔可用時用 fallback（非安全上下文）
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <li
      id={`source-row-${index}`}
      className={cn(
        'flex items-start gap-3 rounded-md border border-transparent p-3 transition-colors duration-300',
        highlighted && 'animate-[flash-gold_1.2s_ease-out] border-gold/50',
      )}
    >
      <span className="mt-0.5 inline-flex h-6 w-8 shrink-0 items-center justify-center rounded-sm border border-border bg-surface-2 font-num text-caption font-semibold text-accent">
        S{index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          {providerName}
          {providerUrl && (
            <a
              href={providerUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-2 text-caption font-normal text-accent underline-offset-2 hover:underline"
            >
              來源連結
            </a>
          )}
        </p>
        <p className="mt-0.5 text-caption text-text-2">
          {entityLabel(sourceRef.entity)}
          {sourceRef.entityId ? ` · ${sourceRef.entityId}` : ''} ·{' '}
          <span className="font-mono text-[10px] text-text-3">{sourceRef.fieldPath}</span>
        </p>
        <p className="mt-0.5 text-caption text-text-3">
          擷取於 {formatInTimeZone(new Date(sourceRef.retrievedAt), HKT, 'yyyy-MM-dd HH:mm')} HKT
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {demo ? (
          <DataStatusBadge status="DEMO" meta={meta} />
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/50 px-2 py-0.5 text-caption font-medium text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            Live
          </span>
        )}
        <button
          type="button"
          onClick={copyCitation}
          className="inline-flex min-h-9 items-center gap-1 rounded-md border border-border px-2 text-caption text-text-3 transition-colors duration-200 hover:border-border-strong hover:text-foreground"
          aria-label={`複製來源 S${index + 1} 引用格式`}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} aria-hidden />
          ) : (
            <Copy className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          )}
          {copied ? '已複製' : '複製引用'}
        </button>
      </div>
    </li>
  );
}

interface SourceListProps {
  sources: SourceRef[];
  providerName: string;
  providerUrl?: string;
  highlightIndex: number | null;
}

export default function SourceList({ sources, providerName, providerUrl, highlightIndex }: SourceListProps) {
  if (sources.length === 0) {
    return <p className="text-caption text-text-3">呢篇分析冇可追溯嘅來源記錄。</p>;
  }
  return (
    <ol className="divide-y divide-border overflow-hidden rounded-md border border-border bg-surface">
      {sources.map((r, i) => (
        <SourceRow
          key={`${r.sourceId}|${r.entity}|${r.entityId ?? ''}|${r.fieldPath}|${i}`}
          index={i}
          sourceRef={r}
          providerName={providerName}
          providerUrl={providerUrl}
          highlighted={highlightIndex === i}
        />
      ))}
    </ol>
  );
}
