// File: frontend/src/components/GameBoard.tsx
import React, { useState } from 'react';
import { useGameStore } from '../hooks/useGameStore';
import { useAnalyticsTracking } from '../hooks/useAnalyticsTracking';

const GameBoard: React.FC = () => {
  const { board, turn, phase, p1Left, p2Left, sendMove, rollbackState } = useGameStore();
  const [selected, setSelected] = useState<number | null>(null);
  const { enqueue } = useAnalyticsTracking();

  // Standard Malom coordinate mapping for SVG rendering (0-23)
  const COORDS: {x: number, y: number}[] = Array.from({ length: 24 }, (_, i) => ({
    x: 15 + ((i % 6) * 14), 
    y: 15 + (Math.floor(i / 6) * 14)
  }));

  const handleClick = async (idx: number) => {
    if (board[idx] !== null && phase !== 'REMOVE_PHASE') return; // Occupied validation
    
    enqueue({ event_name: 'piece_select', payload: { pos: idx, phase }, player_id: turn });

    if (selected === null) {
      setSelected(idx);
    } else {
      const prevBoard = [...board];
      
      try {
        await sendMove({ 
          room_id: useGameStore.getState().roomId, 
          player_id: turn, 
          from_pos: selected, 
          to_pos: idx, 
          move_type: phase === 'REMOVE_PHASE' ? 'REMOVE' : (phase === 'PLACING' ? 'PLACE' : 'MOVE')
        });
        
        enqueue({ event_name: 'move_commit', payload: { from: selected, to: idx } });
        setSelected(null);
      } catch (err) {
        // Optimistic rollback on backend validation failure
        useGameStore.setState({ board: prevBoard });
        enqueue({ event_name: 'move_rollback', payload: { reason: err.message || 'State drift detected' } });
      }
    }
  };

  const phaseLabel = phase === 'PLACING' ? 'ELHELYEZÉS' : 
                     phase === 'MOVING' ? 'MOZGÁS' : 
                     phase === 'REMOVE_PHASE' ? 'ELTÁVOLÍTÁS' : 'VÉGE';

  return (
    <div className="relative w-full max-w-2xl aspect-square bg-slate-900 rounded-xl border border-slate-700 p-4 shadow-2xl">
      <div className={`absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-mono tracking-widest uppercase rounded-full ${phase === 'REMOVE_PHASE' ? 'bg-red-900/50 text-red-300 border border-red-700' : 'bg-cyan-900/40 text-cyan-300 border border-cyan-700'}`}>
        {phaseLabel} FÁZIS
      </div>

      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        {/* Structural Grid Lines */}
        <g stroke="#334155" strokeWidth="0.8" fill="none" opacity="0.6">
          {[0,1,2].map(i => <line x1={15 + i*14} y1="15" x2={15 + i*14} y2="85" />)}
          {[0,1,2].map(i => <line x1="15" y1={15 + i*14} x2="85" y2={15 + i*14} />)}
        </g>

        {/* Interactive Points Layer */}
        {COORDS.map((pos, i) => (
          <circle 
            key={i}
            cx={pos.x} 
            cy={pos.y} 
            r="2.5" 
            className={`cursor-pointer transition-all duration-100 ${selected === i ? 'ring-2 ring-cyan-400 scale-125' : board[i] ? '' : 'hover:fill-slate-600'}`}
            fill={board[i] ? (board[i] === '1' ? '#f97316' : '#06b6d4') : '#1e293b'}
            onClick={() => handleClick(i)}
          />
        ))}
      </svg>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-4 text-xs font-mono text-slate-400">
        <span>P1: {p1Left}</span>
        <span>KÖR: {turn === 1 ? 'PILOT 1' : 'PILOT 2'}</span>
        <span>P2: {p2Left}</span>
      </div>
    </div>
  );
};

export default GameBoard;