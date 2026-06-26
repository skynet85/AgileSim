import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../../services/analytics/FirebaseTracker';

interface Position { x: number; y: number; id: number; }
type Player = 'white' | 'black';
type Phase = 'placement' | 'movement' | 'flying' | 'removal';

const POSITIONS: Position[] = [
    // Outer square (0-7)
    { x: 40, y: 40, id: 0 }, { x: 200, y: 40, id: 1 }, { x: 360, y: 40, id: 2 },
    { x: 360, y: 200, id: 3 }, { x: 360, y: 360, id: 4 }, { x: 200, y: 360, id: 5 },
    { x: 40, y: 360, id: 6 }, { x: 40, y: 200, id: 7 },
    // Middle square (8-15)
    { x: 90, y: 90, id: 8 }, { x: 200, y: 90, id: 9 }, { x: 310, y: 90, id: 10 },
    { x: 310, y: 200, id: 11 }, { x: 310, y: 310, id: 12 }, { x: 200, y: 310, id: 13 },
    { x: 90, y: 310, id: 14 }, { x: 90, y: 200, id: 15 },
    // Inner square (16-23)
    { x: 140, y: 140, id: 16 }, { x: 200, y: 140, id: 17 }, { x: 260, y: 140, id: 18 },
    { x: 260, y: 200, id: 19 }, { x: 260, y: 260, id: 20 }, { x: 200, y: 260, id: 21 },
    { x: 140, y: 260, id: 22 }, { x: 140, y: 200, id: 23 }
];

