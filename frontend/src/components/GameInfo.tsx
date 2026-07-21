import React from 'react';

interface StatusInfo {
  currentPlayer: number;
  phase?: string;
  status: string;
}

interface GameInfoProps {
  status: StatusInfo;
  gameId: string;
}

const GameInfo: React.FC<GameInfoProps> = ({ status, gameId }) => (
  <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-xs shadow-lg">
    <h2 className="text-emerald-400 font-bold text-lg mb-3 uppercase tracking-wide">Játék Állapot</h2>
    <div className="space-y-3 text-sm">
      <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">Session ID:</span><span className="font-mono text-white">{gameId.substring(0, 8)}...</span></div>
      <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">Következő kör:</span><span className={`font-bold ${status.currentPlayer === 1 ? 'text-blue-400' : 'text-orange-400'}`}>Játékos {status.currentPlayer}</span></div>
      <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">Fázis:</span><span className="font-mono text-emerald-300">{status.phase || 'UNKNOWN'}</span></div>
      <div className="pt-2"><p className="text-slate-300 italic text-xs leading-relaxed">"{status.status}"</p></div>
    </div>
  </div>
);

export default GameInfo;