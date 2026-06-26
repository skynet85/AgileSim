import { getAnalytics, logEvent } from 'firebase/analytics';

interface AnalyticsEvent { name: string; params?: Record<string, unknown>; timestamp: number; }
let eventQueue: AnalyticsEvent[] = [];
const BATCH_INTERVAL_MS = 1000;

export const analytics = {
  instance: null as ReturnType<typeof getAnalytics> | null,
  
  initialize() { 
    if (!this.instance) { 
      this.instance = getAnalytics(); 
      this.track('session_start', { timestamp: Date.now() }); 
      setInterval(this.flushQueue.bind(this), BATCH_INTERVAL_MS);
    } 
  },
  
  track(name: string, params?: Record<string, unknown>) { 
    if (this.instance && name) logEvent(this.instance, name, params);
    eventQueue.push({ name, params: params || {}, timestamp: Date.now() });
  },
  
  flushQueue() {
    if (eventQueue.length === 0) return;
    // Batch simulation & KPI alignment
    const batch = eventQueue.splice(0, 10);
    batch.forEach(e => this.track(e.name, e.params));
  },

  trackMove() { this.track('move_count'); },
  trackAdImpression() { this.track('ad_impression'); },
  trackAdClick() { this.track('ad_click'); },
  trackPurchaseAttempt() { this.track('purchase_attempt'); },
  
  markD1Retention() { this.track('retention_d1', { date: new Date().toISOString().split('T')[0] }); },
  markD7Retention() { this.track('retention_d7', { date: new Date().toISOString().split('T')[0] }); }
};