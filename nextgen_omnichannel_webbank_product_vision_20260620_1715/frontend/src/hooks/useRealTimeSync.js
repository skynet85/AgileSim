// File: src/hooks/useRealTimeSync.js
import { useEffect, useRef, useCallback } from 'react';
import apiClient from '../services/apiClient';

/**
 * @module useRealTimeSync
 * @description WebSocket/SSE szinkronizációs hook a valós idejű állapotfrissítésekhez.
 * Determinisztikus életciklus-kezelés: connect | listening | disconnect.
 * TraceId propagáció minden üzenetben, automatikus reconnect backoff, explicit cleanup.
 */

export default function useRealTimeSync({ endpoint, onMessage, onError }) {
  const wsRef = useRef(null);
  const isMounted = useRef(true);
  const reconnectAttempt = useRef(0);
  const maxReconnectAttempts = 5;

  // Kapcsolatnyitás: determinisztikus URL és fejléc konfigurációval
  const connect = useCallback(() => {
    if (!isMounted.current || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const traceId = crypto.randomUUID();
      wsRef.current = new WebSocket(`${window.location.origin}${endpoint}?traceId=${traceId}`);

      wsRef.current.onopen = () => {
        reconnectAttempt.current = 0; // Sikeres csatlakozás esetén counter nullázása
        console.debug(`[RealTimeSync] Connected to ${endpoint} | trace: ${traceId}`);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          onMessage?.(payload);
        } catch (err) {
          onError?.({ type: 'PARSE_ERROR', message: 'Invalid real-time payload format' });
        }
      };

      wsRef.current.onerror = (event) => {
        console.error(`[RealTimeSync] WebSocket error on ${endpoint}`, event);
        onError?.({ type: 'CONNECTION_ERROR' });
      };

      wsRef.current.onclose = () => {
        // Automatikus reconnect backoff (kapu a kaotikus diszkapcsolat és a determinisztikus állapot között)
        if (isMounted.current && reconnectAttempt.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * 2 ** reconnectAttempt.current, 8000);
          reconnectAttempt.current += 1;
          setTimeout(connect, delay);
        }
      };
    } catch (err) {
      onError?.({ type: 'INIT_ERROR', message: err.message });
    }
  }, [endpoint, onMessage, onError]);

  // Életciklus kezelés: mounton connect, unmounton disconnect
  useEffect(() => {
    isMounted.current = true;
    connect();

    return () => {
      isMounted.current = false;
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted or session expired');
        wsRef.current = null;
      }
    };
  }, [connect]);

  // Explicit küldési szerződés: minden üzenet traceId-vel és típuscímkével ellátva
  const sendCommand = useCallback((command) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    
    const envelope = {
      type: command.type,
      payload: command.payload,
      metadata: { traceId: crypto.randomUUID(), timestamp: new Date().toISOString() }
    };

    wsRef.current.send(JSON.stringify(envelope));
  }, []);

  return { isConnected: wsRef.current?.readyState === WebSocket.OPEN, sendCommand };
}