import React from 'react';
import GameBoard from './components/GameBoard';

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <GameBoard />
    </div>
  );
}