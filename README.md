# LLMOps Szimuláció Eredménye

## 🎯 Legutóbbi Üzleti Igény
> kérek egy működő online malom játékot

## 🤖 A Csapat Munkája és a Működés
Ez a kódbázis egy többágenses (Multi-Agent) agilis LLMOps szimuláció végterméke.

## 📂 Projekt Memória (Záró állapot)

### 1. Iteráció:


# 📄 Projekt Dokumentáció Frissítés – Online Malom Játék (MVP)
**Dátum:** 2024-05-20  
**Státusz:** ⏳ Feltételesen Nyitott / Felelősség-átvevő Iteráció  

---

## 1. Üzleti Metrikák & Sikerküszöbök (Validálási Keret)
- **CAC / LTV arány:** ≤ 1:3 (első 90 napos futtatás alapján)
- **Megtartási görbe:** D7 ≥ 25%, D30 ≥ 12% (organikus + paid cohortok átlaga)
- **Átlagos ülésidő & fordulatszám:** ≥ 8 perc/ülés, min. 2 játék/szession
- **Konverziós funnel:** Regisztráció → első match → fizetés/monetizáció ≥ 4.5%
- **Operatív hatékonyság:** Server latency < 120ms, crash rate < 0.3%, build-to-deploy idő ≤ 4 óra

---

