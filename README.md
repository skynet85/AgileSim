# LLMOps Szimuláció Eredménye

## 🎯 Legutóbbi Üzleti Igény
> Kérek egy online malom játékot

## 🤖 A Csapat Munkája és a Működés
Ez a kódbázis egy többágenses (Multi-Agent) agilis LLMOps szimuláció végterméke.

## 📂 Projekt Memória (Záró állapot)

### 1. Iteráció:


# PROJEKT DOKUMENTÁCIÓ – FRISSÍTÉS
**Státusz:** MVP Sprint 1 folyamatban. QA audit alapján blokkolva a merge/deployment előtt.  
**Dokumentáció típusa:** Technikai specifikáció, architektúra, tesztállapot, CI/CD konfiguráció

## 1. Üzleti KPI-k & UX Elvárások (MVP)
- **KPI-k:** CAC < X €, LTV/CAC > 3, DAU ≥ Y (1. hét), session duration ≥ A perc, konverziós ráta ≥ Z%, churn rate ≤ B%, deployment frequency: heti stabil release.
- **UX/Performance:** Indulási idő <3 mp (lazy loading + statikus assetek CDN-en), mobil-first reszponzív design, touch-targets ≥44px, egy kattintásos checkout, kötelező analytics pipeline minden képernyőn (`matchStart`, `purchaseAttempt`, `errorRate`).

## 2. Architektúra & Technológiai Stack
- **Frontend:** React 18, Vite 5, Zustand (state management), TailwindCSS, STOMP/WS (SockJS).
- **Backend:** Spring Boot 3.2.1, Java 17, WebSocket (STOMP), PostgreSQL 15, Redis 7, Stripe SDK, Micrometer/Prometheus. Aszinkron analytics: Kafka/PubSub integráció tervezve.
- **Adatréteg:** PostgreSQL (WAL optimalizált) + Redis (cache + session store). MVCC konzisztencia biztosítva.
- **Infrastruktúra:** Docker Compose alapú környezet, CI/CD pipeline automatizálással.

## 3. Fájlstruktúra & Kódartefaktumok (MVP Sprint 1)
```text
frontend/
  ├── package.json          # React, Vite, Zustand, STOMP, Stripe SDK
  ├── vite.config.ts        # Optimalizált build pipeline, code splitting
  └── src/
      ├── main.tsx          # App mount, Provider stack (Auth, Store, Analytics)
      ├── routes/index.tsx  # Protected routes, lazy-loaded modules
      ├── store/gameStateSlice.ts # Client-side state (Zustand + persist middleware)
      ├── services/websocketClient.ts # STOMP/WS client, reconnect policy
      ├── services/analyticsTracker.ts # Eseménykövető wrapper
      └── components/
          ├── GameBoard/MillBoard.tsx # Reszponzív tábla, touch handler
          └── UI/PaymentModal.tsx     # Checkout flow, retry logika

backend/
  ├── pom.xml               # Spring Boot, WebSocket, Redis, JPA, Stripe, Micrometer
  └── src/main/java/hu/malom/
      ├── config/WebSocketConfig.java   # STOMP endpointek, rate limiting
      ├── service/GameEngineService.java # Játékállapot validáció, mill felismerés
      ├── service/MatchmakingQueueService.java # Skill-weighted queue, timeout handling
      ├── controller/AuthController.java # JWT issuance, GDPR consent log
      ├── service/PaymentGatewayAdapter.java # Stripe abstraction, idempotency keys
      └── event/AnalyticsEventPublisher.java # Async event stream (Kafka/PubSub)

db/migrations/
  ├── V001__create_users_and_profiles.sql
  ├── V002__create_matches_and_snapshots.sql
  └── V003__create_leaderboards_and_transactions.sql
infra/docker-compose.db.yml # PostgreSQL + Redis containerizált környezet
```

## 4. QA Audit Eredmények & Tesztállapot
**Státusz:** 🔴 BLOKKOLVA – Kritikus sebezhetőségek és konzisztenciahiányok azonosítva. A ticket nem kerül merge-re vagy éles környezetbe a javításig.

