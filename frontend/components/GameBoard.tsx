import React from 'react';
import { useGameLogic } from '../src/hooks/useGameLogic';

const POINTS = [
  { x: '5%', y: '5%' },   { x: '50%', y: '5%' },   { x: '95%', y: '5%' },
  { x: '95%', y: '50%' }, { x: '95%', y: '95%' },  { x: '50%', y: '95%' },
  { x: '5%', y: '95%' },  { x: '5%', y: '50%' },
  { x: '25%', y: '25%' }, { x: '75%', y: '25%' },  { x: '75%', y: '75%' },
  { x: '25%', y: '75%' }
];

const GameBoard: React.FC = () => {
  const { gameState, handlePointClick, phaseLabel } = useGameLogic();

  if (!gameState) return <div className="text-slate-400 font-mono">Connecting to deterministic engine...</div>;

  return (
    <>
      <aside className="lg:col-span-3 space-y-4 order-2 lg:order-1">
        {[1, 2].map(p => (
          <div key={p} className={`glass-panel p-5 rounded-2xl border-l-4 transition-all duration-300 ${gameState.currentPlayer === p ? 'border-emerald-500 shadow-lg' : 'border-slate-700 opacity-60'}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-slate-100">Játékos {p} ({p === 1 ? 'Fekete' : 'Fehér'})</h3>
                <p className="text-xs text-slate-400 mt-0.5">{gameState.currentPlayer === p ? 'Aktív / Validálva' : 'Várakozó'}</p>
              </div>
              <span className={`w-8 h-8 rounded-full border-2 shadow-inner ${p === 1 ? 'bg-slate-900 border-slate-600' : 'bg-white border-slate-300 shadow-lg'}`}></span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300"><span>Hátralévő darabok</span><span>{gameState.piecesLeft[p]} / 9</span></div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full transition-all duration-300 ${p === 1 ? 'bg-emerald-500' : 'bg-cyan-400'}`} style={{ width: `${(gameState.piecesLeft[p] / 9) * 100}%` }}></div>
              </div>
            </div>
          </div>
        ))}

        <div className="glass-panel p-4 rounded-xl border border-white/5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Szabályi Keret</h4>
          <ul className="text-[11px] text-slate-400 space-y-1.5 leading-relaxed list-disc pl-3 marker:text-emerald-500/60">
            <li>Felváltva 9 darab kihelyezése</li>
            <li>3 egy sorban = Malom → eltávolítás kényszer</li>
            <li>Minden darab mozgatása szomszédos vonalon</li>
            <li>3 maradt: Repülési jog aktiválódik</li>
          </ul>
        </div>
      </aside>

      <section className="lg:col-span-6 flex items-center justify-center order-1 lg:order-2 p-4">
        <div className="relative w-full max-w-[500px] aspect-square bg-slate-900/80 rounded-3xl shadow-2xl border border-white/10 p-6 select-none">
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 200 200">
            <rect x="10" y="10" width="180" height="180" fill="none" stroke="#94a3b8" strokeWidth="1.5"/>
            <rect x="50" y="50" width="100" height="100" fill="none" stroke="#64748b" strokeWidth="1.5"/>
            <rect x="80" y="80" width="40" height="40" fill="none" stroke="#475569" strokeWidth="1.5"/>
            <line x1="100" y1="10" x2="100" y2="50" stroke="#94a3b8" strokeWidth="1.5"/>
            <line x1="100" y1="150" x2="100" y2="190" stroke="#94a3b8" strokeWidth="1.5"/>
            <line x1="10" y1="100" x2="50" y2="100" stroke="#94a3b8" strokeWidth="1.5"/>
            <line x1="150" y1="100" x2="190" y2="100" stroke="#94a3b8" strokeWidth="1.5"/>
          </svg>

          <div className="absolute inset-6 w-[calc(100%-3rem)] h-[calc(100%-3rem)]">
            {POINTS.map((pos, i) => (
              <div
                key={i}
                onClick={() => handlePointClick(i)}
                className={`board-point absolute w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 
                  ${gameState.board[i] === 1 ? 'bg-slate-900 border-slate-600 shadow-inner' : ''}
                  ${gameState.board[i] === 2 ? 'bg-white border-slate-300 shadow-lg' : ''}
                  ${gameState.phase === 'REMOVING' && gameState.board[i] !== null && gameState.board[i] !== gameState.currentPlayer ? 'cursor-crosshair hover:scale-125 ring-2 ring-red-500 animate-pulse' : ''}
                  ${(gameState.selectedPiece === i || (i === gameState.selectedPiece)) ? 'selected-piece z-30 border-yellow-400 scale-125' : 'border-white/20 hover:bg-white/20'}
                `}
                style={{ left: pos.x, top: pos.y }}
              ></div>
            ))}
          </div>

          {gameState.phase === 'FINISHED' && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center z-50">
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Játék Lezárva</h2>
              <p className="text-emerald-400 font-medium mb-6">Győzelem!</p>
              <button onClick={() => window.location.reload()} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg shadow-xl transition-transform hover:scale-105">Új Iteráció</button>
            </div>
          )}
        </div>
      </section>

      <aside className="lg:col-span-3 space-y-4 order-3">
        <div className="glass-panel p-5 rounded-2xl border border-white/10 h-full flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Rendszernapló & Validálás</h3>
          
          <div className="flex-1 bg-slate-950/50 rounded-xl p-3 overflow-y-auto max-h-[240px] text-xs font-mono space-y-1.5 border border-white/5 mb-4">
            <div className="text-emerald-500/70">[SYS] Determinisztikus állapotgép betöltve.</div>
            <div className="text-slate-400">[INFO] Redundáns zárolás eltávolítva. CAS alapú szinkronizáció aktív.</div>
            <div className={`border-l-2 pl-2 py-0.5 ${gameState.phase === 'PLACING' ? 'text-blue-400 border-blue-500/30' : gameState.phase === 'MOVING' ? 'text-purple-400 border-purple-500/30' : gameState.phase === 'REMOVING' ? 'text-red-400 border-red-500/30' : 'text-emerald-400 border-emerald-500/30'}`}>
              [PHASE] {phaseLabel}
            </div>
          </div>

          <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500">
            <span>Session: <span className="text-slate-400 font-mono">{gameState.sessionId || 'WAITING'}</span></span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> WS: SYNCED</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default GameBoard;