## 2. Architektúra & Komponens Térkép (Fájlstruktúra)
A rendszer interdependens rétegekre bontva, az MVP scope-hoz igazítva:
- **Frontend:** `frontend/package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
  - `src/main.tsx`, `App.tsx`, `index.css` (React 18, TypeScript, Tailwind)
  - `hooks/useGameLogic.ts` (lokális state management, játéklogika, mill detektálás, dobásmechanika)
  - `components/GameBoard.tsx` (UI renderelés, pontkattintások kezelése, fáziskezelés)
- **Backend:** `backend/pom.xml`, `application.yml`
  - `MalmoApplication.java` (Spring Boot 3.2.1 alap)
  - `engine/NineMensMorrisEngine.java` (FSM állapotgép, szabályvalidáció, szinkronizáció)
  - `controller/GameController.java` (REST API: `/game/create`, `/state/{id}`, `/move/{id}`)
- **Adatbázis & DevOps:** H2 in-memory (JPA/Hibernate), Actuator/Prometheus metrikák, Docker alap, GitHub Actions CI/CD váz.

---

## 3. Kódbázis Implementációs Állapot
- **Játéklogika:** 24 pontos tábla topológia megvalósítva. Fázisok: `PLACING`, `MOVING`, `REMOVING`, `FINISHED`.
- **Adjacencia & Mill definíciók:** Explicit listák (`ADJ_FULL`, `MILL_LINES_FINAL`) használata a validáláshoz.
- **Dobásmechanika:** Véletlenszám-generátor (RNG) implementálva, kettős esetén 4 lépés kiosztása. Audit trail rögzítése a játéknaplóban.
- **UI/UX:** Reszponzív layout, animált dobókocka, állapotjelzők, undo funkció, győzelmi modal és konfetti effektus integrálva.
- **API Kontraktusok:** REST endpointok definiálva, JSON state szinkronizációra optimalizálva.

---

## 4. QA Tesztelési Eredmények & Találatok
✅ **Konfigurációs Szűrő:** `frontend/package.json` és `backend/pom.xml` érvényes, függőségek deklarálva.  
⚠️ **Szinkronizáció:** Frontend lokális state-et kezel (`useGameLogic.ts`). A `socket.io-client` importálva, de backend integráció hiányzik (online funkció nem aktív).  
⚠️ **Konkurencia-kezelés:** Backend engine-ben redundáns zárolás észlelve: `synchronized` kulcsszó + `ReentrantLock`. Ez deadlock kockázatot növel, felesleges overheaddel terheli a futási időt.  
⚠️ **Topológia Validáció:** SVG égrajzoló logikája index-alapú matematikai kalkuláción alapul (`j === i + 1 || j === i + 7...`), ami nem garantálja a tényleges szomszédságot. Határeseteknél érvénytelen lépéseket vagy "ragadt" darabokat eredményezhet.  
⚠️ **Skóp Eltérés:** A projekt "Online" megnevezése technikai tartalom nélkül jelenleg csak lokális MVP-t takar. A felelősségi határok explicit lefektetése szükséges.

---

## 5. CI/CD Pipeline Konfiguráció
- **Eszközök:** Jenkins Declarative Pipeline, Maven 3, Node 18.
- **Jelenlegi konfiguráció:** 
  - Backend: `mvn clean package -DskipTests`, háttérprocessz indítás (`nohup mvn spring-boot:run`).
  - Frontend: `npm install`, `npm run build`, háttérprocessz indítás (`nohup npm start`).
- **Metrikakövetés:** Pipeline logokba integrált metrika-kijelentések a fordítási és deploy fázisokhoz.

---

## 6. Technikai Döntések & Következmények (Lezárás Feltételei)
A ticket lezárása csak az alábbi technikai javítások implementálása után engedélyezett:
1. **Skóp-Egyezmény:** Explicit jelölés: `Offline/MVP` vagy `Online/Multiplayer`. Online esetén a `socket.io-client` és `GameWebSocketController.java` integrálása kötelező.
2. **Konkurencia-kezelés tisztázása:** Redundáns lock eltávolítása (`synchronized` VAGY `ReentrantLock`). Párhuzamosság kezelése állapotverziós ellenőrzéssel (CAS) vagy üzenetsor-alapú sorosítással.
3. **Topológia & Validáció:** Index-alapú égrajzoló logika cseréje explicit adjacency mátrixra/edge list-re a determinisztikus szomszédság-garanciáért.
4. **API Dokumentáció:** `/game/create`, `/state/{id}`, `/move/{id}` kontraktusok dokumentálása a frontend/backend szakadék elkerülésére.
5. **Pipeline Integritás:** Tesztek visszaállítása (`mvn test && npm run test`). `nohup` háttérprocessz helyett Docker konténerizálás + healthcheck implementálása.

---

## 7. Jelenlegi Státusz
⏳ **Feltételesen Nyitott / Felelősség-átvevő Iteráció**  
A dokumentáció és kódbázis frissítve a fenti technikai specifikációk szerint. A lezárás várható a QA explicit jóváhagyása után, az integrált WebSocket validálás és a pipeline tesztelési réteg visszaállítása mellett. Minden további fejlesztési lépés a megadott metrikai küszöbértékekhez való konvergenciát kell, hogy szolgálja.  

*(Dokumentáció generálva: Precíz Szoftverfejlesztési Adminisztrátor)*

---
### 2. Iteráció:


# 📄 Projekt Dokumentáció Frissítés – Online Malom Játék (MVP)
**Dátum:** 2024-05-21  
**Státusz:** 🔴 VISSZADOBVA | Korrekció & Validáció Várva  

---

## 1. Üzleti Metrikák & Sikerküszöbök (Validálási Keret)
- **Megtartás & Konverzió:** D7 ≥ 25%, D30 ≥ 12%, Regisztráció → fizetés funnel ≥ 4.5%
- **Teljesítményküszöbök:** Server latency ≤ 80ms, WebSocket handshake < 150ms, crash rate < 0.1%, build-to-deploy idő ≤ 2 óra
- **Minőségi Mutatók:** Unit/Integration test coverage ≥ 85%, rollback idő < 3 perc
- **Skálázhatóság:** Terheléses teszt ≥ 500 egyidejű session, network partition simulation validálva

---

## 2. Architektúra & Komponens Térkép (Fájlstruktúra)
A rendszer rétegzett felépítése a BA/IT specifikációk szerint:
- **Frontend:** `frontend/package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
  - `src/main.tsx`, `App.tsx`, `index.css` (React 18, TypeScript, Tailwind)
  - `hooks/useGameLogic.ts` → Aszinkron WS szinkronizáció, optimista UI frissítés
  - `services/WebSocketClient.ts` → Socket.IO kliens, reconnection logika (5x), állapotkezelés
  - `components/GameBoard.tsx` → Determinisztikus pontrenderelés, fáziskezelés
- **Backend:** `backend/pom.xml`, `application.yml`
  - `MalmoApplication.java` (Spring Boot 3.2.1)
  - `engine/NineMensMorrisEngine.java` → Explicit `ADJACENCY_MATRIX`, `MILL_PATTERNS`, állapotgép validáció
  - `controller/GameController.java` → REST API kontraktusok (`/game/create`, `/state/{id}`, `/move/{id}`)
  - `websocket/GameWebSocketController.java` → Spring `TextWebSocketHandler`, session-kezelés, üzenetbontás
  - `entity/GameSessionEntity.java` / `repository/GameSessionRepository.java` → JPA entitás, H2 persistencia
