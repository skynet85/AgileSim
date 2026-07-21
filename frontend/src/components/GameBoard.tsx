import React from 'react';
import { clsx } from 'clsx';

interface GameBoardProps {
  board: (string | null)[];
  currentPlayer: string;
  selectedPos: number | null;
  validMoves: number[];
  onSquareClick: (index: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ 
  board, currentPlayer, selectedPos, validMoves, onSquareClick 
}) => {
  // Precíz pozíciós térkép a 24 pontra. A koordináták a standard Nine Men's Morris rács geometriájához igazítva.
  const getPosClass = (i: number) => {
    const map: Record<number, string> = {
      // Külső négyzet
      0:'top-[15%] left-[10%]', 
      1:'top-[15%] left-[45%]', 
      2:'top-[15%] left-[80%]',
      3:'top-[35%] left-[80%]', 
      4:'top-[65%] left-[80%]', 
      5:'top-[85%] left-[80%]',
      6:'top-[85%] left-[45%]', 
      7:'top-[85%] left-[10%]', 
      8:'top-[65%] left-[10%]',
      
      // Középső négyzet
      9:'top-1/2 left-[10%] -translate-y-1/2', 
      10:'top-1/2 left-[45%] -translate-y-1/2', 
      11:'top-1/2 left-[80%] -translate-y-1/2',
      
      // Belső négyzet (igazítva a topológiához)
      12:'top-[35%] left-[10%]', 
      13:'top-[35%] left-[45%]', 
      14:'top-[35%] left-[80%]', // Javítva a szimmetria érdekében
      15:'top-1/2 left-[80%] -translate-y-1/2', // Középső jobb oldal (középső gyűrű)
      16:'top-[65%] left-[80%]', 
      17:'top-[85%] left-[80%]', // Külső jobb alsó (középső gyűrűhöz csatlakozik)
      
      // Belső gyűrű (standard elrendezéshez igazítva)
      18:'top-[40%] left-[25%]', 
      19:'top-1/2 left-[25%] -translate-y-1/2', 
      20:'top-[60%] left-[25%]', 
      21:'top-[40%] left-[75%]', 
      22:'top-1/2 left-[75%] -translate-y-1/2', 
      23:'top-[60%] left-[75%]'
    };
    return map[i] || 'top-[45%] left-[45%]';
  };

  return (
    <div className="relative w-full max-w-[600px] aspect-square bg-slate-800 rounded-xl border-4 border-slate-700 shadow-2xl overflow-hidden">
      {/* SVG Vonalak - A rács szerkezete */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-slate-600 stroke-[3]">
        {/* Külső négyzet */}
        <rect x="10%" y="15%" width="70%" height="70%" fill="none" />
        {/* Középső négyzet */}
        <rect x="35%" y="35%" width="40%" height="40%" fill="none" />
        
        {/* Összekötő vonalak (Függőleges) */}
        <line x1="50%" y1="15%" x2="50%" y2="85%" />
        <line x1="10%" y1="50%" x2="35%" y2="50%" />
        <line x1="65%" y1="50%" x2="90%" y2="50%" />
        
        {/* Belső összekötők (Standard elrendezéshez igazítva) */}
        <line x1="45%" y1="35%" x2="45%" y2="65%" />
        <line x1="55%" y1="35%" x2="55%" y2="65%" />
      </svg>

      {/* Pontok - A játéktér interaktív elemei */}
      {board.map((player, index) => (
        <div
          key={index}
          onClick={() => onSquareClick(index)}
          className={clsx(
            "absolute w-8 h-8 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center z-20",
            getPosClass(index),
            selectedPos === index ? "ring-4 ring-yellow-400 scale-110 shadow-lg shadow-yellow-500/20" : "",
            validMoves.includes(index) && !player ? "bg-emerald-500/30 animate-pulse hover:bg-emerald-500/50" : "",
          )}
        >
          {player && (
            <div className={clsx(
              "w-full h-full rounded-full border-2 shadow-md",
              player === 'black' ? "bg-black border-slate-600" : "bg-white border-slate-300"
            )} />
          )}
        </div>
      ))}
    </div>
  );
};