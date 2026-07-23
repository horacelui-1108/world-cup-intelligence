import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './index.css';
import App from './App.tsx';
import { ThemeProvider } from '@/lib/theme';
import { LangProvider } from '@/lib/lang';
import { TimezoneProvider } from '@/lib/timezone';

// Note: no React.StrictMode — canvas/GSAP effects must not run twice.
createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <ThemeProvider>
      <LangProvider>
        <TimezoneProvider>
          <App />
        </TimezoneProvider>
      </LangProvider>
    </ThemeProvider>
  </BrowserRouter>,
);
