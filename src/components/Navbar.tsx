import { Link, NavLink, useLocation } from 'react-router';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  ChevronDown,
  Home,
  ListOrdered,
  Newspaper,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLang } from '@/lib/lang';
import type { ChromeKey } from '@/lib/lang';
import ThemeToggle from '@/components/ThemeToggle';
import LangToggle from '@/components/LangToggle';
import TimezoneToggle from '@/components/TimezoneToggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { asset } from '@/lib/asset';

const NAV_ITEMS: { to: string; key: ChromeKey; icon: typeof Home }[] = [
  { to: '/', key: 'nav.home', icon: Home },
  { to: '/schedule', key: 'nav.schedule', icon: CalendarDays },
  { to: '/standings', key: 'nav.standings', icon: ListOrdered },
  { to: '/bracket', key: 'nav.bracket', icon: Trophy },
  { to: '/analysis', key: 'nav.analysis', icon: Newspaper },
];

function isActive(pathname: string, to: string) {
  if (to === '/') return pathname === '/';
  if (to === '/schedule') return pathname.startsWith('/schedule') || pathname.startsWith('/matches');
  return pathname.startsWith(to);
}

/** Tournament switcher — adapter-ready note per design §6.1/§6.2 */
function TournamentSwitcher() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="切換賽事"
          className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm text-text-2 transition-colors duration-200 hover:text-foreground"
        >
          <span className="max-w-28 truncate font-medium">2026 世界盃</span>
          <ChevronDown className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 border-border bg-popover p-3">
        <p className="text-label text-text-3">目前賽事</p>
        <p className="mt-1 text-sm font-medium text-foreground">2026 FIFA World Cup</p>
        <p className="mt-2 border-t border-border pt-2 text-caption text-text-3">
          系統支援切換至其他賽事,更多賽事即將推出。
        </p>
      </PopoverContent>
    </Popover>
  );
}

function Logo() {
  const { t } = useLang();
  return (
    <Link to="/" className="flex items-center gap-2" aria-label={t('app.fullName')}>
      <img src={asset("/logo.svg")} alt="" width={28} height={28} />
      <span className="font-display text-base font-bold tracking-wide text-foreground">
        {t('app.name')}
      </span>
    </Link>
  );
}

export default function Navbar() {
  const { pathname } = useLocation();
  const { t } = useLang();

  return (
    <>
      {/* ===== Top bar (mobile 56px / desktop 64px, sticky, backdrop-blur) ===== */}
      <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 md:h-16 md:px-6">
          <div className="flex items-center gap-1 md:gap-6">
            <Logo />
            <span className="md:hidden">
              <TournamentSwitcher />
            </span>
            {/* Desktop horizontal nav */}
            <nav aria-label="主導覽" className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative px-3 py-2 text-sm font-medium transition-colors duration-200',
                      active ? 'text-accent' : 'text-text-2 hover:text-foreground',
                    )}
                  >
                    {t(item.key)}
                    {active && (
                      <motion.span
                        layoutId="nav-underline"
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-x-3 -bottom-[13px] h-px bg-accent"
                        aria-hidden
                      />
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-1.5 md:gap-3">
            <TimezoneToggle className="hidden md:inline-flex" />
            <ThemeToggle />
            <LangToggle />
          </div>
        </div>
      </header>

      {/* ===== Mobile bottom tab bar (64px fixed) ===== */}
      <nav
        aria-label="底部導覽"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="grid h-16 grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.to);
            const Icon = item.icon;
            return (
              <li key={item.to} className="relative">
                {active && (
                  <motion.span
                    layoutId="tab-indicator"
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-accent"
                    aria-hidden
                  />
                )}
                <NavLink
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-16 flex-col items-center justify-center gap-1 transition-colors duration-200',
                    active ? 'text-accent' : 'text-text-3',
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                  <span className="text-[10px] font-medium leading-none">{t(item.key)}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