- **Infra & DevOps:** `Dockerfile.backend`, `Dockerfile.frontend`, `docker-compose.yml`, `.github/workflows/ci-cd.yml` (tervezett), Jenkins pipeline (aktuális)

---

## 3. Kódbázis Implementációs Állapot
- **Frontend Logika:** `useGameLogic.ts` WebSocket-eseményekre iratkozik fel (`stateSync`, `moveAck`, `validationError`). Lokális state csak optimista UI célra, szerver-authoritative validáció aktív.
- **Backend Engine:** `NineMensMorrisEngine.java` statikus adjacency mátrixot használ. Jelenleg in-memory `ConcurrentHashMap` tárolja a session állapotokat. Redundáns zárolás (`synchronized`/`ReentrantLock`) eltávolítva, de `@Version` mező még nem implementálva az entitásban.
- **Topológia:** `ADJACENCY_MATRIX` kezeli a külső (0-7) és középső (8-15) gyűrűket. A belső gyűrű (16-23) cross-kötései hiányoznak a statikus blokkból.
- **UI/UX:** Reszponzív grid layout, fázisjelzők (`PLACING`, `MOVING`, `REMOVING`, `FINISHED`), darabszám-sávok, session ID generálás. SVG égrajzoló fix koordinátákkal.
- **API Kontraktusok:** JSON alapú állapotfrissítés WS-en keresztül. Payload struktúra: `{ type: "place"|"move"|"remove", payload: { index, from? } }`

---

## 4. QA Tesztelési Eredmények & Találatok
✅ **Konfiguráció:** `frontend/package.json` és `backend/pom.xml` érvényes, függőségek deklarálva.  
⚠️ **Protokoll Diszharmonia:** Frontend `socket.io-client` vs Backend Spring `TextWebSocketHandler`. A protokollok nem kompatibilisek; reconnection/state drift kockázat.  
⚠️ **Topológia Validáció:** `ADJACENCY_MATRIX` hiányos a belső gyűrű (16-23) és szabványos cross-kötések tekintetében. Nem garantálja a determinisztikus szomszédságot.  
⚠️ **Konkurencia & Persistencia:** In-memory state frissítés request-sorrendben. Nincs `@Version` mező, nincs CAS/optimista zárás. Race condition kockázat egyidejű move requesteknél.  
⚠️ **CI/CD & Tesztek:** Pipeline `-DskipTests` paraméterrel fut. Hiányoznak: `NineMensMorrisEngineTest.java`, `WebSocketSyncTest.java`, `useGameLogic.test.ts`. Coverage nem auditálható.  
📊 **Mélytesztelési Követelmény:** Terhelés (≥500 session), network partition simulation, state drift edge-case validálás kötelező a lezárás előtt.

---

## 5. CI/CD Pipeline Konfiguráció
- **Eszközök:** Jenkins Declarative Pipeline, Maven 3, Node 18.
- **Aktuális Fázisok:**
  - Frontend: `npm install` → `npm run build` → `nohup npm start > frontend.log &`
  - Backend: `mvn clean package -DskipTests` → `nohup mvn spring-boot:run -Dserver.port=8081 > backend.log &`
- **Hiányzó Elemek:** Tesztfuttatás (`mvn test && npm run test`), Docker konténerizálás, healthcheck endpointok, automatikus rollback mechanizmus.

---

## 6. Technikai Döntések & Következmények (Lezárás Feltételei)
A ticket lezárása csak az alábbi technikai korrekciók implementálását és QA jóváhagyását követően engedélyezett:
1. **Protokoll Konvergencia:** `socket.io-client` helyettesítése Spring WebSocket/STOMP kompatibilis klienssel, VAGY backend Socket.IO adapter integrálása (`sockjs`/`stomp` támogatás).
2. **Topológia & Validáció:** `ADJACENCY_MATRIX` kiegészítése a teljes 24 pontos szabványos Malom-tábla éleivel (külső/középső/belső gyűrű + cross-kötések). Unit teszt igazolja az érvényes/érvénytelen lépések determinisztikus szűrését.
3. **Konkurencia & Persistencia:** `GameSessionEntity` frissítése `@Version` mezővel. Optimista zárolás implementálása a `processMove` hívásnál, vagy JPA tranzakciós alapú állapotkezelés bevezetése.
4. **CI/CD Integritás:** `-DskipTests` kivezetése. Pipeline explicit futtassa `mvn test && npm run test`. `nohup` helyett Docker konténerizálás + healthcheck implementálása. Target coverage ≥85%.
5. **Mélytesztelési Keret:** Terheléses teszt (≥500 concurrent session), network partition simulation, state drift edge-case validálás dokumentálva és audit trail-lel rögzítve.

