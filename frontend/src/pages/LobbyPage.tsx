import React from 'react';

interface LobbyPageProps {
  onStart: () => void;
  isLoading: boolean;
  playerName: string;
  onNameChange: (name: string) => void;
}

const LobbyPage: React.FC<LobbyPageProps> = ({ onStart, isLoading, playerName, onNameChange }) => {
  return (
    <div className="flex flex-col gap-6 items-center w-full max-w-md bg-slate-900/50 p-8 rounded-xl border border-slate-800">
      <h2 className="text-xl text-emerald-400 uppercase tracking-widest mb-2">Játék Indítása</h2>
      
      <input
        type="text"
        value={playerName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Játékos neve (pl. Admin_01)"
        className="w-full px-4 py-3 bg-slate-950 border border-slate-600 rounded text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
      />
      
      <button
        onClick={onStart}
        disabled={isLoading || !playerName.trim()}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-8 py-4 rounded font-bold transition-all uppercase tracking-wide shadow-lg shadow-emerald-900/20"
      >
        {isLoading ? 'INICIALIZÁLÁS...' : 'ÚJ JÁTÉK INDÍTÁSA'}
      </button>
      
      <p className="text-xs text-slate-500 mt-4 font-mono">
        A szerver fogja kezdeni az állapotot. A kliens csak jeleket küld. <br/>
        Latency: &lt; 120ms | Status: ONLINE
      </p>
    </div>
  );
};

export default LobbyPage;