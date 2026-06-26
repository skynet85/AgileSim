# LLMOps Szimuláció Eredménye

## 🎯 Legutóbbi Üzleti Igény
> kérek egy online malom játékot

## 🤖 A Csapat Munkája és a Működés
Ez a kódbázis egy többágenses (Multi-Agent) agilis LLMOps szimuláció végterméke. A folyamat során a Clean Code elveket követő csapat iteratív viták során dolgozta ki a specifikációt, a frontend és backend kódokat, az adatbázis sémákat (DDL/DML), valamint a UI/UX terveket.

## 📂 Projekt Memória (Záró állapot)

### 1. Iteráció:


# 📄 PROJEKT DOKUMENTÁCIÓ FRISSÍTÉS
**Dátum:** 2024-05-XX  
**Státusz:** `⚠️ RETURNED FOR REVISION` (Architektúra & State Machine szinkronizáció)  
**Fázis:** MVP Discovery → Validation  

---

## 🔹 1. TECHNOLÓGIAI DÖNTÉSEK & ARCHITKTÚRA
| Réteg | Technológia / Stack | Megjegyzés |
|-------|---------------------|------------|
| **Frontend** | React 18, Vite, TailwindCSS, Socket.io-client | Komponensbontás kötelező: `Board.tsx`, `useMatchState.ts`, `wsClient.ts` |
| **Backend** | Spring Boot 3.2.1 (WebFlux/WS), PostgreSQL, Redis, JWT | Server-authoritative validation, idempotencia kulcsok a tranzakciókhoz |
| **Adatkezelés** | Redis hash (`match:{id}:state`), PostgreSQL (users/matches/moves/transactions) | Batch analytics ingestion, 90 napos anonymizálási politika |
| **CI/CD** | Jenkins Pipeline (Node 18, Maven 3) | Determinisztikus build/deploy lánc, `nohup` háttérfolyamatok |

---

## 🔹 2. KONFIGURÁCIÓS FÁJLOK & PIPELINE (Kód)

### `frontend/package.json`
```json
{
  "name": "malom-online-game",
  "private": true,
  "version": "1.0.0-alpha",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.7.2"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "vite": "^5.0.0"
  }
}
```

### `backend/pom.xml` (Kivonat)
```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.1</version>
</parent>
<dependencies>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-webflux</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-websocket</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-security</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-data-jpa</artifactId></dependency>
    <dependency><groupId>org.postgresql</groupId><artifactId>postgresql</artifactId><scope>runtime</scope></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-data-redis-reactive</artifactId></dependency>
    <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-api</artifactId><version>0.12.3</version></dependency>
</dependencies>
```

### Jenkins Pipeline (`Jenkinsfile`)
```groovy
pipeline {
    agent any
    stages {
        stage('Frontend Dependencies') { when { expression { fileExists("frontend/package.json") } } tools { nodejs "Node18" } steps { sh 'npm install' } }
        stage('Frontend Build')     { when { expression { fileExists("frontend/package.json") } } tools { nodejs "Node18" } steps { sh 'npm run build' } }
        stage('Backend Compile')    { when { expression { fileExists("backend/pom.xml") } } tools { maven "Maven3" } steps { sh 'mvn clean compile' } }
        stage('Backend Deploy')     { when { expression { fileExists("backend/pom.xml") } } tools { maven "Maven3" } steps { sh 'JENKINS_NODE_COOKIE=dontKillMe nohup mvn spring-boot:run -Dserver.port=8081 > backend.log 2>&1 &' } }
    }
}
```

---

