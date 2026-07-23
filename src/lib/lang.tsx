import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Language context — v1 ships 繁體中文 content; the EN toggle switches
 * chrome strings (nav / buttons / labels) only, per design.md §6.11.
 * Body/editorial content remains TC with a「即將推出」notice.
 */

export type Lang = 'tc' | 'en';

const STORAGE_KEY = 'wc26-lang';

const chrome = {
  'app.name': { tc: 'WC26 情報站', en: 'WC26 Hub' },
  'app.fullName': { tc: '世界盃賽事情報站', en: 'World Cup Intelligence Hub' },
  'nav.home': { tc: '主頁', en: 'Home' },
  'nav.schedule': { tc: '賽程', en: 'Schedule' },
  'nav.standings': { tc: '排名', en: 'Standings' },
  'nav.bracket': { tc: '淘汰賽', en: 'Bracket' },
  'nav.analysis': { tc: '分析', en: 'Analysis' },
  'nav.teams': { tc: '球隊', en: 'Teams' },
  'tz.local': { tc: '本地', en: 'Local' },
  'tz.hkt': { tc: '香港時間', en: 'HK Time' },
  'theme.toLight': { tc: '切換至淺色模式', en: 'Switch to light mode' },
  'theme.toDark': { tc: '切換至深色模式', en: 'Switch to dark mode' },
  'lang.notice': { tc: 'English 內容即將推出', en: 'Full English content coming soon' },
  'footer.sources': { tc: '資料來源', en: 'Data source' },
  'footer.disclaimer': {
    tc: '本站為非官方賽事情報網站,所有數據僅供參考。',
    en: 'Unofficial intelligence site. All data for reference only.',
  },
  'footer.adapterNote': { tc: '系統支援切換至其他賽事', en: 'Adapter-ready for other tournaments' },
  'common.retry': { tc: '重試', en: 'Retry' },
  'common.loading': { tc: '載入中…', en: 'Loading…' },
  'common.lastUpdated': { tc: '最後更新', en: 'Last updated' },
  'common.favorite': { tc: '收藏', en: 'Favorite' },
  'common.dismiss': { tc: '關閉', en: 'Dismiss' },
  'common.unfavorite': { tc: '取消收藏', en: 'Remove favorite' },
} as const;

export type ChromeKey = keyof typeof chrome;

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: ChromeKey) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: 'tc',
  setLang: () => {},
  t: (k) => chrome[k].tc,
});

function initialLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'tc';
  } catch {
    return 'tc';
  }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const value = useMemo<LangContextValue>(
    () => ({
      lang,
      setLang: (l: Lang) => {
        setLangState(l);
        try {
          localStorage.setItem(STORAGE_KEY, l);
        } catch {
          /* private mode */
        }
        document.documentElement.lang = l === 'en' ? 'en' : 'zh-Hant';
      },
      t: (k: ChromeKey) => chrome[k][lang],
    }),
    [lang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLang() {
  return useContext(LangContext);
}
