on
// File: frontend/package.json
{
  "name": "malom-protocol-core",
  "version": "1.0.2-release-candidate",
  "private": true,
  "type": "module",
  "description": "Deterministic state machine implementation for Nine Men's Morris with telemetry-driven validation.",
  "scripts": {
    "dev": "vite --port 3000 --host",
    "build": "tsc && vite build",
    "test": "vitest run --coverage",
    "lint": "eslint src/ --fix"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@stomp/stompjs": "^7.0.0",
    "sockjs-client": "^1.6.1",
    "zustand": "^4.5.2",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.65",
    "@types/sockjs-client": "^1.5.4",
    "typescript": "^5.4.2",
    "vite": "^5.1.4",
    "vitest": "^1.3.1",
    "@testing-library/react": "^15.0.0",
    "jsdom": "^24.0.0"
  }
}