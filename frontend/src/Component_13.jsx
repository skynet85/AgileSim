import { useState, useCallback } from 'react';

type Phase = 'PLACING' | 'MOVING' | 'REMOVING' | 'FINISHED';

interface GameState {
  boardState: number[];
  currentPlayer: number; // 1 or 2
  phase: Phase;
  selectedPiece: number | null;
  diceValues: number[];
  movesLeft: number;
  gameOver: boolean;
  winner: number | null;
}

const ADJACENCY: Record<number, number[]> = {
  0:[1,7], 1:[0,2,8], 2:[1,3], 3:[2,4], 4:[3,5], 5:[4,6], 6:[5,7], 7:[0,6],
  8:[9,15], 9:[8,10,17], 10:[9,11], 11:[10,12], 12:[11,13], 13:[12,14], 14:[13,15], 15:[8,14],
  16:[17,23], 17:[16,18], 18:[17,19], 19:[18,20], 20:[19,21], 21:[20,22], 22:[21,23], 23:[16,22]
};

const MILLS = [
  [0,1,2],[4,5,6],[0,7,6],[2,3,4],
  [8,9,10],[12,13,14],[8,15,14],[10,11,12],
  [16,17,18],[20,21,22],[16,23,22],[18,19,20],
  [1,9,17],[5,13,21],[7,15,23],[3,11,19]
];

export const useGameLogic = () => {
  const [state, setState] = useState<GameState>({
    boardState: Array(24).fill(0),
    currentPlayer: 1,
    phase: 'PLACING',
    selectedPiece: null,
    diceValues: [],
    movesLeft: 0,
    gameOver: false,
    winner: null
  });

  const checkMills = useCallback((idx: number, player: number) => {
    return MILLS.some(m => m.includes(idx) && m.every(p => state.boardState[p] === player));
  }, [state.boardState]);

  const canFly = useCallback((player: number) => {
    return state.boardState.filter(p => p === player).length <= 3;
  }, [state.boardState]);

  const handlePointClick = useCallback((index: number) => {
    if (state.gameOver) return;

    setState(prev => {
      const newState = { ...prev, boardState: [...prev.boardState] };
      
      if (newState.phase === 'REMOVING') {
        const opponent = prev.currentPlayer === 1 ? 2 : 1;
        if (newState.boardState[index] !== opponent) return prev;
        
        const millsAtIdx = MILLS.filter(m => m.includes(index));
        const isLocked = millsAtIdx.some(m => 
          m.every(pos => newState.boardState[pos] === opponent) && 
          m.slice(1).every(p => p !== index && !MILLS.some(mm => mm.includes(p) && mm.every(pp => newState.boardState[pp] === opponent)))
        );
        
        if (isLocked && millsAtIdx.length > 0 && state.boardState.filter(p=>p===opponent).length > 4) {
          return prev;
        }

        newState.boardState[index] = 0;
        const oppPieces = newState.boardState.filter(p => p === opponent).length;
        if (oppPieces < 4) {
          return { ...newState, gameOver: true, winner: prev.currentPlayer };
        }
        return { ...newState, phase: 'PLACING', currentPlayer: opponent, selectedPiece: null };
      }

      if (newState.phase === 'PLACING') {
        if (newState.boardState[index] !== 0) return prev;
        newState.boardState[index] = prev.currentPlayer;
        
        if (checkMills(index, prev.currentPlayer)) {
          return { ...newState, phase: 'REMOVING' };
        }

        const p1Placed = newState.boardState.filter(p => p === 1).length;
        const p2Placed = newState.boardState.filter(p => p === 2).length;
        
        if (p1Placed >= 9 && p2Placed >= 9) {
          return { ...newState, phase: 'MOVING', currentPlayer: prev.currentPlayer === 1 ? 2 : 1 };
        }
        return { ...newState, currentPlayer: prev.currentPlayer === 1 ? 2 : 1, selectedPiece: null };
      }

      if (newState.phase === 'MOVING') {
        if (newState.selectedPiece === null) {
          if (newState.boardState[index] !== prev.currentPlayer) return prev;
          const adj = ADJACENCY[index] || [];
          const hasEmptyNeighbor = adj.some(n => newState.boardState[n] === 0);
          if (!hasEmptyNeighbor && !canFly(prev.currentPlayer)) return prev;
          return { ...newState, selectedPiece: index };
        }

        const from = newState.selectedPiece;
        const to = index;
        const isFly = canFly(prev.currentPlayer);
        
        if (to === from || newState.boardState[to] !== 0) return prev;
        if (!isFly && !(ADJACENCY[from]?.includes(to))) return prev;

        newState.boardState[to] = prev.currentPlayer;
        newState.boardState[from] = 0;
        const newMovesLeft = Math.max(0, prev.movesLeft - 1);

        if (checkMills(to, prev.currentPlayer)) {
          return { ...newState, selectedPiece: null, phase: 'REMOVING', movesLeft: newMovesLeft };
        }

        if (newMovesLeft <= 0) {
          const nextP = prev.currentPlayer === 1 ? 2 : 1;
          const canNextMove = newState.boardState.some((p, i) => p === nextP && ((ADJACENCY[i]||[]).some(n => newState.boardState[n] === 0) || (newState.boardState.filter(x=>x===nextP).length <= 3)));
          if (!canNextMove) {
            return { ...newState, gameOver: true, winner: prev.currentPlayer };
          }
        }

        return { ...newState, selectedPiece: null, movesLeft: newMovesLeft };
      }

      return prev;
    });
  }, [state, checkMills, canFly]);

  const rollDice = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'MOVING' || prev.movesLeft > 0) return prev;
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const vals = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];
      return { ...prev, diceValues: vals, movesLeft: vals.length };
    });
  }, []);

  const resetGame = useCallback(() => {
    setState({
      boardState: Array(24).fill(0),
      currentPlayer: 1,
      phase: 'PLACING',
      selectedPiece: null,
      diceValues: [],
      movesLeft: 0,
      gameOver: false,
      winner: null
    });
  }, []);

  return { ...state, handlePointClick, rollDice, resetGame };
};