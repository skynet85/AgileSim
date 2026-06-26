# LLMOps Szimuláció Eredménye

## 🎯 Legutóbbi Üzleti Igény
> készítsetek egy online malom játékot

## 🤖 A Csapat Munkája és a Működés
Ez a kódbázis egy többágenses (Multi-Agent) agilis LLMOps szimuláció végterméke. A folyamat során a Clean Code elveket követő csapat iteratív viták során dolgozta ki a specifikációt, a frontend és backend kódokat, az adatbázis sémákat (DDL/DML), valamint a UI/UX terveket.

## 📂 Projekt Memória (Záró állapot)

### 1. Iteráció:


# 📄 Projekt Dokumentáció – Frissítés v1.0
**Státusz:** `IN PROGRESS → AWAITING RESOLUTION` (Sprint 1)  
**Dokumentum típusa:** Technikai specifikáció, architektúra döntések, tesztelési eredmények, kódszintű implementációs jegyzetek

---

## 🔹 1. Architektúra & Technológiai Stack Döntések
| Réteg | Döntés / Stack | Indoklás (Tényalapú) |
|-------|----------------|----------------------|
| **Frontend** | React 18, TypeScript, Vite, Redux Toolkit/Zustand, Tailwind CSS | Determinisztikus state management, minimális dependency stack, iparági UX konvenciók követése a lemorzsolódás csökkentésére. |
| **Backend** | Spring Boot 3.2.1, Java 17, REST + WebSocket/STOMP | Lineáris skálázhatóság, idempotens API-k, standardizált üzenetküldési protokoll. |
| **Adatbázis** | PostgreSQL 15, Relációs schema, Flyway/Liquibase | Referenciális integritás kötelező, indexelt lekérdezések optimalizálása, audit trail tárolás. |
| **Infrastruktúra** | Docker Compose (lokális/staging), Jenkins Pipeline | Determinisztikus környezetfelépítés, automatizált build/deploy/health-check folyamatok. |

---

## 🔹 2. MVP Funkciók & KPI Keretrendszer
### 📌 Core MVP Funkciók (Max 5)
1. **Valós idejű párosítás & session routing** – Session repeat rate ↑ → LTV növekedés, churn prediction model táplálása.
2. **Determinisztikus lépésvalidáció & state sync** – Support ticket csökkenés, rendszerbiztonság, state machine alapú validáció.
3. **Persistens felhasználói profil & progresszió** – Retention funnel mérhetőség, személyre szabott monetizációs trigger.
4. **Telemetriai adatgyűjtő csatorna** – Core KPI dashboard valós idejű táplálása, A/B teszt alap.
5. **Nem-intruzív adtámú free tier + rewarded loop** – Monetization without friction → bevételnövekedés 3 hónap alatt.

### 📊 KPI & Validációs Táblázat
| Sprint | Core KPI | Secondary UX Konverziós Mutató | Célérték |
|--------|----------|-------------------------------|----------|
| S1 | Session Repeat Rate (7 nap) | Move-to-Session Completion Ratio | ≥ 35% / ≤ 0.28 abandonment |
| S2 | Churn Prediction Model Accuracy | Ad Impression → Click Conversion | R² ≥ 0.65 / ≥ 4.1% |
| S3 | LTV Projection (30d horizon) | Reward Loop Completion Rate | $≥ 1.80 / ≥ 62% |

**Validációs mechanizmus:** Minden UI elem A/B tesztelésen megy keresztül `main` branch merge előtt. Havi „Devil’s Advocate Review” kötelező a lineáris feltételezések ellenőrzésére. Telemetriai adatok batch processing-szel kerülnek feldolgozásra.

---

## 🔹 3. Technikai Specifikáció & Kódstruktúra
### 📁 Kötelező Fájllista
```text
malmonline-project/
├── frontend/package.json, tsconfig.json, vite.config.ts
├── frontend/src/main.tsx, App.tsx
├── frontend/src/components/{GameBoard, MatchmakingModal, RewardBanner, ProgressBar}.tsx
├── frontend/src/hooks/{useWebSocket, useGameValidation}.ts
├── frontend/src/store/gameSlice.ts
├── frontend/src/utils/telemetryLogger.ts
├── backend/pom.xml
├── backend/src/main/java/com/malmonline/{MalmonlineApplication, config/*, controller/*, service/*, model/*, repository/*}
├── db/migrations/V001__init_schema.sql
├── infra/docker-compose.yml
└── docs/{roi_business_case_mvp.md, kpi_tracking_matrix.md, validation_review_template.md}
```

### 🗄️ Adatbázis Schema (V001)
- `users` (UUID PK, username UNIQUE)
- `game_sessions` (UUID PK, phase ENUM, current_turn_piece_count INT2, winner_id FK)
- `player_states` (UUID PK, session_id FK, user_id FK, color ENUM, pieces_on_board/in_hand INT2)
- `board_state` (SERIAL PK, session_id FK, position_index CHECK 0-23, owner_color ENUM)
- Indexek: `idx_board_session`, `idx_player_session`. Audit log tábla kötelező.

