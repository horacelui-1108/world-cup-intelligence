import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import type { GroupLetter, Stage } from '@/types/football';
import { cn } from '@/lib/utils';
import FilterChip from '@/components/FilterChip';
import SegmentedControl from '@/components/SegmentedControl';
import TimezoneToggle from '@/components/TimezoneToggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ALL_TEAMS, GROUP_LETTERS, STAGE_LABELS, crestPath } from './model';
import type { FilterStatus, ScheduleFilters, ScheduleView } from './filters';
import { hasActiveFilters } from './filters';

export interface StatusCounts {
  scheduled: number;
  live: number;
  finished: number;
}

interface ScheduleFilterBarProps {
  filters: ScheduleFilters;
  onChange: (patch: Partial<ScheduleFilters>) => void;
  onClear: () => void;
  /** 狀態 chip 計數（已套用 status 以外嘅篩選） */
  counts: StatusCounts;
  /** 「全部」chip 計數（status 以外篩選後嘅總數,含 postponed） */
  allCount: number;
  shown: number;
  total: number;
}

const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'scheduled', label: '未開始' },
  { value: 'live', label: '進行中' },
  { value: 'finished', label: '已完成' },
];

const STAGE_OPTIONS: { value: Stage; label: string }[] = [
  { value: 'GROUP', label: '小組賽' },
  { value: 'R32', label: '32強' },
  { value: 'R16', label: '16強' },
  { value: 'QF', label: '8強' },
  { value: 'SF', label: '四強' },
  { value: '3P', label: '季軍戰' },
  { value: 'F', label: '決賽' },
];

/** 搜尋輸入：200ms debounce 後寫入 URL */
function SearchInput({ value, onChange }: { value: string; onChange: (q: string) => void }) {
  const [local, setLocal] = useState(value);

  // 外部變更（如清除篩選）時同步 — render 期間調整 state（React 官方模式）
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setLocal(value);
  }

  useEffect(() => {
    if (local === value) return;
    const t = window.setTimeout(() => onChange(local), 200);
    return () => window.clearTimeout(t);
  }, [local, value, onChange]);

  return (
    <div className="relative min-w-0 flex-1 sm:max-w-72">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3"
        strokeWidth={1.5}
        aria-hidden
      />
      <input
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="搜尋球隊、球場、城市…"
        aria-label="搜尋球隊、球場、城市"
        className="h-9 w-full rounded-md border border-border bg-surface-2 pl-9 pr-8 text-sm text-foreground placeholder:text-text-3 focus-visible:border-border-strong"
      />
      {local && (
        <button
          type="button"
          onClick={() => {
            setLocal('');
            onChange('');
          }}
          aria-label="清除搜尋"
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-text-3 transition-colors hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
        </button>
      )}
    </div>
  );
}

