import { useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs.min.js'; // Using SockJS for broader compatibility or native WS

interface GameState {
  sessionId: string | null;
  currentPlayer: number;
  phase: 'PLACING' | 'MOVING' | 'REMOVING' | 'FINISHED';
  piecesLeft: { [key: number]: number };
  board: (number | null)[];
  isConnected: boolean;
  packetsSent: number;
}

const useGameLogic = () => {
  const [state, setState] = useState<GameState>({
    sessionId: null,
    currentPlayer: 1,
    phase: 'PLACING',
    piecesLeft: { 1: 9, 2: 9 },
    board: new Array(24).fill(null),
    isConnected: false,
    packetsSent: 0,
  });

  const [client] = useState(() => new Client({ 
    webSocketFactory: () => new SockJS('/ws'),
    onConnect: () => {
      setState(s => ({ ...s, isConnected: true }));
      // Subscribe to sync topics upon connection
      client.subscribe(`/topic/sync/${state.sessionId}`, (msg) => {
        const data = JSON.parse(msg.body);
        if (data.type === 'STATE_UPDATE') {
          // Optimistic rollback could go here if version mismatch detected
          setState(s => ({ ...s, board: parseBoardFromJson(data.payload) })); 
        }
      });
    },
    onStompError: (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    },
  }));

  const connect = useCallback(async () => {
    // Create a new session if none exists
    if (!state.sessionId) {
      try {
        const res = await fetch('/api/game/create', { method: 'POST' });
        const id = await res.text();
        setState(s => ({ ...s, sessionId: id }));
        
        // Initialize WS after session creation
        client.activate();
      } catch (e) {
        console.error("Failed to create game session", e);
      }
    } else {
      client.activate();
    }
  }, [state.sessionId, client]);

  const disconnect = useCallback(() => {
    client.deactivate();
    setState(s => ({ ...s, isConnected: false }));
  }, [client]);

  const makeMove = useCallback((from: number, to: number) => {
    if (!state.isConnected || !state.sessionId) return;

    // Optimistic UI Update
    const newBoard = [...state.board];
    newBoard[to] = state.currentPlayer;
    newBoard[from] = null;

    setState(prev => ({
      ...prev,
      board: newBoard,
      packetsSent: prev.packetsSent + 1
    }));

    // Send to Server via STOMP
    client.publish({
      destination: `/app/game/${state.sessionId}/move`,
      body: JSON.stringify({ 
        from, 
        to, 
        player: state.currentPlayer.toString(),
        sessionId: state.sessionId 
      })
    });
  }, [client, state.isConnected, state.sessionId, state.currentPlayer, state.board]);

  return { state, connect, disconnect, makeMove };
};

// Helper to parse board from backend JSON string (simplified)
const parseBoardFromJson = (json: string): (number | null)[] => {
    try {
        const parsed = JSON.parse(json);
        // Assuming payload contains a 'board' array in the full implementation
        return Array.isArray(parsed.board) ? parsed.board : new Array(24).fill(null);
    } catch {
        return new Array(24).fill(null);
    }
};

export default useGameLogic;