| Kategória | Kritikus Pont | Teszt/Eredmény | Hatás |
|-----------|---------------|----------------|-------|
| **Állapotkezelés** | `zustand/persist` middleware kliens oldalon | Állapotaszinkronizáció hiánya, terhelés alatt nemlineáris drift | Churn rate növekedés, matchmaking latency ugrás |
| **WebSocket/Analytics** | `websocketClient.ts` & `pom.xml` dependency stack | Hiányzó exponential backoff, heartbeat tuning, Kafka/PubSub kliens hiánya | Zombie connection állapotok, analytics pipeline összeomlás |
| **Játékmotor Logika** | `MillBoard.tsx` koordináta-rendszer & mill detektálás | Indexelés inkonzisztens, valid move/mill logika hibásan kezeli a 24 pozíciót/12 kombinációt | Játékélmény torzulása, ELO/ranglista érvénytelenség |
| **Biztonság & Compliance** | `AuthController.java`, `docker-compose.db.yml` | Placeholder JWT, hardkódolt DB jelszó (`secure_password_change_me`), GDPR consent validáció hiánya | CI/CD pipeline blokkolás, compliance kockázat |

## 5. Technikai Döntések & Infrastruktúra Frissítések
- **State Management:** `zustand/persist` middleware törlése/kiszűrése. Server-authoritative state elv bevezetése (ADR dokumentációval rögzítve).
- **WebSocket Client:** Exponential backoff, heartbeat tuning és reconnect policy implementálása a BA specifikáció szerint.
- **Analytics Stack:** Backend `pom.xml` frissítése Kafka/PubSub dependency-kkel az aszinkron eseménykövetéshez.
- **Játékmotor Refaktorálás:** `MillBoard.tsx` logikájának kiszervezése szerver-oldali validációra. Determinisztikus unit tesztek írása a 24 pozíció és 12 mill kombináció referenciájára.
- **Biztonság & Configok:** Environment változókra váltás, JWT aláírás implementálása, GDPR consent flow beépítése az AuthController-ba. Docker compose jelszavak cseréje secret managerre/CI variable-re.
- **Folyamatfrissítések (DoR & Review):** `-DskipTests` flag törlése a CI pipeline-ból. Architecture Review Gate bevezetése minden PR merge előtt.

## 6. CI/CD Pipeline Konfiguráció (Jenkins)
```groovy
pipeline {
    agent any
    stages {
        stage('Frontend') {
            when { expression { fileExists("frontend/package.json") } }
            tools { nodejs "Node18" }
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'JENKINS_NODE_COOKIE=dontKillMe nohup npm start > frontend.log 2>&1 &'
                }
            }
        }
        stage('Backend') {
            when { expression { fileExists("backend/pom.xml") } }
            tools { maven "Maven3" }
            steps {
                dir('backend') {
                    sh 'mvn clean package -DskipTests' // ⚠️ JAVÍTANDÓ: -DskipTests flag eltávolítva lesz a QA követelmények szerint
                }
                steps {
                    sh 'JENKINS_NODE_COOKIE=dontKillMe nohup mvn spring-boot:run -Dserver.port=8081 > backend.log 2>&1 &'
                }
            }
        }
    }
}
```

## 7. Implementációs Határidők & Felelősségi Körök
| Feladat | Felelős | Határidő |
|---------|---------|----------|
| `pom.xml` Kafka/PubSub + JWT/GDPR implementáció | Tech Lead / Backend-DevOps | 24 óra |
| Zustand persist törlése, koordináta-refaktorálás, unit tesztek | UX/UI / Frontend | 36 óra |
| Javított verzió manuális & automatizált tesztelése (WebSocket heartbeat, mill-logika determinisztikum) | QA | ≤48 óra |

**Megjegyzés:** A ticket lezárása és következő sprintbe kerülése kizárólag a QA explicit jóváhagyását követően lehetséges. A technikai rigor és a KPI-k mérhetősége prioritás.

---
### 2. Iteráció:


# PROJEKT DOKUMENTÁCIÓ – FRISSÍTÉS
**Státusz:** 🔴 BLOKKOLVA | JAVÍTÁSI ABLAK NYITVA (48h) | MERGE/DEPLOYMENT NEM ENGEDÉLYEZETT  
**Dokumentáció típusa:** Technikai specifikáció, architektúra, tesztállapot, CI/CD konfiguráció

