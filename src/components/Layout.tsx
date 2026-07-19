import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { LAST_UPDATED, SOURCE_NAME } from '@/pages/home/data';

/**
 * Nested-route layout (pattern B): renders <Outlet/>, so App.tsx must use
 * nested <Route> children. Owns the mobile bottom-tab-bar offset — pages
 * must NOT add their own nav-height padding (react-dev.md contract).
 */
export default function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg text-text">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      {/* Footer owns bottom padding to clear the 64px mobile tab bar;
          home gets the extra data-source legend row (home.md §8) */}
      <Footer showLegend={pathname === '/'} lastUpdated={LAST_UPDATED} sourceName={SOURCE_NAME} />
    </div>
  );
}
