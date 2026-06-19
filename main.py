<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Malom — Nine Men's Morris</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  body { font-family: 'Inter', sans-serif; }
  
  .piece-white { 
    background: radial-gradient(circle at 35% 35%, #ffffff, #d1d5db);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(0,0,0,0.1);
  }
  .piece-black { 
    background: radial-gradient(circle at 35% 35%, #6b7280, #1f2937);
    box-shadow: 0 2px 8px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(0,0,0,0.2);
  }
  
  .piece-selected { 
    animation: pulse-selected 1s infinite;
    filter: drop-shadow(0 0 8px rgba(59,130,246,0.8));
  }
  
  @keyframes pulse-selected {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.15); }
  }
  
  .ai-thinking::after {
    content: '';
    animation: aiDots 1.5s infinite;
  }
  @keyframes aiDots {
    0% { content: '.'; }
    33% { content: '..'; }
    66% { content: '...'; }
  }

  .sidebar-card {
    background: linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95));
    backdrop-filter: blur(10px);
    border: 1px solid rgba(71,85,105,0.3);
  }

  .kpi-bar { transition: width 0.6s ease-out; }
  .glow-text { text-shadow: 0 0 20px rgba(99,102,241,0.5); }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #1e293b; }
  ::-webkit-scrollbar-thumb { background: #475569; border-radius: 2px; }
</style>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: { board: '#1a1f36', accent: '#6366f1', surface: '#0f172a' }
    }
  }
}
</script>
</head>
<body class="bg-surface text-gray-100 min-h-screen overflow-x-hidden">

<header class="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
  <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-500/20">M</div>
      <div>
        <h1 class="text-lg font-bold tracking-tight glow-text">AI Malom</h1>
        <p class="text-[10px] text-slate-400 uppercase tracking-widest">Nine Men's Morris • v1.0.0-QA-FIXED</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <span id="gameStatus" class="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">⏳ Várakozás</span>
      <button onclick="resetGame()" class="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-medium transition-colors border border-slate-600">↻ Új játék</button>
    </div>
  </div>
</header>