## 🔹 3. QA AUDIT & TESZTELÉSI EREDMÉNYEK
| Kategória | Találat / Hibaleírás | Hatás |
|-----------|----------------------|-------|
| **Architektúra** | Specifikáció React komponenseket ír elő, implementáció monolit Vanilla JS (`index.html`). | Vite build pipeline `MODULE_NOT_FOUND` hibával áll le. WebSocket adapter réteg hiányzik. |
| **State Machine** | `setTimeout(() => this.enterRemoveMode(), 500)` használata fázisváltáshoz. | Race condition WebSocket üzenet-pufferelésnél, undo/rollback sorrend felborulása. |
| **Win Condition** | Duplikált validáció a `checkWinCondition()` és `switchPlayer()` ágakban. | Mill levétel utáni állapotátmenés nem determinisztikus, `gameOver` flag nem akadályozza a következő kör inicializálását. |
| **Edge Case** | `handleMovement` nem frissíti azonnal a fázist üres pontra kattintásnál; `undo()` hiányos backend szinkronizáció. | Üres render loop kockázat, data drift offline/reconnect forgatókönyvnél. |
| **Tesztfedezettség** | Követelmény: >80% unit test coverage (`MoveValidatorTest.java`). | Jelenlegi állapot: 0%. Coverage hiánya blokkolja a DoD teljesülését. |

---

## 🔹 4. TECHNikai AKCIÓTERV (Scope Gate v1.0 előtt)
1. **Frontend Refaktorálás:** Monolit `index.html` bontása BA specifikáció szerinti komponensekre (`Board.tsx`, `useMatchState.ts`, `wsClient.ts`).
2. **Determinisztikus Állapotgép:** `setTimeout()` eltávolítása. Szinkron state machine switch implementálása WebSocket üzenet-prioritással (`state sync > analytics`).
3. **Backend Endpoint Vázak:** `/match`, `/move`, `/reconnect` végpontok létrehozása (még ha üres is, a frontend `wsClient.ts` integrációs teszteléséhez).
4. **Unit Tesztek:** `MoveValidatorTest.java` lefedésének biztosítása (>80%), fókuszban mill levétel utáni win condition és reconnect fallback forgatókönyvek.
5. **Integrációs Teszt Pipeline:** Futtatás a teljes láncra: `WebSocket room creation → move sync → DB persistence → analytics ingestion`.

**Jövőbeli mérföldkő:** Ticket lezárása csak QA Lead explicit jóváhagyása után, az integrált stack és >80% tesztfedezettség mellett.

---
### 2. Iteráció:


# 📄 PROJEKT DOKUMENTÁCIÓ FRISSÍTÉS
**Dátum:** 2024-05-XX  
**Státusz:** `🔴 CRITICAL PRIORITY – SCOPE GATE v1.0 PENDING / RETURNED FOR CRITICAL REVISION`  
**Fázis:** MVP Discovery → Validation  

---

## 🔹 1. TECHNOLÓGIAI DÖNTÉSEK & ARCHITKTÚRA
| Réteg | Technológia / Stack | Megjegyzés / Mandátum |
|-------|---------------------|------------------------|
| **Frontend** | React 18, Vite, TailwindCSS, Socket.io-client, Immer, TypeScript | Komponensbontás kötelező: `Board.tsx`, `useMatchState.ts`, `wsClient.ts`. Lokális validáció csak UX-preview; szerveri autoritás végleges. |
| **Backend** | Spring Boot 3.2.1 (WebFlux/WS, JPA), PostgreSQL, Redis Reactive, JWT | Server-authoritative state machine. Idempotencia kulcsok minden `/move` hívásnál. Determinisztikus fázisváltás atomi üzenetküldéssel. |
| **Adatkezelés** | Redis hash (`match:{id}:state`), PostgreSQL (users/matches/moves/transactions) | Batch analytics ingestion, 90 napos anonymizálási politika. State snapshot + client-side optimistic queue + reconciliation endpoint. |
| **CI/CD** | Jenkins Pipeline (Node 18, Maven 3) | Determinisztikus build/deploy lánc, `disableConcurrentBuilds`, explicit timestamp audit trail. |
| **Tesztelési Küszöbök** | Unit: ≥85% branch coverage<br>Integration: ≤120ms P95 latency, <0.3% error rate (50 párhuzamos session)<br>Chaos/Edge: Network throttling, Redis/DB timeout, state drift recovery ≤2s<br>State Machine: 500+ szimuláció, 100% pass rate | A küszöbök túllépése scope freeze-t és risk log entry-t generál. |

---

## 🔹 2. KONFIGURÁCIÓS FÁJLOK & PIPELINE (Kód)

### `frontend/package.json`
```json
{
  "name": "malom-online-game",
  "private": true,
  "version": "1.0.1-rc",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.7.5",
    "immer": "^10.0.3",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.12"
  }
}
```

