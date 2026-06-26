import React from 'react';

interface Props {
  state: any; // Simplified for brevity, should be typed interface
  onMove: (from: number, to: number) => void;
}

const GameBoard: React.FC<Props> = ({ state, onMove }) => {
  // Explicit coordinates for the 24 points of Nine Men's Morris
  const coords = [
    { x: '5%', y: '5%' },   { x: '50%', y: '5%' },   { x: '95%', y: '5%' },
    { x: '95%', y: '50%' }, { x: '95%', y: '95%' },  { x: '50%', y: '95%' },
    { x: '5%', y: '95%' },  { x: '5%', y: '50%' },   // Outer Ring (0-7)
    
    { x: '25%', y: '25%' }, { x: '75%', y: '25%' },  { x: '75%', y: '75%' },
    { x: '25%', y: '75%' }, // Middle Ring (8-15) - Simplified visual mapping for MVP
    
    { x: '37.5%', y: '37.5%' }, { x: '62.5%', y: '37.5%' }, 
    { x: '62.5%', y: '62.5%' },   { x: '37.5%', y: '62.5%' }  // Inner Ring (16-23)
  ];

  const handleClick = (index: number) => {
    if (state.selectedPiece !== null && state.board[index] === null) {
      onMove(state.selectedPiece, index);
      return;
    }
    if (state.board[index] === state.currentPlayer) {
        // Select piece logic would go here in full implementation
        console.log(`Select ${index}`); 
    }
  };

  return (
    <div className="relative w-full max-w-[600px] aspect-square bg-slate-900/50 rounded-xl border border-white/10 p-4 shadow-2xl">
      {/* SVG Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 100 100">
        {/* Outer Square */}
        <rect x="5" y="5" width="90" height="90" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
        {/* Middle Square */}
        <rect x="25" y="25" width="50" height="50" fill="none" stroke="#64748b" strokeWidth="0.5"/>
        {/* Inner Square */}
        <rect x="37.5" y="37.5" width="25" height="25" fill="none" stroke="#475569" strokeWidth="0.5"/>
        
        {/* Cross Lines */}
        <line x1="50" y1="5" x2="50" y2="95" stroke="#94a3b8" strokeWidth="0.5"/>
        <line x1="5" y1="50" x2="95" y2="50" stroke="#94a3b8" strokeWidth="0.5"/>
      </svg>

      {/* Points */}
      {state.board.map((player: number | null, i: number) => (
        <div
          key={i}
          onClick={() => handleClick(i)}
          className={`absolute w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 z-10 ${
            player === 1 
              ? 'bg-slate-900 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' 
              : player === 2 
                ? 'bg-white border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                : 'border-slate-600 bg-transparent hover:bg-white/10'
          }`}
          style={{ left: coords[i].x, top: coords[i].y }}
        >
            {player !== null && <div className={`w-3 h-3 rounded-full ${player === 1 ? 'bg-emerald-500' : 'bg-cyan-400'}`} />}
        </div>
      ))}

      {/* Phase Overlay */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-800/90 rounded-full text-xs font-mono text-emerald-400 border border-emerald-500/20">
        {state.phase}
      </div>
    </div>
  );
};

export default GameBoard;