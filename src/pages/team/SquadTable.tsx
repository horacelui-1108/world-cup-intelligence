import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import type { Player } from '@/types/football';
import EmptyState from '@/components/EmptyState';
import { cn } from '@/lib/utils';
import { POSITION_LABELS, POSITION_ORDER } from './data';
import { SegmentedControl } from './widgets';

type SortKey = 'position' | 'goals' | 'appearances';

interface SquadTableProps {
  players: Player[];
}

/** 黃 / 紅牌圖示（CSS 矩形色塊，唔用 emoji — design §1 hard ban） */
function CardGlyph({ color }: { color: 'yellow' | 'red' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block h-3 w-2 rounded-[1px] align-middle',
        color === 'yellow' ? 'bg-warn' : 'bg-live',
      )}
    />
  );
}

/**
 * team.md Tab B — 球員名單：位置分組 + 排序切換；欄位按數據可用性顯示
 * （全隊都無該欄數據 → 成隱藏；個別球員無 → 留空，唔會當 0）。
 */
export default function SquadTable({ players }: SquadTableProps) {
  const [sort, setSort] = useState<SortKey>('position');

  const columns = useMemo(() => {
    const has = (pick: (p: Player) => unknown) => players.some((p) => pick(p) !== undefined);
    return {
      number: has((p) => p.number),
      age: has((p) => p.age),
      club: has((p) => p.club),
      appearances: has((p) => p.stats?.appearances),
      goals: has((p) => p.stats?.goals),
      assists: has((p) => p.stats?.assists),
      yellow: has((p) => p.stats?.yellow),
      red: has((p) => p.stats?.red),
    };
  }, [players]);

  const sorted = useMemo(() => {
    const list = [...players];
    if (sort === 'goals') {
      list.sort((a, b) => (b.stats?.goals ?? -1) - (a.stats?.goals ?? -1) || a.nameZh.localeCompare(b.nameZh));
    } else if (sort === 'appearances') {
      list.sort(
        (a, b) =>
          (b.stats?.appearances ?? -1) - (a.stats?.appearances ?? -1) || a.nameZh.localeCompare(b.nameZh),
      );
    } else {
      list.sort(
        (a, b) =>
          POSITION_ORDER[a.position] - POSITION_ORDER[b.position] || a.nameZh.localeCompare(b.nameZh),
      );
    }
    return list;
  }, [players, sort]);

  if (players.length === 0) {
    return (
      <EmptyState
        title="名單資料不足"
        description="供應商暫未提供此球隊嘅球員名單，請留意更新。"
      />
    );
  }

  const statColCount =
    (columns.appearances ? 1 : 0) + (columns.goals ? 1 : 0) + (columns.assists ? 1 : 0);

  const groups: { label: string | null; rows: Player[] }[] = [];
  if (sort === 'position') {
    for (const pos of ['GK', 'DF', 'MF', 'FW'] as const) {
      const rows = sorted.filter((p) => p.position === pos);
      if (rows.length > 0) groups.push({ label: POSITION_LABELS[pos], rows });
    }
  } else {
    groups.push({ label: null, rows: sorted });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption text-text-3">共 {players.length} 名球員有資料</p>
        <SegmentedControl<SortKey>
          id="squad-sort"
          ariaLabel="名單排序"
          options={[
            { value: 'position', label: '按位置' },
            { value: 'goals', label: '按入球' },
            { value: 'appearances', label: '按出場' },
          ]}
          value={sort}
          onChange={setSort}
        />
      </div>

      {groups.map((group) => (
        <section key={group.label ?? 'all'} aria-label={group.label ?? undefined}>
          {group.label && (
            <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{group.label}</h3>
          )}
          <div className="overflow-x-auto rounded-md border border-border bg-surface">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-label text-text-3">
                  {columns.number && <th scope="col" className="w-10 px-3 py-2 font-medium">#</th>}
                  <th scope="col" className="px-3 py-2 font-medium">球員</th>
                  <th scope="col" className="px-3 py-2 font-medium">位置</th>
                  {columns.age && <th scope="col" className="px-3 py-2 text-right font-medium">年齡</th>}
                  {columns.club && <th scope="col" className="px-3 py-2 font-medium">球會</th>}
                  {columns.appearances && (
                    <th scope="col" className="px-3 py-2 text-right font-medium">出場</th>
                  )}
                  {columns.goals && <th scope="col" className="px-3 py-2 text-right font-medium">入球</th>}
                  {columns.assists && (
                    <th scope="col" className="px-3 py-2 text-right font-medium">助攻</th>
                  )}
                  {(columns.yellow || columns.red) && (
                    <th scope="col" className="px-3 py-2 text-right font-medium">牌</th>
                  )}
                </tr>
              </thead>
              <motion.tbody layout="position" className="divide-y divide-border">
                {group.rows.map((p) => (
                  <motion.tr
                    key={p.id}
                    layout="position"
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="group relative transition-colors duration-150 hover:bg-surface-2"
                  >
                    {columns.number && (
                      <td className="px-3 py-2.5 font-num font-bold text-text-3 tnum">
                        {p.number ?? ''}
                      </td>
                    )}
                    <td className="px-3 py-2.5">
                      <Link
                        to={`/players/${p.id}`}
                        className="flex items-center gap-3 after:absolute after:inset-0"
                        aria-label={`${p.nameZh}（${p.nameEn}）球員頁`}
                      >
                        <img
                          src="/player-silhouette.svg"
                          alt=""
                          width={40}
                          height={40}
                          loading="lazy"
                          className="h-10 w-10 shrink-0 rounded-full border border-border bg-surface-2"
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-foreground transition-colors group-hover:text-accent">
                            {p.nameZh}
                          </span>
                          <span className="block truncate font-num text-caption text-text-3">{p.nameEn}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-caption font-medium text-text-2">
                        {POSITION_LABELS[p.position]}
                      </span>
                    </td>
                    {columns.age && (
                      <td className="px-3 py-2.5 text-right font-num tnum text-text-2">{p.age ?? ''}</td>
                    )}
                    {columns.club && <td className="px-3 py-2.5 text-text-2">{p.club ?? ''}</td>}
                    {columns.appearances && (
                      <td className="px-3 py-2.5 text-right font-num tnum text-text-2">
                        {p.stats?.appearances ?? ''}
                      </td>
                    )}
                    {columns.goals && (
                      <td className="px-3 py-2.5 text-right font-num font-semibold tnum text-foreground">
                        {p.stats?.goals ?? ''}
                      </td>
                    )}
                    {columns.assists && (
                      <td className="px-3 py-2.5 text-right font-num tnum text-text-2">
                        {p.stats?.assists ?? ''}
                      </td>
                    )}
                    {(columns.yellow || columns.red) && (
                      <td className="px-3 py-2.5">
                        <span className="flex items-center justify-end gap-1.5">
                          {p.stats?.yellow !== undefined && p.stats.yellow > 0 && (
                            <span className="inline-flex items-center gap-1" title={`黃牌 ${p.stats.yellow}`}>
                              <CardGlyph color="yellow" />
                              <span className="font-num text-caption tnum text-text-2">{p.stats.yellow}</span>
                            </span>
                          )}
                          {p.stats?.red !== undefined && p.stats.red > 0 && (
                            <span className="inline-flex items-center gap-1" title={`紅牌 ${p.stats.red}`}>
                              <CardGlyph color="red" />
                              <span className="font-num text-caption tnum text-text-2">{p.stats.red}</span>
                            </span>
                          )}
                        </span>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </section>
      ))}

      {statColCount === 0 && (
        <p className="text-caption text-text-3">
          供應商暫未提供名單內大部分球員嘅賽事統計，表格只顯示已核實欄位。
        </p>
      )}
    </div>
  );
}
