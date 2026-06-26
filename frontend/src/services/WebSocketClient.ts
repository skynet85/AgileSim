import { io, Socket } from 'socket.io-client';

export interface GameState {
  phase: 'PLACING' | 'MOVING' | 'REMOVING' | 'FINISHED';
  currentPlayer: number;
  piecesLeft: Record<number, number>;
  board: (number | null)[];
  sessionId?: string;
}

class WebSocketClientService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  public isConnected = false;

  connect() {
    this.socket = io('http://localhost:8081', {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      timeout: 20000
    });

    this.socket.on('connect', () => {
      console.log('[WS] Deterministic connection established.');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.warn('[WS] Connection lost. Optimistic UI will revert to server state upon reconnect.');
    });

    this.socket.on('gameStateUpdate', (state: GameState) => {
      this.handleGlobalEvent('stateSync', state);
    });

    this.socket.on('moveConfirmed', () => {
      this.handleGlobalEvent('moveAck', null);
    });

    this.socket.on('error', (msg: string) => {
      console.error('[WS] Server validation rejected move:', msg);
      this.handleGlobalEvent('validationError', msg);
    });
  }

  emit(event: string, payload: any) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit(event, payload);
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  private handleGlobalEvent(event: string, data: any) {
    const callbacks = this.listeners.get('stateSync') || new Set();
    console.log(`[WS] Event received: ${event}`, data);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }
}

export default new WebSocketClientService();