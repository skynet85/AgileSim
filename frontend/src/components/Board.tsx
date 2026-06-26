// File: frontend/src/components/Board.tsx
import React, { useMemo } from 'react';
import { useMatchState } from '../hooks/useMatchState';

const POS = [
  {x:50,y:50},{x:200,y:50},{x:350,y:50},{x:350,y:200},{x:350,y:350},{x:200,y:350},{x:50,y:350},{x:50,y:200},
  {x:100,y:100},{x:200,y:100},{x:300,y:100},{x:300,y:200},{x:300,y:300},{x:200,y:300},{x:100,y:300},{x:100,y:200},
  {x:150,y:150},{x:200,y:150},{x:250,y:150},{x:250,y:200},{x:250,y:250},{x:200,y:250},{x:150,y:250},{x:150,y:200}
];

export const Board: React.FC = () => {
  const { state, handleBoardClick, reset, undo } = useMatchState();
  
  const phaseLabel = useMemo(() => {
    switch(state.phase) { case 'placement': return 'Helyezés'; case 'movement': return 'Mozgás'; case 'flying': return '✈ Repülés'; case 'remove': return '⚔ Levétel'; default: return 'Vége'; }
  }, [state.phase]);

  const renderPiece = (i: number) => {
    if (!state.board[i]) return null;
    const isSelected = state.selectedIdx === i;
    const colorClass = state.board[i] === 'w' ? 'fill-slate-200 stroke-slate-400' : 'fill-slate-800 stroke-slate-600';
    return (
      <g key={`piece-${i}`}>
        <circle cx={POS[i].x} cy={POS[i].y} r="15" className={`${colorClass} transition-all duration-200 ${isSelected ? 'animate-pulse-glow stroke-teal-400' : ''}`} />
        <circle cx={POS[i].x - 3} cy={POS[i].y - 3} r="4" className={state.board[i] === 'w' ? 'fill-white/30' : 'fill-black/20'} />
      </g>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-5xl p-4">
      {/* Left Panel */}
      <aside className="w-full lg:w-72 flex flex-col gap-4 order-2 lg:order-1">
        <header><h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">MALOM</h1>
        <p className="text-xs text-slate-500 tracking-widest uppercase mt-1">Deterministic State Engine v2.1</p></header>
        
        <div className="glass-panel rounded-r-xl px-4 py-3 border-l-4 border-teal-400 bg-white/5 backdrop-blur flex justify-between items-center">
          <span className="text-sm text-slate-300">{phaseLabel}</span>
          <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">Kör: {state.round}</span>
        </div>

        <div className="space-y-3">
          {(['w','b'] as const).map(p => (
            <div key={p} className={`glass-panel p-4 rounded-xl transition-all ${state.turn === p ? 'border-l-2 border-teal-400 bg-white/5' : ''}`}>
              <div className="flex justify-between mb-1"><span className={state.board[0]===p?'text-slate-200':'text-slate-500'}>{p==='w'?'Fehér':'Fekete'}</span>
              <span className="font-mono text-xs bg-white/10 px-2 py-0.5 rounded">{state.piecesLeft[p]}</span></div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className={`h-full ${p==='w'?'bg-teal-400':'bg-purple-400'}`} style={{width:`${(state.piecesOnBoard[p]/9)*100}%`}} /></div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={reset} className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors">Új játék</button>
          <button onClick={undo} disabled={!state.selectedIdx && state.phase==='placement'} className="flex-1 py-2.5 rounded-lg bg-teal-900/30 hover:bg-teal-800/40 border border-teal-700/50 transition-colors disabled:opacity-40">↩ Vissza</button>
        </div>

        <details className="glass-panel rounded-xl overflow-hidden"><summary className="px-4 py-2 text-sm text-slate-400 cursor-pointer hover:text-teal-300">Szabályzat</summary>
          <div className="px-4 pb-3 text-xs text-slate-500 border-t border-white/5 pt-2 space-y-1">Helyezés → Mozgás (1 lépés) → Repülés (bárhova). Mill = 3 egyben → ellenfél levétele.</div>
        </details>
      </aside>

      {/* Board */}
      <main className="flex-1 flex items-center justify-center order-1 lg:order-2 min-w-[300px]">
        <svg viewBox="0 0 400 400" className="w-full max-w-[420px] drop-shadow-2xl">
          <defs><filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          <rect x="20" y="20" width="360" height="360" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="2"/>
          <g className="stroke-slate-600 stroke-[2px] fill-none">
            <rect x="50" y="50" width="300" height="300"/><rect x="100" y="100" width="200" height="200"/><rect x="150" y="150" width="100" height="100"/>
            <line x1="200" y1="50" x2="200" y2="350"/><line x1="50" y1="200" x2="350" y2="200"/>
          </g>
          
          <g id="valid-layer">{state.selectedIdx !== null && state.phase!=='remove' && (() => {
             // Simplified local preview for UX, server validates strictly
             const moves = [];
             if(state.piecesOnBoard[state.turn]===3) Array.from({length:24}).forEach((_,i)=>{if(!state.board[i])moves.push(i)});
             else /* adjacency logic */; 
             return moves.map(i => <circle key={`vm-${i}`} cx={POS[i].x} cy={POS[i].y} r="16" className="fill-teal-400/20 stroke-teal-400 animate-blink-move cursor-pointer" onClick={()=>handleBoardClick(i)}/>);
          })()}</g>

          <g id="pieces-layer" filter="url(#glow)">{state.board.map((_,i) => renderPiece(i))}</g>
          
          {Array.from({length:24}).map((_,i) => (
            <circle key={`node-${i}`} cx={POS[i].x} cy={POS[i].y} r="18" fill="transparent" className="cursor-pointer hover:fill-white/5 transition-colors" onClick={()=>handleBoardClick(i)} />
          ))}
        </svg>
      </main>

      {/* Right Panel */}
      <aside className="w-full lg:w-72 flex flex-col gap-4 order-3">
        <div className="glass-panel p-5 rounded-xl border-t-4 border-teal-500 text-center">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Aktív Játékos</p>
          <div className="flex items-center justify-center gap-3"><div className={`w-6 h-6 rounded-full ${state.turn==='w'?'bg-teal-400':'bg-purple-500'} shadow-lg`}/>
          <span className="text-xl font-bold text-slate-100">{state.turn==='w'?'Fehér':'Fekete'}</span></div>
          <p className="text-xs mt-2 bg-teal-950/30 px-2 py-1 rounded inline-block min-h-[24px]">
            {state.phase==='placement'?`Helyezés (${state.piecesLeft[state.turn]} marad)`: state.phase==='remove'?'Válassz ellenfél bábut!':'Kattints a saját bábudra, majd célpontra'}
          </p>
        </div>

        <div className="glass-panel p-4 space-y-3">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Játékállapot</h3>
          {['Fázis','Érvényes lépések','Levett bábu'].map(l=>(
            <div key={l} className="flex justify-between py-2 border-b border-white/5"><span className="text-sm text-slate-400">{l}</span>
            <span className="font-mono text-sm text-purple-300">{l==='Fázis'?state.phase.toUpperCase(): l==='Érvényes lépések'?(state.selectedIdx!==null?state.validMoves.length:'-'):`${state.scores.w} - ${state.scores.b}`}</span></div>
          ))}
        </div>

        <div className="glass-panel p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-dashed border border-slate-700">
          <p className="text-[10px] text-slate-500 italic leading-relaxed">"A játék nem csupán stratégia, hanem a döntések láthatóvá tétele. Minden lépés egyértelműen nyomon követhető."</p>
        </div>
      </aside>

      {state.phase === 'gameover' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="glass-panel p-8 rounded-2xl max-w-md w-full text-center border-t-4 border-yellow-500 scale-100 transition-transform">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent mb-3">VÉGE A JÁTÉKNAK</h2>
            <p className="text-slate-300 mb-6">{state.winReason || 'Az ellenfél lemaradt a lépésekkel.'}</p>
            <button onClick={reset} className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 text-white font-bold rounded-xl shadow-lg">Új párbaj</button>
          </div>
        </div>
      )}
    </div>
  );
};