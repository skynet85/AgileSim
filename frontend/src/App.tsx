import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, ShieldAlert, Activity, AlertTriangle, MoveUp } from 'lucide-react';

export interface GameState {
  phase: string;
  turn: string;
  piecesToPlaceWhite: number;
  piecesToPlaceBlack: number;
  boardState: number[]; // 0=üres, 1=Fehér, -1=Fekete
  winner: string | null;
  message?: string;
}

const MOCK_STATE: GameState = {
  phase: 'PLACE',
  turn: 'W',
  piecesToPlaceWhite: 9,
  piecesToPlaceBlack: 9,
  boardState: Array(24).fill(0),
  winner: null,
  message: ''
};

interface Position { x: number; y: number; }
const POSITIONS: readonly Position[] = [
  // Külső gyűrű (0-7)
  { x: 10, y: 10 }, { x: 50, y: 5 }, { x: 90, y: 10 }, { x: 95, y: 50 },
  { x: 90, y: 90 }, { x: 50, y: 95 }, { x: 10, y: 90 }, { x: 5, y: 50 },
  // Középső gyűrű (8-15)
  { x: 25, y: 25 }, { x: 50, y: 20 }, { x: 75, y: 25 }, { x: 80, y: 50 },
  { x: 75, y: 75 }, { x: 50, y: 80 }, { x: 25, y: 75 }, { x: 20, y: 50 },
  // Belső gyűrű (16-23)
  { x: 40, y: 40 }, { x: 50, y: 35 }, { x: 60, y: 40 }, { x: 65, y: 50 },
  { x: 60, y: 60 }, { x: 50, y: 65 }, { x: 40, y: 60 }, { x: 35, y: 50 }
];

