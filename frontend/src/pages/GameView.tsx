import React, { useState } from 'react';
import axios from 'axios';
import GameBoard from '../components/GameBoard';
import GameInfo from '../components/GameInfo';

const API_BASE = '/api/game';

interface StatusInfo {
  currentPlayer: number;
  phase?: string;
  status: string;
}

interface GameViewProps {
  gameId: string;
  playerName: string;
  onLeave: () => void;
}

const GameView: React.FC<GameViewProps> = ({ gameId, playerName, onLeave }) => {
  const [boardState, setBoardState] = useState<(string | null)[]>(Array(24).fill(null));
  const [statusInfo, setStatusInfo] = useState<StatusInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleMove = async (fromIndex: number, toIndex: number) => {
    if (loading || !statusInfo?.currentPlayer) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/${gameId}/move`, { fromIndex, toIndex });
      setBoardState(res.data.board);
      setStatusInfo({
        currentPlayer: res.data.currentPlayer,
        phase: res.data.phase,
        status: res.data.status
      });
      if (res.data.status?.includes("Malmot zártál")) {
        alert("Malmot zártál! Válassz ellenfél bábát a kikapáshoz.");
      }
    } catch (e: unknown) {
      console.error("Érvénytelen lépés vagy hiba:", e);
      alert("A rendszer elutasította a lépést. Próbáld újra.");
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async (pieceIndex: number) => {
    if (!statusInfo?.phase || statusInfo.phase !== 'CAPTURE_WAIT') return;
    try {
      await axios.post(`${API_BASE}/${gameId}/capture`, { pieceIndex });
      alert("Kikapás rögzítve. Következő kör.");
      // A szerver frissíti az állapotot, a frontend csak jelzi a sikert
      setStatusInfo(prev => prev ? ({ ...prev }) : null); 
    } catch (e: unknown) {
      console.error("Kikapási hiba:", e);
      const err = e as { response?: { data?: string } };
      alert(err.response?.data || "Hiba történt a kikapáskor.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start w-full max-w-4xl">
      <GameBoard 
        board={boardState} 
        onCellClick={handleMove} 
        currentPlayer={statusInfo?.currentPlayer || 1} 
        onCapture={handleCapture} 
        isCapturePhase={statusInfo?.phase === 'CAPTURE_WAIT'} 
      />
      {statusInfo && <GameInfo status={statusInfo} gameId={gameId} />}
      <div className="mt-4">
        <button onClick={onLeave} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors text-sm">
          KILÉPÉS A SZERVEZŐBŐL
        </button>
      </div>
    </div>
  );
};

export default GameView;