### ⚙️ Backend Logika (`GameEngineService.java`)
- Adjacency matrix (24x24) O(1) validációhoz.
- `validateMove()`: Foglaltság ellenőrzés, szomszédság vagy azonos gyűrű validáció. Érvénytelen lépésre `IllegalArgumentException`.
- `applyCapture()`: Pozíció nullázása (permanens törlés).

### 🖥️ Frontend Logika (`gameSlice.ts`, `useWebSocket.ts`)
- Redux slice: `phase`, `currentPlayerColor`, `boardState` (24 elemű array, determinisztikus struktúra).
- WebSocket hook: `state_update` eseményre `syncBoard()` dispatch. `player_move` emitálás kattintásra. Reconnection disabled a stabilitás érdekében.

---

## 🔹 4. CI/CD & Infrastruktúra
### 🐳 Docker Compose (`infra/docker-compose.yml`)
- `db`: PostgreSQL 15, adatmappa mountolva.
- `backend`: Spring Boot, `SPRING_JPA_HIBERNATE_DDL_AUTO=validate`, függ `db`-n.
- `frontend`: Vite build, port 3000, függ `backend`-en.

### 🔄 Jenkins Pipeline (`Jenkinsfile`)
1. **Repository Validation**: `frontend/` és `backend/` mappák ellenőrzése.
2. **Frontend Build & Deploy**: `npm install`, `npm run build`, artifact archiválás, `nohup npm start`.
3. **Backend Build & Deploy**: `mvn clean compile package -DskipTests`, JAR archiválás, `nohup mvn spring-boot:run` (port 8081).
4. **Post-Deployment Verification**: Health-check curl localhost:8081 és :3000. Naplózás `frontend.log`/`backend.log`.

---

## 🔹 5. QA Tesztelési Eredmények & Hibajegyzék
**Státusz:** `RETURNED FOR RESOLUTION`  
**Ellenőrzés eredménye:** Konfigurációs fájlok (`package.json`, `pom.xml`) jelen vannak, de protokoll- és típusbiztonsági eltérések blokkolják az élesítést.

| Kód helye | Megfigyelt hiba/törés | Hatás / Kockázat | Javítási követelmény |
|-----------|----------------------|------------------|----------------------|
| `frontend/src/hooks/useWebSocket.ts` vs `backend/.../WebSocketConfig.java` | Frontend: `socket.io-client`. Backend: STOMP/SockJS broker. Nincs kliens illesztés. | WebSocket kapcsolat sikertelen, state sync nem indul el. | Protokoll-egyeztetés dokumentálása (`docs/protocol_decision.md`). Kliens vagy backend konfiguráció módosítása. |
| `frontend/src/store/gameSlice.ts` → `GameBoard.tsx` import | `RootState` típus nem exportált a slice-ból. | TypeScript fordítási hiba / futásidejű `undefined` state hozzáférés. | Export: `export type RootState = ReturnType<typeof store.getState>;` + megfelelő typestore létrehozása. |
| `frontend/package.json` dependencies | Hiányzik BA specifikáció szerinti UI library és Analytics SDK. | MVP funkcionális hiányosság, telemetriai adatgyűjtés nem teljes. | `@mui/material` (vagy Chakra) + `@google-analytics/data` / `gtag` hozzáadása. |
| `GameBoard.tsx` → `handlePointClick` | Nincs try/catch vagy socket error listener az érvénytelen lépésekre. | Felhasználói élmény törése, láthatatlan hiba, state desync. | Hiba-visszajelzés implementálása (toast/error log) a move dispatch köré. |

---

## 🔹 6. Következő Lépések & Zárás Feltételei
1. **FE/BE Javítások:** Protokoll-egyeztetés dokumentálva, `RootState` export, függőségek kiegészítve, hiba-visszajelzés implementálva. Határidő: Sprint 1 zárás előtt.
2. **QA Végső Ellenőrzés:** Fenti pontok ellenőrzése, `✅ APPROVED` státusz kiadása, konfigurációs fájlok megerősítése.
3. **Zárás Szabály:** `[LEZÁRVA]` csak akkor írható be, ha FE/BE/DevOps kész ÉS QA egyértelműen megerősíti mindkét konfigurációs fájl jelenlétét ÉS a protokoll-típust.
4. **Sprint Review:** Protokoll-döntés és KPI-mérési keretrendszer tapasztalatainak rögzítése.

**Dokumentum verzió:** v1.0  
**Utolsó frissítés dátuma:** [Aktuális dátum]  
**Jogosultság:** Csak tényalapú technikai információk, kódszintű implementációk és validált tesztelési eredmények tartalmazzák. Viták, pszichodinamikai elemzések és motivációs szövegek kiküszöbölésre kerültek.
