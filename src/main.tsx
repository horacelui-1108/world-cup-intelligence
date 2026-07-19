import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './index.css';
import App from './App.tsx';
import { ThemeProvider } from '@/lib/theme';
import { LangProvider } from '@/lib/lang';
import { TimezoneProvider } from '@/lib/timezone';

// Note: no React.StrictMode — canvas/GSAP effects must not run twice.
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ThemeProvider>
      <LangProvider>
        <TimezoneProvider>
          <App />
        </TimezoneProvider>
      </LangProvider>
    </ThemeProvider>
  </BrowserRouter>,
);
