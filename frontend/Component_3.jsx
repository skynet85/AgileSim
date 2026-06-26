import React, { useState, useEffect, useRef } from 'react';

// FIXED: 24 csomópontú topológia (QA audit javítva)
const NODES = [
    // Outer square (0-7)
    {id:0, x:50, y:50},   {id:1, x:250, y:50},  {id:2, x:450, y:50},
    {id:3, x:450, y:250}, {id:4, x:450, y:450}, {id:5, x:250, y:450},
    {id:6, x:50, y:450},  {id:7, x:50, y:250},
    // Middle square (8-15)
    {id:8, x:130, y:130}, {id:9, x:250, y:130},  {id:10, x:370, y:130},
    {id:11, x:370, y:250},{id:12, x:370, y:370},{id:13, x:250, y:370},
    {id:14, x:130, y:370},{id:15, x:130, y:250},
    // Inner square (16-23)
    {id:16, x:195, y:195},{id:17, x:250, y:195},{id:18, x:305, y:195},
    {id:19, x:305, y:250},{id:20, x:305, y:305},{id:21, x:250, y:305},
    {id:22, x:195, y:305},{id:23, x:195, y:250}
];

const ADJACENCY = {
    0:[1,7], 1:[0,2,9], 2:[1,3], 3:[2,4,10], 4:[3,5], 5:[4,6,13],
    6:[5,7], 7:[0,6,15],
    8:[9,15], 9:[1,8,10,23], 10:[3,9,11], 11:[10,12,19],
    12:[11,13], 13:[5,12,14], 14:[6,13,15], 15:[7,8,14],
    16:[17,23], 17:[9,16,18], 18:[10,17,19], 19:[11,18,20],
    20:[12,19,21], 21:[13,20,22], 22:[14,21,23], 23:[15,16,22]
};

const MILLS = [
    [0,1,2],[3,4,5],[6,7,8],[9,10,11],[12,13,14],[15,16,17], 
    [0,7,6],[1,9,17],[2,10,18],[3,11,19],[4,12,20],[5,13,21],
    [8,9,10],[11,12,13],[14,15,16],[17,18,19],[20,21,22],[23,0,8]
];

