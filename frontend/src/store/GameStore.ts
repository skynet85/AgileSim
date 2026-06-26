import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Player = 'white' | 'black';
export type Phase = 'PLACEMENT' | 'MOVEMENT' | 'FLYING' | 'REMOVAL' | 'GAME_OVER';

interface GameState {
  board: (Player | null)[];
  turn: Player;
  phase: Phase;
  hands: Record<Player, number>;
  selectedPos: number | null;
  removalMode: boolean;
  winner: Player | null;
  initGame: () => void;
  handleNodeClick: (index: number) => Promise<void>;
}

export const POSITIONS = [
  {x: 40, y: 40},   {x: 200, y: 40},  {x: 360, y: 40},
  {x: 360, y: 200}, {x: 360, y: 360}, {x: 200, y: 360},
  {x: 40, y: 360},  {x: 40, y: 200},
  {x: 90, y: 90},   {x: 200, y: 90},  {x: 310, y: 90},
  {x: 310, y: 200}, {x: 310, y: 310}, {x: 200, y: 310},
  {x: 90, y: 310},  {x: 90, y: 200},
  {x: 140, y: 140}, {x: 200, y: 140}, {x: 260, y: 140},
  {x: 260, y: 200}, {x: 260, y: 260}, {x: 200, y: 260},
  {x: 140, y: 260}, {x: 140, y: 200}
];

export const ADJACENCY: Record<number, number[]> = {
  0:[1,7], 1:[0,2,9], 2:[1,3], 3:[2,4,11], 4:[3,5], 5:[4,6,13], 6:[5,7], 7:[0,6,15],
  8:[9,14], 9:[8,10,1], 10:[9,11], 11:[10,12,3], 12:[11,13], 13:[12,14,5], 14:[13,8], 15:[14,7],
  16:[17,22], 17:[16,18,9], 18:[17,19], 19:[18,20,11], 20:[19,21], 21:[20,22,13], 22:[21,16,15], 23:[22,20]
};

export const MILL_TRIPLES: number[][] = [
  [0,1,2],[2,3,4],[4,5,6],[6,7,0],
  [8,9,10],[10,11,12],[12,13,14],[14,15,8],
  [16,17,18],[18,19,20],[20,21,22],[22,23,16],
  [1,9,17],[3,11,19],[5,13,21],[7,15,23]
];

const INITIAL_STATE = {
  board: Array(24).fill(null),
  turn: 'white' as Player,
  phase: 'PLACEMENT' as Phase,
  hands: { white: 9, black: 9 },
  selectedPos: null as number | null,
  removalMode: false,
  winner: null as Player | null
};

const checkWinCondition = (board: (Player|null)[], player: Player): boolean => {
  return board.filter(p => p === player).length < 3;
};

