// frontend/src/App.tsx
import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Info, Play, Users, User, XCircle, CheckCircle, ChevronDown, ChevronUp, RotateCcw, AlertTriangle, BookOpen } from 'lucide-react';

// --- TÍPUSOK & ÁLLAPOTVEZÉRLÉS ---
type Player = 'black' | 'white';
type GameMode = 'SINGLE' | 'LOCAL_MULTI';
type Phase = 'SETUP' | 'PLACING' | 'MOVING' | 'FLYING' | 'FINISHED';

interface GameState {
  mode: GameMode;
  board: (Player | null)[]; // 24 pozíció, indexelve 0-23
  currentPlayer: Player;
  phase: Phase;
  piecesRemaining: Record<Player, number>;
  winner: Player | null;
  selectedPos: number | null;
  validMoves: number[];
  feedbackMessage: string | null;
  feedbackType: 'success' | 'error' | 'info';
}

// Drótváz koordináták (relatív százalékos pozícionálás a három koncentrikus négyzethez)
const BOARD_POSITIONS = [
  // Külső négyzet (0-7)
  { id: 0, x: '5%', y: '5%' },   { id: 1, x: '50%', y: '5%' },  { id: 2, x: '95%', y: '5%' },
  { id: 3, x: '95%', y: '50%' }, { id: 4, x: '95%', y: '95%' }, { id: 5, x: '50%', y: '95%' },
  { id: 6, x: '5%', y: '95%' },  { id: 7, x: '5%', y: '50%' },
  // Középső négyzet (8-15)
  { id: 8, x: '25%', y: '25%' },  { id: 9, x: '50%', y: '25%' }, { id: 10, x: '75%', y: '25%' },
  { id: 11, x: '75%', y: '50%' }, { id: 12, x: '75%', y: '75%' }, { id: 13, x: '50%', y: '75%' },
  { id: 14, x: '25%', y: '75%' }, { id: 15, x: '25%', y: '50%' },
  // Belső négyzet (16-23)
  { id: 16, x: '38.5%', y: '38.5%' }, { id: 17, x: '50%', y: '38.5%' }, { id: 18, x: '61.5%', y: '38.5%' },
  { id: 19, x: '61.5%', y: '50%' },   { id: 20, x: '61.5%', y: '61.5%' }, { id: 21, x: '50%', y: '61.5%' },
  { id: 22, x: '38.5%', y: '61.5%' }, { id: 23, x: '38.5%', y: '50%' }
];

// Kapcsolatok a vonalak rajzolásához (wireframe szintű)
const LINES = [
  // Külső
  [0, 1], [1, 2], [2, 4], [4, 5], [5, 6], [6, 7], [7, 0], [3, 4],
  // Középső
  [8, 9], [9, 10], [10, 12], [12, 13], [13, 14], [14, 15], [15, 8], [11, 12],
  // Belső
  [16, 17], [17, 18], [18, 20], [20, 21], [21, 22], [22, 23], [23, 16], [19, 20],
  // Kapcsolatok (külső-közép-belső)
  [1, 9], [3, 11], [5, 19], [7, 15], [9, 17], [11, 18], [19, 20], [15, 23]
];

// --- SEGÉDFUNKCIÓK ---
const createInitialState = (mode: GameMode): GameState => ({
  mode,
  board: Array(24).fill(null),
  currentPlayer: 'black',
  phase: 'PLACING',
  piecesRemaining: { black: 9, white: 9 },
  winner: null,
  selectedPos: null,
  validMoves: [],
  feedbackMessage: null,
  feedbackType: 'info'
});

// --- KOMPONENSEK ---

