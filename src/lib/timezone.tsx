import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type TzMode = 'local' | 'hkt';

interface TimezoneContextValue {
  mode: TzMode;
  setMode: (m: TzMode) => void;
  toggle: () => void;
  /** IANA zone currently in effect */
  timeZone: string;
  /** Short pill label: 「HKT」 or 「本地」 */
  label: string;
}

const STORAGE_KEY = 'wc26-tz';
const HKT = 'Asia/Hong_Kong';

const TimezoneContext = createContext<TimezoneContextValue>({
  mode: 'local',
  setMode: () => {},
  toggle: () => {},
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  label: '本地',
});

function initialMode(): TzMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'hkt' ? 'hkt' : 'local';
  } catch {
    return 'local';
  }
}

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<TzMode>(initialMode);

  const value = useMemo<TimezoneContextValue>(() => {
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    return {
      mode,
      setMode: (m: TzMode) => {
        setModeState(m);
        try {
          localStorage.setItem(STORAGE_KEY, m);
        } catch {
          /* private mode */
        }
      },
      toggle: () => {
        const next = mode === 'hkt' ? 'local' : 'hkt';
        setModeState(next);
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {
          /* private mode */
        }
      },
      timeZone: mode === 'hkt' ? HKT : local,
      label: mode === 'hkt' ? 'HKT' : '本地',
    };
  }, [mode]);

  return <TimezoneContext.Provider value={value}>{children}</TimezoneContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTimezone() {
  return useContext(TimezoneContext);
}
