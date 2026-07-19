import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

/** 規則編號 — serif gold numeral（standings.md §4） */
function RuleNo({ n }: { n: number }) {
  return (
    <span
      aria-hidden
      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-gold font-display text-caption font-semibold text-gold"
    >
      {n}
    </span>
  );
}

function RuleList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((text, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-text-2">
          <RuleNo n={i + 1} />
          <span className="leading-relaxed">{text}</span>
        </li>
      ))}
    </ol>
  );
}

const GROUP_RULES = [
  '積分較多者排名在前（勝 3 分、和 1 分、負 0 分）',
  '全組賽事得失球差較佳者',
  '全組賽事入球較多者',
  '同分球隊之間對賽積分較多者',
  '同分球隊之間對賽得失球差較佳者',
  '同分球隊之間對賽入球較多者',
  '公平競技分較佳者（扣分較少）',
  '由賽會抽籤決定 — 最終排名以官方公佈為準',
];

const THIRD_RULES = [
  '積分較多者',
  '得失球差較佳者',
  '入球較多者',
  '公平競技分較佳者',
  '由賽會抽籤決定 — 最終排名以官方公佈為準',
];

const FAIR_PLAY_ROWS: { label: string; points: number; tone: 'warn' | 'live' }[] = [
  { label: '黃牌', points: -1, tone: 'warn' },
  { label: '兩黃一紅（間接紅牌）', points: -3, tone: 'live' },
  { label: '直接紅牌', points: -4, tone: 'live' },
  { label: '黃牌後直接紅牌', points: -5, tone: 'live' },
];

interface RulesAccordionProps {
  sourceName: string;
  lastUpdatedLabel: string;
  isDemo: boolean;
}

/**
 * standings.md §4 — 同分排名規則 Accordion（single-open）。
 * 容器由頁面加上 id="rules" 以支援 deep link。
 */
export default function RulesAccordion({ sourceName, lastUpdatedLabel, isDemo }: RulesAccordionProps) {
  return (
    <Accordion type="single" collapsible defaultValue="group-rules" className="rounded-md border border-border bg-surface px-4">
      <AccordionItem value="group-rules" className="border-border">
        <AccordionTrigger className="py-4 font-display text-base font-semibold text-foreground hover:no-underline">
          分組賽排名準則
        </AccordionTrigger>
        <AccordionContent>
          <div className="pb-2">
            <RuleList items={GROUP_RULES} />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="third-rules" className="border-border">
        <AccordionTrigger className="py-4 font-display text-base font-semibold text-foreground hover:no-underline">
          最佳第三名如何決定
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 pb-2">
            <p className="text-sm leading-relaxed text-text-2">
              12 個小組的第 3 名會合併排名，頭 8 隊晉級 32 強。由於 48 隊賽制下 32 強需要 32 隊
              （12 組首兩名共 24 隊），其餘 8 個席位由成績最好的小組第三名填補。
            </p>
            <RuleList items={THIRD_RULES} />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="fair-play" className="border-border">
        <AccordionTrigger className="py-4 font-display text-base font-semibold text-foreground hover:no-underline">
          公平競技分計算
        </AccordionTrigger>
        <AccordionContent>
          <div className="pb-2">
            <p className="mb-3 text-sm leading-relaxed text-text-2">
              公平競技分按球員喺分組賽領受嘅牌扣分，扣分較少者排名在前：
            </p>
            <ul className="divide-y divide-border rounded-md border border-border">
              {FAIR_PLAY_ROWS.map((row) => (
                <li key={row.label} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm text-text-2">
                    <span
                      aria-hidden
                      className={cn(
                        'h-3 w-2.5 rounded-[2px]',
                        row.tone === 'warn' ? 'bg-warn' : 'bg-live',
                      )}
                    />
                    {row.label}
                  </span>
                  <span className="font-num text-sm font-semibold tnum text-foreground">{row.points}</span>
                </li>
              ))}
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="data-source" className="border-border">
        <AccordionTrigger className="py-4 font-display text-base font-semibold text-foreground hover:no-underline">
          資料來源與更新
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 pb-2 text-sm leading-relaxed text-text-2">
            <p>
              排名由本站根據已完場賽事即時推導，數據來源：{sourceName}。最後更新：{lastUpdatedLabel}。
            </p>
            <p>
              小組賽進行期間，排名會隨每場賽果更新；相同戰績需抽籤決定嘅名次，一律以賽會官方公佈為準。
            </p>
            {isDemo && (
              <p className="rounded-md border border-border bg-info-bg px-3 py-2 text-caption text-text-2">
                目前顯示「示範數據」：未連接即時數據源，內容為人手策展嘅快照，僅作介面示範用途。
              </p>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