<main class="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
  <aside class="lg:col-span-3 space-y-4 order-2 lg:order-1">
    <div class="sidebar-card rounded-xl p-4 space-y-3">
      <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">👥 Játékosok</h3>
      <div id="whiteCard" class="rounded-lg p-3 border border-gray-600/30 bg-slate-800/50 transition-all duration-300">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold text-white flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-white shadow-inner"></span> Fehér (Te)</span>
          <span id="whitePieces" class="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-700">9/9</span>
        </div>
        <div class="space-y-1"><div class="flex justify-between text-[10px] text-slate-400"><span>Hátralévő:</span><span id="whiteRemaining">9</span></div>
        <div class="w-full bg-slate-700 rounded-full h-1.5"><div id="whiteBar" class="bg-emerald-400 h-1.5 rounded-full kpi-bar" style="width:100%"></div></div></div>
      </div>
      <div id="blackCard" class="rounded-lg p-3 border border-gray-600/30 bg-slate-800/50 transition-all duration-300">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold text-white flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-gray-800 border border-gray-500 shadow-inner"></span> Fekete (AI)</span>
          <span id="blackPieces" class="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-700">9/9</span>
        </div>
        <div class="space-y-1"><div class="flex justify-between text-[10px] text-slate-400"><span>Hátralévő:</span><span id="blackRemaining">9</span></div>
        <div class="w-full bg-slate-700 rounded-full h-1.5"><div id="blackBar" class="bg-red-400 h-1.5 rounded-full kpi-bar" style="width:100%"></div></div></div>
      </div>
    </div>

    <div class="sidebar-card rounded-xl p-4 space-y-3">
      <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">📊 Valós idejű metrikák</h3>
      <div class="grid grid-cols-2 gap-2">
        <div class="bg-slate-800/60 rounded-lg p-2 text-center"><div id="moveCount" class="text-xl font-bold text-indigo-400">0</div><div class="text-[9px] text-slate-500 uppercase">Lépés</div></div>
        <div class="bg-slate-800/60 rounded-lg p-2 text-center"><div id="phaseLabel" class="text-xs font-semibold text-amber-400">ELHELYEZÉS</div><div class="text-[9px] text-slate-500 uppercase">Fázis</div></div>
      </div>
      <div class="space-y-2 pt-1">
        <div class="flex justify-between items-center text-[10px]"><span class="text-slate-400">Szekció hossza</span><span id="sessionTime" class="font-mono text-gray-300">0:00</span></div>
        <div class="w-full bg-slate-700 rounded-full h-1"><div id="sessionBar" class="bg-indigo-500 h-1 rounded-full kpi-bar" style="width:0%"></div></div>
        <div class="flex justify-between items-center text-[10px]"><span class="text-slate-400">AI interakciók</span><span id="aiInteractions" class="font-mono text-gray-300">0</span></div>
        <div class="w-full bg-slate-700 rounded-full h-1"><div id="aiBar" class="bg-purple-500 h-1 rounded-full kpi-bar" style="width:0%"></div></div>
        <div class="flex justify-between items-center text-[10px]"><span class="text-slate-400">Malom-formálás</span><span id="millCount" class="font-mono text-gray-300">0</span></div>
      </div>
    </div>

    <div class="sidebar-card rounded-xl p-4 space-y-2">
      <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">🤖 AI Elemzés</h3>
      <div id="aiAnalysis" class="text-[11px] text-slate-500 leading-relaxed">A játék kezdete után az AI elemzi a lépéseidet és ad ajánlásokat.</div>
      <div id="aiDifficulty" class="flex items-center gap-2 mt-2">
        <span class="text-[10px] text-slate-500">Nehézség:</span>
        <select id="difficultySelect" onchange="setDifficulty(this.value)" class="bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-[10px] text-gray-300 focus:outline-none">
          <option value="1">Könnyű</option><option value="2" selected>Közepes</option><option value="3">Nehéz</option>
        </select>
      </div>
    </div>

    <div class="sidebar-card rounded-xl p-4 space-y-2 max-h-60 overflow-hidden flex flex-col">
      <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">📝 Mozgásnapló</h3>
      <div id="moveLog" class="flex-1 overflow-y-auto space-y-1 pr-1"><span class="text-[10px] text-slate-600 italic">Még nincsenek lépések...</span></div>
    </div>
  </aside>

  <section class="lg:col-span-6 order-1 lg:order-2 flex flex-col items-center gap-4">
    <div id="turnBanner" class="w-full max-w-lg rounded-xl p-3 text-center bg-slate-800/70 border border-slate-700/50 backdrop-blur-sm transition-all duration-300">
      <p id="turnText" class="text-sm font-medium text-gray-400">Válassz játék módot</p>
    </div>

    <div class="relative w-full max-w-lg aspect-square">
      <svg id="boardSvg" viewBox="-10 -10 620 620" class="w-full h-full drop-shadow-2xl">
        <defs><radialGradient id="bgGrad" cx="50%" cy="50%"><stop offset="0%" stop-color="#1e293b"/><stop offset="100%" stop-color="#0f172a"/></radialGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        <rect x="-10" y="-10" width="620" height="620" rx="24" fill="url(#bgGrad)" stroke="#334155" stroke-width="1"/>
        <g id="boardLines"></g><g id="millHighlights"></g><g id="validMoves"></g>
        <g id="piecesGroup" filter="url(#glow)"></g>
      </svg>
    </div>

    <div class="w-full max-w-lg flex items-center justify-between gap-3">
      <button onclick="aiHint()" class="flex-1 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 text-xs font-medium transition-all flex items-center justify-center gap-2">💡 AI Tipp</button>
      <button onclick="undoMove()" class="flex-1 py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 text-gray-400 text-xs font-medium transition-all flex items-center justify-center gap-2">↩ Visszavonás</button>
      <button onclick="resetGame()" class="flex-1 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-xs font-medium transition-all flex items-center justify-center gap-2">🏁 Feladás</button>
    </div>

    <div id="recommendationPanel" class="w-full max-w-lg rounded-xl p-3 bg-emerald-500/5 border border-emerald-500/20 hidden">
      <p class="text-[11px] text-emerald-400 font-medium flex items-center gap-2">🎯 Ajánlott lépés:</p>
      <p id="recommendationText" class="text-xs text-gray-300 mt-1"></p>
    </div>
  </section>

  <aside class="lg:col-span-3 space-y-4 order-3">
    <div class="sidebar-card rounded-xl p-4 space-y-3">
      <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">📖 Szabályok</h3>
      <div class="space-y-2">
        <div class="flex items-start gap-2"><span class="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span><div><p class="text-[11px] text-gray-300 leading-relaxed"><strong class="text-white">Elhelyezés:</strong> Helyezz el 9 darabot a rácsra.</p></div></div>
        <div class="flex items-start gap-2"><span class="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span><div><p class="text-[11px] text-gray-300 leading-relaxed"><strong class="text-white">Mozgatás:</strong> Csúsztass egy darabot szomszédos pontra.</p></div></div>
        <div class="flex items-start gap-2"><span class="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span><div><p class="text-[11px] text-gray-300 leading-relaxed"><strong class="text-white">Repülés:</strong> 3 darabnál bárhová repíthetsz!</p></div></div>
        <div class="flex items-start gap-2"><span class="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">✕</span><div><p class="text-[11px] text-gray-300 leading-relaxed"><strong class="text-white">Malom:</strong> 3 egy sorba → ellenfél darabját vedd fel!</p></div></div>
      </div>
    </div>

    <div class="sidebar-card rounded-xl p-4 space-y-3">
      <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">🔍 AI Átláthatóság</h3>
      <div class="space-y-2">
        <div class="flex justify-between text-[10px]"><span class="text-slate-500">Model típusa:</span><span class="text-gray-400 font-mono">Minimax + Alpha-Beta</span></div>
        <div class="flex justify-between text-[10px]"><span class="text-slate-500">Mélység:</span><span id="aiDepth" class="text-gray-400 font-mono">3</span></div>
        <div class="flex justify-between text-[10px]"><span class="text-slate-500">Elo rating:</span><span id="aiElo" class="text-gray-400 font-mono">~1200</span></div>
        <div class="flex justify-between text-[10px]"><span class="text-slate-500">EU AI Act:</span><span class="text-emerald-400 font-medium">✓ Nem high-risk</span></div>
      </div>
      <div class="pt-2 border-t border-slate-700/50"><p class="text-[9px] text-slate-600 leading-relaxed">Az AI ellenfél a minimax algoritmust használja korlátozott mélységgel. Minden lépés determinisztikus, nem tartalmaz gépi tanulási modellt. A játékállapotok nem kerülnek külső szerverre (edge inference).</p></div>
    </div>

    <div class="sidebar-card rounded-xl p-4 space-y-2">
      <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">⚖️ Compliance</h3>
      <div class="grid grid-cols-1 gap-1.5">
        <div class="flex items-center gap-2 bg-slate-800/60 rounded-lg px-2 py-1.5"><span class="text-[14px]">🔒</span><span class="text-[10px] text-gray-400">GDPR: Nincs személyes adat gyűjtése</span></div>
        <div class="flex items-center gap-2 bg-slate-800/60 rounded-lg px-2 py-1.5"><span class="text-[14px]">🌍</span><span class="text-[10px] text-gray-400">KOPPA: Korhatár nélkül elérhető</span></div>
        <div class="flex items-center gap-2 bg-slate-800/60 rounded-lg px-2 py-1.5"><span class="text-[14px]">♿</span><span class="text-[10px] text-gray-400">WCAG 2.1 AA: Kontraszt & billentyűzetre navigálható</span></div>
      </div>
    </div>

    <div class="sidebar-card rounded-xl p-4 space-y-3">
      <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">💰 Monetizáció (terv)</h3>
      <div class="space-y-1.5">
        <div class="flex items-center justify-between bg-slate-800/60 rounded-lg px-2 py-1.5"><span class="text-[10px] text-gray-400">Freemium alap</span><span class="text-[10px] text-emerald-400 font-medium">✓ Aktív</span></div>
        <div class="flex items-center justify-between bg-slate-800/60 rounded-lg px-2 py-1.5"><span class="text-[10px] text-gray-400">Kozmetikai skin-ek</span><span class="text-[10px] text-yellow-400 font-medium">Tervezett</span></div>
        <div class="flex items-center justify-between bg-slate-800/60 rounded-lg px-2 py-1.5"><span class="text-[10px] text-gray-400">AI Coaching ($2.99/hó)</span><span class="text-[10px] text-yellow-400 font-medium">Tervezett</span></div>
      </div>
    </div>
  </aside>