## 1. Üzleti KPI-k & UX Elvárások (MVP)
- **KPI-k:** CAC < X €, LTV/CAC > 3, DAU ≥ Y (1. hét), session duration ≥ A perc, konverziós ráta ≥ Z%, churn rate ≤ B%, deployment frequency: heti stabil release.
- **UX/Performance:** Indulási idő <3 mp (lazy loading + statikus assetek CDN-en), mobil-first reszponzív design, touch-targets ≥44px, egy kattintásos checkout.
- **Analytics Pipeline:** Kötelező eseménykövetés minden képernyőn (`matchStart`, `purchaseAttempt`, `errorRate`). Beacon API alapú aszinkron küldés. KPI-dashbordon valós idejű frissítés: `session_duration ≥ A perc`, `error_rate < Z%`, `checkout_conversion ≥ Y%`. Nem teljesülés esetén release backout.
- **Prioritás:** MVP fázisban kizárólag mérhető bevételnövekedést vagy churn-csökkentést célzó funkciók. Hosszú távú innováció (AI ellenfél, skin-economy) 2. sprintre halasztva.

## 2. Architektúra & Technológiai Stack
- **Frontend:** React 18, Vite 5, Zustand (persist middleware ELTÁVOLÍTVA), TailwindCSS, STOMP/WS (SockJS). Server-authoritative state elv. Kliens cache csak read-only mód.
- **Backend:** Spring Boot 3.2.1, Java 17, WebSocket (STOMP), PostgreSQL 15, Redis 7, Stripe SDK, Micrometer/Prometheus, Kafka/PubSub (aszinkron analytics). JWT/GDPR compliance.
- **Adatréteg:** PostgreSQL (WAL optimalizált) + Redis (cache + session store). MVCC konzisztencia. Determinisztikus játékállapot szerver-oldali validációval.
- **Infrastruktúra:** Docker Compose alapú környezet, CI/CD pipeline automatizálással, env-alapú konfiguráció, secret manager integráció.

## 3. Fájlstruktúra & Kódartefaktumok (MVP Sprint 1)
*(BA specifikus útvonalak + IT implementációs kódok)*

```text
frontend/package.json          # React 18, Vite 5, Zustand (persist nélkül), STOMP/WS, Stripe SDK, analytics deps
backend/pom.xml                # Spring Boot 3.2.1, Java 17, WebSocket, Redis, JPA, PostgreSQL, Kafka/PubSub, JWT/GDPR, Micrometer, Stripe
frontend/vite.config.ts        # Optimalizált build pipeline, code splitting, CDN asset beállítások
frontend/src/main.tsx          # App mount, Provider stack (Auth, Store, Analytics), BrowserRouter
frontend/src/routes/index.tsx  # Protected routes, lazy-loaded modules
frontend/src/store/gameStateSlice.ts # Zustand store (server-authoritative only, persist middleware ELTÁVOLÍTVA)
frontend/src/services/websocketClient.ts # Exponential backoff, heartbeat tuning, reconnect policy implementálva
frontend/src/services/analyticsTracker.ts # Kötelező eseménykövető wrapper minden képernyőn
frontend/src/components/GameBoard/MillBoard.tsx # Determinisztikus koordináta-rendszer (24 pozíció), szerver-visszahívásos logika
frontend/src/components/UI/PaymentModal.tsx    # Stripe checkout flow, retry logika, analytics kötés
db/migrations/V001__create_users_and_profiles.sql
db/migrations/V002__create_matches_and_snapshots.sql
db/migrations/V003__create_leaderboards_and_transactions.sql
db/scripts/init_analytics_timeview.sql        # MATERIALIZED VIEW a napi KPI rolluphoz
infra/docker-compose.db.yml                   # Env változókra váltott credentials, WAL/Redis optimalizálás
backend/src/main/java/hu/malom/config/WebSocketConfig.java      # STOMP endpointek, rate limiting, CORS security (env-alapú origin)
backend/src/main/java/hu/malom/service/GameEngineService.java   # Szerver-authoritative state, determinisztikus mill validáció (12/24), darabolási jog logika
backend/src/main/java/hu/malom/service/MatchmakingQueueService.java # Skill-weighted queue, timeout handling
backend/src/main/java/hu/malom/controller/AuthController.java   # JWT issuance, GDPR consent log, BCrypt jelszóvalidáció, DB query
backend/src/main/java/hu/malom/service/PaymentGatewayAdapter.java # Stripe abstraction, idempotency keys, webhook handler
backend/src/main/java/hu/malom/event/AnalyticsEventPublisher.java # Async Kafka/PubSub emission
backend/src/resources/application-prod.yml                        # Env változók, JPA validate, Redis/PostgreSQL config
```

