import { createSlice, PayloadAction, current } from '@reduxjs/toolkit';
import { GameState, Player, Phase, applyPlacement, applyMovement, applyRemoval, createInitialState } from '../engine/MillDeterministicEngine';
import { analytics } from '../services/analytics';

interface GameSliceState { 
  state: GameState; 
  error: string | null; 
  isProcessing: boolean; // Mutex lock for rapid click desync prevention
}

const initialState: GameSliceState = { 
  state: createInitialState(), 
  error: null, 
  isProcessing: false 
};

export const gameSlice = createSlice({ 
  name: 'game', 
  initialState, 
  reducers: { 
    reset(state) { 
      state.state = createInitialState(); 
      state.error = null; 
      analytics.track('session_start'); 
    }, 
    
    handlePlacement(state, action: PayloadAction<number>) {
      if (state.isProcessing || state.state.phase !== 'placement') return;
      try {
        const nextState = applyPlacement(action.payload, state.state);
        state.isProcessing = true;
        setTimeout(() => { state.isProcessing = false; }, 100); // Deterministic lock release
        
        if (nextState !== state.state) { 
          state.state = nextState; 
          analytics.trackMove(); 
          if (state.state.phase === 'removal') analytics.trackAdImpression();
        } else { 
          state.error = 'Érvénytelen elhelyezés.'; 
        }
      } catch (e: unknown) { 
        state.error = e instanceof Error ? e.message : 'Ismeretlen hiba.'; 
      }
    }, 
    
    handleMovement(state, action: PayloadAction<{ from: number; to: number }>) {
      if (state.isProcessing || state.state.phase !== 'movement') return;
      try {
        const nextState = applyMovement(action.payload.from, action.payload.to, state.state);
        state.isProcessing = true;
        setTimeout(() => { state.isProcessing = false; }, 100);
        
        if (nextState !== state.state) { 
          state.state = nextState; 
          analytics.trackMove(); 
          if (state.state.captureCount >= 3) analytics.track('purchase_attempt');
        } else { 
          state.error = 'Érvénytelen mozgatás.'; 
        }
      } catch (e: unknown) { 
        state.error = e instanceof Error ? e.message : 'Ismeretlen hiba.'; 
      }
    }, 
    
    handleRemoval(state, action: PayloadAction<number>) {
      if (state.isProcessing || state.state.phase !== 'removal') return;
      try {
        const nextState = applyRemoval(action.payload, state.state);
        state.isProcessing = true;
        setTimeout(() => { state.isProcessing = false; }, 100);
        
        if (nextState !== state.state) { 
          state.state = nextState; 
          analytics.trackMove(); 
        } else { 
          state.error = 'Nem választható ki ez a bábu.'; 
        }
      } catch (e: unknown) { 
        state.error = e instanceof Error ? e.message : 'Ismeretlen hiba.'; 
      }
    }, 
    
    selectPiece(state, action: PayloadAction<number>) {
      if (state.isProcessing || state.state.phase !== 'movement') return;
      state.state.selectedPiece = state.state.board[action.payload] === state.state.currentPlayer ? action.payload : null;
    },
    
    undo(state) { 
      if (state.state.history.length === 0 || state.state.phase === 'gameover' || state.isProcessing) return;
      const prevJson = state.state.history.pop()!;
      try { 
        state.state = JSON.parse(prevJson); 
        analytics.track('undo_action'); 
      } catch { /* silent fail */ } 
    }, 
    
    featureFlagUpdate(state, action: PayloadAction<Record<string, boolean>>) { 
      window.__FEATURE_FLAGS__ = { ...window.__FEATURE_FLAGS__, ...action.payload }; 
    } 
  }
});

declare global { interface Window { __FEATURE_FLAGS__: Record<string, boolean>; } }
if (!window.__FEATURE_FLAGS__) window.__FEATURE_FLAGS__ = {};

export const { reset, handlePlacement, handleMovement, handleRemoval, selectPiece, undo, featureFlagUpdate } = gameSlice.actions;
export default gameSlice.reducer;