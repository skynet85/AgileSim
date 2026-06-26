import React, { useEffect } from 'react';
import GameBoard from './components/GameBoard';
import useGameLogic from './hooks/useGameLogic';

const App: React.FC = () => {
  const { state, connect, disconnect } = useGameLogic();

  useEffect(() => {
    // Auto-connect on mount for seamless MVP experience
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  if (!state.sessionId) {
    return <div className="p-10 text-center">Initializing Deterministic Engine...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4">
      <header className="w-full max-w-6xl mb-6 flex justify-between items-center border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Malmo Online Engine v1.0.2
        </h1>
        <div className="flex items-center gap-4 text-sm font-mono text-slate-400">
           <span className={state.isConnected ? "text-emerald-500" : "text-red-500"}>
             {state.isConnected ? "● STOMP SYNCED" : "○ DISCONNECTED"}
           </span>
           <span>ID: {state.sessionId.slice(0, 8)}</span>
        </div>
      </header>

      <main className="flex-grow w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        <GameBoard state={state} onMove={state.makeMove} />
        
        {/* Stats Panel */}
        <aside className="lg:col-span-3 glass-panel p-4 rounded-xl border border-white/5 space-y-4">
          <h3 className="font-bold text-slate-300 uppercase tracking-widest text-xs">Session Audit</h3>
          <div className="text-xs font-mono space-y-2 text-slate-500">
            <p>Protocol: STOMP/WS 1.2</p>
            <p>Version Locking: Active (@Version)</p>
            <p>Topology: Explicit Matrix (24-pt)</p>
            <p>Packets Sent: {state.packetsSent}</p>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;