---

## 7. Jelenlegi Státusz
🔴 **VISSZADOBVA | Korrekció & Validáció Várva**  
A dokumentáció és kódbázis frissítve a BA/IT specifikációk szerint. A QA validációs jelentés alapján az alábbi 5 kritikus technikai hiányosság fizikai implementálása kötelező: protokoll konvergencia, teljes topológia leképezés, `@Version` alapú konkurencia-kezelés, CI/CD tesztfuttatás + Docker konténerizálás, mélytesztelési jelentés. A ticket **[LEZÁRVA]** státuszba csak a QA explicit jóváhagyása után kerülhet, a metrikai küszöbértékek (latency ≤80ms, coverage ≥85%, D7 ≥25%) konvergenciájának igazolását követően.  

*(Dokumentáció generálva: Precíz Szoftverfejlesztési Adminisztrátor)*

---
### 3. Iteráció:


# 📄 Projekt Dokumentáció Frissítés – Online Malom Játék (MVP)
**Dátum:** 2024-05-23  
**Státusz:** 🔴 VISSZADOBVA | IT Korrekciós Iteráció Kötelező  

---

## 1. Üzleti Metrikák & Sikerküszöbök (Validálási Keret)
- **Megtartás & Konverzió:** D7 ≥ 25%, D30 ≥ 12%, Regisztráció → első match → fizetés funnel ≥ 4.5%
- **Teljesítményküszöbök:** Server latency ≤ 80ms, WebSocket handshake < 150ms, crash rate < 0.1%, build-to-deploy idő ≤ 2 óra
- **Minőségi Mutatók:** Unit/Integration test coverage ≥ 85%, rollback idő < 3 perc
- **Skálázhatóság & Stabilitás:** Terheléses teszt ≥ 500 egyidejű session, network partition (1s/2s drop) edge-case validálás kötelező

---