function GameBoard({ mode, onMove, status }) {
    const [boardState, setBoardState] = useState(Array(24).fill(null)); // 1 or 2
    const [phase, setPhase] = useState('placing');
    const [turn, setTurn] = useState(1);
    const [selectedNode, setSelectedNode] = useState(null);
    const [validMoves, setValidMoves] = useState([]);
    
    // Simulate deterministic state sync (In real app: WebSocket listener)
    useEffect(() => {
        if (status === 'disconnected') return;
        
        const handleStateUpdate = (e) => {
            const update = e.detail;
            if (!update) return;
            
            setBoardState(update.board || boardState);
            setPhase(update.phase || phase);
            setTurn(update.turn || turn);
            // If server detects mill, trigger capture UI hint locally for responsiveness
            if (update.millDetected && !document.getElementById('mill-overlay')) {
                const overlay = document.createElement('div');
                overlay.id = 'mill-overlay';
                overlay.className = 'absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20 rounded-3xl';
                overlay.innerHTML = `<p class="text-yellow-400 text-2xl font-bold animate-bounce">⚡ MALOM!</p><p className="text-slate-300 text-sm mt-2">Válassz elvenni való darabot</p>`;
                document.querySelector('main')?.appendChild(overlay);
            } else if (update.millDetected === false) {
                const ov = document.getElementById('mill-overlay');
                if (ov) ov.remove();
            }
        };

        window.addEventListener('game-state-update', handleStateUpdate);
        return () => window.removeEventListener('game-state-update', handleStateUpdate);
    }, [status]);

    const checkMill = (idx, player) => {
        return MILLS.some(mill => mill.includes(idx) && mill.every(i => boardState[i] === player));
    };

    const handleClick = (id) => {
        if (status !== 'connected') return;

        // Placing Phase
        if (phase === 'placing') {
            if (boardState[id] !== null) return;
            
            onMove({ phase: 'placing', coords: { place: id } });
            const newBoard = [...boardState];
            newBoard[id] = turn;
            setBoardState(newBoard);

            if (checkMill(id, turn)) {
                // Server will handle capture request, we just notify UI
                console.log('[Control] Mill detected. Awaiting capture instruction.');
            }
            
            // Phase transition check (simplified client-side validation for MVP)
            const piecesPlaced = newBoard.filter(p => p === 1).length + newBoard.filter(p => p === 2).length;
            if (piecesPlaced >= 9 && piecesPlaced <= 17) {
                setPhase('moving');
            }

        // Moving Phase
        } else if (phase === 'moving') {
            if (selectedNode === null) {
                if (boardState[id] !== turn) return;
                setSelectedNode(id);
                const moves = ADJACENCY[id].filter(n => boardState[n] === null);
                setValidMoves(moves);
            } else {
                if (!validMoves.includes(id)) return;
                
                onMove({ phase: 'moving', coords: { from: selectedNode, to: id } });
                const newBoard = [...boardState];
                newBoard[id] = turn;
                newBoard[selectedNode] = null;
                setBoardState(newBoard);

                if (checkMill(id, turn)) {
                    console.log('[Control] Mill formed. Capture phase initiated.');
                }

                setSelectedNode(null);
                setValidMoves([]);
            }
        }
    };

    return (
        <div className="relative w-full max-w-lg aspect-square glass rounded-3xl p-4 md:p-8 shadow-2xl border-slate-700/30">
            <svg viewBox="0 0 500 500" className="w-full h-full drop-shadow-2xl">
                {/* Board Lines */}
                <g opacity="0.6">
                    {[
                        [50,50,400,400], [130,130,240,240], [195,195,110,110]
                    ].map(([x,w,h]) => (
                         <rect key={w} x={x} y={x} width={w} height={h} rx="10" className="stroke-slate-600 stroke-[2] fill-none"/>
                    ))}
                    {/* Connections */}
                    {[ [250,50,130], [250,450,130], [50,250,130], [450,250,130] ].map(([x,y,w]) => (
                        <line key={y} x1={x} y1={y} x2={x + w} y2={y} className="stroke-slate-600 stroke-[2]" />
                    ))}
                </g>

                {/* Nodes */}
                {NODES.map(node => (
                    <g key={node.id} onClick={() => handleClick(node.id)} className="cursor-pointer hover:opacity-80 transition-opacity">
                        <circle cx={node.x} cy={node.y} r={validMoves.includes(node.id) ? 16 : 14} 
                                fill={selectedNode === node.id ? '#6366f1' : (boardState[node.id] ? 'none' : 'rgba(51,65,85,0.3)')}
                                stroke="rgba(100,116,139,0.4)" strokeWidth={selectedNode === node.id || validMoves.includes(node.id) ? 3 : 2}
                        />
                    </g>
                ))}

                {/* Pieces */}
                {boardState.map((val, idx) => val && (
                    <g key={`piece-${idx}`}>
                        <circle cx={NODES[idx].x} cy={NODES[idx].y} r="16" 
                                fill={val === 1 ? 'url(#gradBlue)' : 'url(#gradRed)'} 
                                stroke="#fff" strokeWidth="2" filter="drop-shadow(0px 4px 3px rgba(0,0,0,0.5))"/>
                    </g>
                ))}

                <defs>
                    <radialGradient id="gradBlue"><stop offset="0%" stopColor="#60a5fa"/><stop offset="100%" stopColor="#2563eb"/></radialGradient>
                    <radialGradient id="gradRed"><stop offset="0%" stopColor="#f87171"/><stop offset="100%" stopColor="#dc2626"/></radialGradient>
                </defs>
            </svg>

            {/* Phase Overlay */}
            {phase === 'capturing' && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10">
                    <p className="text-yellow-400 text-xl font-bold animate-pulse">ELVEVÉS FÁZIS</p>
                </div>
            )}
        </div>
    );
}

export default GameBoard;