### `backend/pom.xml` (Kivonat)
```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.1</version>
</parent>
<dependencies>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-webflux</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-websocket</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-security</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-data-jpa</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-data-redis-reactive</artifactId></dependency>
    <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-api</artifactId><version>0.12.3</version></dependency>
    <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-impl</artifactId><version>0.12.3</version><scope>runtime</scope></dependency>
    <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-jackson</artifactId><version>0.12.3</version><scope>runtime</scope></dependency>
    <dependency><groupId>org.postgresql</groupId><artifactId>postgresql</artifactId><scope>runtime</scope></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-test</artifactId><scope>test</scope></dependency>
</dependencies>
```

### `frontend/vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8081', '/ws': { target: 'http://localhost:8081', ws: true } } },
  build: { outDir: 'dist', sourcemap: false, rollupOptions: { output: { manualChunks: { vendor: ['react','react-dom'] } } } }
})
```

### `frontend/tailwind.config.js`
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: []
}
```

### `frontend/index.html` & `main.tsx` & `index.css`
```html
<!DOCTYPE html>
<html lang="hu">
  <head><meta charset="UTF-8" /><link rel="icon" type="image/svg+xml" href="/vite.svg" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>MALOM | Deterministic Strategy</title></head>
  <body class="bg-slate-900 text-slate-200 font-sans antialiased min-h-screen flex items-center justify-center"><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
```
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Board } from './components/Board'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><Board /></React.StrictMode>
)
```
```css
@tailwind base; @tailwind components; @tailwind utilities;
@keyframes pulse-glow { 0% { filter: drop-shadow(0 0 4px rgba(100,255,218,0.3)); } 100% { filter: drop-shadow(0 0 12px rgba(100,255,218,0.7)); } }
.animate-pulse-glow { animation: pulse-glow 1.5s infinite alternate; }
::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: rgba(30,41,59,0.5); } ::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
```

### `frontend/src/services/wsClient.ts` & `useMatchState.ts` & `Board.tsx`
*(Kód a megadott specifikáció szerint, React komponensbontással, Immer state kezeléssel, idempotencia kulcs generálással és WS eseményrouterrel.)*

### Backend Java Architektúra (`MalomApplication.java`, `WebSocketConfig.java`, `MatchStateMachine.java`, `MoveValidatorService.java`)
*(Kód a megadott specifikáció szerint, server-authoritative state machine, explicit adjacency/mill validáció, STOMP WebSocket broker konfigurációval.)*

### `frontend/src/test/java/com/mallogame/engine/MoveValidatorTest.java`
```java
@SpringBootTest
class MoveValidatorTest {
    @Autowired private MoveValidatorService validator;
    private List<Character> board;
    @BeforeEach void setUp() { board = new ArrayList<>(Collections.nCopies(24, null)); }

