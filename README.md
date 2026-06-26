# LLMOps Szimuláció Eredménye

## 🎯 Legutóbbi Üzleti Igény
> kérek egy online malom játékot ami játszható tehát van működő front end es back end is

## 🤖 A Csapat Munkája és a Működés
Ez a kódbázis egy többágenses (Multi-Agent) agilis LLMOps szimuláció végterméke.

## 📂 Projekt Memória (Záró állapot)

### 1. Iteráció:


# Projekt Dokumentáció Frissítés

## 1. Aktuális Projektállapot
- **Státusz:** Felfüggesztve a Sprint-be való továbbítás előtt.
- **Fázis:** Sprint 0 / Architektúra & Metrikai Gerinc fejlesztése (javításra váró állapot).
- **Validálás eredménye:** A jelenlegi implementáció nem felel meg a Definíció of Done (DoD) kritériumainak. A ticket nem továbbítható a következő sprintbe a QA jelentés alapján.

## 2. Üzleti & Technikai Követelmények (Metrikák)
| Mutató | Küszöbérték / Korlát | Mérési Módszer |
|--------|----------------------|----------------|
| `Time-to-First-Move` | ≤ 3 mp | Frontend render tracker |
| Felhasználói hibaarány | `<2% / session` | Eseménykövető middleware |
| `Retention D1` | ≥ 40% | Anonymous ID + batch ingest |
| `Retention D7` | ≥ 25% | Cookie/session-based tracking |
| Monetizációs lépések | ≤ 4 kattintás | UX flow audit |
| Backend P95 válaszidő | ≤ 80ms | API latency monitoring |
| Deploy idő | < 5 perc | CI/CD pipeline timing |
| Hibás release arány | < 1% | Rollback & feature flag audit |

## 3. Architektúra & Stack Döntések
- **Frontend:** Next.js (SSR/SSG), TailwindCSS, lazy loading, statikus generálás game board-hoz.
- **Backend:** Spring Boot 3.x / Java 21, monolit REST API + WebSocket (valós idejű játékhoz).
- **Állapotkezelés:** Eseményvezérelt architektúra, CQRS/Event Sourcing alapú modell. Session-állapot helyi tárolása vagy Redis cache.
- **Infrastruktúra:** Docker konténerizáció (multi-stage build), GitHub Actions / Jenkins pipeline, PostgreSQL adatbázis.
- **Konfiguráció:** Feature flag rendszer a scope-visszavágáshoz. Metrikai küszöbértékek read-only config-ban.

## 4. Kódstruktúra & Implementált Modulok
### 🔹 Frontend (`frontend/`)
| Fájl | Státusz / Specifikáció |
|------|------------------------|
| `package.json` | Next.js ^14.2.0, React ^18.3.0, TailwindCSS ^3.4.0. Verziók jelenleg `^` prefixszel rögzítve. |
| `next.config.mjs` | `reactStrictMode: true`, `output: 'standalone'`, statikus generálás engedélyezve. |
| `src/app/page.tsx` & `GameBoard.tsx` | SVG alapú játékterp, React hooks (`useGameEngine`) állapotkezeléssel. |
| `src/lib/hooks/useGameEngine.ts` | Állapotmenedzsment (board, turn, phase). **Hiányosság:** Nincs implementálva a malomfelismerés és az állapotátmenet-kezelés. |

### 🔹 Backend (`backend/`)
| Fájl | Státusz / Specifikáció |
|------|------------------------|
| `pom.xml` | Spring Boot 3.2.5, Java 21. **Hiányzó starterek:** `spring-boot-starter-websocket`, `redis`, `opentelemetry`, `spring-data-jpa`. |
| `GameController.java` | REST végpontok: `/api/v1/games`, `/move`, `/state`. Jelenlegi implementáció: statikus `Map.of()` stubok, nincs valós session kezelés. |
| `application.yml` | Port 8080, Jackson config, logging. Hiányzó: WebSocket timeout, metric endpoint routing, feature flag beállítások. |

