/**
 * ClaimText — 渲染 engine 輸出嘅 Claim.text：
 * - 行內〔Sn〕標記 → 可點擊 citation chip（design §6.10 / analysis-detail §6）
 * - popover 顯示 sourceRefs 嘅 provider、實體、fieldPath、擷取時間、live/demo
 * - 「跳至來源清單」按鈕 → 與文末來源清單聯動（scroll + highlight）
 * 渲染層唔會改寫 claim 文字，只係將標記換成互動 chip。
 */
import { useState } from 'react';
import { ArrowDownToLine } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Claim, SourceRef } from '@/lib/analysis/types';
import { entityLabel, sourceListIndex } from './model';

const HKT = 'Asia/Hong_Kong';

interface CitationChipProps {
  marker: string; // e.g. 〔S1〕
  refs: SourceRef[]; // 解讀後嘅來源（通常 1 條）
  sources: SourceRef[]; // analysis.sources（清單）
  providerName: string;
  onJumpToSource: (listIndex: number) => void;
}

function CitationChip({ marker, refs, sources, providerName, onJumpToSource }: CitationChipProps) {
  const [open, setOpen] = useState(false);
  const primary = refs[0];
  const listIndex = primary ? sourceListIndex(sources, primary) : -1;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-baseline rounded px-0.5 align-super text-[0.68em] font-semibold text-accent transition-colors duration-200 hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label={`來源標記 ${marker}，撳以查看來源資料`}
        >
          {marker}
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-80 border-border bg-popover p-3 text-caption">
        <p className="text-label text-text-3">
          來源{listIndex >= 0 ? ` S${listIndex + 1}` : ''}
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">{providerName}</p>
        <ul className="mt-2 space-y-2">
          {refs.map((r, i) => (
            <li key={i} className="rounded-sm border border-border bg-surface-2/50 p-2">
              <p className="text-foreground">
                {entityLabel(r.entity)}
                {r.entityId ? <span className="text-text-3"> · {r.entityId}</span> : null}
              </p>
              <p className="mt-0.5 font-mono text-[10px] break-all text-text-3">fieldPath: {r.fieldPath}</p>
              <p className="mt-0.5 text-text-3">
                擷取於 {formatInTimeZone(new Date(r.retrievedAt), HKT, 'yyyy-MM-dd HH:mm')} HKT ·{' '}
                {r.dataMode === 'demo' ? 'demo 示範數據' : 'live'}
              </p>
            </li>
          ))}
        </ul>
        {listIndex >= 0 && (
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onJumpToSource(listIndex);
            }}
            className="mt-2 inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-md border border-accent px-3 text-xs font-medium text-accent transition-colors duration-200 hover:bg-accent/10"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            跳至來源清單 S{listIndex + 1}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

export interface ClaimTextProps {
  claim: Claim;
  sources: SourceRef[];
  providerName: string;
  onJumpToSource: (listIndex: number) => void;
  className?: string;
}

/**
 * 將 claim.text 以〔Sn〕分段渲染。標記按出現次序對應 claim.sourceRefs 入面
 * 相同 sourceId 嘅第 n 條（engine 按事實順序附加 refs）。
 */
export default function ClaimText({ claim, sources, providerName, onJumpToSource, className }: ClaimTextProps) {
  const parts = claim.text.split(/(〔S\d+〕)/g);
  const seenBySourceId = new Map<string, number>();

  return (
    <span className={cn(className)}>
      {parts.map((part, i) => {
        const m = /^〔S(\d+)〕$/.exec(part);
        if (!m) return <span key={i}>{part}</span>;
        const sid = `S${m[1]}`;
        const all = claim.sourceRefs.filter((r) => r.sourceId === sid);
        const occurrence = seenBySourceId.get(sid) ?? 0;
        seenBySourceId.set(sid, occurrence + 1);
        const ref = all.length > 0 ? all[Math.min(occurrence, all.length - 1)] : claim.sourceRefs[0];
        if (!ref) return <span key={i}>{part}</span>; // 無來源（唔應發生，G-11 會攔）→ 原樣顯示
        return (
          <CitationChip
            key={i}
            marker={part}
            refs={[ref]}
            sources={sources}
            providerName={providerName}
            onJumpToSource={onJumpToSource}
          />
        );
      })}
    </span>
  );
}
