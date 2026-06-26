import React, { useEffect } from 'react';
import GameBoard from './components/GameBoard/GameBoard';

function App() {
  // Onboarding logic is encapsulated in the board state for MVP simplicity
  
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
      <GameBoard />
    </div>
  );
}

export default App;