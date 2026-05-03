import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { LanguageProvider } from './contexts/LanguageContext.tsx'

// Surface silent runtime errors so a "blank screen" stops being invisible.
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    console.error('[GlobalError]', e.message, e.error);
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.error('[UnhandledRejection]', e.reason);
  });
}

// StrictMode intentionally disabled: it double-mounts auth providers in
// development, which caused the regional portal to race against Supabase
// session restoration and briefly bounce to the login page.
createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
