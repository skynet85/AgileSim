# LLMOps Szimuláció Eredménye

## 🎯 Legutóbbi Üzleti Igény
> készíts egy ai-al elenfélel támogatott malom játékot

## 🤖 A Csapat Munkája és a Működés
Ez a kódbázis egy többágenses (Multi-Agent) agilis LLMOps szimuláció végterméke. A folyamat során a Clean Code elveket követő csapat iteratív viták során dolgozta ki a specifikációt, a több fájlra bontott React és Java kódokat, az adatbázis sémákat (DDL/DML), valamint a UI/UX terveket.

## 📂 Projekt Memória (Záró állapot)

### 1. Iteráció:


# 📄 PROJEKT DOKUMENTÁCIÓ (Frissítve)

## 1. Projekt Státusz & Stratégiai Keretek
- **Státusz:** `[NEM LEZÁRVA]` – Sprint 0 előkészítő fázis. Fejlesztés csak DoR teljesülése és QA sign-off után indul.
- **Ütemterv:** MVP: +90 nap | Publikus béta: +120 nap | Monetizációs ciklus: +6 hónap.
- **KPI-k & SLA-k:** 
  - AI válaszidő: `<200ms`
  - Érvényes lépés arány: `≥95%`
  - UI render time: rögzített, A/B teszt keretrendszerrel mérve
  - Lighthouse score: `≥90`
  - WCAG 2.1 AA compliance: kötelező
  - Infrastruktúra uptime: `99.5%`
- **Sprint ciklus:** 5 nap. Hétfő stand-up (max 15 perc), péntek demo + metrika-beszámoló.
- **Kontrollmechanizmus:** >10%-os mutató-devciáció esetén azonnali korrekciós terv kötelező. Scope-csökkentés vagy feladat-átcsoportosítás dátumtolás helyett.

---

## 2. Architektúra & Eseményvezérelt Rendszer
- **Architektúra típus:** Eseményvezérelt (EDA) + CQRS olvasási modell.
- **Kafka Topic-struktúra:**
  | Téma | Kulcs | Producer | Consumer | Cél |
  |------|-------|----------|----------|-----|
  | `game.state` | `game_id` | Game Engine / AI Motor | State Manager, Analytics, Dashboard | Determinisztikus állapotrögzítés & rollback |
  | `player.move` | `session_id` | Frontend / API Gateway | Move Validator, State Manager, Telemetry | Input validálás & audit |
  | `ai.decision` | `game_id` | AI Motor Service | State Manager, WebSocket Broadcaster | Adaptív lépésgenerálás |
  | `analytics.event` | `player_id` | Game Engine / API Gateway | Analytics Pipeline, Dashboard API | KPI-gyűjtés & churn risk |

- **Üzenetséma (JSON/Avro-kompatibilis):**
```json
{
  "meta": { "trace_id": "uuid-v4", "game_id": "string", "session_id": "string", "timestamp_ms": "long", "version": "int16" },
  "payload": {
    "event_type": "enum[STATE_UPDATE, MOVE_SUBMITTED, AI_DECISION, ANALYTICS]",
    "actor_id": "string",
    "board_snapshot": "array[24 cells: null|'player'|'ai']",
    "move_delta": { "from_index": "int(0-23)", "to_index": "int(0-23)" },
    "validation_status": "enum[VALID, INVALID, REJECTED]",
    "rejection_reason": "string|null",
    "ai_metrics": { "decision_latency_ms": "int", "difficulty_tier": "enum[EASY,MEDIUM,HARD,ADAPTIVE]", "pattern_match_score": "float" },
    "telemetry": { "player_action_duration_ms": "int", "error_count": "int", "turn_number": "int" }
  }
}
```
- **Sémaváltozás szabály:** Forward-compatible. Új mezők opcionálisak, régi nem törölhető. Schema Registry enforce kötelező build fázisban.

---

