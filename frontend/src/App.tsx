import React, { useState, useEffect, useCallback } from 'react';

interface GameState {
  board: (string | null)[];
  currentPlayer: string;
  phase: string;
  p1PiecesLeft: number;
  p2PiecesLeft: number;
  winner: string | null;
}

const API_BASE = '/api/game';

export default function App() {
  const [mode, setMode] = useState<'1P' | '2P'>('1P');
  const [state, setState] = useState<GameState>({ board: Array(24).fill(null), currentPlayer: 'P1', phase: 'PLACING', p1PiecesLeft: 9, p2PiecesLeft: 9, winner: null });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [prevState, setPrevState] = useState<GameState>({ board: Array(24).fill(null), currentPlayer: 'P1', phase: 'PLACING', p1PiecesLeft: 9, p2PiecesLeft: 9, winner: null });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const syncState = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/game`);
      if (!res.ok) throw new Error('Sync failed');
      const data = await res.json();
      setState(data);
    } catch (e) { console.warn('Sync failed, rollback active'); }
  }, []);

  useEffect(() => { syncState(); }, [syncState]);

  const handleMove = async (to: number, from?: number) => {
    setPrevState(state);
    setState(prev => ({ ...prev }));
    
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/game/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to })
      });
      if (!res.ok) throw new Error('Backend rejection');
      const data = await res.json();
      setState(data);
    } catch (err) {
      setState(prevState);
      showToast('Érvénytelen lépés • Állapot visszaállítva');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (mode === '1P' && state.currentPlayer !== 'P1' && !state.winner) {
      const timer = setTimeout(async () => {
        setPrevState(state);
        setState(prev => ({ ...prev }));
        try {
          await fetch(`${API_BASE}/game/move`, { method: 'POST', body: JSON.stringify({ from: null, to: Math.floor(Math.random() * 24) }) });
          syncState();
        } catch(e) { setState(prevState); showToast('AI hiba • Kérem próbálja újra'); }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [state.currentPlayer, mode, state.winner, prevState, syncState]);

  const resetGame = async () => {
    try {
      await fetch(`${API_BASE}/game/reset`, { method: 'POST' });
      syncState();
    } catch(e) { console.error('Reset failed'); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center p-4 font-sans">
      <header className="mb-6 w-full max-w-md flex justify-between items-center border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">MORRIS PROTOCOL</h1>
        <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
          <button onClick={() => setMode('1P')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === '1P' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>1 Játékos</button>
          <button onClick={() => setMode('2P')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === '2P' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>2 Játékos</button>
        </div>
      </header>

      <div className="w-full max-w-md flex justify-between items-center mb-4 px-2">
        <span className="text-sm text-slate-300">{state.phase === 'PLACING' ? 'Elhelyezés' : 'Mozgatás'} • {state.currentPlayer} Köre</span>
        <button onClick={resetGame} className="text-xs font-mono text-slate-500 hover:text-red-400 border border-dashed border-slate-700 px-2 py-1 rounded">Újraindítás</button>
      </div>

      <main className="relative w-[300px] h-[300px] border-2 border-slate-700 bg-slate-900/50 rounded-lg shadow-2xl">
        {state.board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleMove(i)}
            disabled={loading || !!state.winner || (mode === '1P' && state.currentPlayer !== 'P1')}
            className="absolute w-8 h-8 flex items-center justify-center text-lg font-bold touch-manipulation rounded-full transition-all duration-200 hover:bg-slate-700/50 disabled:cursor-not-allowed"
            style={{ left: `${(i % 4) * 33.3 + (i >= 16 ? 8 : i >= 8 && i < 16 ? -4 : 0)}%`, top: `${Math.floor(i / 6) * 33.3}%` }}
          >
            {cell === 'P1' ? <span className="w-6 h-6 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span> : cell === 'P2' ? <span className="w-6 h-6 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span> : ''}
          </button>
        ))}
      </main>

      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 bg-slate-800/95 border border-slate-700 rounded-lg shadow-xl text-sm font-medium backdrop-blur-md transition-all duration-300 ease-out z-50">
          {toast}
        </div>
      )}

      <footer className="mt-6 text-slate-400 text-xs">
        P1: {state.p1PiecesLeft} • P2: {state.p2PiecesLeft} • Winner: {state.winner || '-'}
      </footer>
    </div>
  );
}