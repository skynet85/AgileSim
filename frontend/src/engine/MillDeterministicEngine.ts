export type Player = 'black' | 'white';
export type Phase = 'placement' | 'movement' | 'removal' | 'gameover';

export interface GameState {
  board: Array<Player | null>;
  currentPlayer: Player;
  phase: Phase;
  piecesRemaining: Record<Player, number>;
  selectedPiece: number | null;
  history: string[];
  moveCount: number;
  millCount: number;
  captureCount: number;
}

const POSITIONS = [
  {id:0,row:2,col:2},{id:1,row:2,col:3},{id:2,row:2,col:4},
  {id:3,row:3,col:4},{id:4,row:4,col:4},{id:5,row:4,col:3},
  {id:6,row:4,col:2},{id:7,row:3,col:2},
  {id:8,row:1,col:1},{id:9,row:1,col:3},{id:10,row:1,col:5},
  {id:11,row:3,col:5},{id:12,row:5,col:5},{id:13,row:5,col:3},
  {id:14,row:5,col:1},{id:15,row:3,col:1},
  {id:16,row:0,col:0},{id:17,row:0,col:3},{id:18,row:0,col:6},
  {id:19,row:3,col:6},{id:20,row:6,col:6},{id:21,row:6,col:3},
  {id:22,row:6,col:0},{id:23,row:3,col:0}
];

const CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],
  [8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,8],
  [16,17],[17,18],[18,19],[19,20],[20,21],[21,22],[22,23],[23,16],
  [17,9],[9,1],[3,11],[11,19],[5,13],[13,21],[7,15],[15,23]
];

const MILLS: number[][] = [
  [0,1,2],[2,3,4],[4,5,6],[6,7,0],
  [8,9,10],[10,11,12],[12,13,14],[14,15,8],
  [16,17,18],[18,19,20],[20,21,22],[22,23,16],
  [17,9,1],[3,11,19],[5,13,21],[7,15,23]
];

export function createInitialState(): GameState {
  return {
    board: Array(24).fill(null),
    currentPlayer: 'black',
    phase: 'placement',
    piecesRemaining: { black: 9, white: 9 },
    selectedPiece: null,
    history: [],
    moveCount: 0,
    millCount: 0,
    captureCount: 0
  };
}

export function getAdjacent(id: number): number[] {
  const adj = new Set<number>();
  CONNECTIONS.forEach(([a, b]) => { if (a === id) adj.add(b); if (b === id) adj.add(a); });
  return [...adj];
}

export function isInMill(posId: number, player: Player, board: Array<Player | null>): boolean {
  return MILLS.some(mill => mill.includes(posId) && mill.every(p => board[p] === player));
}

export function checkNewMill(posId: number, player: Player, board: Array<Player | null>): boolean {
  return isInMill(posId, player, board);
}

export function getRemovablePieces(player: Player, board: Array<Player | null>): number[] {
  const opp = player === 'black' ? 'white' : 'black';
  let hasNonMillOpponent = false;
  for (let i = 0; i < 24; i++) { if (board[i] !== opp) continue; if (!isInMill(i, opp, board)) hasNonMillOpponent = true; }
  const removable: number[] = [];
  for (let i = 0; i < 24; i++) {
    if (board[i] === opp && (!hasNonMillOpponent || !isInMill(i, opp, board))) removable.push(i);
  }
  return [...new Set(removable)];
}

export function validateMove(fromId: number, toId: number, state: GameState): boolean {
  if (state.phase === 'placement') return false;
  if (state.board[toId] !== null) return false;
  if (state.board[fromId] !== state.currentPlayer) return false;
  
  const pieceCount = state.piecesRemaining[state.currentPlayer] === 0 
    ? state.board.filter(p => p === state.currentPlayer).length : -1;
  
  if (pieceCount === 3) return true; // Flying rule explicit
  return getAdjacent(fromId).includes(toId);
}

export function checkWinCondition(state: GameState): Player | null {
  const opp = state.currentPlayer === 'black' ? 'white' : 'black';
  if (state.piecesRemaining[opp] === 0) {
    const oppPieces = state.board.map((p, i) => p === opp ? i : -1).filter(i => i !== -1);
    if (oppPieces.length < 3) return state.currentPlayer;
    
    let canMove = false;
    for (const p of oppPieces) {
      if (oppPieces.length === 3 && state.board.some(x => x === null)) { canMove = true; break; }
      else if (getAdjacent(p).some(a => state.board[a] === null)) { canMove = true; break; }
    }
    if (!canMove && oppPieces.length > 0) return state.currentPlayer;
  }
  return null;
}

export function applyPlacement(id: number, state: GameState): GameState {
  const next = JSON.parse(JSON.stringify(state));
  if (next.board[id] !== null || next.phase !== 'placement') return state;
  
  next.history.push(JSON.stringify(next));
  next.board[id] = next.currentPlayer;
  next.piecesRemaining[next.currentPlayer]--;
  next.moveCount++;
  
  const formedMill = checkNewMill(id, next.currentPlayer, next.board);
  if (formedMill) { next.millCount++; next.phase = 'removal'; } 
  else { 
    next.currentPlayer = next.currentPlayer === 'black' ? 'white' : 'black'; 
    if (next.piecesRemaining.black === 0 && next.piecesRemaining.white === 0) next.phase = 'movement';
  }
  
  const win = checkWinCondition(next);
  if (win) next.phase = 'gameover';
  
  return next;
}

export function applyMovement(fromId: number, toId: number, state: GameState): GameState {
  const next = JSON.parse(JSON.stringify(state));
  if (!validateMove(fromId, toId, next)) return state;
  
  next.history.push(JSON.stringify(next));
  next.board[toId] = next.currentPlayer;
  next.board[fromId] = null;
  next.moveCount++;
  
  const formedMill = checkNewMill(toId, next.currentPlayer, next.board);
  if (formedMill) { next.millCount++; next.phase = 'removal'; } 
  else { 
    next.currentPlayer = next.currentPlayer === 'black' ? 'white' : 'black'; 
    const win = checkWinCondition(next);
    if (win) next.phase = 'gameover';
  }
  
  return next;
}

export function applyRemoval(id: number, state: GameState): GameState {
  const next = JSON.parse(JSON.stringify(state));
  if (next.phase !== 'removal') return state;
  
  const removable = getRemovablePieces(next.currentPlayer, next.board);
  if (!removable.includes(id)) return state;
  
  next.history.push(JSON.stringify(next));
  next.board[id] = null;
  next.captureCount++;
  next.currentPlayer = next.currentPlayer === 'black' ? 'white' : 'black';
  
  if (next.piecesRemaining.black === 0 && next.piecesRemaining.white === 0) next.phase = 'movement';
  else next.phase = 'placement';
  
  const win = checkWinCondition(next);
  if (win) next.phase = 'gameover';
  
  return next;
}

export function getValidTargets(state: GameState): number[] {
  if (state.phase === 'placement') return state.board.map((p, i) => p === null ? i : -1).filter(i => i !== -1);
  if (state.phase === 'removal') return getRemovablePieces(state.currentPlayer, state.board);
  if (state.phase === 'movement' && state.selectedPiece !== null) {
    const adj = getAdjacent(state.selectedPiece);
    return adj.filter(id => state.board[id] === null);
  }
  return [];
}