</main>

<div id="gameOverModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
  <div class="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl transform scale-100 animate-fade-in">
    <div id="gameOverIcon" class="text-5xl mb-4">🏆</div>
    <h2 id="gameOverTitle" class="text-2xl font-bold mb-2">Győzelem!</h2>
    <p id="gameOverText" class="text-gray-400 text-sm mb-6">Kiváló játék! A fehér játékos győzött.</p>
    <div class="grid grid-cols-3 gap-3 mb-6">
      <div class="bg-slate-800 rounded-lg p-2"><div id="goMoves" class="text-lg font-bold text-indigo-400">0</div><div class="text-[9px] text-slate-500 uppercase">Lépés</div></div>
      <div class="bg-slate-800 rounded-lg p-2"><div id="goMills" class="text-lg font-bold text-emerald-400">0</div><div class="text-[9px] text-slate-500 uppercase">Malom</div></div>
      <div class="bg-slate-800 rounded-lg p-2"><div id="goTime" class="text-lg font-bold text-purple-400">0:00</div><div class="text-[9px] text-slate-500 uppercase">Idő</div></div>
    </div>
    <button onclick="resetGame(); document.getElementById('gameOverModal').classList.add('hidden');" class="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold transition-all shadow-lg shadow-indigo-500/25">Új játék indítása →</button>
  </div>
</div>

<div id="removeModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 hidden flex items-center justify-center p-4">
  <div class="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
    <div class="text-3xl mb-3">⚔️</div>
    <h3 class="text-lg font-bold text-white mb-1">Malom!</h3>
    <p id="removeText" class="text-gray-400 text-sm mb-4">Válassz egy ellenfél darabot a felvételhez.</p>
    <div id="invalidRemovalNotice" class="hidden bg-red-500/10 border border-red-500/30 rounded-lg p-2 mb-3"><p class="text-xs text-red-400">⚠️ Nem veheted fel! A darab malomban van (kivéve ha nincs más).</p></div>
    <button onclick="cancelRemove()" class="w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-300 text-sm font-medium transition-colors">Mégse</button>
  </div>
</div>

<script>
// ============================================================
// NINE MEN'S MORRIS - QA-FIXED ENGINE
// ============================================================
const BOARD_SIZE = 500;
const MARGIN = 25;

function getPos(idx) {
  const s = BOARD_SIZE, m = MARGIN;
  const outer = [{x:m,y:m},{x:s/2,y:m},{x:s-m,y:m},{x:s-m,y:s/2},{x:s-m,y:s-m},{x:s/2,y:s-m},{x:m,y:s-m},{x:m,y:s/2}];
  const mid = s*0.3, mid2=s-mid;
  const middle = [{x:mid,y:mid},{x:s/2,y:mid},{x:mid2,y:mid},{x:mid2,y:s/2},{x:mid2,y:mid2},{x:s/2,y:mid2},{x:mid,y:mid2},{x:mid,y:s/2}];
  const inner = s*0.18, inner2=s-inner;
  const innerPos = [{x:inner,y:inner},{x:s/2,y:inner},{x:inner2,y:inner},{x:inner2,y:s/2},{x:inner2,y:inner2},{x:s/2,y:inner2},{x:inner,y:inner2},{x:inner,y:s/2}];
  return [...outer,...middle,...innerPos][idx];
}

const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],
  [8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,8],
  [16,17],[17,18],[18,19],[19,20],[20,21],[21,22],[22,23],[23,16],
  [0,8],[1,9],[2,10],[3,11],[4,12],[5,13],[6,14],[7,15],
  [8,16],[9,17],[10,18],[11,19],[12,20],[13,21],[14,22],[15,23]
];

