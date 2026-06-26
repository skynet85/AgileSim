import React, { useState, useEffect, useCallback } from 'react';
import { useAnalytics } from '../../services/analytics/FirebaseTracker';

interface Position { x: number; y: number; id: number; }
type Player = 'white' | 'black';
type Phase = 'placement' | 'movement' | 'flying' | 'removal' | 'gameover';

const POSITIONS: Position[] = [
  { x: 40, y: 40, id: 0 }, { x: 200, y: 40, id: 1 }, { x: 360, y: 40, id: 2 },
  { x: 360, y: 200, id: 3 }, { x: 360, y: 360, id: 4 }, { x: 200, y: 360, id: 5 },
  { x: 40, y: 360, id: 6 }, { x: 40, y: 200, id: 7 },
  { x: 90, y: 90, id: 8 }, { x: 200, y: 90, id: 9 }, { x: 310, y: 90, id: 10 },
  { x: 310, y: 200, id: 11 }, { x: 310, y: 310, id: 12 }, { x: 200, y: 310, id: 13 },
  { x: 90, y: 310, id: 14 }, { x: 90, y: 200, id: 15 },
  { x: 140, y: 140, id: 16 }, { x: 200, y: 140, id: 17 }, { x: 260, y: 140, id: 18 },
  { x: 260, y: 200, id: 19 }, { x: 260, y: 260, id: 20 }, { x: 200, y: 260, id: 21 },
  { x: 140, y: 260, id: 22 }, { x: 140, y: 200, id: 23 }
];

const ADJACENCY: Record<number, number[]> = {
  0: [1, 7], 1: [0, 2, 9], 2: [1, 3], 3: [2, 4, 11], 4: [3, 5], 5: [4, 6, 13],
  6: [5, 7], 7: [0, 6, 15],
  8: [9, 14], 9: [8, 10, 1], 10: [9, 11], 11: [10, 12, 3], 12: [11, 13],
  13: [12, 14, 5], 14: [13, 8], 15: [14, 7],
  16: [17, 22], 17: [16, 18, 9], 18: [17, 19], 19: [18, 20, 11],
  20: [19, 21], 21: [20, 22, 13], 22: [21, 16, 15], 23: [22, 20]
};