### 🔹 UX/UI Implementáció (HTML/CSS/JS)
- Teljes Malom (Nine Men's Morris) logika és UI implementálva egyetlen HTML fájlban.
- SVG renderelés, állapotkezelés (`state` objektum), lépésnapló, visszavonás funkcióval.
- Animációk: `pulse-glow`, `mill-flash`, `remove-pulse`.
- Metrikai integráció jelenleg hiányzik a frontend kódból.

## 5. CI/CD & Infrastruktúra Konfiguráció
```groovy
pipeline {
    agent any
    stages {
        stage('Frontend Install') { when { expression { fileExists("frontend/package.json") } } steps { sh 'cd frontend && npm install' } }
        stage('Frontend Build')   { when { expression { fileExists("frontend/package.json") } } steps { sh 'cd frontend && npm run build' } }
        stage('Frontend Deploy')  { when { expression { fileExists("frontend/package.json") } } steps { sh 'JENKINS_NODE_COOKIE=dontKillMe nohup npm start > frontend.log 2>&1 &' } }
        
        stage('Backend Compile')  { when { expression { fileExists("backend/pom.xml") } } steps { sh 'cd backend && mvn clean compile -DskipTests' } }
        stage('Backend Package')  { when { expression { fileExists("backend/pom.xml") } } steps { sh 'cd backend && mvn package -DskipTests' } }
        stage('Backend Deploy')   { when { expression { fileExists("backend/pom.xml") } } steps { sh 'JENKINS_NODE_COOKIE=dontKillMe nohup mvn spring-boot:run -Dserver.port=8081 > backend.log 2>&1 &' } }
    }
    post { success { echo "✅ Pipeline stabil." } failure { echo "🛑 Rendszertörés detektálva." } }
}
```
- **Guardok:** `when { expression { fileExists(...) } }` feltételes végrehajtás.
- **Deploy flag:** `JENKINS_NODE_COOKIE=dontKillMe` a folyamat stabilitás biztosítására.

## 6. QA Validálás & Teszteredmények
| Terület | Eredmény | Kritikus Hibák / Hiányosságok |
|---------|----------|-------------------------------|
| Frontend Game Loop | ❌ Nem felel meg | `useGameEngine.ts` kihagyja a malomfelismerést (`mill detection`), ellenfél bábulevétel kényszerítését (`mustRemove` fázis) és teljes állapotátmenet-kezelést. |
| Backend State Mgmt | ❌ Nem felel meg | `GameController.java` statikus stubokat használ. Hiányzik a WebSocket handler, Redis/session támogatás és ütközéskezelési logika. |
| Konfiguráció & Deps | ⚠️ Részleges | `package.json` és `pom.xml` hiányolja a kritikus függőségeket (`ws`, `analytics-sdk`, `websocket`, `redis`). Verziókötelés nem szigorú. |
| Metrikai Integráció | ❌ Nem felel meg | Mock analytics ingest endpoint, feature flag rendszer és automatizált tesztelés (game loop, auth, metric flush) nincs implementálva. |

**Validációs Szabályrendszer:** Ha `Retention D7 < 25%` vagy `P95 > 80ms` → automatikus feature flag disable + backlog return. Nincs „nice-to-have” UI elem, amíg a metrikai pipeline nem stabil.

## 7. Kötelező Javítási Feladatok & Határidők
1. **Frontend Game Loop kiegészítése:** Implementáld a malomfelismerést, az ellenfél bábulevételét és a teljes állapotátmenet-kezelést (`placing` → `moving` → `removing` → `gameover`). Determinisztikus és tesztelhető logika kötelező.
2. **Backend State Management:** Helyettesítsd a `Map.of(...)` stubokat valós session-kontextussal (Redis vagy in-memory state store WebSocket-hez). Implementáld az ütközéskezelést és ping/keep-alive logikát.
3. **Konfiguráció szigorítása:** Rögzítsd a kritikus függőségeket `pom.xml`-ben és `package.json`-ban. Add hozzá: `spring-boot-starter-websocket`, `redis`, `opentelemetry`, `ws`, `analytics-sdk`.
4. **Metrikai integráció:** Generáld le a mockolt analytics ingest endpointot (`/api/internal/metrics`) és a feature flag konfigurációt a scope-visszavágási mechanizmushoz.
5. **Tesztelés & Validálás:** Futtass automatizált teszteket a kritikus útvonalakon (auth, game loop, metric flush). P95 latencia stress test (<80ms) + ütközéskezelési edge case dokumentáció.

**Határidő:** Javított verzió + metrikai validációs jelentés beadása 48 órán belül a Sprint review előkészítéséhez. A projekt csak akkor indul, ha minden elem illeszkedik a szigorú költség- és ROI-keretekbe.

---
### 2. Iteráció:


# Projekt Dokumentáció Frissítés

## 1. Aktuális Projektállapot
- **Státusz:** 🚫 BLOKKOLVA (IT javításra váró állapot)
- **Fázis:** Sprint 0 / Architektúra & Metrikai Gerinc fejlesztése (validálás alatt)
- **Validálás eredménye:** QA audit alapján a ticket nem továbbítható. A `GameStateService.java` placeholder validációja, hiányzó metrikai pipeline és laza függőségkötelés nem felel meg a Definíció of Done (DoD) kritériumainak.

## 2. Üzleti & Technikai Követelmények (Metrikák)
| Mutató | Küszöbérték / Korlát | Mérési Módszer | Triggerek / Scope Visszavágás |
|--------|----------------------|----------------|-------------------------------|
| `Time-to-First-Move` | ≤ 3 mp | Frontend render tracker (`tracker.ts`) | >3s → session error flag + UI fallback |
| Felhasználói hibaarány | `<2% / session` | Eseménykövető middleware | >2% → automatikus feature flag disable |
| `Retention D1` | ≥ 40% | Anonymous ID + batch ingest | <40% → scope rollback trigger |
| `Retention D7` | ≥ 25% | Cookie/session-based tracking | <25% → projekt scope visszavágás backlogba |
| Monetizációs lépések | ≤ 4 kattintás | UX flow audit | N/A (fázis 0) |
| Backend P95 válaszidő | ≤ 80ms | API latency monitoring (500 concurrent session) | >80ms → automatikus scope rollback + stress test kötelező |
| Deploy idő | < 5 perc | CI/CD pipeline timing | N/A |
| Hibás release arány | < 1% | Rollback & feature flag audit | >1% → azonnali deprecation |

## 3. Architektúra & Stack Döntések
- **Frontend:** Next.js ^14.2.0, React ^18.3.0, TailwindCSS ^3.4.0. Determinisztikus állapotgép (`useGameEngine.ts`), WebSocket/REST fallback, optimisztikus frissítés, metrikai ingest middleware (`tracker.ts`, `featureFlags.ts`).
- **Backend:** Spring Boot 3.2.5 / Java 21. Monolit REST API + WebSocket (STOMP/JSR-356). Állapotkezelés: Redis-backed store vagy determinisztikus in-memory tároló session szinkronizációhoz. Timestamp ordering és ütközéskezelési logika kötelező.
- **Infrastruktúra:** Docker konténerizáció (multi-stage build), GitHub Actions / Jenkins pipeline, PostgreSQL audit schema (`game_log`, `metric_snapshots`, `feature_flag_registry`), Redis 7.x (TTL politika, AOF persistence, connection pooling).
- **Konfiguráció:** Szigorú verziókötés (`=` operátor) kötelező. Lockfájlok generálása (`package-lock.json`, `mvn dependency:tree`) és pipeline-ban történő ellenőrzése (`npm ci` / `mvn dependency:verify`). Feature flag rendszer scope-visszavágáshoz read-only config-ban.

## 4. Kódstruktúra & Implementált Modulok
### 🔹 Frontend (`frontend/`)
| Fájl | Státusz / Specifikáció |
|------|------------------------|
| `package.json` | Next.js, React, TailwindCSS jelennek meg. **Hiányosság:** Laza verziókötés (`^`), hiányzó `ws`, `analytics-sdk`. Lockfájl nem generálva. |
| `next.config.mjs` / `tailwind.config.ts` / `globals.css` | SSR/SSG engedélyezve, `output: 'standalone'`, custom animation utilities (`pulse-glow`, `mill-flash`) rögzítve. |
| `src/app/page.tsx` & `GameBoard.tsx` | SVG alapú játékterp, React hooks állapotkezeléssel. **Hiányosság:** Nem integrált metrikai instrumentáció, mock session sync. |
| `src/lib/hooks/useGameEngine.ts` | Állapotmenedzsment (board, turn, phase). **Hiányosság:** React render ciklusok nem determinisztikusak, fázisváltások scope-kezelése hiányos, metrikai middleware-gyel nincs szinkronizálva. |
| `UX Prototype` | Teljes Malom logika és SVG renderelés implementálva egyetlen HTML fájlban (`UX` deliverable). Animációk, állapotkezelés, lépésnapló, visszavonás funkcióval. Frontend integráció szükséges. |

### 🔹 Backend (`backend/`)
| Fájl | Státusz / Specifikáció |
|------|------------------------|
| `pom.xml` | Spring Boot 3.2.5, Java 21. Starterek: `spring-boot-starter-websocket`, `validation`. **Hiányzó:** `redis-spring-data-jpa`, `opentelemetry`, `analytics-sdk`. Verziókötés laza. |
| `GameController.java` | REST végpontok: `/api/v1/games`, `/move`, `/state`. Implementáció jelenleg működik, de ütközéskezelési logika hiányos. |
| `GameStateService.java` | In-memory `ConcurrentHashMap` session tároló. **Kritikus hiba:** `validateAndApplyMove()` metódus placeholderrel (`boolean isValid = true;`) ugrálja át a szabályvalidációt. Hiányzó Redis/session szinkronizáció és auditálható állapotáramlás. |
| `GameWebSocketHandler.java` | Session menedzsment, ping/keep-alive mock implementáció. Csak ACK üzeneteket küld, nem kommunikál közvetlenül a `GameStateService`-szel. |
| `application.yml` | Port 8081, Jackson config, logging. Hiányzó: WebSocket timeout, metric endpoint routing, feature flag beállítások. |

### 🔹 UX/UI Implementáció (HTML/CSS/JS)
- Teljes Malom logika és UI implementálva (`UX` deliverable). SVG renderelés, állapotkezelés (`state` objektum), lépésnapló, visszavonás funkcióval.
- Animációk: `pulse-glow`, `mill-flash`, `remove-pulse`.
- Metrikai integráció jelenleg hiányzik a frontend kódból; mock latency és retention adatok jelennek meg.

## 5. CI/CD & Infrastruktúra Konfiguráció
```groovy
pipeline {
    agent any
    tools { nodejs 'Node18'; maven 'Maven3' }
    
    stages {
        stage('Frontend Install') { when { expression { fileExists("frontend/package.json") } } steps { sh 'cd frontend && npm ci --no-audit' } }
        stage('Frontend Build')   { when { expression { fileExists("frontend/package.json") } } steps { sh 'cd frontend && npm run build' } }
        stage('Frontend Deploy')  { when { expression { fileExists("frontend/package.json") } } steps { sh 'JENKINS_NODE_COOKIE=dontKillMe nohup npm start > frontend.log 2>&1 &' } }
        
        stage('Backend Verify')   { when { expression { fileExists("backend/pom.xml") } } steps { sh 'cd backend && mvn dependency:verify' } }
        stage('Backend Compile')  { when { expression { fileExists("backend/pom.xml") } } steps { sh 'cd backend && mvn clean compile -DskipTests' } }
        stage('Backend Package')  { when { expression { fileExists("backend/pom.xml") } } steps { sh 'cd backend && mvn package -DskipTests' } }
        stage('Backend Deploy')   { when { expression { fileExists("backend/pom.xml") } } steps { sh 'JENKINS_NODE_COOKIE=dontKillMe nohup mvn spring-boot:run -Dserver.port=8081 > backend.log 2>&1 &' } }
    }
    post { success { echo "✅ Pipeline stabil." } failure { echo "🛑 Rendszertörés detektálva." } }
}
```
- **Guardok:** `when { expression { fileExists(...) } }` feltételes végrehajtás.
- **Deploy flag:** `JENKINS_NODE_COOKIE=dontKillMe` a folyamat stabilitás biztosítására.
- **Frissítés:** `npm install` → `npm ci`, hozzáadva `mvn dependency:verify` lépés a determinisztikus build biztosításához.

## 6. QA Validálás & Teszteredmények
| Terület | Eredmény | Kritikus Hibák / Hiányosságok |
|---------|----------|-------------------------------|
| Frontend Game Loop | ❌ Nem felel meg | `useGameEngine.ts` React state sync nem determinisztikus. Metrikai instrumentáció (`Time-to-First-Move`, session error tracking) hiányzik. E2E tesztelés hálózati ingadozás/ütköző lépések szimulációjával nincs lefuttatva. |
| Backend State Mgmt | ❌ Nem felel meg | `GameStateService.java` placeholder validáció (`boolean isValid = true;`). Hiányzó Redis/session szinkronizáció, ütközéskezelési logika és timestamp ordering. WebSocket handler csak mock ACK-ot küld. |
| Konfiguráció & Deps | ⚠️ Részleges | `package.json` és `pom.xml` laza verziókötést (`^`) tartalmaznak. Lockfájlok hiányoznak, `npm ci` / `mvn dependency:verify` pipeline lépések nincsenek implementálva. |
| Metrikai Integráció | ❌ Nem felel meg | `/api/internal/metrics` endpoint nem létezik. Batch ingest scheduler, feature flag trigger és automatizált tesztelés (game loop, auth, metric flush) hiányzik. P95 stress test (<80ms 500 session mellett) nincs dokumentálva. |

**Validációs Szabályrendszer:** Ha `Retention D7 < 25%` vagy `P95 > 80ms` → automatikus feature flag disable + backlog return. Nincs „nice-to-have” UI elem, amíg a metrikai pipeline nem stabil. A ticket státusza: `🚫 BLOKKOLVA | Visszavárva az IT javításra és QA végleges validációjára`.

## 7. Kötelező Javítási Feladatok & Határidők
1. **Backend State Mgmt:** Helyettesítsd a `boolean isValid = true;` placeholder-t valós ADJ/MILL validációval. Implementáld az ütközéskezelést, timestamp ordering-t és session-állapot szinkronizációt (Redis vagy determinisztikus in-memory store). WebSocket handler-nek közvetlenül kell kommunikálnia a `GameStateService`-szel.
2. **Konfiguráció & Lockfájl Szigorítás:** Rögzítsd a kritikus függőségeket `=` operátorral. Generáld le a lockfájlokat (`package-lock.json`, `mvn dependency:tree`). Frissítsd a pipeline-t `npm ci` és `mvn dependency:verify` lépésekkel a determinisztikus build biztosítására.
3. **Metrikai Pipeline & Feature Flag:** Implementáld a `/api/internal/metrics` endpointot batch ingest schedulerrel. Integráld a frontend tracker-t (`Time-to-First-Move`, session error rate). Állítsd be a scope rollback trigger-t `D7 < 25%` vagy `P95 > 80ms` esetén.
4. **Frontend Játékloop Validálás:** Implementáld a determinisztikus React state menedzsmentet a fázisváltásokhoz (`PLACING → MOVING → REMOVING`). Kösd össze a metrikai middleware-gyel. Futtass E2E teszteket hálózati ingadozás és ütköző lépések szimulációjával.

**Határidő:** Javított verzió + metrikai validációs jelentés beadása 48 órán belül a Sprint review előkészítéséhez. A projekt csak akkor indul, ha minden elem illeszkedik a szigorú költség- és ROI-keretekbe.