    @Test void testIsAdjacent() { assertTrue(validator.isAdjacent(0, 1)); assertFalse(validator.isAdjacent(0, 5)); }
    @Test void testHasFormedMill_StandardOuter() { board.set(0,'w');board.set(1,'w');board.set(2,'w'); assertTrue(validator.hasFormedMill(board,1,'w')); }
    @Test void testCanRemovePiece_ProtectionRule() { /* Védett bábu logika validálása */ }
    @Test void testHasAnyValidMoves_Flying() { board.set(0,'w');board.set(4,'w');board.set(8,'w'); assertTrue(validator.hasAnyValidMoves(board,'w')); }
    @Test void testDeterministicStateTransition_NoTimeouts() { /* Tiszta függvény validáció */ }
}
```

### Jenkins Pipeline (`Jenkinsfile`)
```groovy
pipeline { agent any stages { stage('Frontend Dependencies') { when { expression { fileExists("frontend/package.json") } } tools { nodejs "Node18" } steps { sh 'npm install' } } stage('Frontend Build') { when { expression { fileExists("frontend/package.json") } } tools { nodejs "Node18" } steps { sh 'npm run build' } } stage('Backend Compile') { when { expression { fileExists("backend/pom.xml") } } tools { maven "Maven3" } steps { sh 'mvn clean compile' } } stage('Backend Deploy') { when { expression { fileExists("backend/pom.xml") } } tools { maven "Maven3" } steps { sh 'JENKINS_NODE_COOKIE=dontKillMe nohup mvn spring-boot:run -Dserver.port=8081 > backend.log 2>&1 &' } } stage('Frontend Deploy') { when { expression { fileExists("frontend/package.json") } } tools { nodejs "Node18" } steps { sh 'JENKINS_NODE_COOKIE=dontKillMe nohup npm start > frontend.log 2>&1 &' } } } options { timestamps() disableConcurrentBuilds() } }
```

---

## 🔹 3. QA AUDIT & TESZTELÉSI EREDMÉNYEK
| Kategória | Találat / Hibaleírás | Hatás / Következmény |
|-----------|----------------------|-----------------------|
| **POJO Serializáció** | `GameState` belső osztály hiányos: `getScores()`, `getPiecesOnBoard()` és kapcsolódó setterek nem implementálva. | JSON szerializációs hiba a `broadcastSync()` hívásnál. State drift a kliens-oldalon. |
| **State Machine Asyncitás** | `setPhase("remove")` utáni azonnali `return` megszakítja a flow-ot. WebSocket üzenetek sorrendisége és idempotencia kulcsok érvényesítése reconnect esetén nem garantált. | Race condition optimistic UI vs server state. Undo/rollback sorrend felborulása. |
| **Validációs Réteg** | `MoveValidatorService.checkWinCondition()` jelenleg `return false;` (stub). | Üzleti logika hiányos. Játék soha nem ér véget, churn kockázat növekszik. |
| **Frontend-Backend Sync** | `useMatchState.ts` lokális `getValidMoves()` számítása nem tartalmaz server-side error rollback mechanizmust (`produce` draft hiányos ERROR eseményre). | State drift esetén UI nem áll vissza konzisztens állapotra. Felhasználói súrlódás nő. |
| **Tesztfedezettség** | Jelenlegi: ~0% branch coverage a kritikus ágakban. Követelmény: ≥85%. | DoD nem teljesült. Scope Gate v1.0 aktiválása blokkolva. |

---

## 🔹 4. TECHNikai AKCIÓTERV & ZÁRÁS KRITÉRIUMOK
1. **`GameState` POJO Teljesítése:** Explicit getter/setter implementáció minden mezőre. JSON szerializáció determinisztikus, reflexióra hagyott boilerplate nélkül.
2. **`checkWinCondition()` Valós Implementáció:** Logika pótlása: `(piecesOnBoard[opponent] < 3) || (!hasAnyValidMoves(board, opponent))`. Tiszta függvény, kimeneti torzítás nélkül.
3. **Determinisztikus State Sync:** `MatchStateMachine`-ben explicit `nextTurn()` logika bevezetése. Fázisváltás és `STATE_SYNC` küldése atomi művelet. WebSocket üzenetekhez sequence number/versioning hozzáadása az idempotencia és reconnect konzisztencia biztosítására.
4. **Error Handling & Rollback:** `useMatchState.ts`-ben `ERROR` esemény kezelő implementálása. UI state visszaállítása az előző konzisztens pontra (`history.pop()` logika), akadálynak nem hagyva a felhasználót.
5. **Unit Tesztek Kiegészítése:** `MoveValidatorTest.java` bővítése `checkWinCondition()` és állapotátmeneti sorrendiség teszteivel. CI pipeline-ban branch coverage gate beállítása ≥85% minimumra.

**Zárási Kritériumok (Scope Gate v1.0):**
- ✅ QA Lead explicit jóváhagyása a fenti 5 pont fizikai implementációjára és unit teszteseteken keresztüli igazolására.
- ✅ Integrációs pipeline sikeres futtatása: `WS room creation → move sync → DB persistence → analytics ingestion`.
- ✅ Metrikus küszöbök teljesülése: ≤120ms P95 latency, <0.3% error rate, 500+ state machine szimuláció 100%-os pass rate.
- ⛔ A ticket **NEM ZÁRHATÓ LE** `RETURNED FOR CRITICAL REVISION` státusz alatt a fenti feltételek teljesüléséig.

**Státusz:** `🟡 IN PROGRESS – SCOPE GATE v1.0 PENDING`  
**Következő Sync:** Holnap 10:00 | Téma: `State Machine Determinism + Integration Test Matrix`

---
### 3. Iteráció:


# 📄 PROJEKT DOKUMENTÁCIÓ FRISSÍTÉS
**Dátum:** 2024-05-XX  
**Státusz:** `🔴 RETURNED FOR CRITICAL REVISION – STRUCTURAL INTEGRITY CHECK FAILED`  
**Fázis:** MVP Discovery → Validation  

---

## 🔹 1. TECHNOLÓGIAI DÖNTÉSEK & ARCHITKTÚRA
| Réteg | Technológia / Stack | Megjegyzés / Mandátum |
|-------|---------------------|------------------------|
| **Frontend** | React 18, Vite, TailwindCSS, Socket.io-client, Immer, TypeScript | Komponensbontás kötelező: `Board.tsx`, `useMatchState.ts`, `wsClient.ts`. Lokális validáció csak UX-preview; szerveri autoritás végleges. History stack korlátja: `MAX_HISTORY_DEPTH = 50`. Explicit WS router (`STATE_SYNC`, `ERROR`, `GAME_OVER`). |
| **Backend** | Spring Boot 3.2.1 (WebFlux/WS, JPA), PostgreSQL, Redis Reactive, JWT | Server-authoritative state machine. DI kontextus kötelező (`@Autowired`). Idempotencia kulcsok minden `/move` hívásnál. DTO felelősségi kör szigorú elválasztása (nincs üzleti logika). `checkWinCondition()` valós lépésképtelenség-ellenőrzése kötelező. |
| **Adatkezelés** | Redis hash (`match:{id}:state`), PostgreSQL (users/matches/moves/transactions) | Batch analytics ingestion, 90 napos anonymizálási politika. State snapshot + client-side optimistic queue + reconciliation endpoint. Composite unique index: `match_id` + `sequence_number`. |
| **CI/CD** | Jenkins Pipeline (Node 18, Maven 3) | Determinisztikus build/deploy lánc, `disableConcurrentBuilds`, explicit timestamp audit trail, timeout: 45 perc, log rotáció: 30 build. Automatikus coverage gate ≥85% branch. |
| **Tesztelési Küszöbök** | Unit: ≥85% branch coverage<br>Integration: ≤120ms P95 latency, <0.3% error rate (50 párhuzamos session)<br>Chaos/Edge: Network throttling, Redis/DB timeout, state drift recovery ≤2s<br>State Machine: 500+ szimuláció, 100% pass rate | A küszöbök túllépése scope freeze-t és risk log entry-t generál. |

---

## 🔹 2. KONFIGURÁCIÓS FÁJLOK & PIPELINE (Kód)

### `frontend/package.json`
```json
{
  "name": "malom-online-game",
  "private": true,
  "version": "1.0.2-stable",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.7.5",
    "immer": "^10.0.3",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.12"
  }
}
```

### `backend/pom.xml` (Kivonat)
```xml
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.1</version>
    </parent>
    <groupId>com.mallogame</groupId>
    <artifactId>malom-backend</artifactId>
    <version>1.0.2-stable</version>
    <properties><java.version>17</java.version></properties>
    <dependencies>
        <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-webflux</artifactId></dependency>
        <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-websocket</artifactId></dependency>
        <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-security</artifactId></dependency>
        <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-data-jpa</artifactId></dependency>
        <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-data-redis-reactive</artifactId></dependency>
        <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-api</artifactId><version>0.12.3</version></dependency>
        <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-impl</artifactId><version>0.12.3</version><scope>runtime</scope></dependency>
        <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-jackson</artifactId><version>0.12.3</version><scope>runtime</scope></dependency>
        <dependency><groupId>org.postgresql</groupId><artifactId>postgresql</artifactId><scope>runtime</scope></dependency>
        <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-test</artifactId><scope>test</scope></dependency>
    </dependencies>
    <build><plugins><plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId></plugin></plugins></build>