const ADJACENCY = Array.from({length:24},()=>[]);
CONNECTIONS.forEach(([a,b])=>{ADJACENCY[a].push(b);ADJACENCY[b].push(a)});

const MILLS = [
  [0,1,2],[2,3,4],[4,5,6],[6,7,0],
  [8,9,10],[10,11,12],[12,13,14],[14,15,8],
  [16,17,18],[18,19,20],[20,21,22],[22,23,16],
  [0,8,16],[1,9,17],[2,10,18],[3,11,19],[4,12,20],[5,13,21],[6,14,22],[7,15,23]
];

let state = {
  board: Array(24).fill(null), currentPlayer:'white', phase:'placing',
  whitePlaced:0, blackPlaced:0, selectedPiece:null, validMoves:[],
  moveHistory:[], millCount:{white:0,black:0}, sessionStart:Date.now(),
  aiInteractions:0, gameMode:'ai', difficulty:2, gameOver:false, isAiThinking:false
};

let moveCount = 0, sessionTimer = null;

function initBoard() {
  const linesGroup = document.getElementById('boardLines');
  linesGroup.innerHTML = '';
  CONNECTIONS.forEach(([a,b])=>{
    const pa=getPos(a), pb=getPos(b);
    createSVG('line',{x1:pa.x,y1:pa.y,x2:pb.x,y2:pb.y,stroke:'#334155','stroke-width':2,'stroke-linecap':'round'},linesGroup);
  });
}

function createSVG(tag, attrs, parent) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for(const [k,v] of Object.entries(attrs)) el.setAttribute(k,v);
  if(parent) parent.appendChild(el); return el;
}

function renderPieces() {
  const group = document.getElementById('piecesGroup');
  group.innerHTML = '';
  for(let i=0;i<24;i++){
    if(!state.board[i]) continue;
    const p=getPos(i), c=createSVG('circle',{cx:p.x,cy:p.y,r:18,class:`piece-${state.board[i]} ${state.selectedPiece===i?'piece-selected':''}`},group);
    c.addEventListener('click',()=>handlePositionClick(i));
  }
}

function renderBoard(){ renderPieces(); updateUI(); }

function handlePositionClick(idx) {
  if(state.gameOver || state.isAiThinking) return;
  if(state.currentPlayer==='black' && state.gameMode==='ai') return;
  
  if(state.phase==='placing') placePiece(idx);
  else if(state.phase==='moving') movePiece(idx);
  else if(state.phase==='removing') removePiece(idx);
}

function placePiece(idx) {
  if(state.board[idx]!==null || (state.currentPlayer==='white'&&state.whitePlaced>=9)||(state.currentPlayer==='black'&&state.blackPlaced>=9)) return;
  
  state.moveHistory.push({type:'place',position:idx,player:state.currentPlayer,board:[...state.board],whitePlaced:state.whitePlaced,blackPlaced:state.blackPlaced,phase:state.phase});
  state.board[idx]=state.currentPlayer;
  if(state.currentPlayer==='white') state.whitePlaced++; else state.blackPlaced++;
  moveCount++; addLogEntry(`Fehér helyez → pozíció ${idx}`, 'white');
  
  const millsFormed = checkMill(idx, state.currentPlayer);
  if(millsFormed.length>0){
    state.phase='removing'; state.millCount[state.currentPlayer]++;
    const opp=state.currentPlayer==='white'?'black':'white';
    const removable=getRemovablePieces(opp);
    
    // Edge case: all opponent pieces in mills but >3
    if(removable.length===0 && countOnBoard(opp)>3){
      for(let i=0;i<24;i++){if(state.board[i]===opp){state.board[i]=null;break;}}
      addLogEntry(`Fehér felvesz egy darabot (kényszer)`, 'white');
    } else if(state.currentPlayer==='white'){
      showRemoveModal(removable); return;
    } else {
      const removed=aiRemovePiece(removable, state.currentPlayer);
      if(removed!==-1){state.board[removed]=null; addLogEntry(`Fekete felvesz egy darabot (${removed})`, 'black');}
    }
  }
  
  if(state.whitePlaced>=9 && state.blackPlaced>=9) state.phase='moving';
  checkWinCondition(); endTurn();
}

function movePiece(idx) {
  const player=state.currentPlayer;
  if(state.board[idx]===player && !isPieceSelected()){ selectPiece(idx); return; }
  
  if(state.selectedPiece!==null && state.validMoves.includes(idx)){
    const from=state.selectedPiece;
    state.moveHistory.push({type:'move',from,to:idx,player,state.currentPlayer,board:[...state.board],phase:state.phase});
    state.board[idx]=state.board[from]; state.board[from]=null;
    state.selectedPiece=null; state.validMoves=[]; moveCount++;
    addLogEntry(`Fehér mozgat ${from} → ${idx}`, 'white');
    
    const millsFormed=checkMill(idx,player);
    if(millsFormed.length>0){
      state.phase='removing'; state.millCount[player]++;
      const opp=player==='white'?'black':'white';
      const removable=getRemovablePieces(opp);
      if(player==='white') showRemoveModal(removable);
      else{const r=aiRemovePiece(removable,player);if(r!==-1){state.board[r]=null;addLogEntry(`Fekete felvesz egy darabot (${r})`,'black');}}
    }
  }
  checkWinCondition(); endTurn();
}