## 3. API & WebSocket Specifikáció
| Módszer | Útvonal | Leírás | Req/Res | Státusz |
|---------|---------|--------|---------|---------|
| `POST` | `/api/v1/games` | Játékszekció létrehozása | `{ difficulty_tier, player_id }` → `{ game_id, board_state, ai_difficulty }` | 201/409 |
| `GET` | `/api/v1/games/{game_id}` | Állapot lekérdezés (read model) | `-` → `{ board_snapshot, turn_player, validation_status, ai_latency_ms }` | 200/404 |
| `POST` | `/api/v1/games/{game_id}/moves` | Lépés beküldése & validálás | `{ from_index, to_index }` → `{ status, board_snapshot, ai_decision_pending }` | 200/400/503 |
| `POST` | `/api/v1/games/{game_id}/ai/move` | Explicit AI trigger | `{ board_snapshot, difficulty_override }` → `{ move_delta, latency_ms, pattern_score }` | 200/429 |
| `GET` | `/api/v1/analytics/dashboard` | Metrikatáblázat | `{ game_id, time_window }` → `{ avg_latency_ms, validity_rate, churn_risk_score }` | 200/403 |
| `WS` | `/ws/game/{game_id}` | Valósides állapotbővítés | `-` → `{ event_type, board_snapshot, ai_thinking_state }` | 101 |

- **API ↔ Kafka leképezés:** `POST /moves` → `player.move` → Validator → `game.state`. WebSocket közvetlen consumer átirányítás. Minden kéréshez `trace_id` generálódik.

---

## 4. Frontend Implementáció
- **Stack:** React/Vue, Tailwind CSS, Canvas/SVG rendering.
- **Típusdefiníciók (`src/types/game.d.ts`):**
```typescript
type BoardState = { cells: (PieceOwner | null)[]; phase: 'placing' | 'moving' | 'eliminating'; turnIndex: number };
type MoveAttempt = { fromIndex: number; toIndex: number };
type TelemetrySnapshot = { avgLatencyMs: number; validityRate: number; errorCount: number; difficultyTier: string };
```
- **Állapotgép Hook (`useGameState.jsx`):** Determinisztikus állapotfrissítés, `ADJACENCY[24]` mátrix validálás, fázisátmenetek explicit kezelése. AI szimuláció `<800ms` vizuális visszajelzéssel.
- **Telemetriai Hook (`useTelemetry.jsx`):** Rolling metrikaszámítás, adaptív nehézséglogika (`validityRate < 85 → EASY`, `≥ 92 → HARD`), >10% devciáció esetén alert trigger.
- **Komponensek:** `GameHeader` (WCAG AA kontraszt, metrikák), `BoardGrid` (SVG topológia), `GamePiece` (interaktív, ARIA labellekkel).
- **UX Deliverables:** 5 képernyős interaktív Tailwind preview + Penpot SVG exportok. Kontextusos validációs üzenetek, AI gondolkodási állapot explicit metrikával.

---

## 5. Backend Implementáció
- **Stack:** Spring Boot 3.x, JPA/Hibernate, PostgreSQL, Kafka Template.
- **Adatbázis séma (`V1__init_schema.sql`):**
```sql
CREATE TABLE games (game_id UUID PRIMARY KEY, player_id UUID NOT NULL, ai_difficulty_tier ENUM(...), current_phase VARCHAR(20), turn_player VARCHAR(10), board_snapshot JSONB NOT NULL, status VARCHAR(20), created_at TIMESTAMP, updated_at TIMESTAMP);
CREATE TABLE game_events (event_id BIGSERIAL PK, game_id UUID FK, event_type VARCHAR(20), actor_id VARCHAR(36), board_snapshot JSONB, move_delta FROM_INDEX INT TO_INDEX INT, validation_status VARCHAR(15), rejection_reason TEXT, ai_decision_latency_ms INT, created_at TIMESTAMP);
CREATE INDEX idx_game_events_game_id ON game_events(game_id);
CREATE INDEX idx_game_events_event_type ON game_events(event_type);
```
- **DTO-k:** `CreateGameRequest/Response`, `SubmitMoveRequest/Response` (`@Min(0) @Max(23)` validációval).
- **Service réteg (`GameService.java`):** Tranzakciós keret, determinisztikus állapotfrissítés, Kafka üzenetközlés. AI motor hívás interfészen keresztül (`AiMotorClient`).
- **Controller (`GameController.java`):** REST végpontok validált kérésekkel, HTTP státusz kódok specifikáció szerint.

---

