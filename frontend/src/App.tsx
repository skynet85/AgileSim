import React, { useState } from 'react';
import LobbyPage from './pages/LobbyPage';
import GameView from './pages/GameView';
import axios from 'axios';

const API_BASE = '/api/game';
type ViewType = 'LOBBY' | 'GAME';

interface AppState {
  view: ViewType;
  currentGameId: string | null;
  playerName: string;
  isLoading: boolean;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    view: 'LOBBY',
    currentGameId: null,
    playerName: 'Játékos_1',
    isLoading: false
  });

  const startNewGame = async () => {
    if (state.isLoading) return;
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const res = await axios.post(`${API_BASE}/init`);
      setState({
        view: 'GAME',
        currentGameId: res.data.gameId,
        playerName: state.playerName || 'Játékos_1',
        isLoading: false
      });
    } catch (e: unknown) {
      console.error("Rendszerhiba a játék indításakor:", e);
      alert("A szerver nem válaszolt. Ellenőrizd a hálózati kapcsolatot.");
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleLeave = () => {
    setState({ view: 'LOBBY', currentGameId: null, playerName: state.playerName, isLoading: false });
  };

  if (state.view === 'LOBBY') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-start p-4 font-mono selection:bg-emerald-500/30">
        <header className="mb-8 text-center border-b border-slate-700 pb-4 w-full max-w-3xl pt-6">
          <h1 className="text-3xl font-bold tracking-tighter text-emerald-500 uppercase">MILLS_PROTOCOL_V2</h1>
          <p className="text-xs text-slate-500 mt-2">DETERMINISTIC MULTIPLAYER ENGINE | SERVER-AUTHORITATIVE STATE</p>
        </header>
        <LobbyPage 
          onStart={startNewGame} 
          isLoading={state.isLoading} 
          playerName={state.playerName} 
          onNameChange={(n) => setState(prev => ({ ...prev, playerName: n }))} 
        />
        <footer className="mt-12 text-slate-600 text-xs">SYSTEM INTEGRITY: 100% | NO CLIENT-SIDE STATE MUTATION ALLOWED</footer>
      </div>
    );
  }

  if (state.currentGameId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-start p-4 font-mono selection:bg-emerald-500/30">
        <header className="mb-8 text-center border-b border-slate-700 pb-4 w-full max-w-3xl pt-6">
          <h1 className="text-3xl font-bold tracking-tighter text-emerald-500 uppercase">MILLS_PROTOCOL_V2</h1>
          <p className="text-xs text-slate-500 mt-2">DETERMINISTIC MULTIPLAYER ENGINE | SERVER-AUTHORITATIVE STATE</p>
        </header>
        <GameView gameId={state.currentGameId} playerName={state.playerName} onLeave={handleLeave} />
        <footer className="mt-12 text-slate-600 text-xs">SYSTEM INTEGRITY: 100% | NO CLIENT-SIDE STATE MUTATION ALLOWED</footer>
      </div>
    );
  }

  return null;
};

export default App;