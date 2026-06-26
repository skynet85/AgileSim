@tailwind base;
@tailwind components;
@tailwind utilities;

body { margin: 0; font-family: 'Inter', system-ui, sans-serif; }
.board-point { cursor: pointer; transition: all 0.2s ease; }
.board-point.selected { transform: scale(1.3); box-shadow: 0 0 15px rgba(250,204,21,0.6); }