/** 球隊篩選：可搜尋 dropdown（中文名/英文名/FIFA code），選取後顯示可移除 chip */
function TeamSelect({ value, onChange }: { value: string; onChange: (teamId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = ALL_TEAMS.find((t) => t.id === value);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_TEAMS;
    return ALL_TEAMS.filter(
      (t) =>
        t.nameZh.toLowerCase().includes(q) ||
        t.nameEn.toLowerCase().includes(q) ||
        t.code3.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="按球隊篩選"
            aria-expanded={open}
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors duration-200',
              selected
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-text-2 hover:border-border-strong hover:text-foreground',
            )}
          >
            球隊
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 border-border bg-popover p-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-3"
              strokeWidth={1.5}
              aria-hidden
            />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="輸入隊名或代碼…"
              aria-label="搜尋球隊"
              className="h-8 w-full rounded-md border border-border bg-surface-2 pl-8 pr-2 text-sm text-foreground placeholder:text-text-3"
            />
          </div>
          <ul role="listbox" aria-label="球隊清單" className="mt-2 max-h-64 overflow-y-auto">
            {list.length === 0 && (
              <li className="px-2 py-4 text-center text-caption text-text-3">沒有符合的球隊</li>
            )}
            {list.map((t) => {
              const active = t.id === value;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(t.id);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-150',
                      active ? 'bg-accent/10 text-accent' : 'text-foreground hover:bg-surface-2',
                    )}
                  >
                    <img src={crestPath(t.id)} alt="" width={20} height={20} className="rounded-full" loading="lazy" />
                    <span className="min-w-0 flex-1 truncate">{t.nameZh}</span>
                    <span className="font-num text-caption text-text-3">{t.code3}</span>
                    <span className="text-caption text-text-3">{t.group} 組</span>
                    {active && <Check className="h-3.5 w-3.5 text-accent" strokeWidth={2} aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        </PopoverContent>
      </Popover>
      {selected && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent/10 py-1 pl-2 pr-1 text-sm font-medium text-accent">
          <img src={crestPath(selected.id)} alt="" width={16} height={16} className="rounded-full" />
          {selected.nameZh}
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label={`移除球隊篩選：${selected.nameZh}`}
            className="flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-accent/20"
          >
            <X className="h-3 w-3" strokeWidth={2} aria-hidden />
          </button>
        </span>
      )}
    </div>
  );
}

/**
 * schedule.md §1 — sticky filter bar（黐喺 navbar 下）：視圖切換、搜尋、
 * 時區切換、狀態 chips、階段 Select、組別 chips A–L、球隊篩選、結果計數。
 */
export default function ScheduleFilterBar({
  filters,
  onChange,
  onClear,
  counts,
  allCount,
  shown,
  total,
}: ScheduleFilterBarProps) {
  const localTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', []);
  const active = hasActiveFilters(filters);

  const toggleStatus = (s: FilterStatus) => {
    const next = new Set(filters.status);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    onChange({ status: next });
  };

  return (
    <div className="sticky top-14 z-30 border-b border-border bg-surface/95 backdrop-blur md:top-16">
      <div className="mx-auto max-w-7xl space-y-2.5 px-4 py-3 md:px-6">
        {/* Row 1：視圖 + 搜尋 + 時區 */}
        <div className="flex flex-wrap items-center gap-2.5">
          <SegmentedControl<ScheduleView>
            ariaLabel="賽程視圖：按日期或按分組"
            value={filters.view}
            onChange={(view) => onChange({ view })}
            options={[
              { value: 'date', label: '按日期' },
              { value: 'group', label: '按分組' },
            ]}
          />
          <SearchInput value={filters.q} onChange={(q) => onChange({ q })} />
          <div className="ml-auto flex items-center gap-2">
            <TimezoneToggle />
            <span className="hidden text-caption text-text-3 lg:inline">本地:{localTz}</span>
          </div>
        </div>

        {/* Row 2：狀態 chips + 階段 Select */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            label="全部"
            selected={filters.status.size === 0}
            onClick={() => onChange({ status: new Set<FilterStatus>() })}
            count={allCount}
          />
          {STATUS_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label}
              selected={filters.status.has(opt.value)}
              onClick={() => toggleStatus(opt.value)}
              count={counts[opt.value]}
            />
          ))}
          <div className="max-sm:w-full sm:ml-auto">
            <Select
              value={filters.stage || 'ALL'}
              onValueChange={(v) => onChange({ stage: v === 'ALL' ? '' : (v as Stage) })}
            >
              <SelectTrigger
                size="sm"
                aria-label="按階段篩選"
                className="h-9 w-full border-border bg-surface text-sm text-foreground sm:w-36"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover">
                <SelectItem value="ALL">全部階段</SelectItem>
                {STAGE_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {STAGE_LABELS[s.value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 3：組別 chips A–L + 球隊篩選 */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="按組別篩選"
            className="flex max-w-full items-center gap-1.5 overflow-x-auto pb-0.5"
          >
            {GROUP_LETTERS.map((g: GroupLetter) => {
              const selectedGroup = filters.group === g;
              return (
                <button
                  key={g}
                  type="button"
                  aria-pressed={selectedGroup}
                  onClick={() => onChange({ group: selectedGroup ? '' : g })}
                  className={cn(
                    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-num text-sm font-semibold transition-colors duration-200',
                    selectedGroup
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-text-2 hover:border-border-strong hover:text-foreground',
                  )}
                >
                  {g}
                </button>
              );
            })}
          </div>
          <TeamSelect value={filters.team} onChange={(team) => onChange({ team })} />
        </div>

        {/* Row 4：結果計數 + 清除篩選 */}
        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-2">
          <p aria-live="polite" className="text-caption text-text-3">
            顯示 <span className="font-num font-semibold text-text-2 tnum">{shown}</span> /{' '}
            <span className="font-num tnum">{total}</span> 場
          </p>
          {active && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 text-caption font-medium text-accent transition-colors duration-200 hover:text-accent-strong"
            >
              <X className="h-3 w-3" strokeWidth={2} aria-hidden />
              清除全部篩選
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