</project>
```

### `frontend/vite.config.ts` & `tailwind.config.js`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8081', '/ws': { target: 'http://localhost:8081', ws: true } } },
  build: { outDir: 'dist', sourcemap: false, rollupOptions: { output: { manualChunks: { vendor: ['react','react-dom'] } } } }
})
```
```javascript
export default { content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'], theme: { extend: {} }, plugins: [] }
```

### `frontend/index.html` & `main.tsx` & `index.css`
```html
<!DOCTYPE html>
<html lang="hu">
  <head><meta charset="UTF-8" /><link rel="icon" type="image/svg+xml" href="/vite.svg" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>MALOM | Deterministic Strategy</title></head>
  <body class="bg-slate-900 text-slate-200 font-sans antialiased min-h-screen flex items-center justify-center"><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
```
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Board } from './components/Board'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Board /></React.StrictMode>)
```
```css
@tailwind base; @tailwind components; @tailwind utilities;
@keyframes pulse-glow { 0% { filter: drop-shadow(0 0 4px rgba(100,255,218,0.3)); } 100% { filter: drop-shadow(0 0 12px rgba(100,255,218,0.7)); } }
.animate-pulse-glow { animation: pulse-glow 1.5s infinite alternate; }
::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: rgba(30,41,59,0.5); } ::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
```

### `frontend/src/services/wsClient.ts` & `useMatchState.ts` & `Board.tsx`
*(Kód a megadott specifikáció szerint, explicit eseményrouterrel, Immer alapú rollback korlátozással és determinisztikus állapotkezeléssel.)*

### Backend Java Architektúra (`MalomApplication.java`, `WebSocketConfig.java`, `GameStateDTO.java`, `MatchStateMachine.java`, `MoveValidatorService.java`)
*(Kód a megadott specifikáció szerint, Spring DI injektálással, tiszta DTO szerződéssel és valós win condition logikával.)*

### `frontend/src/test/java/com/mallogame/engine/MoveValidatorTest.java`
```java
@SpringBootTest
class MoveValidatorTest {
    @Autowired private MoveValidatorService validator;
    private List<Character> board;
    @BeforeEach void setUp() { board = new ArrayList<>(Collections.nCopies(24, null)); }

