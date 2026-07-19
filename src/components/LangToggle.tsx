import { useLang } from '@/lib/lang';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * design.md §6.11 — 中 | EN mini control. EN is selectable and switches
 * chrome strings (nav/buttons/labels); full EN body copy ships later,
 * so EN carries a「即將推出」tooltip notice.
 */
export default function LangToggle({ className }: { className?: string }) {
  const { lang, setLang, t } = useLang();

  return (
    <div
      role="group"
      aria-label="語言切換 Language"
      className={cn('inline-flex items-center rounded-full border border-border bg-surface p-0.5', className)}
    >
      <button
        type="button"
        aria-pressed={lang === 'tc'}
        onClick={() => setLang('tc')}
        className={cn(
          'rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors duration-200',
          lang === 'tc' ? 'bg-surface-2 text-foreground' : 'text-text-3 hover:text-text-2',
        )}
      >
        中
      </button>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-pressed={lang === 'en'}
              aria-describedby="lang-en-note"
              onClick={() => setLang('en')}
              className={cn(
                'relative rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors duration-200',
                lang === 'en' ? 'bg-surface-2 text-foreground' : 'text-text-3 hover:text-text-2',
              )}
            >
              EN
              <span
                className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-warn"
                aria-hidden
              />
            </button>
          </TooltipTrigger>
          <TooltipContent id="lang-en-note" side="bottom" className="text-caption">
            {t('lang.notice')}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
