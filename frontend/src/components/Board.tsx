import React, { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store/gameSlice'; // Assumed re-export for context
import { getAdjacent, checkNewMill, getRemovablePieces, getValidTargets } from '../engine/MillDeterministicEngine';
import { handlePlacement, handleMovement, handleRemoval, selectPiece, undo, reset } from '../store/gameSlice';

const POSITIONS = [
  {id:0,row:2,col:2},{id:1,row:2,col:3},{id:2,row:2,col:4},
  {id:3,row:3,col:4},{id:4,row:4,col:4},{id:5,row:4,col:3},
  {id:6,row:4,col:2},{id:7,row:3,col:2},
  {id:8,row:1,col:1},{id:9,row:1,col:3},{id:10,row:1,col:5},
  {id:11,row:3,col:5},{id:12,row:5,col:5},{id:13,row:5,col:3},
  {id:14,row:5,col:1},{id:15,row:3,col:1},
  {id:16,row:0,col:0},{id:17,row:0,col:3},{id:18,row:0,col:6},
  {id:19,row:3,col:6},{id:20,row:6,col:6},{id:21,row:6,col:3},
  {id:22,row:6,col:0},{id:23,row:3,col:0}
];

const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],
  [8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,8],
  [16,17],[17,18],[18,19],[19,20],[20,21],[21,22],[22,23],[23,16],
  [17,9],[9,1],[3,11],[11,19],[5,13],[13,21],[7,15],[15,23]
];

export const Board: React.FC = () => {
  const dispatch = useDispatch();
  const state = useSelector((state: any) => state.game.state); // Type inferred from slice structure
  const validTargets = useMemo(() => getValidTargets(state), [state]);

  useEffect(() => {
    if (validTargets.length === 0 && state.phase !== 'gameover') dispatch(reset());
  }, [validTargets, state.phase]);

  const handleClick = (id: number) => {
    if (state.phase === 'placement') dispatch(handlePlacement(id));
    else if (state.phase === 'movement') {
      if (state.selectedPiece !== null && validTargets.includes(id)) {
        dispatch(handleMovement({ from: state.selectedPiece, to: id }));
      } else if (state.board[id] === state.currentPlayer) {
        dispatch(selectPiece(id));
      }
    } 
    else if (state.phase === 'removal') dispatch(handleRemoval(id));
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-slate-800 rounded-xl shadow-lg border border-slate-700">
      <div className="flex justify-between w-full text-sm font-mono text-slate-300 px-2">
        <span>{state.currentPlayer === 'black' ? 'Fekete' : 'Fehér'} soron</span>
        <span className="uppercase tracking-wider">{state.phase}</span>
      </div>
      
      <svg viewBox="-15 -15 330 330" className="w-full max-w-[400px] aspect-square bg-slate-900 rounded-lg border border-slate-700">
        <g id="connections-layer">
          {CONNECTIONS.map(([a, b], i) => (
            <line key={i} x1={(POSITIONS[a].col*30)+15} y1={(POSITIONS[a].row*30)+15} 
                  x2={(POSITIONS[b].col*30)+15} y2={(POSITIONS[b].row*30)+15} 
                  stroke="#475569" strokeWidth="3" />
          ))}
        </g>
        
        <g id="nodes-layer">
          {POSITIONS.map(p => {
            const cx = (p.col * 30) + 15;
            const cy = (p.row * 30) + 15;
            const isTarget = validTargets.includes(p.id);
            const isSelected = state.selectedPiece === p.id;
            
            return (
              <circle key={p.id} cx={cx} cy={cy} r={isSelected ? 14 : (state.board[p.id] ? 12 : 8)}
                fill={state.board[p.id] === 'black' ? '#0f172a' : state.board[p.id] === 'white' ? '#e2e8f0' : '#334155'}
                stroke={isSelected ? '#fbbf24' : isTarget ? '#4ade80' : '#64748b'}
                strokeWidth={isSelected ? 3 : 1.5}
                className={`cursor-pointer transition-all duration-150 ${isTarget || isSelected ? 'filter brightness-125' : ''}`}
                onClick={() => handleClick(p.id)}
              />
            );
          })}
        </g>
      </svg>

      <div className="flex gap-3 mt-2">
        <button onClick={() => dispatch(reset())} className="px-4 py-2 text-xs font-medium bg-slate-700 hover:bg-slate-600 rounded uppercase tracking-wide transition-colors">Újrakezdés</button>
        <button onClick={() => dispatch(undo())} className="px-4 py-2 text-xs font-medium bg-slate-700 hover:bg-slate-600 rounded uppercase tracking-wide transition-colors">Visszavonás</button>
      </div>
    </div>
  );
};