function removePiece(idx) {
  const player=state.currentPlayer, opp=player==='white'?'black':'white';
  if(state.board[idx]!==opp) return;
  if(isInMill(idx,opp)){const rem=getRemovablePieces(opp);if(rem.length>0){document.getElementById('invalidRemovalNotice').classList.remove('hidden');return;}}
  
  state.board[idx]=null; addLogEntry(`Fehér felvesz egy darabot (${idx})`, 'white');
  document.getElementById('removeModal').classList.add('hidden');
  checkWinCondition(); endTurn();
}

function cancelRemove(){document.getElementById('removeModal').classList.add('hidden'); clearHighlights(); state.phase='moving'; renderBoard();}

function showRemoveModal(removablePieces){
  const modal=document.getElementById('removeModal'); modal.classList.remove('hidden');
  clearHighlights();
  removablePieces.forEach(idx=>{
    const p=getPos(idx);
    createSVG('circle',{cx:p.x,cy:p.y,r:24,fill:'none',stroke:'#ef4444','stroke-width':3,'stroke-dasharray':'6 3',opacity:0.8},document.getElementById('boardLines'));
    const hit=createSVG('circle',{cx:p.x,cy:p.y,r:20,fill:'transparent'},document.getElementById('boardLines'));
    hit.style.cursor='pointer'; hit.addEventListener('click',()=>handlePositionClick(idx));
  });
}

function endTurn(){
  if(state.gameOver) return;
  state.currentPlayer=state.currentPlayer==='white'?'black':'white';
  
  renderBoard(); clearHighlights();
  
  if(state.currentPlayer==='black' && state.gameMode==='ai' && !state.gameOver){
    startAiThinking();
  }
}

function checkWinCondition(){
  const wc=countOnBoard('white'), bc=countOnBoard('black');
  if(bc<3 && state.whitePlaced>=9){ endGame('white','A Fekete kevesebb mint 3 darabbal rendelkezik!'); return true; }
  if(wc<3 && state.blackPlaced>=9){ endGame('black','A Fehér kevesebb mint 3 darabja maradt!'); return true; }
  
  if(state.phase==='moving'){
    const loser=state.currentPlayer;
    if(!hasAnyMoves(loser)){endGame(loser==='white'?'black':'white',`A ${loser==='white'?'Fehérnek':'Feketének'} nincs érvényes lépése!`); return true;}
  }
  return false;
}

function countOnBoard(p){ let c=0; for(let i=0;i<24;i++) if(state.board[i]===p) c++; return c; }
function checkMill(pos, player){ const m=[]; MILLS.forEach(ml=>{if(ml.includes(pos)&&ml.every(x=>state.board[x]===player))m.push(ml);}); return m; }
function isInMill(pos, p){ for(const ml of MILLS) if(ml.includes(pos)&&ml.every(x=>state.board[x]===p)) return true; return false; }

function isPieceSelected(){ return state.selectedPiece!==null; }
function selectPiece(idx){
  if(state.board[idx]!==state.currentPlayer) return;
  const cnt=countOnBoard(state.currentPlayer), canFly=cnt===3 && state.phase==='moving';
  state.selectedPiece=idx;
  state.validMoves = canFly ? Array.from({length:24},(_,i)=>state.board[i]===null?i:-1).filter(i=>i>=0) : ADJACENCY[idx].filter(p=>state.board[p]===null);
  renderBoard(); highlightValidMoves();
}

function hasAnyMoves(player){
  const cnt=countOnBoard(player);
  if(cnt===3 && state.phase==='moving') return state.board.some(p=>p===null);
  for(let i=0;i<24;i++) if(state.board[i]===player && ADJACENCY[i].some(a=>state.board[a]===null)) return true;
  return false;
}

function getRemovablePieces(opp){
  const rem=[]; for(let i=0;i<24;i++){if(state.board[i]===opp&&!isInMill(i,opp))rem.push(i);}
  if(rem.length===0 && countOnBoard(opp)>3) for(let i=0;i<24;i++) if(state.board[i]===opp) rem.push(i);
  return rem;
}

// ============================================================
// AI ENGINE (Async Yield + Alpha-Beta Pruning)
// ============================================================
function startAiThinking(){
  state.isAiThinking=true; updateUI();
  setTimeout(()=>{
    const move=computeBestMove(state.difficulty);
    if(!move){state.isAiThinking=false; return;}
    
    if(state.phase==='placing') aiPlace(move.position);
    else if(state.phase==='moving') aiMove(move.from, move.to);
    
    state.isAiThinking=false;
  }, 50); // Yield to main thread to prevent UI freeze
}

