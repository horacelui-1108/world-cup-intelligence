import type { GroupLetter, Stage } from '@/types/football';
import type { UiStatus } from './model';

export type ScheduleView = 'date' | 'group';

/** 可篩選嘅狀態（postponed 只會喺「全部」出現） */
export type FilterStatus = Extract<UiStatus, 'scheduled' | 'live' | 'finished'>;

export interface ScheduleFilters {
  view: ScheduleView;
  q: string;
  stage: Stage | '';
  group: GroupLetter | '';
  team: string;
  /** 空 set = 全部 */
  status: ReadonlySet<FilterStatus>;
}

export const DEFAULT_FILTERS: ScheduleFilters = {
  view: 'date',
  q: '',
  stage: '',
  group: '',
  team: '',
  status: new Set<FilterStatus>(),
};

const VALID_STAGES = new Set(['GROUP', 'R32', 'R16', 'QF', 'SF', '3P', 'F']);
const VALID_GROUPS = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']);
const VALID_STATUS = new Set<FilterStatus>(['scheduled', 'live', 'finished']);

/** URL search params → 篩選狀態（refresh 可還原、可分享） */
export function filtersFromParams(sp: URLSearchParams): ScheduleFilters {
  const view = sp.get('view') === 'group' ? 'group' : 'date';
  const stageRaw = sp.get('stage') ?? '';
  const groupRaw = sp.get('group') ?? '';
  const status = new Set<FilterStatus>();
  for (const s of (sp.get('status') ?? '').split(',')) {
    if (VALID_STATUS.has(s as FilterStatus)) status.add(s as FilterStatus);
  }
  return {
    view,
    q: sp.get('q') ?? '',
    stage: VALID_STAGES.has(stageRaw) ? (stageRaw as Stage) : '',
    group: VALID_GROUPS.has(groupRaw) ? (groupRaw as GroupLetter) : '',
    team: sp.get('team') ?? '',
    status,
  };
}

/** 篩選狀態 → URL search params（只寫非預設值，保持 URL 乾淨） */
export function paramsFromFilters(f: ScheduleFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.view !== 'date') sp.set('view', f.view);
  if (f.q) sp.set('q', f.q);
  if (f.stage) sp.set('stage', f.stage);
  if (f.group) sp.set('group', f.group);
  if (f.team) sp.set('team', f.team);
  if (f.status.size > 0) sp.set('status', [...f.status].join(','));
  return sp;
}

/** 除 view 之外是否有任何生效篩選（決定「清除篩選」按鈕顯示） */
export function hasActiveFilters(f: ScheduleFilters): boolean {
  return Boolean(f.q || f.stage || f.group || f.team || f.status.size > 0);
}
