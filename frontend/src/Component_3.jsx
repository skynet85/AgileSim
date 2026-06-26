import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AnalyticsProvider } from './services/analytics/FirebaseTracker';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AnalyticsProvider>
      <App />
    </AnalyticsProvider>
  </React.StrictMode>
);