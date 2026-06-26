script
// File: frontend/src/App.jsx
import React, { useEffect, useState } from 'react';
import { useGameStore } from './gameEngine';
import io from 'socket.io-client';

const POINTS = [
  {x:50,y:50},{x:150,y:50},{x:250,y:50},{x:350,y:50},
  {x:350,y:150},{x:350,y:250},{x:350,y:350},{x:250,y:350},
  {x:150,y:350},{x:50,y:350},{x:50,y:250},{x:50,y:150},
  {x:90,y:90},{x:170,y:90},{x:250,y:90},{x:310,y:90},
  {x:310,y:170},{x:310,y:250},{x:310,y:310},{x:250,y:310},
  {x:170,y:310},{x:90,y:310},{x:90,y:250},{x:90,y:170}
];

const EDGES = [
  [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],
  [8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,16],
  [16,17],[17,18],[18,19],[19,20],[20,21],[21,22],[22,23],[23,24],
  [0,8],[4,12],[6,16],[2,20]
];

export default function App() {
  const { gameState, connectToRoom, submitMove } = useGameStore();
  const [selectedPiece, setSelectedPiece] = useState(null);

  useEffect(() => {
    // Deterministic connection ritual: establishes single source of truth link
    const socket = io('ws://localhost:8081/ws/game/demo-session');
    connectToRoom(socket);
    
    return () => {
      socket.disconnect();
    };
  }, [connectToRoom]);

  const handleNodeClick = (idx) => {
    if (gameState.phase === 'placement' && !gameState.board[idx]) {
      submitMove({ from: null, to: idx });
      return;
    }

    if (!selectedPiece) {
      if (gameState.board[idx] === gameState.currentPlayer) {
        setSelectedPiece(idx);
      }
    } else {
      if (gameState.validMoves.includes(idx)) {
        submitMove({ from: selectedPiece, to: idx });
        setSelectedPiece(null);
      } else {
        // Server-driven validation failure mitigation
        setSelectedPiece(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4">
      <div className="relative w-full max-w-[480px] aspect-square bg-slate-900/30 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        <svg viewBox="0 0 400 400" className="w-full h-full select-none">
          {EDGES.map(([a, b], i) => (
            <line key={`edge-${i}`} x1={POINTS[a].x} y1={POINTS[a].y} 
                  x2={POINTS[b].x} y2={POINTS[b].y} className="board-line" />
          ))}
          
          {gameState.board.map((owner, idx) => (
            <g key={`node-${idx}`} transform={`translate(${POINTS[idx].x}, ${POINTS[idx].y})`} 
               onClick={() => handleNodeClick(idx)} className="point-node cursor-pointer">
              <circle r={14} fill={owner ? (owner === 'white' ? '#f8fafc' : '#0f172a') : 'transparent'} 
                      stroke={owner ? 'none' : '#64748b'} strokeWidth={2} />
              
              {owner && (
                <>
                  <circle r={18} fill={owner === 'white' ? '#e2e8f0' : '#1e293b'} 
                          stroke={owner === 'white' ? '#6366f1' : '#a855f7'} strokeWidth={3} />
                  {selectedPiece === idx && (
                    <circle r={24} fill="none" stroke="#10b981" strokeWidth={2} className="valid-target" />
                  )}
                </>
              )}

              {gameState.validMoves.includes(idx) && !owner && selectedPiece !== null && (
                <circle r={18} fill="#10b981" opacity={0.35} className="valid-target pointer-events-none" />
              )}
            </g>
          ))}
        </svg>

        {/* KPI Hook: Transparent tracking of deterministic flow */}
        <div className="absolute top-2 right-2 bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-full text-xs font-mono border border-slate-700">
          Sync: {gameState.syncStatus === 'live' ? 'OK' : 'RECONCILE'} • Phase: {gameState.phase}
        </div>

        {/* Server-driven validation feedback overlay */}
        {!gameState.isValidTurn && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
            <div className="text-red-400 font-mono text-sm border border-red-500/30 px-4 py-2 rounded-lg bg-red-500/10">
              VALID_MOVE_SET: Invalid transition. Awaiting server reconciliation.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Tailwind config for custom classes
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .board-line { stroke: #475569; stroke-width: 2; fill: none; vector-effect: non-scaling-stroke; }
    .point-node:hover circle { r: 18; fill-opacity: 0.3; }
    .valid-target { animation: pulse-green 1.5s infinite; }
    @keyframes pulse-green { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
  `;
  document.head.appendChild(style);
}