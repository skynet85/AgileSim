import React, { useEffect } from 'react';
import GameBoard from './components/GameBoard';
import { useGameStore } from './store/GameStore';

const App: React.FC = () => {
  const initGame = useGameStore((s) => s.initGame);

  useEffect(() => {
    initGame();
  }, [initGame]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6 tracking-widest uppercase text-indigo-400">Malom</h1>
      <GameBoard />
    </div>
  );
};

export default App;