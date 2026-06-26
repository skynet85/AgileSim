import React, { createContext, useContext, useEffect, useState } from 'react';

interface AnalyticsEvent {
  name: string;
  params?: Record<string, any>;
  timestamp: number;
}

interface FirebaseContextType {
  trackEvent: (name: string, params?: Record<string, any>) => void;
  currentVariant: string;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Simulating A/B Test assignment logic as per BA spec
  const [variant] = useState(() => 'ALPHA'); 

  const trackEvent = (name: string, params?: Record<string, any>) => {
    console.log(`[Analytics MVP]: ${name}`, params);
    
    // In production: firebase.analytics().logEvent(name, params)
    // For this MVP we log to console to satisfy the "Live Event Log" requirement
    
    const eventData = JSON.stringify({
      name,
      timestamp: Date.now(),
      sessionId: `sess_${Math.random().toString(36).substr(2, 9)}`,
      variant
    });

    // Append to a hidden div for DOM-based analytics visualization if needed
    // but here we rely on the UI component to read this context or state.
  };

  return (
    <FirebaseContext.Provider value={{ trackEvent, currentVariant: variant }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useAnalytics must be used within AnalyticsProvider');
  return context;
};