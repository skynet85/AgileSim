import React from 'react';
import { useGameLogic } from '../hooks/useGameLogic';

const BOARD_POINTS = [
  { x: 60, y: 60 },   // 0 TL Outer
  { x: 240, y: 60 },  // 1 TM Outer
  { x: 420, y: 60 },  // 2 TR Outer
  { x: 420, y: 240 }, // 3 RM Outer
  { x: 420, y: 420 }, // 4 BR Outer
  { x: 240, y: 420 }, // 5 BM Outer
  { x: 60, y: 420 },  // 6 BL Outer
  { x: 60, y: 240 },  // 7 LM Outer
  { x: 130, y: 130 }, // 8 TL Middle
  { x: 240, y: 130 }, // 9 TM Middle
  { x: 350, y: 130 }, // 10 TR Middle
  { x: 350, y: 240 }, // 11 RM Middle
  { x: 350, y: 350 }, // 12 BR Middle
  { x: 240, y: 350 }, // 13 BM Middle
  { x: 130, y: 350 }, // 14 BL Middle
  { x: 130, y: 240 }, // 15 LM Middle
  { x: 195, y: 195 }, // 16 TL Inner
  { x: 240, y: 195 }, // 17 TM Inner
  { x: 285, y: 195 }, // 18 TR Inner
  { x: 285, y: 240 }, // 19 RM Inner
  { x: 285, y: 285 }, // 20 BR Inner
  { x: 240, y: 285 }, // 21 BM Inner
  { x: 195, y: 285 }, // 22 BL Inner
  { x: 195, y: 240 }  // 23 LM Inner
];

const GameBoard: React.FC = () => {
  const { 
    boardState, currentPlayer, phase, selectedPiece, diceValues, movesLeft, gameOver, winner, 
    handlePointClick, rollDice, resetGame 
  } = useGameLogic();

  const getPhaseLabel = () => {
    if (gameOver) return 'JÁTÉK VÉGE';
    if (phase === 'REMOVING') return 'ELTÁVOLÍTÁS!';
    if (phase === 'PLACING') return 'HELYEZÉS';
    return movesLeft > 0 ? `DOBÁS (${movesLeft})` : 'MOZGATÁS';
  };

  const getPhaseColor = () => {
    if (gameOver) return 'bg-green-500/20 text-green-300 border-green-500/30';
    if (phase === 'REMOVING') return 'bg-red-500/20 text-red-300 border-red-500/30';
    if (phase === 'PLACING') return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  };

  const getPhaseText = () => {
    if (gameOver) return `🏆 Játékos ${winner} nyert!`;
    if (phase === 'REMOVING') return 'Válassz egy ellenséges darabot az eltávolításhoz.';
    if (phase === 'PLACING') return `${currentPlayer === 1 ? '⚫ Fekete' : '⚪ Fehér'} helyezi a következőt.`;
    return movesLeft > 0 ? 'Használd a dobott számokat a mozgatáshoz.' : 'Kattints egy saját darabra a kiválasztáshoz.';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-6xl w-full items-start">
      <div className="w-full lg:w-72 space-y-4 order-2 lg:order-1">
        <div className={`p-4 rounded-xl border transition-all ${currentPlayer === 1 ? 'ring-2 ring-emerald-500/50 bg-gray-800/80' : 'bg-gray-800/40'} border-white/10`}>
          <h3 className="text-sm font-semibold mb-2">Játékos 1 (Fekete)</h3>
          <div className="flex justify-between text-xs text-gray-400"><span>Helyezett</span><span>{boardState.filter(p => p === 1).length}/9</span></div>
        </div>
        <div className={`p-4 rounded-xl border transition-all ${currentPlayer === 2 ? 'ring-2 ring-emerald-500/50 bg-gray-800/80' : 'bg-gray-800/40'} border-white/10`}>
          <h3 className="text-sm font-semibold mb-2">Játékos 2 (Fehér)</h3>
          <div className="flex justify-between text-xs text-gray-400"><span>Helyezett</span><span>{boardState.filter(p => p === 2).length}/9</span></div>
        </div>
        <button 
          onClick={rollDice} 
          disabled={phase !== 'MOVING' || movesLeft > 0 || gameOver}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 font-semibold text-sm disabled:opacity-40 transition-all shadow-lg"
        >
          🎲 Dobj!
        </button>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPhaseColor()} inline-block mb-2`}>{getPhaseLabel()}</span>
          <p className="text-sm text-gray-300">{getPhaseText()}</p>
        </div>
      </div>

      <div className="flex-1 order-1 lg:order-2 flex justify-center">
        <div className="relative w-[480px] h-[480px] bg-gray-900/50 rounded-2xl shadow-2xl border border-white/10 p-6">
          <svg className="absolute inset-6 w-[calc(100%-3rem)] h-[calc(100%-3rem)] pointer-events-none opacity-40">
            {BOARD_POINTS.map((pt, i) => 
              BOARD_POINTS.map((target, j) => 
                i < j && (j === i + 1 || j === i + 7 || j === i - 8 || j === i + 2) ? 
                  <line key={`${i}-${j}`} x1={pt.x} y1={pt.y} x2={target.x} y2={target.y} stroke="white" strokeWidth="2" />
                : null
              )
            )}
          </svg>

          {BOARD_POINTS.map((pt, index) => {
            const isSelected = selectedPiece === index;
            const isPlayer1 = boardState[index] === 1;
            const isPlayer2 = boardState[index] === 2;
            return (
              <div
                key={index}
                onClick={() => handlePointClick(index)}
                className={`board-point absolute w-5 h-5 rounded-full flex items-center justify-center z-10
                  ${isSelected ? 'bg-yellow-400 scale-150 shadow-[0_0_15px_rgba(250,204,21,0.8)]' : 'bg-white/20 hover:bg-white/40'}
                  ${isPlayer1 ? '!bg-gray-900 border-4 border-gray-600 shadow-inner' : ''}
                  ${isPlayer2 ? '!bg-white border-4 border-gray-300 shadow-lg' : ''}
                  ${(phase === 'REMOVING' && ((currentPlayer===1 && isPlayer2)||(currentPlayer===2 && isPlayer1))) ? 'cursor-crosshair hover:scale-125 ring-2 ring-red-500 animate-pulse' : ''}
                `}
                style={{ left: pt.x - 38, top: pt.y - 38 }}
              >
                {isSelected && <span className="text-[10px] font-bold text-black">●</span>}
              </div>
            );
          })}

          {(phase === 'MOVING' || phase === 'PLACING') && (
            <div className="absolute bottom-6 right-6 flex gap-2">
              {diceValues.map((val, i) => (
                <div key={i} className={`w-10 h-10 rounded-lg font-bold flex items-center justify-center shadow-lg ${movesLeft > 0 ? 'bg-white text-black animate-pulse' : 'bg-gray-700 text-gray-400'}`}>
                  {val || '-'}
                </div>
              ))}
            </div>
          )}

          <button onClick={resetGame} className="absolute top-6 right-6 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition-all">Új játék</button>
        </div>
      </div>

      <div className="w-full lg:w-72 space-y-4 order-3">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Szabályok (MVP)</h3>
          <ul className="text-xs text-gray-400 space-y-1.5 leading-relaxed">
            <li>• 9 darab helyezés felváltva</li>
            <li>• 3 egy sorban = malom → eltávolítás</li>
            <li>• Elfogyott: csak szomszédos pontra</li>
            <li>• 3 maradt: bárhova repülés!</li>
            <li>• Győzelem: ellenfél &lt;4 darabja</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;