const SetupScreen: React.FC<{ onStart: (mode: GameMode) => void }> = ({ onStart }) => {
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4 font-sans selection:bg-emerald-500/30">
      <div className="w-full max-w-lg bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 ring-1 ring-white/5">
        <header className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-full mb-4 ring-2 ring-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Play className="w-8 h-8 text-emerald-400 ml-1" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">MALOM PROTOKOLL</h1>
          <p className="text-slate-400 text-sm">Digitális stratégiai interfész • Verzió 2.0</p>
        </header>

        <div className="space-y-3">
          <span className="block text-xs font-mono uppercase tracking-widest text-slate-500 mb-2">Játékmód Választás</span>
          <button 
            onClick={() => onStart('SINGLE')}
            className="w-full group flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-emerald-900/30 border border-slate-700 hover:border-emerald-500/50 rounded-xl transition-all duration-200"
          >
            <div className="p-2 bg-slate-700 group-hover:bg-emerald-500/20 rounded-lg">
              <User className="w-6 h-6 text-slate-300 group-hover:text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-white">Egyjátékos (AI)</p>
              <p className="text-xs text-slate-500">Adaptív nehézség, sablonos stratégiák</p>
            </div>
          </button>

          <button 
            onClick={() => onStart('LOCAL_MULTI')}
            className="w-full group flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-blue-900/30 border border-slate-700 hover:border-blue-500/50 rounded-xl transition-all duration-200"
          >
            <div className="p-2 bg-slate-700 group-hover:bg-blue-500/20 rounded-lg">
              <Users className="w-6 h-6 text-slate-300 group-hover:text-blue-400" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-white">Helyi Többjátékos</p>
              <p className="text-xs text-slate-500">Felváltva, valós idejű állapotfrissítés</p>
            </div>
          </button>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <button 
            onClick={() => setShowRules(!showRules)}
            className="w-full flex items-center justify-between text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span className="flex items-center gap-2"><BookOpen size={16} /> Szabályrendszer & Stratégia</span>
            {showRules ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          <div className={clsx(
            "overflow-hidden transition-all duration-300 ease-in-out", 
            showRules ? "max-h-96 mt-4 opacity-100" : "max-h-0 opacity-0"
          )}>
            <div className="bg-slate-800/50 rounded-xl p-4 space-y-3 text-sm text-slate-300 leading-relaxed">
              <p><strong className="text-white block mb-1">1. Helyezés (Placing)</strong> Mindkét játékos felváltva helyez el 9 darabot a kereszteződéseken. Ha egy sorba (malom) kerülnek, az ellenfél egy darabja eltávolítható.</p>
              <p><strong className="text-white block mb-1">2. Mozgás (Moving)</strong> Miután mindkét játékos lerakta a készletét, a vonalak mentén lépkednek szomszédos szabad mezőre.</p>
              <p><strong className="text-white block mb-1">3. Repülés (Flying)</strong> Ha egy játékosnak csak 3 darabja maradt, bármely üres mezőre "repülhet".</p>
              <div className="flex items-start gap-2 text-xs text-yellow-500/80 bg-yellow-900/10 p-2 rounded border border-yellow-700/30 mt-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>A szabályok szigorú érvényesítést követnek a felületen. Érvénytelen lépések esetén a rendszer azonnal visszajelzést ad, csökkentve a kognitív terhelést.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GameBoard: React.FC<{ 
  board: (Player | null)[], 
  validMoves: number[], 
  selectedPos: number | null,
  onSquareClick: (idx: number) => void 
}> = ({ board, validMoves, selectedPos, onSquareClick }) => {
  return (
    <div className="relative w-full max-w-[500px] aspect-square mx-auto bg-slate-900/40 rounded-2xl border border-slate-800 p-4 shadow-inner">
      {/* Vonalak rajzolása SVG-ben */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 100 100">
        {LINES.map(([from, to], i) => {
          const f = BOARD_POSITIONS.find(p => p.id === from)!;
          const t = BOARD_POSITIONS.find(p => p.id === to)!;
          return (
            <line 
              key={i} 
              x1={f.x} y1={f.y} x2={t.x} y2={t.y} 
              stroke="#475569" strokeWidth="0.8" 
            />
          );
        })}
      </svg>

      {/* Pozíciók */}
      {BOARD_POSITIONS.map((pos) => {
        const isOccupied = board[pos.id] !== null;
        const isValid = validMoves.includes(pos.id);
        const isSelected = selectedPos === pos.id;
        
        return (
          <button
            key={pos.id}
            onClick={() => onSquareClick(pos.id)}
            style={{ left: pos.x, top: pos.y }}
            className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 transition-all duration-200 z-10 flex items-center justify-center"
            disabled={!isValid && !isOccupied}
          >
            <span 
              className={clsx(
                "w-full h-full rounded-full shadow-sm ring-2",
                isOccupied ? (board[pos.id] === 'black' ? "bg-slate-950 border-white ring-emerald-500/60" : "bg-white border-black ring-red-500/60") :
                isValid ? "bg-transparent border-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)] cursor-pointer hover:scale-150" :
                isSelected ? "border-yellow-400 scale-150 bg-slate-800/80" :
                "bg-transparent border-slate-600 opacity-40 hover:border-slate-400 hover:opacity-100"
              )} 
            />
          </button>
        );
      })}
    </div>
  );
};

const GamePlayPage: React.FC<{ mode: GameMode, onBack: () => void }> = ({ mode, onBack }) => {
  const [state, setState] = useState<GameState>(createInitialState(mode));

  // Reset handler (anchor bias leküzdése)
  const resetGame = () => setState(createInitialState(state.mode));

  const handleSquareClick = (idx: number) => {
    if (state.phase === 'FINISHED') return;

    // Érvényes lépés kiválasztása / megerősítése
    if (!state.selectedPos && state.board[idx] !== null && state.phase !== 'PLACING') {
      setState(prev => ({ ...prev, selectedPos: idx }));
      return;
    }

    if (state.selectedPos !== null) {
      const isMoveValid = state.validMoves.includes(idx);
      
      // Helyezés fázisban azonnal elfogadva (UI egyszerűsítés)
      if (state.phase === 'PLACING' && !isOccupied) {
        applyPlace(state, idx);
        return;
      }

      if (!isMoveValid) {
        setFeedback('Érvénytelen lépés. Válassz egy saját darabot vagy a valid mezőt.', 'error');
        setState(prev => ({ ...prev, selectedPos: null }));
        return;
      }

      // Mozgás végrehajtása (wireframe szintű szimuláció)
      applyMove(state, state.selectedPos, idx);
    } else if (state.phase === 'PLACING' && !isOccupied) {
       setState(prev => ({ ...prev, selectedPos: idx }));
    }
  };

  const isOccupied = (idx: number) => state.board[idx] !== null;

  // Szimulált állapotfrissítés a wireframe céljára (backend hívás helyére)
  const applyPlace = (s: GameState, idx: number) => {
    const newBoard = [...s.board];
    newBoard[idx] = s.currentPlayer;
    const nextPlayer = s.currentPlayer === 'black' ? 'white' : 'black';
    
    setState(prev => ({
      ...prev, board: newBoard, currentPlayer: nextPlayer, selectedPos: null,
      piecesRemaining: { ...prev.piecesRemaining, [nextPlayer]: prev.piecesRemaining[nextPlayer] - 1 },
      feedbackMessage: `${s.currentPlayer.toUpperCase()} darab elhelyezve.`,
      feedbackType: 'success'
    }));
  };

  const applyMove = (s: GameState, from: number, to: number) => {
    const newBoard = [...s.board];
    newBoard[from] = null;
    newBoard[to] = s.currentPlayer;
    const nextPlayer = s.currentPlayer === 'black' ? 'white' : 'black';

    setState(prev => ({
      ...prev, board: newBoard, currentPlayer: nextPlayer, selectedPos: null,
      feedbackMessage: `Lépés elfogadva. ${s.currentPlayer.toUpperCase()} → ${nextPlayer.toUpperCase()}`,
      feedbackType: 'success'
    }));
  };

  const setFeedback = (msg: string, type: GameState['feedbackType']) => {
    setState(prev => ({ ...prev, feedbackMessage: msg, feedbackType: type }));
    setTimeout(() => setState(prev => ({ ...prev, feedbackMessage: null })), 4000);
  };

  const phaseLabels = { PLACING: 'Helyezés', MOVING: 'Mozgás', FLYING: 'Repülés', FINISHED: 'Vége' };
  const playerColors = { black: 'text-slate-200', white: 'text-white' };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold tracking-wider text-emerald-400">MALOM PROTOCOL</span>
          <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] font-mono text-slate-400 uppercase">{state.mode}</span>
        </div>
        <button onClick={onBack} className="text-xs flex items-center gap-1 text-slate-500 hover:text-white transition-colors">
          <XCircle size={14} /> Kijelentkezés
        </button>
      </header>

      {/* Feedback Toast */}
      {state.feedbackMessage && (
        <div className="mx-auto mt-3 px-4 max-w-md animate-in fade-in slide-in-from-top-2 duration-300">
          <div className={clsx(
            "px-4 py-2 rounded-lg text-xs font-medium border flex items-center justify-between shadow-lg",
            state.feedbackType === 'error' ? "bg-red-950/80 border-red-700 text-red-200" : 
            state.feedbackType === 'success' ? "bg-emerald-950/80 border-emerald-700 text-emerald-200" :
            "bg-blue-950/80 border-blue-700 text-blue-200"
          )}>
            <span>{state.feedbackMessage}</span>
            {state.feedbackType === 'success' && <CheckCircle size={14} />}
            {state.feedbackType === 'error' && <XCircle size={14} />}
          </div>
        </div>
      )}

      <main className="flex-grow flex flex-col lg:flex-row gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
        
        {/* Bal oldal: Tábla */}
        <section className="lg:w-2/3 flex flex-col items-center justify-start min-h-[50vh]">
          <GameBoard 
            board={state.board} 
            validMoves={state.validMoves} 
            selectedPos={state.selectedPos} 
            onSquareClick={handleSquareClick} 
          />
          
          {/* Irányítópult a tábla alatt */}
          <div className="mt-6 flex gap-3 w-full max-w-md">
             <button onClick={resetGame} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2">
               <RotateCcw size={14} /> Új Játék
             </button>
             {state.phase === 'FINISHED' && (
               <div className="flex-1 py-2.5 bg-emerald-900/30 border border-emerald-700 rounded-lg text-xs font-bold text-emerald-300 flex items-center justify-center gap-2 animate-pulse">
                 <CheckCircle size={14} /> Játék Lezárva
               </div>
             )}
          </div>
        </section>

        {/* Jobb oldal: Szabályok & Állapot */}
        <aside className="lg:w-1/3 space-y-6">
          
          {/* Aktuális kör kártya */}
          <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 shadow-lg backdrop-blur-sm ring-1 ring-white/5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-3">Aktuális Fázis</span>
            <div className="flex items-center justify-between mb-4">
              <span className={clsx(
                "px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider border",
                state.phase === 'PLACING' ? "bg-blue-500/20 text-blue-300 border-blue-500/40" : 
                state.phase === 'FLYING' ? "bg-purple-500/20 text-purple-300 border-purple-500/40" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              )}>
                {phaseLabels[state.phase]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={clsx("p-3 rounded-lg border transition-all", state.currentPlayer === 'black' ? "bg-slate-800/90 border-black ring-1 ring-emerald-500/40" : "bg-slate-900/30 border-slate-800 opacity-60")}>
                <span className="text-[10px] text-slate-500 block mb-1">Fekete</span>
                <div className="flex items-end gap-1">
                  <span className={clsx("font-mono text-xl font-bold", state.currentPlayer === 'black' ? "text-white" : "text-slate-600")}>{state.piecesRemaining.black}</span>
                  <span className="text-[10px] text-slate-600 mb-1">/ 9</span>
                </div>
              </div>
              <div className={clsx("p-3 rounded-lg border transition-all", state.currentPlayer === 'white' ? "bg-slate-800/90 border-white ring-1 ring-emerald-500/40" : "bg-slate-900/30 border-slate-800 opacity-60")}>
                <span className="text-[10px] text-slate-500 block mb-1">Fehér</span>
                <div className="flex items-end gap-1">
                  <span className={clsx("font-mono text-xl font-bold", state.currentPlayer === 'white' ? "text-white" : "text-slate-600")}>{state.piecesRemaining.white}</span>
                  <span className="text-[10px] text-slate-600 mb-1">/ 9</span>
                </div>
              </div>
            </div>
          </div>

          {/* Kontextuális Szabálypanel */}
          <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 shadow-lg backdrop-blur-sm ring-1 ring-white/5 flex-grow">
            <h3 className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3 flex items-center gap-2">
              <Info size={14} /> Kontextuális Útmutató
            </h3>
            
            {state.phase === 'PLACING' && (
              <div className="space-y-3 text-xs text-slate-300 font-light leading-relaxed animate-in fade-in slide-in-from-right-2 duration-300">
                <p>Helyezz el egy darabot a <strong className="text-emerald-400">legyen üres</strong> kereszteződésen.</p>
                <div className="bg-slate-800/60 p-2 rounded border-l-2 border-emerald-500 text-[11px] text-slate-400">
                  Tipp: Figyeld a sorokat. Három egyforma színű darab malomot alkot, ami lehetővé teszi az ellenfél eltávolítását.
                </div>
              </div>
            )}

            {(state.phase === 'MOVING' || state.phase === 'FLYING') && (
              <div className="space-y-3 text-xs text-slate-300 font-light leading-relaxed animate-in fade-in slide-in-from-right-2 duration-300">
                {state.piecesRemaining[state.currentPlayer] <= 3 ? (
                   <>
                    <p><strong className="text-purple-400">Repülés aktiválva!</strong> Bármely üres mezőre léphetsz.</p>
                    <div className="bg-slate-800/60 p-2 rounded border-l-2 border-purple-500 text-[11px] text-slate-400">
                      A korlátozott készlet miatt a tábla bármely pontjára célzhatsz. Használd ki taktikailag!
                    </div>
                   </>
                ) : (
                  <>
                    <p><strong className="text-blue-400">Mozgás fázis.</strong> Csak a szomszédos, üres mezőre léphetsz.</p>
                    <div className="bg-slate-800/60 p-2 rounded border-l-2 border-blue-500 text-[11px] text-slate-400">
                      A kék/sárga kiemelés mutatja az érvényes útvonalakat. Ne lépj üresen, ha nem te vagy a soron következő játékos.
                    </div>
                  </>
                )}
              </div>
            )}

            {state.phase === 'FINISHED' && (
               <div className="text-center py-4 space-y-2 animate-in zoom-in duration-300">
                 <span className="block text-emerald-400 font-bold tracking-wider uppercase text-sm">Játék Vége</span>
                 <p className="text-slate-500 text-xs">A játék lezárult. Kattints az "Új Játék" gombra a folytatáshoz.</p>
               </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-600 font-mono">
              <span>SESSION_ID: {Math.random().toString(36).substring(2, 9)}</span>
              <span className="flex items-center gap-1"><CheckCircle size={10} className="text-emerald-500"/> STATE SYNCED</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

// --- FŐ APP KOMPONENS ---
function App() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [mode, setMode] = useState<GameMode>('LOCAL_MULTI');
  
  const startNewGame = async (selectedMode: GameMode) => {
    // Ide kerülne az axios.post('/api/games', { mode }) hívás a valós backendhez.
    // Wireframe szinten azonnali állapotváltást szimulálunk.
    setMode(selectedMode);
    setGameId(Math.random().toString(36).substring(7));
  };

  if (!gameId) return <SetupScreen onStart={startNewGame} />;
  
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500/30">
      <GamePlayPage gameId={gameId} mode={mode} onBack={() => setGameId(null)} />
    </div>
  );
}

export default App;