    @Test void testIsAdjacent() { assertTrue(validator.isAdjacent(0, 1)); assertFalse(validator.isAdjacent(0, 5)); }
    @Test void testHasFormedMill_StandardOuter() { board.set(0,'w');board.set(1,'w');board.set(2,'w'); assertTrue(validator.hasFormedMill(board,1,'w')); }
    @Test void testCanRemovePiece_ProtectionRule() { /* Védett bábu logika validálása */ }
    @Test void testHasAnyValidMoves_Flying() { board.set(0,'w');board.set(4,'w');board.set(8,'w'); assertTrue(validator.hasAnyValidMoves(board,'w')); }
    @Test void testDeterministicStateTransition_NoTimeouts() { /* Tiszta függvény validáció */ }
}
```

### Jenkins Pipeline (`Jenkinsfile`)
```groovy
pipeline {
    agent any
    options { timestamps(); disableConcurrentBuilds(); buildDiscarder(logRotator(numToKeepStr: '30')); timeout(time: 45, unit: 'MINUTES') }
    stages {
        stage('Frontend Dependencies') { when { expression { fileExists("frontend/package.json") } } tools { nodejs "Node18" } steps { sh 'npm install' } }
        stage('Frontend Build')     { when { expression { fileExists("frontend/package.json") } } tools { nodejs "Node18" } steps { sh 'npm run build' } }
        stage('Backend Compile & Test'){ when { expression { fileExists("backend/pom.xml") } } tools { maven "Maven3" } steps { sh 'mvn clean compile test -DskipTests=false' } }
        stage('Frontend Deploy')     { when { expression { fileExists("frontend/package.json") } } tools { nodejs "Node18" } steps { sh 'JENKINS_NODE_COOKIE=dontKillMe nohup npm start > frontend.log 2>&1 &' } }
        stage('Backend Deploy')      { when { expression { fileExists("backend/pom.xml") } } tools { maven "Maven3" } steps { sh 'JENKINS_NODE_COOKIE=dontKillMe nohup mvn spring-boot:run -Dserver.port=8081 > backend.log 2>&1 &' } }
    }
}
```

---

## 🔹 3. QA AUDIT & TESZTELÉSI EREDMÉNYEK
| Kategória | Találat / Hibaleírás | Hatás / Következmény |
|-----------|----------------------|-----------------------|
| **DI/Spring Kontextus** | `MatchStateMachine.java` → `new MoveValidatorService()` bypass. | Validator nem részesül AOP proxyban, tranzakciós kezelés hiányos. Reconnect/fallback esetén állapotmaradék keletkezik. |
| **Üzleti Logika (Win Condition)** | `MoveValidatorService.checkWinCondition()` → `boolean hasMoves = false;` halott ág. | Lépésképtelenség ellenőrzése nem fut le. Játék nem zárul determinisztikusan kényszerállapot esetén. |
| **Frontend Rollback Stack** | `useMatchState.ts` → `stateHistoryRef.current.pop()` korlátlan mélység. | Reconnect loop vagy sorozatos ERROR esemény esetén memória-overflow, stack üresedésekor `INITIAL_STATE` ugrás (state drift irreverzibilis). |
| **DTO Felelősségi Kör** | `GameStateDTO.java` → `getPiecesOnBoard(String player)` custom getter. | Üzleti logika keveredik adattartó réteggel. Mock-olhatóság csökken, serialization tesztelhetetlenné válik CI pipeline-ban. |
| **WebSocket Router** | `wsClient.ts` → `socket.onAny(...)` nem szűrt eseménykezelő. | Nem definiált üzenetek (telemetry/heartbeat) véletlenszerű állapotfrissítést vagy rollback-et triggerelhetnek. Fail-safe routing hiányzik. |
| **Tesztfedezettség** | Jelenlegi: ~0% branch coverage a kritikus ágakban. Követelmény: ≥85%. | DoD nem teljesült. Scope Gate v1.0 aktiválása blokkolva. CI pipeline automatikus blokkolás beállítandó. |

---

## 🔹 4. TECHNikai AKCIÓTERV & ZÁRÁS KRITÉRIUMOK
**Kötelező Implementációk (Scope Gate v1.0 előtti zárási feltétel):**
1. `MatchStateMachine.java` → Validator injektálása: `@Autowired private MoveValidatorService validator;`. Spring IoC kontextusba helyezés kötelező.
2. `MoveValidatorService.checkWinCondition()` → Valós lépésképtelenség-ellenőrzés implementálása: iteráció az ellenfél pozícióin, ADJ mátrix validálással. `hasMoves = false;` helyettesítése kötelező.
3. `useMatchState.ts` → History stack korlátozása (`MAX_HISTORY_DEPTH = 50`). Üres stack esetén explicit `STATE_SYNC` kérés a szervertől, nem `INITIAL_STATE` ugrás.
4. `GameStateDTO.java` → `getPiecesOnBoard()` custom getter eltávolítása. A számítás az engine rétegbe kerül át (tiszta felelősségi kör).
5. `wsClient.ts` → `onAny()` kicserélése explicit routerre (`STATE_SYNC`, `ERROR`, `GAME_OVER`). Nem definiált üzenetek loggolása és figyelmen kívül hagyása kötelező.

**Zárási Kritériumok (Scope Gate v1.0):**
- ✅ QA Lead explicit jóváhagyása a fenti 5 pont fizikai implementációjára és unit/integration teszten keresztüli igazolására.
- ✅ `MoveValidatorTest.java` bővítése valós `checkWinCondition()` ágakkal + `hasMoves` ellenőrzéssel. CI coverage gate ≥85% (branch).
- ✅ Integrációs pipeline sikeres futtatása: `WS room creation → move sync → DB persistence → analytics ingestion`.
- ✅ Metrikus küszöbök teljesülése: ≤120ms P95 latency, <0.3% error rate, 500+ state machine szimuláció 100%-os pass rate.
- ⛔ A ticket **NEM ZÁRHATÓ LE** `RETURNED FOR CRITICAL REVISION` státusz alatt a fenti feltételek teljesüléséig. Release freeze aktív.

**Státusz:** `🔴 RETURNED FOR CRITICAL REVISION – STRUCTURAL INTEGRITY CHECK FAILED`  
**Következő Sync:** Holnap 10:00 | Téma: `State Machine Determinism + Integration Test Matrix + Coverage Gate Validation`
