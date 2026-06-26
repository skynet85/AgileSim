import React, { useEffect, useCallback } from 'react';
import { useGameStore, Player } from '../store/GameStore';

const POSITIONS = [
  [40,40], [200,40], [360,40], [360,200], [360,360], [200,360], [40,360], [40,200],
  [90,90], [200,90], [310,90], [310,200], [310,310], [200,310], [90,310], [90,200],
  [140,140], [200,140], [260,140], [260,200], [260,260], [200,260], [140,260], [140,200]
];

export default function GameBoard() {
  const { board, turn, phase, hands, selectedPos, removalMode, winner, initGame, placePiece, movePiece, removePiece } = useGameStore();

  useEffect(() => {
    if (phase === 'PLACEMENT' && !winner && turn === 'black') startAIMove();
  }, [turn, phase, winner]);

  const startAIMove = useCallback(async () => {
    await new Promise(r => setTimeout(r, 600));
    
    if (phase !== 'PLACEMENT' || winner) return;
    
    const empty = board.map((p,i) => p === null ? i : -1).filter(i => i !== -1);
    if (empty.length === 0) return;

    let target = -1;
    
    for (const idx of empty) {
      const testBoard = [...board];
      testBoard[idx] = 'black';
      if (([0,1,2],[2,3,4],[4,5,6],[6,7,0],[8,9,10],[10,11,12],[12,13,14],[14,15,8],[16,17,18],[18,19,20],[20,21,22],[22,23,16],[1,9,17],[3,11,19],[5,13,21],[7,15,23]).some(t => t.every(i => testBoard[i] === 'black'))) {
        target = idx; break;
      }
    }

    if (target === -1) {
      for (const idx of empty) {
        const testBoard = [...board];
        testBoard[idx] = 'white';
        if (([0,1,2],[2,3,4],[4,5,6],[6,7,0],[8,9,10],[10,11,12],[12,13,14],[14,15,8],[16,17,18],[18,19,20],[20,21,22],[22,23,16],[1,9,17],[3,11,19],[5,13,21],[7,15,23]).some(t => t.every(i => testBoard[i] === 'white'))) {
          target = idx; break;
        }
      }
    }

    if (target === -1) target = empty[Math.floor(Math.random() * empty.length)];

    placePiece(target);
  }, [phase, winner, board]);

  const handleClick = (idx: number) => {
    if (winner || phase === 'GAME_OVER') return;

    if (removalMode) {
      removePiece(idx);
      return;
    }

    if (turn !== 'white' && !winner) return; 

    if (board[idx] === null) {
      placePiece(idx);
    } else if (board[idx] === turn) {
      useGameStore.setState({ selectedPos: idx });
    } else if (selectedPos !== null && board[selectedPos] !== null) {
      movePiece(selectedPos, idx);
    }
  };

  const getStatusText = () => {
    if (winner) return `🏆 ${winner === 'white' ? 'Fehér' : 'Fekete'} nyert!`;
    if (removalMode) return '⚠️ Molino! Válassz egy ellenfél bábút a eltávolításhoz.';
    if (phase === 'PLACEMENT') return `📍 Elhelyezés (${hands.white} F / ${hands.black} K)`;
    if (phase === 'MOVEMENT') return '⚔️ Mozgás';
    if (phase === 'FLYING') return '🕊️ Repülés (bármerre léphetsz)';
    return '';
  };

  const validMoves = selectedPos !== null ? (phase === 'FLYING' 
    ? board.map((p, i) => p === null ? i : -1).filter(i => i !== -1)
    : (useGameStore.getState().selectedPos !== null ? ADJACENCY[selectedPos].filter(n => board[n] === null) : [])
  ) : [];

  return (
    <div className="relative w-[400px] h-[400px] select-none">
      <div className={`absolute -top-12 left-0 right-0 text-center font-bold tracking-wide ${removalMode ? 'text-red-400' : winner ? 'text-yellow-400' : 'text-indigo-300'}`}>
        {getStatusText()}
      </div>

      <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        {[ [40,40,360,40], [40,40,40,360], [40,360,360,360], [360,40,360,360] ].map(([x1,y1,x2,y2],i) => (
          <line key={`s${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth="2"/>
        ))}
        {[ [90,90,310,90], [90,90,90,310], [90,310,310,310], [310,90,310,310] ].map(([x1,y1,x2,y2],i) => (
          <line key={`m${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth="2"/>
        ))}
        {[ [140,140,260,140], [140,140,140,260], [140,260,260,260], [260,140,260,260] ].map(([x1,y1,x2,y2],i) => (
          <line key={`c${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#64748b" strokeWidth="2"/>
        ))}
        
        {[ [200,40,200,90], [310,200,360,200], [200,310,200,360], [90,200,40,200] ].map(([x1,y1,x2,y2],i) => (
          <line key={`cx${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#55657a" strokeWidth="2"/>
        ))}

        {POSITIONS.map(([cx, cy], idx) => (
          <circle
            key={`n${idx}`}
            cx={cx} cy={cy} r="14"
            fill="#0f172a" stroke={selectedPos === idx ? '#818cf8' : board[idx] ? 'transparent' : '#334155'}
            strokeWidth="3"
            className={`cursor-pointer transition-all ${removalMode && board[idx] !== turn ? 'hover:fill-red-900/40 hover:r-6' : 'hover:fill-slate-800'}`}
            onClick={() => handleClick(idx)}
          />
        ))}

        {board.map((p, idx) => p && (
          <circle key={`p${idx}`} cx={POSITIONS[idx][0]} cy={POSITIONS[idx][1]} r="12"
            fill={p === 'white' ? '#f8fafc' : '#020617'} stroke="#94a3b8" strokeWidth="2">
            <animate attributeName="r" values="0;12" dur="0.2s" fill="freeze"/>
          </circle>
        ))}

        {validMoves.map(m => (
           <circle key={`v${m}`} cx={POSITIONS[m][0]} cy={POSITIONS[m][1]} r="6" 
             fill="#6366f1" opacity="0.6">
             <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" repeatCount="indefinite"/>
           </circle>
        ))}

        {selectedPos !== null && board[selectedPos] !== null && (
           <circle cx={POSITIONS[selectedPos][0]} cy={POSITIONS[selectedPos][1]} r="18" 
             fill="none" stroke="#6366f1" strokeWidth="2" opacity="0.5">
             <animate attributeName="r" values="16;20;16" dur="1s" repeatCount="indefinite"/>
           </circle>
        )}
      </svg>

      {winner && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10">
          <button onClick={initGame} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all">
            Új játék 🔄
          </button>
        </div>
      )}
    </div>
  );
}