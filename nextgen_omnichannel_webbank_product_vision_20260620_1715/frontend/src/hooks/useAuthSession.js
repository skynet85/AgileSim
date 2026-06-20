// File: src/hooks/useAuthSession.js
import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';

/**
 * @module useAuthSession
 * @description Determinisztikus session menedzsment hook.
 * Kizárólag ellenőrzött state-struktúrát exponál: isAuthenticated | isLoading | user | error.
 * Nem kezeli a tokent közvetlenül; az apiClient interceptor delegálja a rotációt és a validálást.
 */

export default function useAuthSession() {
  const [state, setState] = useState({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null
  });

  // Session állapot lekérdezése mountoláskor és refresh eseményre
  const fetchSessionStatus = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { data } = await apiClient.get('/auth/session/status');
      setState({
        isAuthenticated: !!data.userId,
        user: data.userMetadata || null,
        isLoading: false,
        error: null
      });
    } catch (err) {
      // 401/403 esetén explicit logout state-re váltás, nem hagyjuk "loading" állapotban a rendszert
      setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: err.message || 'SESSION_VALIDATION_FAILED'
      });
    }
  }, []);

  useEffect(() => {
    fetchSessionStatus();

    // Listener a zárt refresh ciklusból érkező SESSION_EXPIRED eseményre
    const handleExpiry = () => setState({ isAuthenticated: false, isLoading: false, user: null, error: 'SESSION_EXPIRED' });
    window.addEventListener('SESSION_EXPIRED', handleExpiry);

    return () => window.removeEventListener('SESSION_EXPIRED', handleExpiry);
  }, [fetchSessionStatus]);

  const login = useCallback(async (credentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await apiClient.post('/auth/login', credentials);
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      await fetchSessionStatus(); // Állapotgép konzisztencia biztosítása
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message || 'AUTH_FAILED' }));
      throw err;
    }
  }, [fetchSessionStatus]);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setState({ isAuthenticated: false, isLoading: false, user: null, error: null });
    window.location.href = '/auth/logout'; // Determinisztikus kilépés
  }, []);

  return { ...state, login, logout };
}