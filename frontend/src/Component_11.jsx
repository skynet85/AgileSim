import React from 'react';
import GameBoard from './components/GameBoard';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900">
      <GameBoard />
    </div>
  );
};

export default App;