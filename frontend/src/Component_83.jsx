import React, { useEffect } from 'react';
import GameBoard from './components/GameBoard';
import { useGameStore } from './store/GameStore';

export default function App() {
  const initGame = useGameStore(state => state.initGame);

  useEffect(() => {
    initGame();
  }, [initGame]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <GameBoard />
    </div>
  );
}