interface LinePair { from: number; to: number; }
const LINES: readonly LinePair[] = [
  // Külső négyzet
  { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 },
  { from: 4, to: 5 }, { from: 5, to: 6 }, { from: 6, to: 7 }, { from: 7, to: 0 },
  // Középső négyzet
  { from: 8, to: 9 }, { from: 9, to: 10 }, { from: 10, to: 11 }, { from: 11, to: 12 },
  { from: 12, to: 13 }, { from: 13, to: 14 }, { from: 14, to: 15 }, { from: 15, to: 8 },
  // Belső négyzet
  { from: 16, to: 17 }, { from: 17, to: 18 }, { from: 18, to: 19 }, { from: 19, to: 20 },
  { from: 20, to: 21 }, { from: 21, to: 22 }, { from: 22, to: 23 }, { from: 23, to: 16 },
  // Kötővonalak
  { from: 0, to: 8 }, { from: 1, to: 9 }, { from: 2, to: 10 }, { from: 3, to: 11 },
  { from: 4, to: 12 }, { from: 5, to: 13 }, { from: 6, to: 14 }, { from: 7, to: 15 }
];

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFrom, setSelectedFrom] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  useEffect(() => { initGame(); }, []);

  const initGame = async () => {
    try {
      setLoading(true);
      setError(null);
      setSelectedFrom(null);
      const res = await fetch('/api/game/init', { method: 'POST' });
      if (!res.ok) throw new Error('Szerverkapcsolati hiba.');
      
      const data: GameState = await res.json();
      setGameState(data);
    } catch (err: unknown) {
      console.warn("Backend nem elérhető. Demo mód aktiválva.");
      setGameState(MOCK_STATE);
    } finally { setLoading(false); }
  };

  const refreshState = async () => {
    try {
      setError(null);
      setSelectedFrom(null);
      const res = await fetch('/api/game/state');
      if (!res.ok) throw new Error('Szinkronizációs hiba.');
      setGameState(await res.json());
    } catch (err: unknown) { /* Helyileg kezelt, implicit sync fenntartása */ }
  };

  const handleBoardClick = async (index: number) => {
    if (!gameState || gameState.winner || loading || error) return;
    
    let action = '';
    let fromIndex: number | null = selectedFrom;

    if (gameState.phase === 'PLACE') {
      action = 'PLACE';
      fromIndex = null;
    } else {
      if (selectedFrom === null) {
        setSelectedFrom(index);
        return;
      }
      action = gameState.phase === 'MOVE' ? 'MOVE' : 'REMOVE';
    }

    try {
      const t0 = performance.now();
      
      const res = await fetch('/api/game/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, fromIndex, toIndex: index, player: gameState.turn })
      });

      const data: GameState = await res.json();
      setLatencyMs(Math.round(performance.now() - t0));

      if (data.message) {
        setError(data.message);
        setSelectedFrom(null);
        return;
      }

      setGameState(data);
      setSelectedFrom(null);
    } catch (err: unknown) {
      setError('Hálózati hiba. Állapot szinkronizálása...');
      await refreshState();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-emerald-400 font-mono select-none">
        <span className="animate-pulse flex items-center gap-3 tracking-widest uppercase text-sm">
          <RefreshCw size={18} /> Rendszer inicializálása...
        </span>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-red-400 font-mono select-none">
        <AlertTriangle size={20} /> <span>Hiba: Hiányzó játékállapot.</span>
      </div>
    );
  }

  let statusMsg = '';
  if (gameState.winner) {
    statusMsg = `🏆 ${gameState.winner === 'W' ? 'Fehér' : 'Fekete'} játékos nyert!`;
  } else if (gameState.phase === 'PLACE') {
    const totalLeft: number = gameState.piecesToPlaceWhite + gameState.piecesToPlaceBlack;
    statusMsg = `Léptetés: ${gameState.turn === 'W' ? 'Fehér' : 'Fekete'} (${totalLeft} darab hátravan)`;
  } else if (gameState.phase === 'MOVE') {
    statusMsg = 'Mozgatás: Kattints egy saját bábura a kijelöléshez...';
  } else if (gameState.phase === 'REMOVE') {
    statusMsg = 'Mill képződött! Válassz ki egy ellenséges darabot!';
  }

  const isDisabled: boolean = !!error || !!gameState.winner;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start sm:justify-center p-4 font-mono text-slate-200 select-none overflow-y-auto">
      {/* Header */}
      <header className="w-full max-w-lg mb-6 text-center space-y-1 pt-4 sm:pt-0">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-emerald-400 mb-1 uppercase">Nine Men's Morris</h1>
        <p className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500">Determinisztikus Állapotgép • Zárt Ciklus • v1.7.0-METRIC-GATE</p>
      </header>

      {/* Status Bar */}
      <div className={`w-full max-w-lg px-4 py-3 rounded-lg border text-center transition-all duration-300 mb-4 flex items-center justify-between ${
        gameState.phase === 'REMOVE' ? 'bg-red-950/20 border-red-700/60 text-red-300' : 
        gameState.winner ? 'bg-emerald-950/20 border-emerald-700/60 text-emerald-300' : 
        'bg-slate-800/40 border-slate-700/60 text-emerald-200'
      }`}>
        <span className="text-sm sm:text-base font-semibold tracking-wide flex items-center gap-2">
          {gameState.winner ? <CheckCircle2 size={18} /> : null}
          {statusMsg || gameState.message}
        </span>
        
        {!gameState.winner && (
           <button 
             onClick={refreshState}
             className="p-1.5 hover:bg-slate-700/50 rounded transition-colors ml-3 text-slate-400 hover:text-emerald-400"
             title="Állapot manuális szinkronizálása"
           >
             <RefreshCw size={16} />
           </button>
        )}
      </div>

      {/* Latency Metric */}
      {latencyMs !== null && (
        <div className="w-full max-w-lg mb-4 px-3 py-2 rounded border border-slate-700/50 bg-slate-900/30 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5"><Activity size={12} /> Késleltetés:</span>
          <span className={`font-bold ${latencyMs > 30 ? 'text-red-400' : latencyMs > 15 ? 'text-yellow-400' : 'text-emerald-400'}`}>{latencyMs}ms</span>
        </div>
      )}

      {/* Error Banner with Recovery */}
      {error && (
        <div className="w-full max-w-lg mb-6 px-3 py-2 rounded-lg bg-red-950/40 border border-red-700/60 text-red-200 flex items-start gap-3 animate-pulse">
          <ShieldAlert size={18} className="mt-0.5 shrink-0" />
          <div className="flex flex-col w-full">
            <span className="font-medium leading-relaxed">{error}</span>
            <button onClick={() => setError(null)} className="text-[10px] sm:text-xs text-red-300 hover:text-emerald-400 underline mt-2 self-end transition-colors flex items-center gap-1">
              Hiba tisztázása & Recovery <MoveUp size={10} />
            </button>
          </div>
        </div>
      )}

      {/* Game Board */}
      <div className="w-full max-w-lg aspect-square relative select-none" role="grid" aria-label="Nine Men's Morris tábla">
        <svg viewBox="0 0 100 100" className="w-full h-full text-slate-600 stroke-current fill-none stroke-[1.5] pointer-events-none">
          {LINES.map((line) => (
            <line 
              key={`${line.from}-${line.to}`}
              x1={POSITIONS[line.from].x} 
              y1={POSITIONS[line.from].y} 
              x2={POSITIONS[line.to].x} 
              y2={POSITIONS[line.to].y} 
            />
          ))}
        </svg>
        
        {POSITIONS.map((pos, idx) => {
          const cell = gameState.boardState[idx] ?? 0;
          const isWhite = cell === 1;
          const isBlack = cell === -1;
          const isEmpty = !isWhite && !isBlack;

          return (
            <div
              key={idx}
              onClick={() => !isDisabled && handleBoardClick(idx)}
              className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center text-[10px] font-bold border-2 z-10 ${
                isDisabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-slate-700/40 hover:scale-105 active:scale-95'
              } ${selectedFrom === idx ? 'ring-4 ring-emerald-400 bg-slate-800 scale-110 shadow-[0_0_12px_rgba(52,211,153,0.6)] z-20' : 'bg-slate-900 border-slate-600'} ${
                isWhite ? 'text-white border-white bg-slate-200 shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 
                isBlack ? 'text-black border-black bg-slate-400 shadow-[0_0_8px_rgba(0,0,0,0.6)]' : ''
              }`}
              role="gridcell"
              aria-label={`Pozíció ${idx}: ${isEmpty ? 'Üres' : (isWhite ? 'Fehér bábú' : 'Fekete bábú')}`}
              tabIndex={isDisabled ? -1 : 0}
            >
              {isWhite ? 'W' : isBlack ? 'B' : ''}
            </div>
          );
        })}
      </div>

      {/* Footer Controls */}
      <footer className="mt-8 text-xs text-slate-500 flex gap-4 items-center pb-6">
        <button 
          onClick={initGame}
          className="hover:text-emerald-400 transition-colors flex items-center gap-2 px-3 py-2 border border-slate-700/50 rounded hover:border-emerald-500/40 bg-slate-800/30 active:scale-95"
        >
          <RefreshCw size={12} /> Új játék inicializálása (API)
        </button>
      </footer>
    </div>
  );
}