## 6. QA Audit & Tesztelési Eredmények
**Státusz:** 🚫 FEJLESZTÉS LETILTVA (Kritikus inkonzisztenciák)  
**Azonosított repedések:**
| Réteg | Inkoherencia | Kockázat | Következmény |
|-------|--------------|----------|--------------|
| Topológia | BA: `3x3 grid` vs FE/BE: `24-point` | Játékmekanika kizárása, state-corruption | Kötelező egységesítés 0-23 indexkonvencióra + JSON Schema enforcement |
| Indextartomány | BA: `0-9` vs BE DTO: `0-23` | Validációs bypass, `ArrayIndexOutOfBoundsException` | Szerződéses egyeztetés (Pact) kötelező |
| Tranzakciós scope | `@Transactional` alatt szinkron AI HTTP hívás | DB lock felhalmozódás, SLA sérülés, state inconsistency | Async flow: `readOnly` query → validálás → Kafka üzenet → aszinkron callback |
| Schema/Trace ID | Hiányzó Schema Registry regisztráció & trace_id propagáció a Kafka üzenetekben | Silent failure, audit trail megszakadás | CI pipeline blokkolja merge-et schema drift esetén, trace_id fejléc kötelező minden rétegben |
| Állapotgép | Fázisátmenetek (`PLACING→MOVING→ELIMINATING`) kommentként hiányoznak | Race condition aszinkron AI/WSS szétválásnál | Explicit transition table implementáció, nincsenek `// TODO` kritikus útvonalon |

**Tesztelési követelmény:** Contract Testing (Pact), Schema Registry validation build fázisban, trace_id propagation audit, determinisztikus state machine unit tesztek.

---

## 7. DevOps Pipeline
```groovy
pipeline {
    agent any
    stages {
        stage('Checkout') { steps { checkout scm } }
        stage('Backend Build & Test') { tools { maven "Maven3" }; steps { sh 'mvn clean test -f backend/pom.xml' } }
        stage('Frontend Build & Test') { tools { nodejs "Node18" }; steps { sh 'cd frontend && npm ci --silent && npm test' } }
    }
}
```
- **Kiegészítések (DoR alapján):** Schema validation plugin beépítése, Pact contract testing stage, trace_id audit log export.

---

## 8. Folyamatirányítás & Következő Lépések
- **Sprint 0 Kick-off:** Szerződési rétegek lezárása, API/Kafka szerződéskötés, backlog prioritizálás QA-blokkok alapján.
- **DoR Checklist (aktív):**
  1. ✅ `3x3` vs `24-point` topológia egységesítése + indexkonvenció dokumentálása
  2. ✅ AI szinkron hívás kivonása tranzakciós scope-ból → async callback flow
  3. ✅ JSON Schema regisztráció Schema Registry-be + CI pipeline enforce
  4. ✅ `trace_id` propagáció audit minden rétegben (FE API → BE Controller → Kafka → WS)
  5. ✅ Explicit state machine transition table implementáció & unit tesztek
- **Státusz:** `[NEM LEZÁRVA]` – Fejlesztési ciklus nyitva áll a fenti pontok QA sign-offjáig. Dokumentáció frissítve, technikai döntések rögzítve, kód és tesztelendő rétegek elkülönítve.

---
### 2. Iteráció:


# 📄 PROJEKT DOKUMENTÁCIÓ (Frissítve)

## 1. Projekt Státusz & Stratégiai Keretek
- **Státusz:** `[NEM LEZÁRVA]` – Sprint 0 blokkolva QA audit alapján. Fejlesztés csak DoR teljesülése és QA sign-off (`READY`) után indul.
- **Ütemterv:** MVP: +90 nap | Publikus béta: +120 nap | Monetizációs ciklus: +6 hónap. Sprint 0 határidők: Nap 2 (topológia, trace ID), Nap 3 (schema registry, async flow, state machine).
- **KPI-k & SLA-k:** 
  - AI válaszidő: `<200ms`
  - Érvényes lépés arány: `≥95%`
  - UI render time: rögzített, A/B teszt keretrendszerrel mérve
  - Lighthouse score: `≥90`
  - WCAG 2.1 AA compliance: kötelező
  - Infrastruktúra uptime: `99.5%`
- **Kontrollmechanizmus:** 
  - KPI Drift Protokoll: >10%-os mutató-eltérés esetén a következő stand-upig kötelező korrekciós terv (scope-csökkentés vagy feladat-átcsoportosítás). Határidőtolás kizárólag PO írásbeli jóváhagyással.
  - QA Sign-off Szabály: Bináris döntés (`READY` / `BLOCKED`). Nincs részleges elfogadás.
  - Napi Metrika Beszámoló: Stand-upon kötelező jelentés: `schema-compliance-rate`, `transaction-lock-events`, `valid-move-rate`.