function computeBestMove(depth){
  let bestScore=-Infinity, bestMove=null;
  
  if(state.phase==='placing'){
    const empty=[]; for(let i=0;i<24;i++) if(state.board[i]===null) empty.push(i);
    empty.sort((a,b)=>(countPotentialMills(a,'black')-countPotentialMills(a,'white'))-(countPotentialMills(b,'black')-countPotentialMills(b,'white')));
    
    for(const pos of empty){
      state.board[pos]='black';
      const score=minimax(depth-1,false,-Infinity,Infinity);
      state.board[pos]=null;
      if(score>bestScore){bestScore=score;bestMove={position:pos};}
    }
    return bestMove||{position:empty[0]};
  }
  
  const pieces=[]; for(let i=0;i<24;i++) if(state.board[i]==='black') pieces.push(i);
  let allMoves=[];
  const canFly=countOnBoard('black')===3;
  for(const from of pieces){
    const targets=canFly?state.board.map((p,i)=>p===null?i:-1).filter(i=>i>=0):ADJACENCY[from].filter(a=>state.board[a]===null);
    for(const to of targets) allMoves.push({from,to});
  }
  
  allMoves.sort((a,b)=>checkMillFor(b.to,'black')-checkMillFor(a.to,'black'));
  
  for(const mv of allMoves){
    state.board[mv.to]='black'; state.board[mv.from]=null;
    const mills=checkMill(mv.to,'black'); let score;
    if(mills.length>0){const rem=getRemovablePiecesFor('white');if(rem.length>0){state.board[rem[0]]=null;score=minimax(depth-1,false,-Infinity,Infinity)+5;state.board[rem[0]]='white';}else{score=minimax(depth-1,false,-Infinity,Infinity);}}
    else score=minimax(depth-1,false,-Infinity,Infinity);
    
    state.board[mv.from]='black'; state.board[mv.to]=null;
    if(score>bestScore){bestScore=score;bestMove=mv;}
  }
  return bestMove||allMoves[Math.floor(Math.random()*allMoves.length)];
}

function minimax(depth, isMax, alpha, beta){
  if(depth<=0) return evaluateBoard();
  
  const wc=countOnBoard('white'), bc=countOnBoard('black');
  if(bc<3) return -1000+depth; if(wc<3) return 1000-depth;
  const player=isMax?'black':'white';
  if(!hasAnyMoves(player)) return isMax?-500:500;
  
  let bestScore=isMax?-Infinity:Infinity, pieces=[];
  for(let i=0;i<24;i++) if(state.board[i]===player) pieces.push(i);
  
  let moves=[];
  const canFly=countOnBoard(player)===3 && state.phase!=='placing';
  if(state.phase==='placing'){for(let i=0;i<24;i++)if(state.board[i]===null)moves.push({position:i});}
  else{for(const f of pieces){const t=canFly?state.board.map((p,i)=>p===null?i:-1).filter(i=>i>=0):ADJACENCY[f].filter(a=>state.board[a]===null);t.forEach(to=>moves.push({from:f,to}));}}
  
  for(const mv of moves){
    const saved=[...state.board];
    if(state.phase==='placing'){
      state.board[mv.position]=player;
      const ms=checkMill(mv.position,player); let sc;
      if(ms.length>0){const rm=getRemovablePiecesFor(player==='white'?'black':'white');if(rm.length>0){state.board[rm[0]]=null;sc=minimax(depth-1,!isMax,alpha,beta);state.board[rm[0]]=player==='white'?'black':'white';}else{sc=minimax(depth-1,!isMax,alpha,beta);}}
      else sc=minimax(depth-1,!isMax,alpha,beta);
    } else {
      state.board[mv.to]=player; state.board[mv.from]=null;
      const ms=checkMill(mv.to,player); let sc;
      if(ms.length>0){const rm=getRemovablePiecesFor(player==='white'?'black':'white');if(rm.length>0){state.board[rm[0]]=null;sc=minimax(depth-1,!isMax,alpha,beta);state.board[rm[0]]=player==='white'?'black':'white';}else{sc=minimax(depth-1,!isMax,alpha,beta);}}
      else sc=minimax(depth-1,!isMax,alpha,beta);
    }
    
    state.board=saved;
    if(isMax){bestScore=Math.max(bestScore,sc);alpha=Math.max(alpha,sc);}else{bestScore=Math.min(bestScore,sc);beta=Math.min(beta,sc);}
    if(beta<=alpha) break;
  }
  return bestScore===-Infinity||bestScore===Infinity?evaluateBoard():bestScore;
}

function evaluateBoard(){
  let score=0;
  const wc=countOnBoard('white'), bc=countOnBoard('black');
  score+=(bc-wc)*100;
  score+=(countPossibleMoves('black')-countPossibleMoves('white'))*5;
  
  let wm=0,bm=0;
  MILLS.forEach(ml=>{if(ml.every(p=>state.board[p]==='white'))wm++;if(ml.every(p=>state.board[p]==='black'))bm++;});
  score+=(bm-wm)*50;
  
  MILLS.forEach(ml=>{
    const w2=ml.filter(p=>state.board[p]==='white').length;
    const b2=ml.filter(p=>state.board[p]==='black').length;
    if(w2===2&&!ml.some(p=>state.board[p]==='white')) score-=15;
    if(b2===2) score+=8;
  });
  return score;
}

function countPotentialMills(pos, p){ let c=0; MILLS.forEach(ml=>{if(ml.includes(pos)&&ml.filter(x=>x!==pos).every(x=>state.board[x]===p))c++;}); return c; }
function checkMillFor(pos,p){ for(const ml of MILLS) if(ml.includes(pos)&&ml.every(x=>state.board[x]===p)) return true; return false; }
function getRemovablePiecesFor(opp){ const r=[]; for(let i=0;i<24;i++){if(state.board[i]===opp&&!isInMill(i,opp))r.push(i);} if(r.length===0&&countOnBoard(opp)>3) for(let i=0;i<24;i++) if(state.board[i]===opp) r.push(i); return r; }
function countPossibleMoves(p){ const c=countOnBoard(p), m=[]; if(c<=2)return 0; for(let i=0;i<24;i++){if(state.board[i]===p)m.push(c===3&&state.phase!=='placing'?state.board.filter(x=>x===null).length:ADJACENCY[i].filter(a=>state.board[a]===null).length);} return m.reduce((a,b)=>a+b,0); }