## 2. Architektúra & Komponens Térkép (Fájlstruktúra)
A rendszer rétegzett felépítése a BA/IT specifikációk szerint:
- **Frontend:** `frontend/package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
  - `src/main.tsx`, `App.tsx`, `index.css` (React 18, TypeScript, Tailwind)
  - `hooks/useGameLogic.ts` → STOMP/WS kliens (`@stomp/stompjs`), optimista UI frissítés, verziókonfliktus-kezelés
  - `components/GameBoard.tsx` → Explicit koordináta-térkép (24 pont), SVG élek, fáziskezelés
- **Backend:** `backend/pom.xml`, `application.yml`
  - `MalmoApplication.java` (Spring Boot 3.2.1)
  - `engine/NineMensMorrisEngine.java` → Explicit `ADJACENCY_MATRIX`, `MILL_PATTERNS`, állapotgép validáció
  - `controller/GameController.java` → REST API kontraktusok (`/game/create`, `/state/{id}`)
  - `websocket/GameWebSocketController.java` → STOMP `@MessageMapping`, session routing, JPA tranzakciók
  - `entity/GameSessionEntity.java` → `@Version Long version;` mezővel
  - `repository/GameSessionRepository.java` → JPA repository
- **Infra & DevOps:** `Dockerfile.backend`, `Dockerfile.frontend`, `docker-compose.yml`, Jenkins pipeline (frissítendő)

---

## 3. Kódbázis Implementációs Állapot
- **Frontend Logika:** `useGameLogic.ts` STOMP üzenetekre iratkozik fel (`/topic/sync/{sessionId}`). Lokális state optimista frissítés, szerver-authoritative validáció várakozása implementálva. Reconnection logika: 5× retry, exponential backoff.
- **Backend Engine:** `NineMensMorrisEngine.java` statikus adjacency mátrixot és mill pattern listát használ. Jelenleg `detectsMill()` mock (`return true`). Belső gyűrű (16-23) cross-kötései hiányosak a szabványos topológiához képest.
- **Konkurencia & Persistencia:** `GameSessionEntity` tartalmazza az `@Version` mezőt. `GameWebSocketController.processMove()` JPA mentést végez, de `OptimisticLockException` kezelése generic catch blokkban van, retry logika hiányzik.
- **API/WS Kontraktusok:** STOMP `/app/game/{sessionId}/move` és `/topic/sync/{sessionId}` üzenetek definiálva. Payload: `{ from, to, player, sessionId }`.
- **Tesztfedezettség:** `NineMensMorrisEngineTest.java` alapadjacenciát ellenőriz. Hiányoznak: fázisváltás, verziókonfliktus, WS szinkronizáció, terheléses tesztek.

---

## 4. QA Tesztelési Eredmények & Találatok
✅ **Konfigurációs Szűrő:** `frontend/package.json` és `backend/pom.xml` érvényes, függőségek deklarálva.  
⚠️ **Protokoll Diszharmonia:** Hiányzik a `WebSocketConfig.java` (STOMP broker konfiguráció). Frontend SockJS/STOMP vs Backend natív WS routing nem konvergens.  
⚠️ **Topológia & Validáció:** `detectsMill()` mock állapot. Belső gyűrű élei hiányosak. Nem garantált a determinisztikus szabályvalidáció.  
⚠️ **Konkurencia-kezelés:** `OptimisticLockException` nem kezelt expliciten, generic catch blokk használata. Race condition esetén állapotvisszaállítás/retry hiányzik.  
⚠️ **CI/CD & Tesztek:** Pipeline továbbra is `-DskipTests` paraméterrel fut. Coverage metrika nem auditálható. Docker konténerizálás és healthcheck implementálatlan.  
📊 **Mélytesztelési Követelmény:** Terhelés (≥500 session), network partition simulation, state drift edge-case validálás kötelező a lezárás előtt.

---

## 5. CI/CD Pipeline Konfiguráció
- **Eszközök:** Jenkins Declarative Pipeline, Maven 3, Node 18.
- **Jelenlegi konfiguráció:** 
  - Frontend: `npm install` → `npm run build` → `nohup npm start > frontend.log &`
  - Backend: `mvn clean compile` → `nohup mvn spring-boot:run -Dserver.port=8081 > backend.log &`
- **Hiányzó Elemek:** Tesztfuttatás (`mvn test && npm run test`), `-DskipTests` kivezetése, Docker konténerizálás, healthcheck endpointok, coverage reporting (JaCoCo/c8).

---

## 6. Technikai Döntések & Következmények (Lezárás Feltételei)
A ticket lezárása csak az alábbi technikai korrekciók fizikai implementálását és QA jóváhagyását követően engedélyezett:
1. **STOMP Broker Konfiguráció:** `WebSocketConfig.java` létrehozása explicit `/ws/stomp` endpointtal, broker relay vagy direct routing konfigurálásával a frontend/backend protokollkonvergenciáért.
2. **Topológia & Validáció:** `ADJACENCY_MATRIX` és `MILL_PATTERNS` kiegészítése a teljes szabványos 24 pontos tábla éleire. `detectsMill()` implementálása valós board-state ellenőrzéssel, mock kivevésével.
3. **Konkurencia & Persistencia:** `OptimisticLockException` explicit try-catch blokkba helyezése a `GameWebSocketController`-ben, retry logika vagy állapotvisszaállítás implementálása. Generic exception handling tiltása játékállapot-transzformációknál.
4. **CI/CD & Minőségbiztosítás:** Pipeline frissítése `-DskipTests` kivezetésére, explicit `mvn test && npm run test` futtatásra, coverage reporting bevezetésére (target ≥85%), Docker konténerizálásra + healthcheck endpointokra.

---

## 7. Jelenlegi Státusz
🔴 **VISSZADOBVA | IT Korrekciós Iteráció Kötelező**  
A dokumentáció és kódbázis frissítve a PO/BA specifikációk és QA validációs jelentés alapján. Az alábbi 4 kritikus technikai hiányosság fizikai implementálása kötelező: STOMP broker konfiguráció, teljes topológia & valós mill detektálás, `OptimisticLockException` explicit kezelése + retry logika, CI/CD tesztfuttatás + Docker konténerizálás. A ticket **[LEZÁRVA]** státuszba csak a QA explicit jóváhagyása után kerülhet, a metrikai küszöbértékek (coverage ≥85%, latency ≤80ms, determinisztikus állapotgép) konvergenciájának igazolását követően.  

*(Dokumentáció generálva: Precíz Szoftverfejlesztési Adminisztrátor)*
