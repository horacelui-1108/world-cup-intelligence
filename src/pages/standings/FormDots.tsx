import { cn } from '@/lib/utils';
import type { FormResult } from '@/components/TeamChip';

const dotColor: Record<FormResult, string> = {
  W: 'bg-win',
  D: 'bg-draw',
  L: 'bg-live',
};

const textColor: Record<FormResult, string> = {
  W: 'text-win',
  D: 'text-draw',
  L: 'text-live',
};

const label: Record<FormResult, string> = {
  W: '勝',
  D: '和',
  L: '負',
};

interface FormDotsProps {
  /** 近績，最舊 → 最新 */
  form: FormResult[];
  className?: string;
}

/**
 * 近況 W/D/L — 色點 + 字母成對出現（顏色永遠唔係唯一載體，design §2）。
 * 最新一場喺最右。
 */
export default function FormDots({ form, className }: FormDotsProps) {
  const last5 = form.slice(-5);
  if (last5.length === 0) {
    return <span className={cn('text-caption text-text-3', className)}>—</span>;
  }
  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      role="img"
      aria-label={`近況（最舊至最新）：${last5.map((f) => label[f]).join('、')}`}
    >
      {last5.map((f, i) => (
        <span key={i} className="inline-flex items-center gap-0.5" title={label[f]}>
          <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', dotColor[f])} />
          <span aria-hidden className={cn('font-num text-[10px] font-semibold leading-none', textColor[f])}>
            {f}
          </span>
        </span>
      ))}
    </span>
  );
}