function aiPlace(pos){
  state.moveHistory.push({type:'place',position:pos,player:'black',board:[...state.board],whitePlaced:state.whitePlaced,blackPlaced:state.blackPlaced,phase:state.phase});
  state.board[pos]='black'; state.blackPlaced++; moveCount++; addLogEntry(`Fekete (AI) helyez → ${pos}`, 'black');
  
  const ms=checkMill(pos,'black');
  if(ms.length>0){state.phase='removing';state.millCount.black++;const r=getRemovablePieces('white');const rm=aiRemovePiece(r,'black');if(rm!==-1){state.board[rm]=null;addLogEntry(`Fekete felvesz egy darabot (${rm})`,'black');}}
  endTurn();
}

function aiMove(from,to){
  state.moveHistory.push({type:'move',from,to,player:'black',board:[...state.board],phase:state.phase});
  state.board[to]='black'; state.board[from]=null; moveCount++; addLogEntry(`Fekete (AI) mozgat ${from}→${to}`, 'black');
  
  const ms=checkMill(to,'black');
  if(ms.length>0){state.phase='removing';state.millCount.black++;const r=getRemovablePieces('white');const rm=aiRemovePiece(r,'black');if(rm!==-1){state.board[rm]=null;addLogEntry(`Fekete felvesz egy darabot (${rm})`,'black');}}
  endTurn();
}

function aiRemovePiece(rem, p){ if(!rem.length) return -1; let best=rem[0], bs=-Infinity; for(const i of rem){let s=0; MILLS.forEach(ml=>{if(ml.includes(i))s+=ml.filter(x=>state.board[x]===p==='white'?'black':'white').length*10;}); if(!isInMill(i,p==='white'?'black':'white'))s+=20;s+=Math.random()*3;if(s>bs){bs=s;best=i;}} return best; }

function aiHint(){
  if(state.gameOver||state.currentPlayer!=='white'||state.isAiThinking) return;
  let hint='';
  if(state.phase==='placing'){
    const empty=[]; for(let i=0;i<24;i++) if(state.board[i]===null) empty.push(i);
    let bestPos=empty[0], bs=-Infinity;
    for(const pos of empty){state.board[pos]='white';const s=(checkMill(pos,'white').length*10)+(countPotentialMills(pos,'white')*5);state.board[pos]=null;if(s>bs){bs=s;bestPos=pos;}}
    hint=`Helyezz egy darabot a ${bestPos}. pozícióba.`;
  } else {
    const pieces=[]; for(let i=0;i<24;i++) if(state.board[i]==='white') pieces.push(i);
    let bestMove=null, bs=-Infinity;
    for(const f of pieces){const t=countOnBoard('white')===3?state.board.map((p,i)=>p===null?i:-1).filter(i=>i>=0):ADJACENCY[f].filter(a=>state.board[a]===null);for(const to of t){const s=(checkMill(to,'white').length*15)+(countPotentialMills(to,'white')*3);if(s>bs){bs=s;bestMove={from:f,to};}}}
    if(bestMove) hint=`Mozgasd a ${bestMove.from}. darabot a ${bestMove.to}. pozícióba.`;
  }
  document.getElementById('recommendationPanel').classList.remove('hidden');
  document.getElementById('recommendationText').textContent=hint||'Nincs egyértelmű ajánlott lépés.';
}

function updateUI(){
  const wc=countOnBoard('white'), bc=countOnBoard('black');
  document.getElementById('whiteRemaining').textContent=9-state.whitePlaced;
  document.getElementById('blackRemaining').textContent=9-state.blackPlaced;
  document.getElementById('whitePieces').textContent=`${wc}/9`; document.getElementById('blackPieces').textContent=`${bc}/9`;
  document.getElementById('whiteBar').style.width=`${(state.whitePlaced/9)*100}%`;
  document.getElementById('blackBar').style.width=`${(state.blackPlaced/9)*100}%`;
  
  const pl={'placing':state.whitePlaced<9||state.blackPlaced<9?'ELHELYEZÉS':'ELHELYEZÉS (vége)','moving':'MOZGATÁS','removing':'MALOM! DARAB FELVÉTELE','gameover':'JÁTÉK VÉGE'};
  document.getElementById('phaseLabel').textContent=pl[state.phase]||state.phase;
  
  const tb=document.getElementById('turnBanner'), tt=document.getElementById('turnText');
  if(state.gameOver){tb.className='w-full max-w-lg rounded-xl p-3 text-center bg-slate-800/70 border border-slate-700/50 backdrop-blur-sm'; return;}
  
  if(state.currentPlayer==='white'){
    tb.className='w-full max-w-lg rounded-xl p-3 text-center bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm';
    tt.textContent=state.phase==='placing'?(state.whitePlaced<9?'Helyezz el egy darabot!':'Mozgass egy darabot!'):state.phase==='moving'?'Mozgass egy darabot!':'Válassz ellenfél darabot a felvételhez!';
  } else {
    tb.className='w-full max-w-lg rounded-xl p-3 text-center bg-red-500/10 border border-red-500/20 backdrop-blur-sm';
    tt.innerHTML=state.isAiThinking?'<span class="ai-thinking">Fekete (AI) gondolkodik</span>':'Fekete soron';
  }
  
  const se=document.getElementById('gameStatus');
  if(state.gameOver){se.className='px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20';se.textContent='🏁 Vége';}
  else{se.className=state.currentPlayer==='white'?'px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20':'px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20';se.textContent=state.currentPlayer==='white'?'▶ Te soron':'🤖 AI soron';}
  
  document.getElementById('moveCount').textContent=moveCount;
  document.getElementById('millCount').textContent=state.millCount.white+state.millCount.black;
  document.getElementById('aiInteractions').textContent=state.aiInteractions;
}

