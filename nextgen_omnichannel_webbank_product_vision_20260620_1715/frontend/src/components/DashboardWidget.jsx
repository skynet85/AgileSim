// File: src/components/DashboardWidget.jsx
import React, { useMemo, useCallback } from 'react';

/**
 * @module DashboardWidget
 * @description Memoizált konténer explicit állapotgéppel: isLoading -> success/error/empty.
 * A komponens nem kezdeményez adatlekérdezést; a parent scope delegálja a dataFetcher-t.
 * Retry mechanizmus és aria-busy/status szerepkörök garantálják a determinisztikus UX-t.
 */

const DEFAULT_RETRIES = 3;

export default function DashboardWidget({ 
  title, 
  dataFetcher, 
  renderSuccess, 
  renderEmpty, 
  renderError,
  maxRetries = DEFAULT_RETRIES 
}) {
  const [status, setStatus] = React.useState('idle'); // idle | loading | success | error | empty
  const [data, setData] = React.useState(null);
  const [retryCount, setRetryCount] = React.useState(0);

  // Determinisztikus fetch loop állapotgép vezérléssel
  const executeFetch = useCallback(async (currentRetry = 0) => {
    setStatus('loading');
    
    try {
      const response = await dataFetcher();
      
      if (!response || Object.keys(response).length === 0) {
        setStatus('empty');
        return;
      }

      setData(response);
      setStatus('success');
      setRetryCount(0); // Sikeres lekérés esetén retry counter nullázása
    } catch (err) {
      if (currentRetry < maxRetries) {
        // Exponenciális backoff helyett determinisztikus retry a DoD követelmények szerint
        setTimeout(() => executeFetch(currentRetry + 1), 500); 
      } else {
        setStatus('error');
      }
    }
  }, [dataFetcher, maxRetries]);

  // Mountolás és explicit frissítés triggerelése
  React.useEffect(() => {
    executeFetch();
  }, [executeFetch]);

  const handleRetry = useCallback(() => {
    setRetryCount(0);
    setStatus('loading');
    executeFetch(0);
  }, [executeFetch]);

  // Memoizált render dispatch: csak a matching állapotot futtatja le
  const renderedContent = useMemo(() => {
    switch (status) {
      case 'idle': return null;
      case 'loading': return <div className="flex items-center gap-2 text-sm text-slate-500"><span className="animate-pulse w-2 h-2 bg-blue-400 rounded-full"></span>Adatok betöltése...</div>;
      case 'success': return renderSuccess(data);
      case 'empty': return renderEmpty ? renderEmpty() : <div className="text-sm text-slate-400 italic">Nincs megjeleníthető adat.</div>;
      case 'error': return renderError 
        ? renderError(retryCount, handleRetry) 
        : (
            <div role="status" aria-live="polite" className="flex flex-col gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">Sikertelen adatbetöltés.</p>
              <button 
                onClick={handleRetry} 
                className="text-xs text-blue-600 hover:text-blue-800 underline self-start"
                aria-label="Újrapróbálkozás"
              >
                Újrapróbál ({maxRetries - retryCount} kísérlet maradt)
              </button>
            </div>
          );
      default: return null;
    }
  }, [status, data, renderSuccess, renderEmpty, renderError, retryCount, handleRetry]);

  return (
    <article 
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3"
      aria-busy={status === 'loading'}
      role="region"
      aria-label={title}
    >
      <header className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {status === 'loading' && (
          <span className="text-xs text-slate-400 animate-pulse" aria-hidden="true">● SYNCING</span>
        )}
      </header>
      <div className="min-h-[80px] flex items-center justify-center">
        {renderedContent}
      </div>
    </article>
  );
}