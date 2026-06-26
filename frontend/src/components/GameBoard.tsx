import React, { useEffect } from 'react';
import { useGameStore, POSITIONS, ADJACENCY } from '../store/GameStore';

const GameBoard: React.FC = () => {
  const state = useGameStore();
  const handleNodeClick = useGameStore(s => s.handleNodeClick);
  
  useEffect(() => {}, [state.turn]);

  const getLineProps = () => {
    let html = '';
    const drawn = new Set();
    for (let i = 0; i < 24; i++) {
      ADJACENCY[i].forEach(to => {
        const key = [Math.min(i, to), Math.max(i, to)].join('-');
        if (!drawn.has(key)) {
          drawn.add(key);
          const p1 = POSITIONS[i], p2 = POSITIONS[to];
          let color = '#334155', w = 2;
          const isOuter = [0,1,2,3,4,5,6,7].includes(i) || [0,1,2,3,4,5,6,7].includes(to);
          const isInner = [16,17,18,19,20,21,22,23].includes(i) && [16,17,18,19,20,21,22,23].includes(to);
          if (isInner) { color = '#475569'; w=2; } else if (!isOuter) { color='#64748b'; w=1.5; }
          html += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${color}" stroke-width="${w}"/>`;
        }
      });
    }
    return html;
  };

  const getValidMoves = () => {
    if (state.selectedPos === null || state.removalMode || state.phase === 'PLACEMENT') return '';
    const isFlying = state.phase === 'FLYING';
    const targets = isFlying 
      ? state.board.map((p, i) => p === null ? i : -1).filter(i => i !== -1)
      : (ADJACENCY[state.selectedPos] || []).filter(to => !state.board[to]);
    
    return targets.map(idx => {
      const p = POSITIONS[idx];
      return `<circle cx="${p.x}" cy="${p.y}" r="8" class="fill-indigo-500/30 stroke-indigo-400 pointer-events-none"/>`;
    }).join('');
  };

  const getStatusText = () => {
    if (state.winner) return `${state.winner === 'white' ? 'Fehér' : 'Fekete'} Győzött!`;
    if (state.removalMode) return '⚠️ Molino! Válassz ellenfél bábút.';
    if (state.phase === 'PLACEMENT') return `📍 Elhelyezés (${state.hands.white} F / ${state.hands.black} K)`;
    if (state.turn === 'white') return state.phase === 'FLYING' ? '🕊️ Repülés' : '⚔️ Mozgás';
    return '🤖 AI gondolkodik...';
  };

  const getHandCount = (player: Player) => {
      return state.hands[player];
  };

  return (
    <div className="relative w-[500px] h-[500px] rounded-2xl bg-slate-800 shadow-xl p-4 select-none">
      <svg viewBox="0 0 400 400" className="w-full h-full overflow-visible">
        <g id="connections">{getLineProps()}</g>
        <g id="valid-moves">{getValidMoves()}</g>
        
        {state.board.map((p, i) => (
          <circle 
            key={i} cx={POSITIONS[i].x} cy={POSITIONS[i].y} r="12" 
            className={`transition-colors duration-200 ${state.selectedPos === i ? 'fill-indigo-500 stroke-white' : state.removalMode && p !== state.turn && p !== null ? 'fill-red-900/50 stroke-red-500 animate-pulse' : 'fill-slate-700 stroke-slate-600 hover:stroke-indigo-400'} cursor-pointer`}
            onClick={() => handleNodeClick(i)}
          />
        ))}

        {state.board.map((p, i) => p && (
          <circle 
            key={`piece-${i}`} cx={POSITIONS[i].x} cy={POSITIONS[i].y} r="12" 
            fill={p === 'white' ? '#f8fafc' : '#0f172a'} 
            stroke={p === 'white' ? '#cbd5e1' : '#475569'}
            strokeWidth="2"
            className={`pointer-events-none transition-transform duration-300 ${state.selectedPos === i ? 'scale-110' : ''}`}
          />
        ))}
      </svg>

      <div className="absolute top-4 left-0 w-full text-center pointer-events-none">
         {getStatusText()}
      </div>

      <div className="absolute bottom-4 left-0 w-full flex justify-between px-6 text-sm font-mono text-slate-400 bg-slate-900/50 rounded-lg py-2 backdrop-blur-sm">
        <div>Fehér: {getHandCount('white')}</div>
        <div>Fekete: {getHandCount('black')}</div>
      </div>

      {state.winner && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl backdrop-blur-sm">
              <div className="text-center animate-bounce">
                  <h2 className="text-4xl font-bold text-white mb-4">{state.winner === 'white' ? 'Fehér' : 'Fekete'} Nyert!</h2>
                  <button 
                    onClick={() => useGameStore.getState().initGame()}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg transition-transform hover:scale-105"
                  >
                      Újrakezdés
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default GameBoard;