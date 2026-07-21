export type Player = 'P1' | 'P2';
export type Phase = 'PLACING' | 'MOVING' | 'GAME_OVER';

export interface GameState { 
  board: (Player|null)[]; 
  currentPlayer: Player; 
  phase: Phase; 
  p1PiecesLeft: number; 
  p2PiecesLeft: number; 
  winner: Player|null;
}

const ADJACENCY = [
    [1,3],[0,2,6],[1,4], [0,5,9],[2,5,7],[3,4,6,8],
    [1,5,10],[4,8,12],[5,7,9,11], [3,8,13],[6,8,14],[8,12,15],
    [7,11,13,19],[9,12,16],[10,15,17], [11,14,18],[13,17,22],[14,16,23],
    [15,19,21],[12,18,20],[19,21,23], [18,20,22],[16,21,23]
];

const MILLS = [
    [0,1,2],[3,4,5],[6,7,8], [9,10,11],[12,13,14],[15,16,17],
    [18,19,20],[21,22,23], [1,4,7],[4,10,13],[7,16,19],
    [2,5,8],[5,11,14],[8,17,20]
];

export const INITIAL_STATE: GameState = {
  board: Array(24).fill(null), currentPlayer: 'P1', phase: 'PLACING',
  p1PiecesLeft: 9, p2PiecesLeft: 9, winner: null
};

function checkMill(board: (Player|null)[], player: Player): boolean {
    return MILLS.some(m => board[m[0]] === player && board[m[1]] === player && board[m[2]] === player);
}

export function applyMove(state: GameState, from?: number, to?: number): { state: GameState, error?: string } {
  const newState = JSON.parse(JSON.stringify(state));
  if (newState.winner) return { state: newState, error: "Game Over" };

  // REMOVAL LOGIC
  if (from === undefined && to !== undefined) {
    const opponent = newState.currentPlayer === 'P1' ? 'P2' : 'P1';
    if (!newState.board[to!]) return { state: newState, error: "Invalid removal target" };
    
    let inMill = false;
    for(const m of MILLS) if(m.includes(to!) && newState.board[m[0]]===opponent && newState.board[m[1]]===opponent && newState.board[m[2]]===opponent) inMill=true;
    
    if(inMill) {
        let allInMills = true;
        for(let i=0;i<24;i++) if(newState.board[i]===opponent) {
            let pInMill=false;
            for(const m of MILLS) if(m.includes(i)&&newState.board[m[0]]===opponent&&newState.board[m[1]]===opponent&&newState.board[m[2]]===opponent){pInMill=true;break;}
            if(!pInMill) allInMills=false;
        }
        if(!allInMills) return { state: newState, error: "Cannot remove piece from mill" };
    }

    newState.board[to!] = null;
    newState.currentPlayer = newState.currentPlayer === 'P1' ? 'P2' : 'P1';
    return { state: newState };
  }

  if (to === undefined) return { state: newState, error: "Missing target" };

  // PLACING PHASE
  if (newState.phase === 'PLACING') {
    if (newState.board[to!]) return { state: newState, error: "Position occupied" };
    newState.board[to!] = newState.currentPlayer;
    if (newState.currentPlayer === 'P1') newState.p1PiecesLeft--; else newState.p2PiecesLeft--;
    
    const millCreated = checkMill(newState.board, newState.currentPlayer);
    if (!millCreated) newState.currentPlayer = newState.currentPlayer === 'P1' ? 'P2' : 'P1';
    
    if (newState.p1PiecesLeft === 0 && newState.p2PiecesLeft === 0) {
        newState.phase = 'MOVING';
        if (!millCreated) newState.currentPlayer = newState.currentPlayer === 'P1' ? 'P2' : 'P1';
    }
    return { state: newState };
  }

  // MOVING PHASE
  if (newState.phase === 'MOVING') {
    const isFly = newState.currentPlayer === 'P1' ? newState.p1PiecesLeft < 3 : newState.p2PiecesLeft < 3;
    if (!isFly) {
        if (from === undefined || from === null) return { state: newState, error: "Source required" };
        if (!newState.board[from!] || newState.board[from!] !== newState.currentPlayer) return { state: newState, error: "Not your piece" };
        const adj = ADJACENCY[to!] || [];
        if (!adj.includes(from!)) return { state: newState, error: "Invalid move: not adjacent" };
    } else {
        if (from === undefined || from === null) return { state: newState, error: "Source required" };
    }
    if (newState.board[to!]) return { state: newState, error: "Position occupied" };

    newState.board[to!] = newState.currentPlayer;
    if(!isFly) newState.board[from!] = null;
    
    const millCreated = checkMill(newState.board, newState.currentPlayer);
    if (!millCreated) newState.currentPlayer = newState.currentPlayer === 'P1' ? 'P2' : 'P1';

    if (newState.p1PiecesLeft < 3) newState.winner = 'P2';
    else if (newState.p2PiecesLeft < 3) newState.winner = 'P1';

    return { state: newState };
  }
  return { state: newState, error: "Invalid phase" };
}

export function getValidMoves(state: GameState): number[] {
    const moves: number[] = [];
    if (state.currentPlayer === 'P1') {
        if (state.p1PiecesLeft < 3) return Array.from({length:24}, (_,i)=>i).filter(i => !state.board[i]);
        for(let i=0;i<24;i++) if(state.board[i]==='P1') (ADJACENCY[i]||[]).forEach(a=>{if(!state.board[a])moves.push(a);});
    } else {
        if (state.p2PiecesLeft < 3) return Array.from({length:24}, (_,i)=>i).filter(i => !state.board[i]);
        for(let i=0;i<24;i++) if(state.board[i]==='P2') (ADJACENCY[i]||[]).forEach(a=>{if(!state.board[a])moves.push(a);});
    }
    return [...new Set(moves)];
}

export function getValidRemovals(state: GameState, opponent: Player): number[] {
    const removals: number[] = [];
    for(let i=0;i<24;i++) if(state.board[i]===opponent) {
        let inMill=false;
        for(const m of MILLS) if(m.includes(i)&&state.board[m[0]]===opponent&&state.board[m[1]]===opponent&&state.board[m[2]]===opponent){inMill=true;break;}
        if(!inMill) removals.push(i);
    }
    if(removals.length===0) {
        let allInMills=true;
        for(let i=0;i<24;i++) if(state.board[i]===opponent) {
            let pInMill=false;
            for(const m of MILLS) if(m.includes(i)&&state.board[m[0]]===opponent&&state.board[m[1]]===opponent&&state.board[m[2]]===opponent){pInMill=true;break;}
            if(!pInMill) allInMills=false;
        }
        if(allInMills) return Array.from({length:24}, (_,i)=>i).filter(i=>state.board[i]===opponent);
    }
    return removals;
}

export function simpleAI(state: GameState): {from?: number, to: number} | null {
    const moves = getValidMoves(state);
    if(moves.length === 0) return null;
    if(state.phase === 'PLACING') return { to: moves[Math.floor(Math.random() * moves.length)] };
    return { from: moves[0], to: moves[Math.floor(Math.random() * moves.length)] };
}