import React from 'react';

interface GameSetupPageProps {
  onStart: (mode: 'SINGLE' | 'LOCAL_MULTI') => void;
}

export const GameSetupPage: React.FC<GameSetupPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700 p-8 shadow-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-emerald-400 tracking-tight">MILLS PROTOCOL</h1>
        <p className="text-slate-400 text-center mb-8 text-sm leading-relaxed">
          Klasszikus stratégiai játék. Helyezz el 9 darabot, alakíts malomokat és szorítsd ki ellenfelét! A szabályrendszer determinisztikus, a lépések véglegesítettek.
        </p>

        <div className="space-y-4">
          <button 
            onClick={() => onStart('LOCAL_MULTI')}
            className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold rounded-lg transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-emerald-500/20"
          >
            <span>Helyi Multiplayer</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </button>

          <button 
            onClick={() => onStart('SINGLE')}
            className="w-full py-4 px-6 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-3 border border-slate-600"
          >
            <span>Egyjátékos (AI soon)</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-700 text-center">
          <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">v1.2 | Deterministic State Engine</p>
        </div>
      </div>
    </div>
  );
};