### 🔑 Kritikus Kódimplementációk (IT Specifikáció)
**`frontend/package.json`**
```json
{
  "name": "malom-online-frontend",
  "private": true,
  "version": "2.4.1-alpha",
  "type": "module",
  "scripts": { "dev": "vite", "build": "tsc && vite build", "preview": "vite preview" },
  "dependencies": {
    "react": "^18.2.0", "react-dom": "^18.2.0", "react-router-dom": "^6.22.0",
    "@stomp/stompjs": "^7.0.0", "sockjs-client": "^1.6.1",
    "zustand": "^4.5.0", "@stripe/react-stripe-js": "^2.4.0", "@stripe/stripe-js": "^2.4.0",
    "tailwindcss": "^3.4.1", "postcss": "^8.4.33", "autoprefixer": "^10.4.17"
  },
  "devDependencies": {
    "@types/react": "^18.2.55", "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1", "typescript": "^5.3.3", "vite": "^5.1.0"
  }
}
```

**`backend/pom.xml` (Kivonat)**
```xml
<dependencies>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-websocket</artifactId></dependency>
    <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-api</artifactId><version>${jjwt.version}</version></dependency>
    <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-impl</artifactId><version>${jjwt.version}</version><scope>runtime</scope></dependency>
    <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-jackson</artifactId><version>${jjwt.version}</version><scope>runtime</scope></dependency>
    <dependency><groupId>org.springframework.kafka</groupId><artifactId>spring-kafka</artifactId></dependency>
    <dependency><groupId>com.stripe</groupId><artifactId>stripe-java</artifactId><version>${stripe.version}</version></dependency>
</dependencies>
```

**`frontend/src/services/websocketClient.ts` (Kivonat)**
```typescript
export class WSManager {
  private reconnectAttempts = 0;
  private baseDelay = 1000;
  private maxDelay = 30000;
  // Exponential backoff: min(baseDelay * 2^attempts, maxDelay)
  // STOMP heartbeat tuning & reconnect policy implementálva
}
```

**`backend/src/main/java/hu/malom/service/GameEngineService.java` (Kivonat)**
```java
// Determinisztikus mill kombinációk (12 db) a szabványos 24 pozíciós topológiára
private static final int[][] MILLS = { /* outer ring, middle ring, cross connections */ };
// Server-authoritative validáció: adjacency check + mill detection + stripping jog logika
```

## 4. QA Audit Eredmények & Tesztállapot
**Státusz:** 🔴 BLOKKOLVA – Kritikus inkonzisztenciák és logikai hibák azonosítva. Merge/deployment csak a javított artifactumok beküldése után lehetséges.

| Kategória | Kritikus Pont / Talált Inkoherencia | Teszt/Eredmény | Követelmény & Javítás |
|-----------|-------------------------------------|----------------|------------------------|
| **Függőségkezelés** | `zustand@4.5.0` jelen van `package.json`-ban, persist middleware hiányzik a kódból de a lock fájl nem frissült | CLI ellenőrzés: `npm ci` szükséges a determinisztikus állapot biztosításához | `zustand` törlése `package.json`-ból, `npm ci` futtatása, lock fájl validálása |
| **Biztonság & Auth** | `AuthController.java`: Hiányzik a jelszóvalidáció (BCrypt), DB query és 401 response. JWT scope konzisztencia ellenőrzése szükséges | Security audit: Placeholder login endpoint, GDPR consent csak flag ellenőrzés | BCrypt implementálása, DB hitelesítés, `jjwt` verziókövetés explicit beállítása `pom.xml`-ban |
| **Játékmotor Logika** | `GameEngineService.java`: `MILLS` tömb indexelése nem tükrözi a szabványos 24 pozíciós topológiát. Hiányzik a darabolási jog (stripping) logikája | Unit teszt: Invalid mill kombinációk elfogadva, ELO torzulás | Szabványos 12 mill kombináció implementálása, adjacency graph validálás, darabolási jog hozzáadása |
| **WebSocket/Config** | `WebSocketConfig.java`: Hardkódolt origin (`https://malom-app.com`), fix heartbeat `{10000, 10000}`. Zombie session kockázat | Network stress test: Memory leak, queue backlog terhelés alatt | Env-alapú origin konfiguráció, heartbeat beállítása `{4000, 4000}`, rate limiting aktiválása |

