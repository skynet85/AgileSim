import { useState, useEffect } from 'react';

export type Player = 'black' | 'white';
export type Position = number; // 0-23
export type GameMode = 'SINGLE' | 'LOCAL_MULTI';
export type Phase = 'placing' | 'moving' | 'flying';
export type GameStatus = 'CREATED' | 'PLAYING' | 'FINISHED';

export interface GameState {
  id: string; 
  mode: GameMode; 
  board: (Player | null)[]; 
  currentPlayer: Player;
  phase: Phase; 
  piecesRemainingToPlace: Record<Player, number>; 
  winner: Player | null; 
  status: GameStatus;
}

export interface Move { from: Position; to: Position; }

const ADJACENCY: Record<number, number[]> = {
  0:[1,9], 1:[0,2,10], 2:[1,11], 3:[4,12], 4:[3,5,13], 5:[4,14], 6:[7,15], 7:[6,8,16], 8:[7,17],
  9:[0,10,18], 10:[1,9,11,19], 11:[2,10,20], 12:[3,13,21], 13:[4,12,14,22], 14:[5,13,15,23],
  15:[6,14,16], 16:[7,15,17], 17:[8,16,20], 18:[9,19,21], 19:[10,18,20,22], 20:[11,17,19,23],
  21:[12,18,23], 22:[13,19], 23:[14,20]
};

const MILLS: number[][] = [
  [0,1,2],[3,4,5],[6,7,8],[9,10,11],[12,13,14],[15,16,17],[18,19,20],[21,22,23],
  [0,9,18],[5,14,23],[2,11,20]
];

export const createInitialState = (mode: GameMode, gameId: string): GameState => ({
  id: gameId, mode, board: Array(24).fill(null), currentPlayer: 'black', phase: 'placing',
  piecesRemainingToPlace: { black: 9, white: 9 }, winner: null, status: 'PLAYING'
});

export const getValidMovesForPosition = (state: GameState, pos: number): number[] => {
  if (state.phase === 'placing') return [];
  if (state.board[pos] !== state.currentPlayer) return [];
  const isFlying = state.piecesRemainingToPlace[state.currentPlayer] <= 3;
  if (isFlying) return state.board.map((p, i) => p === null ? i : -1).filter(i => i !== -1);
  return ADJACENCY[pos]?.filter(n => state.board[n] === null) || [];
};

export const checkMill = (board: (Player | null)[], player: Player): boolean => 
  MILLS.some(mill => mill.every(p => board[p] === player));

export const applyMove = (state: GameState, move: Move): { newState: GameState; removalPositions?: number[] } => {
  if (state.status === 'FINISHED') throw new Error('Játék már véget ért.');
  let newBoard = [...state.board];
  let newPiecesRemaining = { ...state.piecesRemainingToPlace };
  let newPhase = state.phase;
  let removalPositions: number[] | undefined;

  if (state.phase === 'placing') {
    if (newBoard[move.to] !== null || newPiecesRemaining[state.currentPlayer] <= 0) throw new Error('Érvénytelen helyezés.');
    newBoard[move.to] = state.currentPlayer;
    newPiecesRemaining[state.currentPlayer]--;
    if (newPiecesRemaining.black === 0 && newPiecesRemaining.white === 0) newPhase = 'moving';
  } else {
    const isFlying = newPiecesRemaining[state.currentPlayer] <= 3;
    if (!isFlying && !ADJACENCY[move.from]?.includes(move.to)) throw new Error('Érvénytelen mozgás.');
    if (newBoard[move.to] !== null) throw new Error('Célmező foglalt.');
    newBoard[move.from] = null;
    newBoard[move.to] = state.currentPlayer;
  }

  const hasMill = checkMill(newBoard, state.currentPlayer);
  if (hasMill) {
    const opponent = state.currentPlayer === 'black' ? 'white' : 'black';
    removalPositions = newBoard.map((p, i) => p === opponent ? i : -1).filter(i => i !== -1);
    if (removalPositions.length > 0) {
      const allInMills = removalPositions.every(pos => checkMill(newBoard, opponent));
      if (!allInMills) removalPositions = removalPositions.filter(pos => !checkMill(newBoard, opponent));
    }
  }

  return { 
    newState: { ...state, board: newBoard, phase: newPhase, piecesRemainingToPlace: newPiecesRemaining, currentPlayer: state.currentPlayer === 'black' ? 'white' : 'black' },
    removalPositions
  };
};