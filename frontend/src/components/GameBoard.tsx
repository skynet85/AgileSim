import React, { useState } from 'react';

interface GameBoardProps {
  board: (string | null)[];
  onCellClick: (fromIndex: number, toIndex: number) => void;
  currentPlayer: number;
  onCapture?: (pieceIndex: number) => void;
  isCapturePhase?: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({ board, onCellClick, currentPlayer, onCapture, isCapturePhase }) => {
  const [selected, setSelected] = useState<number | null>(null);

  const handleClick = (index: number) => {
    if (isCapturePhase && onCapture) { 
      onCapture(index); 
      return; 
    }
    if (board[index] !== null && selected === null) {
      setSelected(index);
    } else if (selected !== null && board[index] === null) {
      onCellClick(selected, index);
      setSelected(null);
    } else if (selected === index) {
      setSelected(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`grid grid-cols-8 gap-2 bg-slate-900 p-6 rounded-lg border ${isCapturePhase ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-slate-700'} shadow-xl max-w-md w-full relative`}>
        {board.map((cell, idx) => (
          <button 
            key={idx} 
            onClick={() => handleClick(idx)} 
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded flex items-center justify-center text-sm font-bold transition-all border ${
              selected === idx ? 'bg-emerald-600 border-emerald-400 scale-110 z-10' : 
              isCapturePhase && cell !== null && !cell.includes(String(currentPlayer)) ? 'border-red-500 bg-red-900/30 animate-pulse cursor-pointer hover:bg-red-800/50' : 
              cell !== null ? `border-slate-500 ${cell === String(currentPlayer) || (currentPlayer === 1 && cell === '1') || (currentPlayer === 2 && cell === '2') ? 'text-blue-400 bg-blue-900/30 border-blue-500/50' : 'text-orange-400 bg-orange-900/30 border-orange-500/50'}` : 
              'bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-500'
            }`}
          >
            {cell || <span className="text-[10px] opacity-40">{idx}</span>}
          </button>
        ))}
      </div>
      <p className={`text-xs font-mono mt-2 px-3 py-1 rounded ${isCapturePhase ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-slate-900 text-slate-400'}`}>
        {isCapturePhase 
          ? '⚠️ KAPKODÁSI FÁZIS: Válassz ellenfél bábát!' 
          : `Játékos: ${currentPlayer === 1 ? 'KÉK (1)' : 'NARANCS (2)'} | Válassz kiindulási pontot, majd célpontot.`}
      </p>
    </div>
  );
};

export default GameBoard;