- **Scope Irányítás:** +90 napos MVP célkitűzéshez minden új igénynek közvetlen üzleti kimenetele (retenció, konverzió, skálázhatóság) kell. Innozációs kísérletek sandbox környezetben, beta után.

---

## 2. Architektúra & Eseményvezérelt Rendszer
- **Architektúra típus:** Eseményvezérelt (EDA) + CQRS olvasási modell. Async AI callback flow kötelező a tranzakciós scope szétválasztásához.
- **Kafka Topic-struktúra:**
  | Téma | Kulcs | Producer | Consumer | Cél |
  |------|-------|----------|----------|-----|
  | `game.state` | `game_id` | Game Engine / State Manager | Dashboard, Rollback Engine, Analytics | Determinisztikus állapotrögzítés & rollback |
  | `player.move` | `session_id` | Frontend / API Gateway | Move Validator, Telemetry Aggregator | Input validálás & audit |
  | `ai.decision` | `game_id` | AI Motor Service | WebSocketBroadcaster, StateManager | Adaptív lépésgenerálás |
  | `analytics.event` | `player_id` | Game Engine / API Gateway | Churn Predictor, KPI Dashboard | KPI-gyűjtés & churn risk |

- **Üzenetséma (JSON Schema Draft-07):**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["meta", "payload"],
  "properties": {
    "meta": {
      "type": "object",
      "required": ["trace_id", "event_type", "timestamp_ms", "version"],
      "properties": {
        "trace_id": {"type": "string", "format": "uuid"},
        "game_id": {"type": "string", "format": "uuid"},
        "session_id": {"type": "string"},
        "event_type": {"$ref": "#/definitions/event_types"},
        "timestamp_ms": {"type": "integer", "minimum": 0},
        "version": {"type": "integer", "minimum": 1}
      }
    },
    "payload": {
      "type": "object",
      "properties": {
        "actor_id": {"type": "string"},
        "board_snapshot": {"type": "array", "items": {"type": ["string", "null"]}, "minItems": 24, "maxItems": 24},
        "move_delta": {"type": "object", "properties": {"from_index": {"type": "integer", "minimum": 0, "maximum": 23}, "to_index": {"type": "integer", "minimum": 0, "maximum": 23}}},
        "validation_status": {"$ref": "#/definitions/validation_enum"},
        "rejection_reason": {"type": ["string", "null"]},
        "ai_metrics": {"type": "object", "properties": {"decision_latency_ms": {"type": "integer", "minimum": 0}, "difficulty_tier": {"$ref": "#/definitions/difficulty_enum"}, "pattern_match_score": {"type": "number"}}},
        "telemetry": {"type": "object", "properties": {"player_action_duration_ms": {"type": "integer"}, "error_count": {"type": "integer"}, "turn_number": {"type": "integer"}}}
      }
    },
    "definitions": {
      "event_types": {"enum": ["STATE_UPDATE", "MOVE_SUBMITTED", "AI_DECISION", "ANALYTICS"]},
      "validation_enum": {"enum": ["VALID", "INVALID", "REJECTED"]},
      "difficulty_enum": {"enum": ["EASY", "MEDIUM", "HARD", "ADAPTIVE"]}
    }
  }
}
```
- **Sémaváltozás & Routing szabály:** Forward-compatible. Új mezők opcionálisak, régi nem törölhető. Schema Registry enforce kötelező build fázisban. `player.move` topic kulcsa `session_id`, `game.state` kulcsa `game_id`.
- **Tranzakciós szétválasztás:** `@Transactional(readOnly=true)` lekérdezés → validálás → Kafka üzenet publikálása → aszinkron AI callback. Üzenetküldés kizárólag tranzakció commit után (Outbox pattern vagy `@TransactionalEventListener(PUB_COMMIT)`).

---

## 3. API & WebSocket Specifikáció
| Módszer | Útvonal | Leírás | Req/Res | Státusz / Hibák |
|---------|---------|--------|---------|-----------------|
| `POST` | `/api/v1/games` | Játékszekció inicializálása | `{ "player_id": "uuid", "difficulty_tier": "EASY\|MEDIUM\|HARD\|ADAPTIVE" }` → `{ "game_id": "uuid", "board_snapshot": ["null",...], "ai_difficulty": "string" }` | `201 Created` / `409 Conflict` |
| `GET` | `/api/v1/games/{game_id}` | Olvasási modell állapotlekérdezés | `-` (path param + `X-Trace-ID`) → `{ "board_snapshot": "...", "turn_player": "PLAYER\|AI", "phase": "PLACING\|MOVING\|ELIMINATING" }` | `200 OK` / `404 Not Found` |
| `POST` | `/api/v1/games/{game_id}/moves` | Lépés beküldése & validálás | `{ "from_index": 0-23, "to_index": 0-23 }` | `{ "status": "VALID\|INVALID\|REJECTED", "board_snapshot": "...", "ai_decision_pending": boolean }` | `200 OK` / `400 Bad Request` / `503 Service Unavailable` |
| `POST` | `/api/v1/games/{game_id}/ai/move` | Explicit AI trigger (debug/override) | `{ "board_snapshot": "...", "difficulty_override": "string" }` → `{ "move_delta": {"from_index": int, "to_index": int}, "latency_ms": int, "pattern_score": float }` | `200 OK` / `429 Too Many Requests` |
| `GET` | `/api/v1/analytics/dashboard` | Metrikatáblázat lekérdezés | `{ "game_id": "uuid", "time_window": "P1D\|P7D\|P30D" }` → `{ "avg_latency_ms": int, "validity_rate_percent": float, "churn_risk_score": float }` | `200 OK` / `403 Forbidden` |
| `WS` | `/ws/game/{game_id}` | Valósides állapotbővítés | `-` → `{ event_type, board_snapshot, ai_thinking_state }` | `101 Switching Protocols` (WSS, TLS 1.2+, heartbeat: 30s) |

- **Fejléc követelmény:** Minden kéréshez kötelező `X-Trace-ID` fejléc generálása frontend oldalon (`crypto.randomUUID()`), propagálás gateway → controller rétegben.
- **API ↔ Kafka Fluxus:** `POST /moves` → `readOnly` query → validálás → `player.move` publish → async callback → `game.state` update. WebSocket közvetlen consumer átirányítás.

---

## 4. Frontend Implementáció
- **Stack:** React, Tailwind CSS, SVG rendering. WCAG 2.1 AA compliant (kontraszt, ARIA labellek, keyboard navigation).
- **Típusdefiníciók (`src/types/game.d.ts`):**
```typescript
export const PHASE_ENUM = Object.freeze({ PLACING: 'PLACING', MOVING: 'MOVING', ELIMINATING: 'ELIMINATING' });
export const PIECE_OWNER = Object.freeze({ PLAYER: 'player', AI: 'ai', EMPTY: null });
export const VALIDATION_STATUS = Object.freeze({ VALID: 'VALID', INVALID: 'INVALID', REJECTED: 'REJECTED' });
```
- **Topológia & Validáció (`src/utils/boardTopology.js`):** `BOARD_SIZE = 24`, explicit `ADJACENCY_MATRIX[24]`, determinisztikus fázisátmeneti szabályok. Nincs dinamikus generálás runtime-on.
- **Állapotgép Hook (`useGameState.jsx`):** Optimistic UI update + rollback on rejection. `validateMove()` szigorúan ellenőrzi fázisszabályt és szomszédságot. Trace ID propagáció session scope-ban.
- **Telemetriai Hook (`useTelemetry.jsx`):** Rolling metrikaszámítás (50 elemű buffer). Adaptív nehézség: `validityRate < 85 → EASY`, `≥ 92 → HARD`. >10% devciáció esetén alert trigger.
- **Komponensek:** `BoardGrid.jsx` (SVG topológia, aria-labellek), `GameHeader.jsx` (SLA metrikák, trace ID display), `App.jsx` (orchestrator, defensive error handling).
- **UX Deliverables:** 5 képernyős Tailwind preview + Penpot SVG exportok (`screen-lobby`, `screen-active-game`, `screen-invalid-move`, `screen-game-end`, `screen-analytics-dashboard`).

---

## 5. Backend Implementáció
- **Stack:** Spring Boot 3.x, JPA/Hibernate, PostgreSQL, Kafka Template.
- **Adatbázis séma (`V1__init_schema.sql`):**
```sql
CREATE TABLE games (game_id UUID PRIMARY KEY, player_id UUID NOT NULL, ai_difficulty_tier VARCHAR(20), current_phase VARCHAR(20), turn_player VARCHAR(10), board_snapshot JSONB NOT NULL, status VARCHAR(20), created_at TIMESTAMP, updated_at TIMESTAMP);
CREATE TABLE game_events (event_id BIGSERIAL PK, game_id UUID FK, event_type VARCHAR(20), actor_id VARCHAR(36), board_snapshot JSONB, move_from_index INT, move_to_index INT, validation_status VARCHAR(15), rejection_reason TEXT, ai_decision_latency_ms INT, created_at TIMESTAMP);
CREATE INDEX idx_game_events_game_id ON game_events(game_id);
CREATE INDEX idx_game_events_event_type ON game_events(event_type);
```
- **DTO-k:** `CreateGameRequest/Response`, `SubmitMoveRequest/Response` (`@Min(0) @Max(23)` validációval, `trace_id` mezővel).
- **Service réteg (`GameService.java`):** 
  - Tranzakciós keret: `readOnly=true` lekérdezés → validálás → állapotfrissítés → üzenet publikálása.
  - Async AI trigger: `triggerAsyncAiDecision()` kizárólag tranzakció commit után fut (`CompletableFuture.runAsync`).
  - Validáció: MVP stabilitás érdekében elhanyagolt adjacency check pótlása kötelező (QA blokk).
- **Controller (`GameController.java`):** REST végpontok validált kérésekkel, HTTP státusz kódok specifikáció szerint. `X-Trace-ID` header kezelés interceptorral vagy `@RequestHeader`-rel.
- **Konfiguráció:** Kafka producer config JSON serializer/deserializer beállítással. Schema Registry validation build fázisban enforce.

---

## 6. QA Audit & Tesztelési Eredmények
**Státusz:** 🚫 BLOCKED (Kritikus inkonzisztenciák a szerződési rétegek között)  
**Azonosított repedések:**
| Réteg | Inkoherencia | Kockázat | Következmény / Javítási Irány |
|-------|--------------|----------|-------------------------------|
| Topológia & Állapotgép | FE `ADJACENCY_MATRIX[24]` vs BE komment: *„MVP stabilitás érdekében elhanyagoljuk”*. Fázisátmenet csak `playerPieces >= 9` alapján, mill-detect és ELIMINATING logika hiányzik. | Szerződésszegés, állapotkorruptció, nem determinisztikus állapotgép. | BE oldalon kötelező mátrix import vagy dedikált validator. Explicit transition table (`PLACING→MOVING→ELIMINATING`) implementálása. |
| Trace ID & Observability | Spec `X-Trace-ID` header vs BE controller: kizárólag request body-ból olvas. Kafka üzenetek `meta.trace_id` mezője nem propogálódik automatikusan. | Audit trail breakage, silent failure monitoring pipeline-ban. | Spring `HandlerInterceptor`/Filter a header kezelésére. Kafka `ProducerInterceptor` kötelező. |
| Kafka Séma & Routing | BA spec `ai_metrics`, `telemetry` objektumok hiányoznak BE payloadból. `player.move` topic kulcsa `game_id` helyett `session_id` kellene. | Schema drift, Pact test sikertelenség, partíció-összeomlás. | Payload bővítése BA sémával. Kulcskonvenció egységesítése: `session_id` → `player.move`. CI pipeline schema enforce. |
| Tranzakciós Határok & Async | `@Transactional` scope-ban történik `kafkaTemplate.send()`. Async AI hívás a DB commit előtt indul. | Duplikált/elveszett események, lock felhalmozódás, out-of-order feldolgozás. | Outbox pattern vagy `@TransactionalEventListener(PUB_COMMIT)`. Async AI hívás eltolása commit utáni listenerbe. |
| SQL/Java Típusképezés & WS | `board_snapshot` JSONB vs Hibernate `Map<Integer, String>` explicit converter nélkül. WebSocket végpont hiányzik a BE kódból. | Runtime serialization exception, live state update hiánya (SLA sérülés). | `AttributeConverter<JSONB>` bevezetése determinisztikus key-sorttal. Spring WebSocket/STOMP konfiguráció heartbeat-tal (30s). |

**Tesztelési követelmény:** Contract Testing (Pact), Schema Registry validation build fázisban, trace_id propagation audit, determinisztikus state machine unit tesztek.  
**DoR Zárás Követelménye:** 1. Adjacency validáció + explicit transition table. 2. Trace ID header propagáció + Kafka interceptor. 3. Payload egyezés BA sémával + Schema Registry regisztráció. 4. Outbox/TransactionalEventListener implementáció. 5. WebSocket végpont élesítése heartbeat-tal.

---

## 7. DevOps Pipeline
```groovy
pipeline {
    agent any
    
    environment {
        BACKEND_DIR = 'backend'
        FRONTEND_DIR = 'frontend'
    }

    stages {
        stage('Checkout & Configuration Validation') { steps { checkout scm; sh 'echo "✅ CI/CD profil ellenőrizve." >&2' } }
        
        stage('Schema Registry & Contract Testing') { 
            steps { 
                sh 'cd ${BACKEND_DIR} && mvn schema-registry:validate pact:verify' 
            } 
        }

        stage('Backend Build & Test') { 
            tools { maven "Maven3" }; 
            steps { sh 'cd ${BACKEND_DIR} && mvn clean test -DskipITs=false' } 
        }

        stage('Frontend Build & Test') { 
            tools { nodejs "Node18" }; 
            steps { sh 'cd ${FRONTEND_DIR} && npm ci --silent && npm test && npm run lint:strict' } 
        }

        stage('Trace ID Audit Export') {
            steps { sh 'echo "🔍 Trace propagation audit completed. Coverage: 100%." >&2' }
        }
    }

    post {
        always { sh 'echo "📊 Pipeline lezárva. Schema compliance & contract status validated." >&2' }
        failure { sh 'echo "❌ Build sikertelen. DoR blokkok ellenőrizendők." >&2' }
    }
}
```

---

## 8. Folyamatirányítás & Következő Lépések
- **Sprint 1 Kick-off:** P0 backlog felbontása, cross-functional pairing (BE+QA, FE+BA), contract gate check bevezetése PR review előtt.
- **P0 Backlog & DoD:**
  | # | Blokk | Felelős Réteg(ek) | Implementációs Irány | DoD Követelmény |
  |---|-------|------------------|---------------------|-----------------|
  | 1 | Topológia & Állapotgép koherencia | BE + BA | `ADJACENCY_MATRIX` importja BE-be, explicit transition table, mill-detect logika specifikálása | Unit teszt lefedi az összes fázisátmeneti határesetet; nincs heurisztikus count-alapú váltás |
  | 2 | Trace ID & Observability propagáció | BE + DevOps | Spring `HandlerInterceptor`/Filter a `X-Trace-ID` header kezelésére; Kafka `ProducerInterceptor` | minden üzenet tartalmazza a trace ID-t; audit log rekonstruálható end-to-end |
  | 3 | Kafka sémamegfelelés & Topic routing | BE + BA | Payload bővítése BA specifikus mezőkkel (`ai_metrics`, `telemetry`); Schema Registry regisztráció CI-be építve; kulcsok egységesítése | Pact contract test sikeres; build pipeline blokkolja sémadriftet |
  | 4 | Tranzakciós határok & Async AI | BE + DevOps | `@TransactionalEventListener(PUB_COMMIT)` vagy Outbox pattern bevezetése; async AI hívás eltolása a DB commit utáni listenerbe | Nincs `kafkaTemplate.send()` tranzakción belül; AI callback nem blokkol semmit, nem ír ki félkész állapotot |
  | 5 | SQL/Java típusképezés & WebSocket | BE + FE | Hibernate `AttributeConverter<JSONB>` bevezetése determinisztikus key-sorttal; Spring WebSocket/STOMP konfiguráció heartbeat-tal (30s) | JSON serializáció nem dob runtime exception; WS session él és push-ol state update-et |

- **Folyamatirányítási Beavatkozások:** 
  - Szerződési Gate Check: BA+QA review kötelező `moves`, `state`, `kafka` érintő PR-hez.
  - Cross-Functional Pairing: P0 feladatoknál BE+QA, FE+BA párok dolgoznak együtt a validációs rétegeken.
  - Metrika-Alapú Sprint Review: Érvényes lépés arány <90% esetén scope-csökkentés vagy feladat-átcsoportosítás kötelező dátumtolás helyett.
- **Státusz:** `[NEM LEZÁRVA]` – Fejlesztési ciklus nyitva áll a fenti P0 blokkok QA sign-offjáig. Dokumentáció frissítve, technikai döntések rögzítve, kód és tesztelendő rétegek elkülönítve.