const formsMill = (board: (Player|null)[], color: Player): number[] | null => {
  for (const triple of MILL_TRIPLES) {
    if (triple.every(idx => board[idx] === color)) return triple;
  }
  return null;
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,
      initGame: () => set({ ...INITIAL_STATE }),
      
      handleNodeClick: async (index: number) => {
        const state = get();
        if (state.phase === 'GAME_OVER' || state.turn !== 'white') return;

        // REMOVAL MODE
        if (state.removalMode) {
          const opp = state.turn === 'white' ? 'black' : 'white';
          if (state.board[index] !== opp) return;
          
          const pieceIsInMill = MILL_TRIPLES.some(t => t.includes(index) && t.every(ti => state.board[ti] === opp));
          if (pieceIsInMill) {
            const allPiecesInMills = state.board.reduce((acc, p, i) => {
              if (p !== opp) return acc;
              return acc && MILL_TRIPLES.some(t => t.includes(i) && t.every(ti => state.board[ti] === opp));
            }, true);
            if (!allPiecesInMills) return;
          }

          const newBoard = [...state.board];
          newBoard[index] = null;
          if (checkWinCondition(newBoard, opp)) {
            set({ board: newBoard, winner: state.turn, phase: 'GAME_OVER' });
            return;
          }
          set({ board: newBoard, removalMode: false, selectedPos: null });
          get().switchTurn();
          return;
        }

        // PLACEMENT PHASE
        if (state.phase === 'PLACEMENT') {
          if (state.board[index] !== null) return;
          const newBoard = [...state.board];
          newBoard[index] = state.turn;
          const newHands = { ...state.hands };
          newHands[state.turn]--;

          const opp = state.turn === 'white' ? 'black' : 'white';
          if (checkWinCondition(newBoard, opp)) {
            set({ board: newBoard, hands: newHands, winner: state.turn, phase: 'GAME_OVER' });
            return;
          }

          let nextPhase = state.phase;
          if (newHands.white === 0 && newHands.black === 0) {
            const wCount = newBoard.filter(p => p === 'white').length;
            const bCount = newBoard.filter(p => p === 'black').length;
            nextPhase = (wCount < 3 || bCount < 3) ? 'FLYING' : 'MOVEMENT';
          }

          const mill = formsMill(newBoard, state.turn);
          set({ board: newBoard, hands: newHands, phase: nextPhase });
          
          if (mill) {
            set({ removalMode: true });
          } else {
            get().switchTurn();
          }
          return;
        }

        // SELECT OWN PIECE
        if (state.board[index] === state.turn) {
          set({ selectedPos: index });
          return;
        }

        // MOVE TO TARGET
        if (state.selectedPos !== null && state.board[index] === null) {
          const isFlying = state.phase === 'FLYING';
          const isValid = isFlying || ADJACENCY[state.selectedPos].includes(index);
          if (!isValid) return;

          const newBoard = [...state.board];
          newBoard[index] = state.turn;
          newBoard[state.selectedPos!] = null;

          const opp = state.turn === 'white' ? 'black' : 'white';
          if (checkWinCondition(newBoard, opp)) {
            set({ board: newBoard, selectedPos: null, winner: state.turn, phase: 'GAME_OVER' });
            return;
          }

          const mill = formsMill(newBoard, state.turn);
          set({ board: newBoard, selectedPos: null });
          
          if (mill) {
            set({ removalMode: true });
          } else {
            get().switchTurn();
          }
        }
      },

      switchTurn: () => {
        const state = get();
        set({ 
          turn: state.turn === 'white' ? 'black' : 'white',
          removalMode: false,
          selectedPos: null
        });
        
        setTimeout(() => {
            if (get().turn === 'black') get().triggerAIMove();
        }, 100);
      },

      triggerAIMove: async () => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            const state = get();
            if (state.turn !== 'black' || state.phase === 'GAME_OVER') { resolve(); return; }

            let moveMade = false;

            // PLACEMENT AI
            if (state.phase === 'PLACEMENT' && state.hands.black > 0) {
              const emptyIndices = state.board.map((p, i) => p === null ? i : -1).filter(i => i !== -1);
              
              for (const idx of emptyIndices) {
                const testBoard = [...state.board];
                testBoard[idx] = 'black';
                if (formsMill(testBoard, 'black')) { 
                    set({ board: testBoard, hands: {...state.hands, black: state.hands.black - 1}, removalMode: true });
                    moveMade = true; break; 
                }
              }
              if (!moveMade) {
                for (const idx of emptyIndices) {
                  const testBoard = [...state.board];
                  testBoard[idx] = 'white'; 
                  if (formsMill(testBoard, 'white')) { 
                    set({ board: testBoard, hands: {...state.hands, black: state.hands.black - 1}, removalMode: true });
                    moveMade = true; break; 
                }
              }
              if (!moveMade && emptyIndices.length > 0) { 
                  const rIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
                  set({ board: state.board.map((p,i) => i===rIdx ? 'black' : p), hands: {...state.hands, black: state.hands.black - 1} });
                  get().switchTurn();
              }
            } 
            // MOVEMENT/FLYING AI
            else if ((state.phase === 'MOVEMENT' || state.phase === 'FLYING') && !state.removalMode) {
              const blackPieces = state.board.map((p, i) => p === 'black' ? i : -1).filter(i => i !== -1);
              
              for (const from of blackPieces) {
                let targets = state.phase === 'FLYING' 
                  ? state.board.map((p, i) => p === null ? i : -1).filter(i => i !== -1)
                  : ADJACENCY[from] || [];

                for (const to of targets) {
                  if (state.board[to]) continue;
                  const testBoard = [...state.board];
                  testBoard[to] = 'black';
                  testBoard[from] = null;
                  if (formsMill(testBoard, 'black')) { 
                      set({ board: testBoard, selectedPos: from }); 
                      const opp = 'white';
                      const newB2 = [...testBoard];
                      newB2[to] = 'black'; newB2[from] = null;
                      
                      if (checkWinCondition(newB2, opp)) {
                           set({ board: newB2, winner: 'black', phase: 'GAME_OVER' });
                       } else {
                           const mill2 = formsMill(newB2, 'black');
                           set({ board: newB2, selectedPos: null, removalMode: !!mill2 });
                       }
                      moveMade = true; break; 
                  }
                }
                if (moveMade) break;
              }

              if (!moveMade && blackPieces.length > 0) {
                const from = blackPieces[Math.floor(Math.random() * blackPieces.length)];
                let targets = state.phase === 'FLYING' 
                  ? state.board.map((p, i) => p === null ? i : -1).filter(i => i !== -1)
                  : ADJACENCY[from] || [];
                const validTargets = targets.filter(t => !state.board[t]);
                
                if (validTargets.length > 0) {
                    const to = validTargets[Math.floor(Math.random() * validTargets.length)];
                    const newB2 = [...state.board];
                    newB2[to] = 'black'; newB2[from] = null;

                    if (checkWinCondition(newB2, 'white')) {
                       set({ board: newB2, winner: 'black', phase: 'GAME_OVER' });
                   } else {
                       const mill2 = formsMill(newB2, 'black');
                       set({ board: newB2, selectedPos: null, removalMode: !!mill2 });
                   }
                }
              }
            }

            // REMOVAL AI
            if (state.removalMode && state.turn === 'black') {
              const whitePieces = state.board.map((p, i) => p === 'white' ? i : -1).filter(i => i !== -1);
              let removable = whitePieces.filter(idx => !MILL_TRIPLES.some(t => t.includes(idx) && t.every(ti => state.board[ti] === 'white')));
              if (removable.length === 0) removable = whitePieces;
              
              if (removable.length > 0) {
                  const target = removable[Math.floor(Math.random() * removable.length)];
                  const newB3 = [...state.board];
                  newB3[target] = null;
                  
                  if (checkWinCondition(newB3, 'white')) {
                       set({ board: newB3, winner: 'black', phase: 'GAME_OVER' });
                   } else {
                       set({ board: newB3, removalMode: false });
                       get().switchTurn();
                   }
              }
            }

            resolve();
          }, 600); 
        });
      }
    }),
    { name: 'malom-game-storage' }
  )
);