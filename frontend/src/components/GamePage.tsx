import { useState, useCallback, useEffect } from 'react';

type GameMode = 'SINGLE' | 'LOCAL_MULTIPLAYER';
type Phase = 'MENU' | 'SET_SECRET' | 'GUESSING' | 'GAME_OVER';

export default function GamePage() {
  const [mode, setMode] = useState<GameMode>('SINGLE');
  const [phase, setPhase] = useState<Phase>('MENU');
  const [secretCode, setSecretCode] = useState<number[] | null>(null);
  const [guessHistory, setGuessHistory] = useState<{ guess: string; bulls: number; cows: number }[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [gameOverReason, setGameOverReason] = useState<string>('');

  // Determinisztikus játékkonstansok a kognitív súrlódás minimalizálására
  const MAX_GUESSES = 10;
  const CODE_LENGTH = 4;

  // Fázisváltáskor automatikus állapot-generálás (zero-friction onboarding)
  useEffect(() => {
    if (mode === 'SINGLE' && phase === 'GUESSING') {
      generateCode();
    } else if (phase === 'SET_SECRET') {
      setSecretCode(null);
      setCurrentInput('');
      setError(null);
    }
  }, [mode, phase]);

  const generateCode = () => {
    let code: number[] = [];
    while (code.length < CODE_LENGTH) {
      const n = Math.floor(Math.random() * 10);
      if (!code.includes(n)) code.push(n);
    }
    setSecretCode(code);
  };

  // Zod-alapú validáció szimuláció a bemeneti szűréshez
  const validateInput = (val: string): boolean => {
    return /^\d{4}$/.test(val) && new Set(val.split('')).size === CODE_LENGTH;
  };

  // Bull/Cow algoritmus (determinisztikus visszajelzés)
  const calculateBullsCows = (guessStr: string, secret: number[]): { bulls: number; cows: number } => {
    let b = 0, c = 0;
    for (let i = 0; i < CODE_LENGTH; i++) {
      if (parseInt(guessStr[i]) === secret[i]) b++;
      else if (secret.includes(parseInt(guessStr[i]))) c++;
    }
    return { bulls: b, cows: c };
  };

  const handleSetSecret = () => {
    if (!validateInput(currentInput)) {
      setError('Csak 4 egyedi számjegy írható be.');
      return;
    }
    setSecretCode(currentInput.split('').map(Number));
    setPhase('GUESSING');
    setCurrentInput('');
    setError(null);
  };

  const handleSubmitGuess = useCallback(() => {
    if (!validateInput(currentInput)) {
      setError('Érvénytelen tipp. 4 egyedi számjegy szükséges.');
      return;
    }
    setError(null);
    if (!secretCode) return;

    const { bulls, cows } = calculateBullsCows(currentInput, secretCode);
    const newHistory = [...guessHistory, { guess: currentInput, bulls, cows }];
    setGuessHistory(newHistory);
    setCurrentInput('');

    // Állapotgép terminális feltételek
    if (bulls === 4) {
      setGameOverReason(`Gratulálok! Megtaláltad ${newHistory.length} próbálkozásból.`);
      setPhase('GAME_OVER');
    } else if (newHistory.length >= MAX_GUESSES) {
      setGameOverReason(`Vége a játéknak. A kód: ${secretCode.join('')}`);
      setPhase('GAME_OVER');
    }
  }, [currentInput, secretCode, guessHistory]);

  const restartGame = () => {
    setGuessHistory([]);
    setCurrentInput('');
    setError(null);
    setGameOverReason('');
    if (mode === 'SINGLE') {
      generateCode();
    } else {
      setPhase('SET_SECRET');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-8 font-sans selection:bg-cyan-500/30">
      {/* Vizuális fókuszpont: esztétikai koherencia → bizalomépítés */}
      <header className="mb-8 text-center select-none">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2 drop-shadow-sm">
          Ötődölő Pro
        </h1>
        <p className="text-slate-400 text-xs uppercase tracking-[0.3em] font-medium">Kognitív Tervezési Prototípus</p>
      </header>

      {/* Strukturált hibajelzés (≤2s feedback loop) */}
      {error && (
        <div className="w-full max-w-md mb-6 p-3 bg-red-900/15 border border-red-800/60 rounded-lg text-center animate-pulse">
          <p className="text-red-400 text-sm font-medium">{error}</p>
          <button onClick={() => setError(null)} className="mt-1.5 text-xs text-red-300 underline hover:text-red-100 transition-colors">
            Hibajelzés elvetése
          </button>
        </div>
      )}

      {/* FÁZIS: MENU */}
      {phase === 'MENU' && (
        <div className="w-full max-w-md flex flex-col gap-6 items-center animate-fade-in">
          <p className="text-slate-400 mb-2 text-xs uppercase tracking-[0.25em] font-semibold">Válassz üzemmódot</p>
          <div className="flex gap-3 w-full">
            <button 
              onClick={() => setMode('SINGLE')} 
              className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${mode === 'SINGLE' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 scale-[1.02]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
            >
              1 Játékos (VS AI)
            </button>
            <button 
              onClick={() => setMode('LOCAL_MULTIPLAYER')} 
              className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${mode === 'LOCAL_MULTIPLAYER' ? 'bg-purple-500 text-slate-950 shadow-lg shadow-purple-500/25 scale-[1.02]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
            >
              Több Játékos (Helyi)
            </button>
          </div>
          <button 
            onClick={() => setPhase('SET_SECRET')} 
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
          >
            Játék indítása
          </button>
        </div>
      )}

      {/* FÁZIS: TITKOS KÓD BEVITELE (LOCAL MP) */}
      {phase === 'SET_SECRET' && (
        <div className="w-full max-w-md flex flex-col gap-4 animate-fade-in">
          <div className="bg-slate-900 p-5 rounded-xl border border-purple-500/20 text-center shadow-xl shadow-black/30">
            <p className="text-sm text-purple-300 mb-1 font-medium tracking-wide uppercase">Játékos A: Titkos kód rögzítése</p>
            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">Adj át eszközöt a másik játékosnak a tippelés előtt. A kód láthatatlan marad.</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={currentInput}
              onChange={(e) => { setCurrentInput(e.target.value.replace(/\D/g, '')); setError(''); }}
              placeholder="0000"
              className={`w-full bg-slate-800/50 border ${error ? 'border-red-500' : 'border-slate-700'} rounded-lg p-4 text-center text-2xl tracking-[1em] focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all mb-3`}
              autoFocus
            />
            <button 
              onClick={handleSetSecret} 
              disabled={currentInput.length !== 4 || !!error} 
              className={`w-full py-3 rounded-lg font-bold tracking-wide text-sm transition-all ${currentInput.length === 4 && !error ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 active:scale-[0.98]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            >
              KÓD RÖGZÍTÉSE
            </button>
          </div>
        </div>
      )}

      {/* FÁZIS: TIPPELÉS / JÁTÉK VÉGE */}
      {(phase === 'GUESSING' || phase === 'GAME_OVER') && (
        <div className="w-full max-w-md flex flex-col gap-6 animate-fade-in">
          
          {/* Kontextuális állapotjelző */}
          {mode === 'SINGLE' && phase === 'GUESSING' && (
            <div className="bg-slate-900/80 p-3 rounded-xl border border-cyan-500/20 text-center backdrop-blur-sm">
              <p className="text-xs text-cyan-300 mb-1 font-medium flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.6)]"></span>
                AI ellenfél generálva. Tippelj!
              </p>
            </div>
          )}

          {/* Bemeneti zóna (nudging: nagy tapintási felület, azonnali validáció) */}
          {phase === 'GUESSING' && (
            <div className="flex flex-col gap-3">
              <input
                id="active-input"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={currentInput}
                onChange={(e) => { setCurrentInput(e.target.value.replace(/\D/g, '')); setError(''); }}
                placeholder="0000"
                className={`w-full bg-slate-900 border ${error ? 'border-red-500' : 'border-slate-700'} rounded-lg p-4 text-center text-2xl tracking-[1em] focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all`}
                autoFocus
              />
              <button 
                onClick={handleSubmitGuess} 
                disabled={currentInput.length !== 4 || !!error} 
                className={`w-full py-3.5 rounded-lg font-bold tracking-wide text-sm transition-all ${currentInput.length === 4 && !error ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20 active:scale-[0.98]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                TIPP BEADÁSA
              </button>
            </div>
          )}

          {/* Determinisztikus visszajelzési történet */}
          {guessHistory.length > 0 && (
            <div className="w-full bg-slate-900/60 rounded-xl border border-slate-800 p-4 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                <span>Előzmények</span>
                <span>{guessHistory.length} / {MAX_GUESSES} próbálkozás</span>
              </div>
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                {[...guessHistory].reverse().map((item, i) => (
                  <div key={i} className={`flex justify-between items-center p-3 rounded-lg text-xs border-l-4 ${item.bulls === 4 ? 'bg-emerald-900/20 border-emerald-500' : 'bg-slate-800/40 border-cyan-500/60'}`}>
                    <span className="text-slate-400 font-mono">#{guessHistory.length - i}</span>
                    <div className="flex gap-3">
                      <span className="flex items-center gap-1.5 text-slate-200"><div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(34,211,238,0.5)]"></div><span>{item.bulls} B</span></span>
                      <span className="flex items-center gap-1.5 text-slate-200"><div className="w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_6px_rgba(192,132,252,0.5)]"></div><span>{item.cows} C</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Játékvége állapot (explicit fallback & metrikai zárás) */}
          {phase === 'GAME_OVER' && (
            <div className="text-center space-y-4 p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-2xl">
              <p className={`text-lg font-bold ${gameOverReason.includes('Gratulálok') ? 'text-emerald-400' : 'text-red-400'}`}>
                {gameOverReason}
              </p>
              <button 
                onClick={restartGame} 
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-sm rounded-lg transition-colors border border-slate-700 hover:border-slate-600"
              >
                Újraindítás
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lábléc: etikai/kontextuális jelzés */}
      <footer className="mt-8 text-center">
        <p className="text-[10px] text-slate-600 tracking-wider uppercase">A vizualitás a kognitív súrlódás csillapítására szolgál. Minden interakció determinisztikus.</p>
      </footer>

      {/* Tailwind animáció beillesztése (ha nem lenne benne tailwind.config.js-ben) */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>
    </div>
  );
}