const MILL_TRIPLES = [
  [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
  [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
  [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16],
  [1, 9, 17], [3, 11, 19], [5, 13, 21], [7, 15, 23]
];

const GameBoard: React.FC = () => {
  const { trackEvent } = useAnalytics();
  
  const [board, setBoard] = useState<(Player | null)[]>(Array(24).fill(null));
  const [phase, setPhase] = useState<Phase>('placement');
  const [turn, setTurn] = useState<Player>('white');
  const [hands, setHands] = useState({ white: 9, black: 9 });
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [removalMode, setRemovalMode] = useState(false);
  const [sessionStart] = useState(Date.now());
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [gameActive, setGameActive] = useState(true);

  useEffect(() => {
    trackEvent('session_start');
    return () => {
      const duration = (Date.now() - sessionStart) / 60000;
      if (duration > 1) trackEvent('session_duration', { minutes: duration.toFixed(2) });
    };
  }, [trackEvent, sessionStart]);

  const countMills = useCallback((player: Player): number => {
    let mills = 0;
    MILL_TRIPLES.forEach(triple => {
      if (triple.every(idx => board[idx] === player)) mills++;
    });
    return mills;
  }, [board]);

  const getRemovablePieces = useCallback((player: Player): number[] => {
    return board.map((p, idx) => p === player ? idx : -1).filter(idx => idx !== -1).filter(idx => {
      let inMill = false;
      MILL_TRIPLES.forEach(triple => {
        if (triple.includes(idx) && triple.every(i => board[i] === player)) inMill = true;
      });
      return !inMill;
    });
  }, [board]);

  const checkWinCondition = useCallback((currentBoard: typeof board, currentHands: typeof hands): Player | 'draw' | null => {
    for (const p of ['white', 'black'] as Player[]) {
      const total = currentHands[p] + currentBoard.filter(x => x === p).length;
      if (total < 3 && phase !== 'placement') return p === 'white' ? 'black' : 'white';
    }
    for (const p of ['white', 'black'] as Player[]) {
      const pieces = currentBoard.map((x, i) => x === p ? i : -1).filter(i => i !== -1);
      if (pieces.length > 0 && phase !== 'placement' && phase !== 'removal') {
        const canMove = pieces.some(idx => 
          phase === 'flying' || ADJACENCY[idx].some(n => currentBoard[n] === null)
        );
        if (!canMove) return p === 'white' ? 'black' : 'white';
      }
    }
    return null;
  }, [phase]);

  const handleNodeClick = useCallback((id: number) => {
    if (removalMode || !gameActive || phase === 'gameover') return;

    if (phase === 'placement') {
      if (board[id] !== null) return;
      
      setBoard(prev => {
        const newBoard = [...prev];
        newBoard[id] = turn;
        
        setHands(h => ({ ...h, [turn]: h[turn] - 1 }));

        const mills = countMills(turn);
        if (mills > 0) {
          setRemovalMode(true);
          trackEvent('mill_formed', { phase: 'placement' });
          return newBoard;
        }

        if (hands.white === 1 && hands.black === 1 || (turn === 'white' ? hands.white - 1 : hands.black - 1) === 0) {
           // Simplified hand check logic for MVP flow
        }
        
        const nextTurn = turn === 'white' ? 'black' : 'white';
        setTurn(nextTurn);
        
        if (nextTurn === 'black') setTimeout(() => aiMove(), 600);
        trackEvent('piece_placed', { pos: id });
        return newBoard;
      });
    } 
    else {
      const isOwnPiece = board[id] === turn;
      
      if (isOwnPiece) {
        setSelectedPiece(id);
        trackEvent('piece_selected', { pos: id });
        return;
      }

      if (selectedPiece !== null && board[id] === null) {
        let validMove = false;
        if (phase === 'flying') validMove = true;
        else if (ADJACENCY[selectedPiece].includes(id)) validMove = true;

        if (!validMove) return;

        setBoard(prev => {
          const newBoard = [...prev];
          newBoard[id] = turn;
          newBoard[selectedPiece] = null;
          
          const mills = countMills(turn);
          if (mills > 0) {
            setSelectedPiece(null);
            setRemovalMode(true);
            trackEvent('mill_formed', { phase: 'movement' });
            return newBoard;
          }

          const nextTurn = turn === 'white' ? 'black' : 'white';
          setSelectedPiece(null);
          setTurn(nextTurn);
          
          if (nextTurn === 'black') setTimeout(() => aiMove(), 600);
          trackEvent('piece_moved', { from: selectedPiece, to: id });
          return newBoard;
        });
      }
    }
  }, [board, phase, turn, hands, selectedPiece, removalMode, gameActive, countMills, aiMove, trackEvent]);

  const handleRemovalClick = useCallback((id: number) => {
    if (!removalMode || !gameActive || phase === 'gameover') return;
    
    const opponent = turn === 'white' ? 'black' : 'white';
    const removable = getRemovablePieces(opponent);
      
    if (!removable.includes(id)) return;

    setBoard(prev => {
      const newBoard = [...prev];
      newBoard[id] = null;
      trackEvent('piece_removed', { color: opponent });
      
      const totalOpponent = hands[opponent === 'white' ? 'black' : 'white'] + newBoard.filter(x => x === opponent).length;
      if (totalOpponent < 3) {
        setWinner(turn as Player);
        setGameActive(false);
        trackEvent('game_end', { winner: turn });
      }
      
      setRemovalMode(false);
      const nextTurn = turn === 'white' ? 'black' : 'white';
      setTurn(nextTurn);
      if (nextTurn === 'black') setTimeout(() => aiMove(), 600);
      return newBoard;
    });
  }, [removalMode, gameActive, phase, turn, hands, getRemovablePieces, aiMove]);

  const aiMove = useCallback(() => {
    if (turn !== 'black' || !gameActive) return;

    setBoard(prevBoard => {
      let targetId = -1;
      
      if (phase === 'placement') {
        const empty = prevBoard.map((p, i) => p === null ? i : -1).filter(i => i !== -1);
        for (const triple of MILL_TRIPLES) {
          const blackInTriple = triple.filter(idx => prevBoard[idx] === 'black').length;
          if (blackInTriple === 2 && !triple.some(idx => prevBoard[idx] !== null)) {
            targetId = triple.find(idx => prevBoard[idx] === null)!; break;
          }
        }
        for (const triple of MILL_TRIPLES) {
          const whiteInTriple = triple.filter(idx => prevBoard[idx] === 'white').length;
          if (whiteInTriple === 2 && !triple.some(idx => prevBoard[idx] !== null)) {
            targetId = triple.find(idx => prevBoard[idx] === null)!; break;
          }
        }
        const priority = [9, 11, 13, 15, 17, 19, 21, 23];
        if (targetId === -1) {
          for (const p of priority) { if (!prevBoard[p]) targetId = p; break; }
        }
        if (targetId === -1) targetId = empty[Math.floor(Math.random() * empty.length)];
        
        const newBoard = [...prevBoard];
        newBoard[targetId] = 'black';
        setHands(h => ({ ...h, black: h.black - 1 }));
        
        if (countMills('black') > 0) {
          setRemovalMode(true);
          trackEvent('ai_placement', { pos: targetId });
          return newBoard;
        }
      } else {
        const pieces = prevBoard.map((p, i) => p === 'black' ? i : -1).filter(i => i !== -1);
        if (phase === 'flying') {
           const empty = prevBoard.map((p, i) => p === null ? i : -1).filter(i => i !== -1);
           targetId = empty[Math.floor(Math.random() * empty.length)];
           const fromIdx = pieces[Math.floor(Math.random() * pieces.length)];
           if (fromIdx !== undefined && targetId !== -1) {
             newBoard[fromIdx] = null;
             newBoard[targetId] = 'black';
             trackEvent('ai_move', { from: fromIdx, to: targetId });
           }
        } else {
          for (const p of pieces) {
            const neighbors = ADJACENCY[p];
            const validTargets = neighbors.filter(n => prevBoard[n] === null);
            if (validTargets.length > 0) {
              targetId = validTargets[Math.floor(Math.random() * validTargets.length)];
              break;
            }
          }
        }
        
        const newBoard = [...prevBoard];
        if (targetId !== -1 && phase === 'placement') { /* handled above */ }
        else if (phase !== 'placement' && targetId !== -1) {
           // Simplified fallback for MVP flow continuity
           const piecesList = prevBoard.map((p, i) => p === 'black' ? i : -1).filter(i => i !== -1);
           const fromIdx = piecesList[0];
           newBoard[fromIdx] = null;
           newBoard[targetId] = 'black';
           trackEvent('ai_move', { from: fromIdx, to: targetId });
        }

        if (countMills('black') > 0) setRemovalMode(true);
      }

      const nextTurn = turn === 'white' ? 'black' : 'white';
      setTurn(nextTurn);
      
      return newBoard;
    });
  }, [turn, phase, gameActive, hands, countMills, trackEvent]);

  // Merge removal handler into click logic for single dispatch
  const onNodeClick = useCallback((id: number) => {
    if (removalMode && !gameActive) return handleRemovalClick(id);
    if (!removalMode) handleNodeClick(id);
  }, [removalMode, gameActive, handleNodeClick, handleRemovalClick]);

  const validMoves = selectedPiece !== null ? (phase === 'flying' 
    ? board.map((p, i) => p === null ? i : -1).filter(i => i !== -1)
    : ADJACENCY[selectedPiece].filter(n => board[n] === null)
  ) : [];

  const removableTargets = removalMode && gameActive ? getRemovablePieces(turn === 'white' ? 'black' : 'white') : [];

  return (
    <div className="relative w-full max-w-[460px] aspect-square select-none">
      <div className={`absolute -top-12 left-0 right-0 text-center px-4 py-2 rounded-full glass border backdrop-blur-md transition-all ${removalMode ? 'text-red-300 border-red-500/30' : phase === 'gameover' ? 'border-slate-700' : 'border-indigo-500/20 text-indigo-300'}`}>
        {phase === 'placement' && `📍 Elhelyezés – Helyezz el egy bábút! (${hands.white} fehér / ${hands.black} fekete maradt)`}
        {phase === 'movement' && '⚔️ Mozgás – Válassz és mozgasd!'}
        {phase === 'flying' && '🕊️ Repülés – Bármerre léphetsz!'}
        {removalMode && '🗑️ Molino! Távolíts el egy ellenfél bábút!'}
        {phase === 'gameover' && winner ? `🏆 ${winner === 'white' ? 'Te nyertél!' : 'Az AI győzött!'}` : ''}
      </div>

      <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-2xl">
        <defs>
          <filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        
        <rect x="35" y="35" width="330" height="330" fill="none" stroke="#334155" strokeWidth="2.5"/>
        <rect x="85" y="85" width="230" height="230" fill="none" stroke="#475569" strokeWidth="2.5"/>
        <rect x="135" y="135" width="130" height="130" fill="none" stroke="#64748b" strokeWidth="2.5"/>
        
        {[ [200,35,200,90], [365,200,310,200], [200,365,200,310], [40,200,90,200] ].map(([x1,y1,x2,y2]) => (
          <line key="conn" x1={x1} y1={y1} x2={x2} y2={y2} stroke="#55657a" strokeWidth="2.5"/>
        ))}

        {POSITIONS.map(p => (
          <circle 
            key={`node-${p.id}`} 
            cx={p.x} cy={p.y} r="18" 
            fill="#0f172a" stroke="#334155" strokeWidth="2"
            onClick={() => onNodeClick(p.id)}
            className={`cursor-pointer transition-colors ${removalMode && removableTargets.includes(p.id) ? 'hover:fill-red-500/20' : 'hover:fill-slate-800'}`}
          />
        ))}

        {board.map((player, idx) => player && (
          <circle key={`piece-${idx}`} cx={POSITIONS[idx].x} cy={POSITIONS[idx].y} r="14" 
            fill={player === 'white' ? '#f8fafc' : '#020617'} 
            stroke={player === 'white' ? '#94a3b8' : '#475569'} strokeWidth="2">
            <animate attributeName="r" values="0;14" dur="0.3s" fill="freeze"/>
          </circle>
        ))}

        {selectedPiece !== null && (
          <>
            <circle cx={POSITIONS[selectedPiece].x} cy={POSITIONS[selectedPiece].y} r="20" 
              fill="none" stroke="#818cf8" strokeWidth="3" filter="url(#glow)">
              <animate attributeName="r" values="18;22;18" dur="1.5s" repeatCount="indefinite"/>
            </circle>
            
            {validMoves.map(vId => (
               <circle key={`move-${vId}`} cx={POSITIONS[vId].x} cy={POSITIONS[vId].y} r="8" 
                  fill="#6366f1" opacity="0.4">
                  <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite"/>
              </circle>
            ))}

             {removableTargets.map(rId => (
               <circle key={`rem-${rId}`} cx={POSITIONS[rId].x} cy={POSITIONS[rId].y} r="20" 
                  fill="#ef4444" opacity="0.15">
                  <animate attributeName="opacity" values="0.1;0.3;0.1" dur="1s" repeatCount="indefinite"/>
              </circle>
            ))}
          </>
        )}
      </svg>

      {winner && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10">
          <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold transition-all shadow-lg shadow-indigo-500/25">
            Új játék indítása 🔄
          </button>
        </div>
      )}

      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-xs font-mono pointer-events-none">
           <span className="text-slate-500">A/B: ALPHA</span>
           <span className="text-indigo-400">{Math.floor((Date.now() - sessionStart)/1000)}s</span>
      </div>
    </div>
  );
};

export default GameBoard;