## 5. Technikai Döntések & Infrastruktúra Frissítések
- **State Management:** `zustand/persist` middleware teljes törlése. Server-authoritative state kizárólagos használata. Kliens cache read-only mód.
- **WebSocket Client:** Exponential backoff, STOMP heartbeat tuning `{4000, 4000}`, reconnect policy implementálása. Hardkódolt origin cseréje env változóra.
- **Analytics Stack:** Backend `pom.xml` frissítése Kafka/PubSub dependency-kkel. Aszinkron eseménykövetés kötelező minden UX lépéshez (`matchStart`, `purchaseAttempt`, `errorRate`).
- **Játékmotor Refaktorálás:** `MillBoard.tsx` logikájának kiszervezése szerver-oldali validációra. Determinisztikus unit tesztek a 24 pozíció és 12 mill kombináció referenciájára. Darabolási jog implementálása.
- **Biztonság & Configok:** Environment változókra váltás, JWT aláírás (BCrypt + DB query), GDPR consent flow beépítése az AuthController-ba. Docker compose jelszavak cseréje secret managerre/CI variable-re. `jjwt` verziókonfliktusok megelőzése explicit scope-beállítással.
- **Folyamatfrissítések (DoR & Review):** `-DskipTests` flag törlése a CI pipeline-ból. Architecture Review Gate bevezetése minden PR merge előtt.

## 6. CI/CD Pipeline Konfiguráció (Jenkins)
```groovy
pipeline {
    agent any
    stages {
        stage('Frontend') {
            when { expression { fileExists("frontend/package.json") } }
            tools { nodejs "Node18" }
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'JENKINS_NODE_COOKIE=dontKillMe nohup npm start > frontend.log 2>&1 &'
                }
            }
        }
        stage('Backend') {
            when { expression { fileExists("backend/pom.xml") } }
            tools { maven "Maven3" }
            steps {
                dir('backend') {
                    sh 'mvn clean package' // ⚠️ -DskipTests flag eltávolítva, QA követelmények szerint
                }
                steps {
                    sh 'JENKINS_NODE_COOKIE=dontKillMe nohup mvn spring-boot:run -Dserver.port=8081 > backend.log 2>&1 &'
                }
            }
        }
    }
    post {
        always {
            echo "CI/CD gerinc stabilizálva. A gépi folyamat végre hajtotta a tervezett rituálét."
        }
    }
}
```

## 7. Implementációs Határidők & Felelősségi Körök (Go/No-Go)
| Feladat | Felelős | Határidő | Go/No-Go Kritérium |
|---------|---------|----------|---------------------|
| `pom.xml` Kafka/PubSub + JWT/GDPR + env config + CI test flag eltávolítása | Tech Lead / Backend-DevOps | 24 óra | `mvn clean package` sikeres, security gate pass, env változók validálva |
| Zustand persist törlése, koordináta-refaktorálás, unit tesztek, UX konverziós pipeline ellenőrzése | Frontend/UX | 36 óra | `npm ci` lock fájl konzisztencia, analytics beacon küldés validálva, board logika szerver-visszahívásos |
| Javított verzió manuális & automatizált tesztelése (WebSocket heartbeat, mill-logika determinisztikum, Auth BCrypt) | QA | ≤48 óra | Explicit „READY FOR DEPLOY” státusz, KPI-mérési pipeline validálva, regressziós suite pass |

**Megjegyzés:** A ticket lezárása és következő sprintbe kerülése kizárólag a QA explicit jóváhagyását követően lehetséges. A technikai rigor és a KPI-k mérhetősége prioritás. Amíg a fenti kritériumok nem teljesülnek, a ticket **NEM kerül éles környezetbe**.
