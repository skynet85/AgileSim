import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { clsx } from 'clsx';
import { GameBoard } from '../components/GameBoard';
import { GameState } from '../lib/gameLogic';

interface GamePlayPageProps {
  gameId: string;
  mode: 'SINGLE' | 'LOCAL_MULTI';
  onBack: () => void;
}

const API = axios.create({ baseURL: '/api' });

export const GamePlayPage: React.FC<GamePlayPageProps> = ({ gameId, mode, onBack }) => {
  // Determinisztikus állapotgép szinkronizálása a backenddel
  const [state, setState] = useState<GameState | null>(null);
  const [selectedPos, setSelectedPos] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<number[]>([]);
  const [removalTarget, setRemovalTarget] = useState<boolean>(false);
  
  // Strukturált visszajelzési állapot (Nielsen-heurisztikák: azonnali, egyértelmű feedback)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [showRules, setShowRules] = useState<boolean>(true);

  useEffect(() => {
    fetchGameState();
    // Polling alapú állapotfrissítés. Unmountkor kötelező cleanup a memóriaszivárgás elkerülésére.
    const interval = setInterval(fetchGameState, 2000);
    return () => clearInterval(interval);
  }, [gameId]);

  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  const fetchGameState = async () => {
    try {
      const res = await API.get(`/games/${gameId}`);
      setState(res.data.state as GameState);
    } catch (err: any) {
      setFeedbackMessage('Hálózati hiba. Állapot szinkronizálás sikertelen.');
    }
  };

  // Frontend-oldali érvényesítési hint a UX optimalizálásához, de a végső validáció kizárólag backenden történik
  useEffect(() => {
    if (!state || selectedPos === null || state.phase === 'placing') return;
    
    const moves: number[] = [];
    if (state.board[selectedPos] === state.currentPlayer) {
      setValidMoves(moves);
    } else {
      setValidMoves([]);
    }
  }, [selectedPos, state]);

  const handleSquareClick = async (index: number) => {
    if (!state || state.status === 'FINISHED') return;

    // 1. Eltávolítási fázis kezelése (Malom detektált)
    if (removalTarget && index !== selectedPos) {
      try {
        await API.post(`/games/${gameId}/remove`, { position: index });
        setRemovalTarget(false);
        setSelectedPos(null);
        fetchGameState(); 
      } catch (err: any) {
        setFeedbackMessage(err.response?.data?.message || 'Érvénytelen eltávolítás');
      }
      return;
    }

    // 2. Választási fázis (csak mozgatás fázisban releváns)
    if (selectedPos === null && state.board[index] !== null && state.phase !== 'placing') {
      setSelectedPos(index);
      return;
    }

    // 3. Lépés végrehajtása
    if (selectedPos !== null) {
      const move = { from: selectedPos, to: index };
      try {
        const res = await API.post(`/games/${gameId}/move`, move);
        setState(res.data.state as GameState);
        setSelectedPos(null);
        
        // Ha a lépés malomot hozott létre, belépünk az eltávolítási fázisba
        if (res.data.removalPositions && res.data.removalPositions.length > 0) {
          setRemovalTarget(true);
          setFeedbackMessage('MALM KÉZBEN! Válassz egy ellenfél darabot az eltávolításhoz.');
        } else {
          setFeedbackMessage('Lépés elfogadva. Következő kör.');
        }
      } catch (err: any) {
        setSelectedPos(null); 
        setFeedbackMessage(err.response?.data?.message || 'Érvénytelen lépés.');
      }
    } else if (state.phase === 'placing' && state.board[index] === null) {
      // Helyezés fázis: közvetlenül állítjuk be a célpontot
      setSelectedPos(index);
    }
  };

  if (!state) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-mono tracking-widest">ÁLLAPOT SZINKRONIZÁLÁS...</div>;

  const phaseLabels: Record<string, string> = { placing: 'Helyezés', moving: 'Mozgás', flying: 'Repülés' };
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-4 py-6 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-emerald-400 flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
            MILLS PROTOCOL
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-mono tracking-wide">SESSION: {gameId.slice(0, 8)} | MODE: {mode}</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium transition-colors">
          Vissza a menübe
        </button>
      </header>

      {/* Strukturált visszajelzési sáv (Toast helyett, allowed deps betartásával) */}
      {feedbackMessage && (
        <div className={clsx(
          "w-full max-w-7xl mx-auto mt-4 px-4",
          feedbackMessage.toLowerCase().includes('hiba') || feedbackMessage.toLowerCase().includes('érvénytelen') 
            ? "text-red-300 bg-red-950/40 border border-red-800" 
            : feedbackMessage.includes('MALM')
              ? "text-yellow-300 bg-yellow-950/40 border border-yellow-800 animate-pulse"
              : "text-emerald-300 bg-emerald-950/40 border border-emerald-800"
        )}>
          <div className="max-w-7xl mx-auto p-3 rounded-lg text-center font-mono text-sm flex items-center justify-center gap-2">
            {feedbackMessage}
          </div>
        </div>
      )}

      {/* Main Layout */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Game Board Area */}
        <section className="lg:col-span-2 flex flex-col items-center justify-start relative">
          <div className="w-full max-w-[600px] aspect-square relative bg-slate-900/50 rounded-xl border border-slate-800 p-4 shadow-2xl shadow-black/50">
            <GameBoard 
              board={state.board}
              currentPlayer={state.currentPlayer}
              selectedPos={selectedPos}
              validMoves={validMoves}
              onSquareClick={handleSquareClick}
            />
            {removalTarget && (
               <div className="absolute -bottom-10 left-0 right-0 text-center pointer-events-none">
                 <span className="inline-block px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-300 font-mono text-xs tracking-wider animate-bounce">
                   ⚠ ELTÁVOLÍTÁS FÁZIS: KATTINTS AZ ELLENFÉL DARABJÁRA
                 </span>
               </div>
            )}
          </div>
        </section>

        {/* Sidebar / Rules & Status */}
        <aside className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Status Panel */}
          <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">Aktuális fázis</span>
              <span className={clsx(
                "px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider border",
                state.phase === 'placing' ? "bg-blue-500/20 text-blue-300 border-blue-500/40" : 
                state.phase === 'flying' ? "bg-purple-500/20 text-purple-300 border-purple-500/40" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              )}>
                {phaseLabels[state.phase] || state.phase}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={clsx("p-4 rounded-lg border transition-all", state.currentPlayer === 'black' ? "bg-slate-800/80 border-black ring-1 ring-emerald-500/40" : "bg-slate-900/40 border-slate-800")}>
                <span className="text-[10px] text-slate-500 block mb-2 uppercase tracking-wider">Fekete</span>
                <div className="flex items-end gap-2">
                  <span className="font-mono text-2xl font-bold">{(state.piecesRemainingToPlace as any).black}</span>
                  <span className="text-[10px] text-slate-600 mb-1">/ 9</span>
                </div>
              </div>
              <div className={clsx("p-4 rounded-lg border transition-all", state.currentPlayer === 'white' ? "bg-slate-800/80 border-white ring-1 ring-emerald-500/40" : "bg-slate-900/40 border-slate-800")}>
                <span className="text-[10px] text-slate-500 block mb-2 uppercase tracking-wider">Fehér</span>
                <div className="flex items-end gap-2">
                  <span className="font-mono text-2xl font-bold">{(state.piecesRemainingToPlace as any).white}</span>
                  <span className="text-[10px] text-slate-600 mb-1">/ 9</span>
                </div>
              </div>
            </div>

            {state.status === 'FINISHED' && state.winner && (
               <div className="mt-2 p-4 bg-emerald-500/10 border border-emerald-500 rounded-lg text-center animate-pulse">
                 <span className="font-bold text-emerald-300 block mb-1 text-sm tracking-wider">JÁTÉK VÉGE</span>
                 <span className="text-xs font-mono">{state.winner === 'black' ? 'FEKETE' : 'FEHÉR'} GYŐZETT.</span>
               </div>
            )}
          </div>

          {/* Rules & Strategy Panel */}
          <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 flex-grow">
            <button 
              onClick={() => setShowRules(!showRules)} 
              className="w-full flex justify-between items-center pb-3 mb-3 border-b border-slate-800 text-left"
            >
              <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">Szabályok & Stratégia</span>
              <span className={clsx("transition-transform", showRules ? "rotate-180" : "")}>▼</span>
            </button>

            {showRules && (
              <div className="space-y-4 text-xs text-slate-300 font-light leading-relaxed">
                <p><strong className="text-emerald-400 block mb-1">Helyezés (Placing)</strong> 
                A játék elején 9 darabot helyeztek felváltva. A cél sorba állítani 3 saját darabot egy vonalba („malom”). Malom esetén az ellenfél egy darabját eltávolíthatod.</p>
                
                <p><strong className="text-blue-400 block mb-1">Mozgás (Moving)</strong> 
                Miután mindkét játékos lerakta a 9 darabot, követheted a vonalakat. Egy lépésben egy szomszédos szabad mezőre léphetsz.</p>
                
                <p><strong className="text-purple-400 block mb-1">Repülés (Flying)</strong> 
                Ha csak 3 darabod maradt, „repülni” kezdhetsz bármelyik üres mezőre a táblán. Ez kulcsfontosságú a túléléshez.</p>
                
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 block mb-2 uppercase tracking-wider">Játékvég feltétel</span>
                  <p className="text-slate-400">Amikor egy játékosnak 2 vagy kevesebb darabja marad, és nem tud lépni, az ellenfél győz.</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-600 font-mono space-y-1">
                  <div className="flex justify-between"><span>STATE_HASH:</span><span>{state.id.slice(0,12)}...</span></div>
                  <div className="flex justify-between"><span>TURNCOUNT:</span><span>{state.board.filter(Boolean).length}</span></div>
                </div>
              </div>
            )}
          </div>

        </aside>
      </main>
    </div>
  );
};