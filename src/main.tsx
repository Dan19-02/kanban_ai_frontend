import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/public-sans';
import '@fontsource-variable/besley';
import App from './App.tsx';
import { AuthProvider } from './auth/AuthContext';
import { restorePathAfterRedirect } from './lib/lastPath';
import './index.css';

// Must run before the router reads the address.
restorePathAfterRedirect();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
