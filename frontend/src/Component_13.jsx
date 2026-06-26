import React, { Suspense } from 'react';
import GameBoard from './components/GameBoard/GameBoard';

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans overflow-hidden">
      <Suspense fallback={<div className="text-indigo-400 animate-pulse">Betöltés...</div>}>
        <GameBoard />
      </Suspense>
    </div>
  );
}

export default App;