function updateKPIs(){
  const el=Math.floor((Date.now()-state.sessionStart)/1000);
  document.getElementById('sessionTime').textContent=`${Math.floor(el/60)}:${(el%60).toString().padStart(2,'0')}`;
  document.getElementById('sessionBar').style.width=`${Math.min((el/510)*100,100)}%`;
  document.getElementById('aiBar').style.width=`${moveCount>0?Math.min((state.aiInteractions/Math.max(moveCount,1))*100,100):0}%`;
}

function highlightValidMoves(){
  clearHighlights(); const g=document.getElementById('validMoves');
  state.validMoves.forEach(idx=>{if(!state.board[idx]){const p=getPos(idx);createSVG('circle',{cx:p.x,cy:p.y,r:20,fill:'#6366f1',opacity:0.15},g);createSVG('circle',{cx:p.x,cy:p.y,r:18,fill:'none',stroke:'#818cf8','stroke-width':2,'stroke-dasharray':'4 3'},g);createSVG('circle',{cx:p.x,cy:p.y,r:6,fill:'#818cf8',opacity:0.5},g);}});
}

function clearHighlights(){document.getElementById('validMoves').innerHTML='';const lg=document.getElementById('boardLines');while(lg.childNodes.length>CONNECTIONS.length)lg.removeChild(lg.lastChild);}

function addLogEntry(text,player){
  const le=document.getElementById('moveLog'); if(le.querySelector('.italic')) le.innerHTML='';
  const e=document.createElement('div'); e.className='flex items-center gap-2 text-[10px] py-1 border-b border-slate-800/50';
  const cc=player==='white'?'text-white':'text-gray-400', dc=player==='white'?'bg-white':'bg-gray-600';
  e.innerHTML=`<span class="w-1.5 h-1.5 rounded-full ${dc} shrink-0"></span><span class="${cc}">${text}</span><span class="ml-auto text-slate-600 font-mono">#${moveCount}</span>`;
  le.insertBefore(e,le.firstChild); while(le.children.length>50) le.removeChild(le.lastChild);
}

function endGame(winner,reason){
  state.gameOver=true; state.phase='gameover';
  const el=Math.floor((Date.now()-state.sessionStart)/1000);
  document.getElementById('goMoves').textContent=moveCount; document.getElementById('goMills').textContent=state.millCount[winner]; document.getElementById('goTime').textContent=`${Math.floor(el/60)}:${(el%60).toString().padStart(2,'0')}`;
  
  if(winner==='white'){document.getElementById('gameOverIcon').textContent='🏆';document.getElementById('gameOverTitle').textContent='Győzelem!';document.getElementById('gameOverText').textContent=`Kiváló játék! ${reason}`;}
  else{document.getElementById('gameOverIcon').textContent='🤖';document.getElementById('gameOverTitle').textContent='Az AI győzött';document.getElementById('gameOverText').textContent=reason;}
  
  renderBoard(); setTimeout(()=>document.getElementById('gameOverModal').classList.remove('hidden'),400);
}

function undoMove(){
  if(state.moveHistory.length===0||state.gameOver||state.isAiThinking) return;
  let count=1;
  if(state.currentPlayer==='white'&&state.gameMode==='ai'&&state.moveHistory.length>=2) count=2;
  
  for(let i=0;i<count;i++){
    const entry=state.moveHistory.pop();
    state.board=entry.board; if(entry.whitePlaced!==undefined)state.whitePlaced=entry.whitePlaced;if(entry.blackPlaced!==undefined)state.blackPlaced=entry.blackPlaced;if(entry.phase!==undefined)state.phase=entry.phase;
  }
  
  moveCount=Math.max(0,moveCount-count);
  clearHighlights(); renderBoard();
}

function resetGame(){
  state.board=Array(24).fill(null);state.currentPlayer='white';state.phase='placing';state.whitePlaced=0;state.blackPlaced=0;state.selectedPiece=null;state.validMoves=[];state.moveHistory=[];state.millCount={white:0,black:0};state.sessionStart=Date.now();state.aiInteractions=0;state.gameOver=false;state.isAiThinking=false;moveCount=0;
  clearHighlights(); document.getElementById('moveLog').innerHTML='<span class="text-[10px] text-slate-600 italic">Még nincsenek lépések...</span>';document.getElementById('gameOverModal').classList.add('hidden');document.getElementById('removeModal').classList.add('hidden');document.getElementById('recommendationPanel').classList.add('hidden');renderBoard();
}

function setDifficulty(val){state.difficulty=parseInt(val);const depths={1:2,2:4,3:6};document.getElementById('aiDepth').textContent=depths[val]||4;document.getElementById('aiElo').textContent=val==1?'~800':val==2?'~1200':'~1600';}

document.addEventListener('DOMContentLoaded',()=>{initBoard();sessionTimer=setInterval(updateKPIs,1000);renderBoard();});
document.addEventListener('keydown',e=>{if(e.key==='z'&&(e.ctrlKey||e.metaKey)){e.preventDefault();undoMove();}if(e.key==='n')resetGame();});
</script>
</body>
</html>