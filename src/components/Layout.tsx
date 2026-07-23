import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLang } from '@/lib/lang';
import { LAST_UPDATED, SOURCE_NAME } from '@/pages/home/data';

/**
 * Nested-route layout (pattern B): renders <Outlet/>, so App.tsx must use
 * nested <Route> children. Owns the mobile bottom-tab-bar offset — pages
 * must NOT add their own nav-height padding (react-dev.md contract).
 */
export default function Layout() {
  const { pathname } = useLocation();
  const { lang, t } = useLang();
  const [langNoticeDismissed, setLangNoticeDismissed] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // 切返中文時重設提示
  useEffect(() => {
    if (lang === 'tc') setLangNoticeDismissed(false);
  }, [lang]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg text-text">
      <Navbar />
      {lang === 'en' && !langNoticeDismissed && (
        <div role="status" className="border-b border-border bg-surface px-4 py-2 text-center text-caption text-text-2">
          {t('lang.notice')}
          <button
            type="button"
            onClick={() => setLangNoticeDismissed(true)}
            className="ml-3 underline underline-offset-2 hover:text-text"
            aria-label={t('common.dismiss')}
          >
            {t('common.dismiss')}
          </button>
        </div>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
      {/* Footer owns bottom padding to clear the 64px mobile tab bar;
          home gets the extra data-source legend row (home.md §8) */}
      <Footer showLegend={pathname === '/'} lastUpdated={LAST_UPDATED} sourceName={SOURCE_NAME} />
    </div>
  );
}
