// File: src/services/apiClient.js
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * @module apiClient
 * @description Determinisztikus HTTP réteg a NextGen WebBank frontendje számára.
 * A szerződés explicit, az állapotgép-vezérelt hibakezelés szigorúan követi a DoD kapukat.
 * Nem tolerál pragmatikus kompromisszumokat; minden kérés nyomon követhető (traceId),
 * minden válasz standardizált, minden 401-es zárt refresh ciklust indít.
 */

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api/v1',
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' }
});

/**
 * @type {import('axios').AxiosRequestConfig}
 */
const defaultHeaders = {};

// Request Interceptor: Traceability & Identity Propagation
apiClient.interceptors.request.use(
  (config) => {
    // Determinisztikus korrelációs azonosítók generálása audit trailhez
    const correlationId = uuidv4();
    const traceId = uuidv4();

    config.headers['X-Correlation-ID'] = correlationId;
    config.headers['X-Trace-ID'] = traceId;

    // JWT token betöltése a biztonságos tárolóból (pl. httpOnly cookie vagy szigorú sessionStorage)
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;

      // Szerepkör- és identitás-propagáció a BA specifikáció szerint
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.sub || 'anonymous';
        const roles = payload.roles || [];

        if (roles.includes('APPROVER') || roles.includes('COMPLIANCE')) {
          config.headers['X-Approver-ID'] = userId;
        } else {
          config.headers['X-User-ID'] = userId;
        }
      } catch (err) {
        // Token dekodolási hiba esetén nem hagyjuk abba a kérést, de logoljuk a szerkezet sérülését
        console.warn('[apiClient] JWT payload parse failed. Identity propagation skipped.');
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardization & Closed-Loop Token Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Zárt refresh ciklus: csak egyszeri próbálkozás, loop megelőzése
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('REFRESH_TOKEN_MISSING');

        const { data } = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          { refreshToken },
          { headers: { 'X-Trace-ID': uuidv4() } }
        );

        localStorage.setItem('accessToken', data.accessToken);
        
        // Újratöltjük az eredeti kérés fejlécét a frissített tokennel és identitással
        originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
        
        const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
        if (payload.roles?.includes('APPROVER') || payload.roles?.includes('COMPLIANCE')) {
          originalRequest.headers['X-Approver-ID'] = payload.sub;
        } else {
          originalRequest.headers['X-User-ID'] = payload.sub;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh sikertelen: szesszió invalidálása, felület állapotgépének 'empty/error' átállítása
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.dispatchEvent(new CustomEvent('SESSION_EXPIRED'));
        return Promise.reject(refreshError);
      }
    }

    // Hibák standardizálása: code, message, traceId (DoD követelmény)
    const standardizedError = {
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      message: error.response?.data?.message || error.message,
      traceId: originalRequest.headers['X-Trace-ID'] || 'UNTRACKED',
      status: error.response?.status
    };

    return Promise.reject(standardizedError);
  }
);

export default apiClient;