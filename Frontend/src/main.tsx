import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary';
import {AuthProvider} from './context/AuthContext';
import {ToastProvider} from './context/ToastContext';
import {initLanguage} from './i18n/runtime';
import './index.css';

// La langue est appliquée avant le premier rendu : pas d'affichage furtif du français.
void initLanguage().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ToastProvider>
        <AuthProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </AuthProvider>
      </ToastProvider>
    </StrictMode>,
  );
});
