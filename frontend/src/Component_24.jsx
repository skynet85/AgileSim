import React, { createContext, useContext } from 'react';

interface FirebaseContextType {
  trackEvent: (name: string, params?: Record<string, any>) => void;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const trackEvent = (name: string, params?: Record<string, any>) => {
    console.log(`[Analytics MVP]: ${name}`, params || {});
  };

  return (
    <FirebaseContext.Provider value={{ trackEvent }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useAnalytics must be used within AnalyticsProvider');
  return context;
};