const ADJACENCY = {
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
  
  // Game State
  const [board, setBoard] = useState<(Player | null)[]>(Array(24).fill(null));
  const [phase, setPhase] = useState<Phase>('placement');
  const [turn, setTurn] = useState<Player>('white');
  const [hands, setHands] = useState({ white: 9, black: 9 });
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [removalMode, setRemovalMode] = useState(false);
  const [sessionStart] = useState(Date.now());
  
  // Effects
  useEffect(() => {
    trackEvent('session_start');
    
    return () => {
        const duration = (Date.now() - sessionStart) / 60000;
        if(duration > 1) trackEvent('session_duration', { minutes: duration.toFixed(2) });
    };
  }, [trackEvent, sessionStart]);

  // Logic Helpers
  const countMills = (player: Player): number => {
    let mills = 0;
    MILL_TRIPLES.forEach(triple => {
        if (triple.every(idx => board[idx] === player)) mills++;
    });
    return mills;
  };

  const getRemovablePieces = (player: Player) => {
    return board.map((p, idx) => p === player ? idx : -1).filter(idx => idx !== -1).filter(idx => {
        // Not in a mill
        let inMill = false;
        MILL_TRIPLES.forEach(triple => {
            if (triple.includes(idx) && triple.every(i => board[i] === player)) inMill = true;
        });
        return !inMill;
    });
  };

  const handleNodeClick = (id: number) => {
    // REMOVAL MODE
    if (removalMode) {
        const opponent = turn === 'white' ? 'black' : 'white';
        const removable = getRemovablePieces(opponent);
        
        if (!removable.includes(id)) return;

        const newBoard = [...board];
        newBoard[id] = null;
        setBoard(newBoard);
        setRemovalMode(false);
        trackEvent('piece_removed', { color: opponent });

        // Check win condition (opponent has < 3 pieces total)
        // Simplified logic for MVP
        const nextTurn = turn === 'white' ? 'black' : 'white';
        setTurn(nextTurn);
        
        // AI Turn Simulation (Mocking backend sync)
        if (nextTurn === 'black') {
            setTimeout(() => aiMove(), 600);
        }
        return;
    }

    // PLACEMENT PHASE
    if (phase === 'placement' && board[id] === null) {
        const newBoard = [...board];
        newBoard[id] = turn;
        setBoard(newBoard);

        const nextHands = { ...hands };
        nextHands[turn]--;
        setHands(nextHands);

        // Check Mill
        if (countMills(turn) > 0) {
            setRemovalMode(true);
            trackEvent('mill_formed');
            return;
        }

        // Phase Transition check
        const nextTurn = turn === 'white' ? 'black' : 'white';
        
        if (nextHands.white === 0 && nextHands.black === 0) {
             setPhase('movement');
             // Check auto-fly logic here
        }

        setTurn(nextTurn);
        trackEvent('piece_placed', { pos: id });

        if (nextTurn === 'black') setTimeout(() => aiMove(), 600);
    }

    // MOVEMENT / FLYING PHASE
    else {
        const isOwnPiece = board[id] === turn;
        
        // Select own piece
        if (isOwnPiece) {
            setSelectedPiece(id);
            trackEvent('piece_selected', { pos: id });
            return;
        }

        // Move to empty spot
        if (selectedPiece !== null && board[id] === null) {
            let validMove = false;
            
            if (phase === 'flying') validMove = true;
            else if (ADJACENCY[selectedPiece].includes(id)) validMove = true;

            if (!validMove) return;

            const newBoard = [...board];
            newBoard[id] = turn;
            newBoard[selectedPiece] = null;
            setBoard(newBoard);
            
            // Check Mill
            if (countMills(turn) > 0) {
                setSelectedPiece(null);
                setRemovalMode(true);
                trackEvent('mill_formed');
                return;
            }

            const nextTurn = turn === 'white' ? 'black' : 'white';
            setTurn(nextTurn);
            setSelectedPiece(null);
            
            if (nextTurn === 'black') setTimeout(() => aiMove(), 600);
        }
    }
  };

  // AI Logic Stub (Deterministic Heuristic)
  const aiMove = () => {
      // Simplified AI for MVP: Random valid move or block mill
      let targetId = -1;
      
      if (phase === 'placement') {
          const empty = board.map((p, i) => p === null ? i : -1).filter(i => i !== -1);
          targetId = empty[Math.floor(Math.random() * empty.length)];
          setBoard(prev => { const b = [...prev]; b[targetId] = 'black'; return b; });
          
          // Update hand logic would go here (state update batching)
      } else {
          // Movement/Flying: Find a piece that can move to create mill or block
          // ... complex heuristic omitted for brevity ...
          const empty = board.map((p, i) => p === null ? i : -1).filter(i => i !== -1);
          if (empty.length > 0) {
             targetId = empty[Math.floor(Math.random() * empty.length)];
             setBoard(prev => { const b = [...prev]; b[targetId] = 'black'; return b; });
          }
      }
      
      trackEvent('ai_move', { to: targetId });
  };

  // Render Helpers
  const getValidMoves = (idx: number) => {
      if (phase === 'flying') {
          return board.map((p, i) => p === null ? i : -1).filter(i => i !== -1);
      }
      return ADJACENCY[idx].filter(n => board[n] === null);
  };

  const validMoves = selectedPiece !== null ? getValidMoves(selectedPiece) : [];

  return (
    <div className="relative w-full max-w-[460px] aspect-square">
        {/* Phase Indicator */}
        <div className={`absolute -top-12 left-0 right-0 text-center px-4 py-2 rounded-full glass border border-indigo-500/20 transition-all ${phase === 'removal' ? 'text-red-300 border-red-500/30' : ''}`}>
            {phase === 'placement' && '📍 Elhelyezés – Helyezz el egy bábút!'}
            {phase === 'movement' && '⚔️ Mozgás – Válassz és mozgasd!'}
            {phase === 'flying' && '🕊️ Repülés – Bármerre léphetsz!'}
            {phase === 'removal' && '🗑️ Molino! Távolíts el egy ellenfél bábút!'}
        </div>

        <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-2xl">
            {/* Board Lines */}
            <defs>
                <filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            
            {/* Concentric Squares */}
            <rect x="35" y="35" width="330" height="330" fill="none" stroke="#334155" strokeWidth="2.5"/>
            <rect x="85" y="85" width="230" height="230" fill="none" stroke="#475569" strokeWidth="2.5"/>
            <rect x="135" y="135" width="130" height="130" fill="none" stroke="#64748b" strokeWidth="2.5"/>
            
            {/* Connectors */}
            {[ [200,35,200,90], [365,200,310,200], [200,365,200,310], [40,200,90,200] ].map(([x1,y1,x2,y2]) => (
                <line key="conn" x1={x1} y1={y1} x2={x2} y2={y2} stroke="#55657a" strokeWidth="2.5"/>
            ))}

            {/* Nodes */}
            {POSITIONS.map(p => (
                <circle 
                    key={p.id} 
                    cx={p.x} cy={p.y} r="18" 
                    fill="#0f172a" stroke="#334155" strokeWidth="2"
                    onClick={() => handleNodeClick(p.id)}
                    className="cursor-pointer hover:fill-slate-800 transition-colors"
                />
            ))}

            {/* Pieces */}
            {board.map((player, idx) => player && (
                <circle key={idx} cx={POSITIONS[idx].x} cy={POSITIONS[idx].y} r="14" 
                    fill={player === 'white' ? '#f8fafc' : '#020617'} 
                    stroke={player === 'white' ? '#94a3b8' : '#475569'} strokeWidth="2">
                    <animate attributeName="r" values="0;14" dur="0.3s" fill="freeze"/>
                </circle>
            ))}

            {/* Selection & Valid Moves */}
            {selectedPiece !== null && (
                <>
                    <circle cx={POSITIONS[selectedPiece].x} cy={POSITIONS[selectedPiece].y} r="20" 
                        fill="none" stroke="#818cf8" strokeWidth="3" filter="url(#glow)">
                        <animate attributeName="r" values="18;22;18" dur="1.5s" repeatCount="indefinite"/>
                    </circle>
                    
                    {/* Highlight Valid Targets */}
                    {validMoves.map(vId => (
                         <circle key={`move-${vId}`} cx={POSITIONS[vId].x} cy={POSITIONS[vId].y} r="8" 
                            fill="#6366f1" opacity="0.4">
                            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite"/>
                        </circle>
                    ))}

                     {/* Highlight Removal Targets */}
                     {phase === 'removal' && board.map((p, i) => {
                         if (p !== null && p !== turn && !getRemovablePieces(turn).includes(i)) return null;
                         if (p !== null && p !== turn && getRemovablePieces(turn).includes(i)) {
                            return (
                                <circle key={`rem-${i}`} cx={POSITIONS[i].x} cy={POSITIONS[i].y} r="20" 
                                    fill="#ef4444" opacity="0.15">
                                    <animate attributeName="opacity" values="0.1;0.3;0.1" dur="1s" repeatCount="indefinite"/>
                                </circle>
                            );
                         }
                     })}
                </>
            )}
        </svg>

        {/* HUD Overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-xs font-mono">
             <span className="text-slate-500">A/B: ALPHA</span>
             <span className="text-indigo-400">Session: {Math.floor((Date.now() - sessionStart)/1000)}s</span>
        </div>
    </div>
  );
};

export default GameBoard;