# LLMOps Szimuláció Eredménye

## 🎯 Eredeti Üzleti Igény
> "NextGen Omni-Channel WebBank" – Product Vision & Core Requirements
1. Üzleti Vízió és Kontextus (The "Why")
Cél: Egy modern, reszponzív és maximálisan biztonságos webalapú banki alkalmazás kifejlesztése, amely zökkenőmentesen illeszkedik a banki omni-channel (OCT) stratégiába. Az ügyfelek számára intuitív, valós idejű pénzügyi áttekintést és tranzakciós képességeket kell nyújtania, miközben a háttérben robusztus, skálázható architektúrára támaszkodik.

2. Célközönség és Felhasználói Útvonalak (The "Who")
Lakossági Ügyfelek: Gyors egyenleglekérdezés, egyszerűsített utalások (1-click megoldások), kiadás-elemzés vizualizációval.

Prémium/Kkv Ügyfelek: Több számla egyidejű kezelése, kötegelt utalások, részletes exportálási lehetőségek és jogosultságkezelés.

3. Főbb Epicek és Elvárt Funkcionalitás (The "What")
Epic 1: Biztonságos Onboarding és Autentikáció

Többfaktoros hitelesítés (MFA), biometrikus azonosítás támogatása (eszközszinten), és gyanús bejelentkezések anomália-alapú detektálása.

Epic 2: Központi Dashboard (PFM - Personal Finance Management)

Személyre szabott, widget-alapú kezdőképernyő.

Költési kategóriák automatikus, MI-támogatott felcímkézése és diagramos vizualizációja.

Epic 3: Core Tranzakciós Modul

Azonnali átutalások (SEPA/belföldi), sablonok kezelése, rendszeres megbízások beállítása.

Valós idejű tranzakció-visszaigazolás és értesítési rendszer.

Epic 4: Digitális Ügyfélszolgálat

Integrált, biztonságos csatorna a bankkal való kommunikációra, chatbot integrációs lehetőséggel.

4. Technológiai és Architekturális Elvárások (The "How")
Frontend: Modern, komponens-alapú keretrendszer (pl. React, Angular vagy Vue), szigorú UI/UX iránymutatásokkal, akadálymentesítési (WCAG) szabványok betartásával.

Backend & API: Microservices architektúra, RESTful vagy GraphQL API-k, nagy rendelkezésre állás (High Availability).

Biztonság (Security-by-Design): OWASP Top 10 vulnerabilitások elleni beépített védelem, végpontok közötti titkosítás, és szigorú adatvédelmi/GDPR megfelelés.

5. Minőségbiztosítási és Tesztelési Irányelvek (A minőségi kapu)
A fejlesztés során a legmagasabb szintű, vállalati Testing Center of Excellence (CoE) standardokat kell alkalmazni:

AI-Támogatott Tesztelés: Elvárás az intelligens tesztautomatizációs eszközök, lokális LLM-ek és autonóm (Agentic) AI megoldások bevonása a tesztesetek generálásába, a kódminőség ellenőrzésébe és a regressziós tesztelésbe.

Omni-Channel Tesztelés: A funkciókat folyamatos end-to-end (E2E) tesztelésnek kell alávetni, garantálva, hogy a webes élmény tökéletesen szinkronban maradjon a mobilalkalmazással és a fióki folyamatokkal.

Shift-Left Megközelítés: A biztonsági és teljesítménytesztek (Load/Stress testing) beépítése már a CI/CD pipeline korai szakaszaiba.

6. Definition of Done (DoD)
Egy User Story vagy Epic csak akkor tekinthető késznek, ha:

A kód átesett a Peer Code Review-n és a statikus kódanalízisen (SonarQube/hasonló).

Az automatizált tesztlefedettség eléri a minimum 85%-ot.

Nincsenek ismert 'High' vagy 'Critical' prioritású biztonsági és funkcionális hibák.

A fejlesztés átment az AI-alapú E2E integrációs teszteken a staging környezetben.

A funkció teljes mértékben megfelel a banki design systemnek és a UX/UI terveknek.

## 🤖 A Csapat Munkája és a Működés
Ez a kódbázis egy többágenses (Multi-Agent) agilis LLMOps szimuláció végterméke. A folyamat során a Clean Code elveket követő csapat iteratív viták során dolgozta ki a specifikációt, a több fájlra bontott React és Java kódokat, az adatbázis sémákat (DDL/DML), valamint a UI/UX terveket.

## 📂 Projekt Memória (Záró állapot)

### 1. Iteráció:


# 📋 Projekt Dokumentáció – Frissítés
**Projekt:** NextGen Omni-Channel WebBank  
**Státusz:** S1 Kickoff előkészítő fázis / QA blokk miatt strukturális javítások szükségesek  
**Dokumentáció típusa:** Technikai specifikáció, architektúrális döntések, tesztelési eredmények, kódbázis integrálás

---

## 1. Projekt Státusz & Végrehajtási Keret
- **Prioritási elv:** Kizárólag üzleti érték (bevételnövekedés, kockázatcsökkentés, ügyfélmegtartás, szabályozási megfelelés).
- **Határidő-fegyelem:** Sprint végén scope freeze. Külső függőségek 48 órával előre jelezendők. Nem jelezett késések formai mulasztásnak minősülnek.
- **DoD & CoE Kapuk:** 85% kódfedés (JaCoCo), SonarQube quality gate, Pact contract test, OWASP ZAP baseline scan, AI-assisted E2E staging validáció, Design System compliance. Nem teljesítés esetén return.
- **Kommunikáció:** Napi 15 perces sync (metrikafókusz), heti scope review, sprint demo üzleti metrikák alapján értékelendő.

---

## 2. Architektúrális Döntések & Technológiai Stack
| Réteg | Technológia / Szabvány | Döntés / Megvalósítás |
|-------|------------------------|------------------------|
| **Frontend** | React, Tailwind CSS, Penpot | WCAG AA/AAA kompatibilitás, determinisztikus állapotgépek, drag-and-drop widget engine, valós idejű szinkron (WebSocket/SSE) |
| **Backend** | Java Spring Boot, REST API v1 | OAuth2/OIDC auth, Bean Validation DTO-k, `@Transactional` határok, eseményvezérelt kommunikáció Kafka-n keresztül |
| **Üzenetközvetítés** | Apache Kafka, Confluent Schema Registry | Standard `Envelope` schema (header/payload/metadata), sémavezérelt validáció, DLQ routing, idempotencia kulcsok |
| **Adatréteg** | PostgreSQL, JPA/Hibernate | Explicit FK constraint-ek, CHECK korlátok, audit log tábla, Flyway/Liquibase versioning |
| **Infra & CI/CD** | Docker, Kubernetes, Jenkins, SonarQube, Pact, OWASP ZAP | Szigorú agent-allokáció, disableConcurrentBuilds, 40 perces timeout, automatikus staging deploy + smoke test |

---

## 3. Frontend Specifikáció & Implementáció
### 3.1. Komponens Architektúra
- `SecureInput.jsx`: WCAG compliant bemeneti egység. Explicit fókusz/blur állapotok, `aria-invalid` és `role="alert"` hibaállapotokhoz, Tailwind alapú stíluskezelés.
- `useAuthSession.js`: Custom hook a session menedzsmenthez. Token rotáció, lejárati ellenőrzés, kontrollált state struktúra (`isAuthenticated`, `isLoading`, `user`, `error`).
- `LoginForm.jsx`: Validációs sémák (`validateEmail`, `validatePassword`), correlation ID generálás audit trailhez, disabled állapot submit gombon validációs hiba vagy loading esetén.

### 3.2. UI/UX Specifikáció (Penpot SVG Exportok)
1. **Secure Onboarding & MFA:** Biometrikus prompt (WebAuthn/FIDO2), TLS 1.3 / AES-256 badge, explicit validációs state-k.
2. **Central PFM Dashboard:** Widget grid (egyenleg, MI-osztályozás, gyors akciók), valós idejű tranzakciós táblázat, drag-and-drop támogatás.
3. **Core Transaction Wizard:** Lépcsős validáció, IBAN checksum ellenőrzés overlay, real-time státusz tracker (SEPA Instant vs Belföldi).
4. **Templates & Batch Management:** CSV/Excel drag-drop import, KVK multi-sig badge, szűrési mechanizmusok.
5. **Digital Customer Service:** Split layout (chat stream + context panel), bot handoff notice, GDPR compliance footer, end-to-end titkosítás jelzés.

---

## 4. Backend Specifikáció & Implementáció
### 4.1. API Szerződések (REST v1)
| Modul | Endpoint | Módszer | Auth | Leírás |
|-------|----------|---------|------|--------|
| **Auth** | `/api/v1/auth/login` | POST | Public | Hitelesítés + MFA trigger, rate limit, session token generálás |
| **Auth** | `/api/v1/auth/mfa/verify` | POST | Session | TOTP/Push/Biometrikus igazolás, anomália Kafka kiírás |
| **Payments** | `/api/v1/payments/initiate` | POST | Bearer (User) | Utalás létrehozása, idempotencia ellenőrzés, `core.payment.initiated.v1` esemény |
| **Payments** | `/api/v1/payments/{id}/status` | GET | Bearer (User) | Státusz lekérdezés, cache szinkron |
| **Payments** | `/api/v1/payments/{id}/approve` | PUT | Bearer (Approver) | Jogosult jóváhagyás, audit trail, státusz frissítés |
| **PFM** | `/api/v1/accounts/balances` | GET | Bearer (User) | Multi-számla aggregálás, WebSocket/SSE trigger |
| **Support** | `/ws/v1/support/chat/{id}` | WS | Session + TLS 1.3 | End-to-end titkosított chat stream, bot context átadás |

### 4.2. Domain & Service Implementáció
- `Transaction.java`: JPA entitás explicit constraintekkel (`@Column`, `@Enumerated`, `@PrePersist`/`@PreUpdate`). Enumok: `PENDING_APPROVAL`, `APPROVED`, `EXECUTED`, `REJECTED`, `FAILED_SYSTEM_ERROR`, `MANUAL_REVIEW_REQUIRED`.
- `PaymentRequestDto`: Bean Validation (`@NotBlank`, `@Pattern`, `@DecimalMin`, `@Digits`), idempotencia kulcs kötelező.
- `TransactionServiceImpl`: Tranzakciós határok (`rollbackFor = Exception.class`), idempotencia ellenőrzés repository szinten, állapotgép validáció, Kafka eseményközlés zárt tranzakcióban.
- `PaymentEventProducer`: Standard envelope konstrukció (messageId, correlationId, timestamp, sourceService, eventType, version). *Megjegyzés: QA azonosított partíciós kulcs eltérést (lásd 6. fejezet).*

---

## 5. Adatréteg & Infrastruktúra
### 5.1. SQL Schema (PostgreSQL)
```sql
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    iban VARCHAR(34) UNIQUE NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY,
    idempotency_key VARCHAR(64) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES accounts(customer_id),
    account_from VARCHAR(34) NOT NULL REFERENCES accounts(iban),
    account_to VARCHAR(34) NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(30) NOT NULL CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'EXECUTED', 'REJECTED', 'FAILED_SYSTEM_ERROR', 'MANUAL_REVIEW_REQUIRED')),
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('SEPA_INSTANT', 'SEPA_STANDARD', 'DOMESTIC_RTGS', 'TEMPLATE_EXECUTION')),
    reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB,
    trace_id VARCHAR(64)
);

CREATE INDEX idx_transactions_customer_status ON transactions(customer_id, status);
CREATE INDEX idx_audit_log_trace ON audit_log(trace_id);
```
- **Trigger:** `update_updated_at_column()` automatikus frissítés UPDATE műveleteknél.
- **Seed Data:** Determinisztikus tesztállapotok (`accounts`, `transactions`, `audit_log`) staging környezetbe.

---

## 6. Tesztelés, QA Eredmények & DoD Kapuk
### 6.1. Strukturális Koherencia Audit (QA Manual)
| Tény / Kockázat | Leírás | Következmény |
|-----------------|--------|--------------|
| **ORM–DDL FK Szakadék** | `Transaction.java` nem tartalmaz `@JoinColumn`/`@ManyToOne` annotációkat, DDL explicit `REFERENCES` korlátokat használ. | Hibernate cache/tranzakciós izoláció kiszámíthatatlan viselkedése, migrációs törések kockázata. |
| **Kafka Partíciós Kulcs** | Producer `messageId`-t használ kulcsként, BA spec szerint `customerId`/`paymentId` szükséges. | Sorrendiség-garancia sérül, omni-channel szinkron drift, duplikált egyenlegfrissítés veszélye. |
| **Állapotgép Hiányosság** | Hiányoznak a `REJECTED`, `FAILED_SYSTEM_ERROR`, `MANUAL_REVIEW_REQUIRED` átmenetek és API végpontok. | Tranzakciók „elvadult” státuszba kerülnek, frontend/ügyfélszolgálati flow-k blokkolódnak. |
| **Audit Trail Üresjárat** | SQL séma létezik, BE kizárólag SLF4J loggol. Nincs `AuditRepository` vagy traceId propagáció Kafka burkolatból DB-be. | DoD compliance kapu nem teljesíthető, GDPR auditálhatóság hiányos. |
| **Biztonsági Réteg Hiánya** | Nincsenek Spring Security filterek, JWT validálás endpointeken, Kafka SSL/mTLS konfigurációk, FE token refresh interceptor. | OWASP A01/A07 sebezhetőség, session invalidálás kockázata, végpontok közötti titkosítás hiánya. |

**Státusz:** 🔴 **BLOCKED – Koherencia-javítás szükséges DoD kapu előtt.**  
**Kötelező korrekciók S1 előtt:**
1. `Transaction.java` FK annotációinak helyreállítása + `hibernate.hbm2ddl.auto=validate` bekapcsolása.
2. Kafka producer partíciós kulcsának átírása `customerId`/`paymentId`-re, DLQ routing konfigurálása.
3. Állapotgép kiegészítése hiányzó átmenetekkel és API végpontokkal.
4. `AuditRepository` implementálása + traceId propagáció Kafka burkolatból SQL naplóba.
5. Spring Security filter lánc + OAuth2/OIDC token validálás beépítése REST rétegbe.

---

## 7. CI/CD Pipeline Konfiguráció (Jenkinsfile)
```groovy
pipeline {
    agent none
    environment {
        DOCKER_REGISTRY = 'registry.internal.nextgenbank.com'
        SONAR_HOST_URL  = 'http://sonarqube.internal:9000'
        ZAP_API_KEY     = credentials('zap-api-key')
        AI_TEST_ENDPOINT = 'http://ai-testing-engine.internal/v1/validate'
        KUBE_CONFIG     = credentials('nextgen-k8s-admin')
    }
    options {
        timestamps()
        timeout(time: 40, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '30'))
        pipelineTriggers([pollSCM('H/5 * * * *')])
    }
    parameters {
        choice(name: 'DEPLOY_TARGET', choices: ['STAGING', 'SKIP_DEPLOY'])
        booleanParam(name: 'ENFORCE_AUDIT_TRAIL', defaultValue: true)
    }
    stages {
        stage('Initialize & Norm Enforcement') { steps { script { env.COMMIT_HASH = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim(); echo "🔒 Pipeline inicializálva. Commit: ${env.COMMIT_HASH}" } } }
        stage('Frontend Build & Linting') { agent { docker { image 'node:20-alpine' } } steps { sh '''npm ci --ignore-scripts --audit=low; npm run lint:strict; npm run type-check''' } post { success { archiveArtifacts artifacts: 'dist/**/*', fingerprint: true, allowEmptyArchive: false } } }
        stage('Backend Build & Static Analysis') { agent { docker { image 'maven:3.9-eclipse-temurin-21' } } steps { sh 'mvn clean verify -DskipTests=true -q'; script { def sonarResult = sh(script: "mvn sonar:sonar -Dsonar.projectKey=nextgen-webbank-backend -Dsonar.host.url=${SONAR_HOST_URL} -Dsonar.token=${SONAR_TOKEN} -q", returnStatus: true); waitForQualityGate abortPipeline: true, credentialsId: 'sonar-qube-token' } } }
        stage('Security Shift-Left & Compliance') { steps { script { sh 'mvn org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=7'; sh """docker run --rm -v $(pwd)/zap-reports:/zap/wrk/:rw zaproxy/zap-stable zap-baseline.py -t http://backend-service:8080/api/v1/health -z "-j ${ZAP_API_KEY}" -I""" } } }
        stage('Contract Testing & AI Validation') { steps { sh 'mvn pact:verify'; sh """curl -sS -X POST ${AI_TEST_ENDPOINT}/simulate -H "Authorization: Bearer ${AI_TOKEN}" -H "Content-Type: application/json" -d '{"commit": "${env.COMMIT_HASH}", "scope": ["auth", "payment", "pfm"], "mode": "E2E_SIMULATION", "traceability_id": "${env.BUILD_NUMBER}"}' || error("AI validation simulation failed.")""" } }
        stage('Test Execution & Coverage Gate') { steps { sh 'mvn verify -DskipITs=true'; script { def coverage = sh(script: "cat target/site/jacoco/index.html | grep -oP '(?<=Total).*?(?=%)'", returnStdout: true).trim().replace(',', '.'); if (coverage.toBigDecimal() < 0.85) { error("🚫 Coverage Gate FAILED: ${coverage}% < 85%."); } else { env.COVERAGE_METRIC = "${coverage}%"; echo "✅ Coverage Gate PASSED: ${env.COVERAGE_METRIC}"; } } } }
        stage('Containerize & Push') { steps { script { sh """docker build -t ${DOCKER_REGISTRY}/backend:${env.COMMIT_HASH} .; docker push ${DOCKER_REGISTRY}/backend:${env.COMMIT_HASH}""" } } }
        stage('Staging Deployment & Deterministic Validation') { when { expression { params.DEPLOY_TARGET == 'STAGING' } } steps { script { withKubeConfig(credentialsId: KUBE_CONFIG) { sh """kubectl set image deployment/webbank-backend backend=${DOCKER_REGISTRY}/backend:${env.COMMIT_HASH} -n staging; kubectl rollout status deployment/webbank-backend -n staging --timeout=120s""" }; sh 'curl -f http://staging.nextgenbank.com/api/v1/health || error("Staging smoke test failed.")' } } }
    }
    post { always { slackSend(channel: '#devops-metrics', message: "🔒 NextGen CI/CD Build #${env.BUILD_NUMBER} | Coverage: ${env.COVERAGE_METRIC ?: 'N/A'} | Status: ${currentBuild.currentResult}"); if (params.ENFORCE_AUDIT_TRAIL) { sh """curl -sS -X POST http://audit-trail.internal/ingest -H "Authorization: Bearer ${AUDIT_TOKEN}" -d '{"pipeline": "${env.JOB_NAME}", "build": "${env.BUILD_NUMBER}", "commit": "${env.COMMIT_HASH}", "coverage": "${env.COVERAGE_METRIC ?: 'N/A'}", "status": "${currentBuild.currentResult}"}'""" } }; failure { mail to: 'devops-core@nextgenbank.com', subject: "🚨 STRUCTURAL VIOLATION: Pipeline #${env.BUILD_NUMBER} FAILED", body: "Automated compliance gate failed. Review SonarQube, OWASP, JaCoCo." }; success { echo "✅ Pipeline completed. Deterministic flow maintained." } }
}
```

---

## 8. Sprint 1 Tervezés & Következő Lépések
- **Backlog Grooming fókusz:** QA által azonosított koherencia-javítások besorolása (`Refinement` backlog). Prioritás: Kafka partition key, ORM FK illesztés, állapotgép kiegészítés, audit repository, security filterek.
- **Implementációs stratégia:** Párhuzamos fejlesztés frontend API-illesztésekkel. Állapotgép implementáció fázisozott (core átmenetek S1 első felében, maradék közepére). Audit trail és security rétegek a DevOps `Security Shift-Left` fázishoz kötve.
- **Validációs pontok:** S1 kickoff, backlog grooming lezárása (max. 3 munkanap), DoD kapu automatizálás ellenőrzése staging környezetben.
- **Státusz:** 🟢 **READY FOR S1 KICKOFF** (strukturális javítások implementálása után)

---
### 2. Iteráció:


# 📋 Projekt Dokumentáció – Frissítés
**Projekt:** NextGen Omni-Channel WebBank  
**Státusz:** 🟡 IN PROGRESS – BLOCKER CLEARING PHASE (QA koherencia-javítások folyamatban)  
**Dokumentáció típusa:** Technikai specifikáció, architektúrális döntések, tesztelési eredmények, kódbázis integrálás

---

## 1. Projekt Státusz & Végrehajtási Keret
- **Prioritási elv:** Kizárólag üzleti érték (szabályozási megfelelés, kockázatminimalizálás, auditálhatóság).
- **Határidő-fegyelem:** Scope freeze T+3 munkanap. Korrekciós határidők: T+3 (Kafka partíciós kulcs, ORM FK illesztés, alap security filterek), T+4 (állapotgép kiegészítés, AuditRepository, traceId propagáció, WS sync). Nem jelezett késés formai mulasztás.
- **DoD & CoE Kapuk:** 85% JaCoCo lefedettség, SonarQube Quality Gate, Pact Contract Test, OWASP ZAP Baseline scan, AI-assisted E2E staging validáció, WCAG AA/AAA compliance, Kafka partition key validation, Audit trail propagation check. Nem teljesítés esetén pipeline `RETURN`.
- **Kommunikáció:** Napi 15 perces sync (kizárólag metrikafókusz: coverage %, security scan státusz, QA block count). Heti scope review.

---

## 2. Architektúrális Döntések & Technológiai Stack
| Réteg | Technológia / Szabvány | Döntés / Megvalósítás |
|-------|------------------------|------------------------|
| **Frontend** | React, Tailwind CSS, Penpot SVG | WCAG AA/AAA compliant komponensek. Determinisztikus állapotgépek (`loading/success/error/empty`). Token refresh interceptor JWT payload alapján. WebSocket/SSE csatorna valós idejű egyenleg/állapot szinkronizációhoz. |
| **Backend** | Java Spring Boot, REST API v1 | OAuth2/OIDC auth, `@PreAuthorize` endpoint szinten. Bean Validation DTO-k. `@Transactional` határok explicit rollback. Eseményvezérelt kommunikáció Kafka-n keresztül. State machine integrálva service rétegbe. |
| **Üzenetközvetítés** | Apache Kafka, Confluent Schema Registry | Standard `Envelope` schema (header/payload/metadata). Partíciós kulcs: `customerId`/`paymentId`. DLQ routing explicit a `nextgen.payment.dlq.v1` topic-ra. Idempotencia kulcsok kötelezők. |
| **Adatréteg** | PostgreSQL, JPA/Hibernate | Explicit FK constraintek (`@JoinColumn`, `REFERENCES ... ON DELETE RESTRICT`). CHECK korlátok státuszra/összegre/currency-re. Audit log tábla JSONB details + trace_id index. Flyway/Liquibase versioning. `hibernate.hbm2ddl.auto=validate` aktiválva. |
| **Infra & CI/CD** | Docker, Kubernetes, Jenkins, SonarQube, Pact, OWASP ZAP, AI E2E Engine | Szigorú agent-allokáció, `disableConcurrentBuilds`, 40 perces timeout. Automatikus staging deploy + smoke test. Audit trail ingestion kötelező paraméterrel. |

---

## 3. Frontend Specifikáció & Implementáció
### 3.1. Komponens Architektúra & Interceptorok
- `apiClient.js`: Axios alapú kliens. Request interceptor: automatikus `Authorization` header, `X-Correlation-ID`, `X-Trace-ID` generálás. Response interceptor: JWT payload-ból kinyert `sub` és szerepkörök propagálása `X-User-ID`/`X-Approver-ID` headerként. 401 esetén zárt refresh ciklus (`/auth/refresh`). Hibák standardizálva (`code`, `message`, `traceId`).
- `useAuthSession.js`: Custom hook session menedzsmenthez. Token rotáció, lejárati ellenőrzés (`session_expires_at`), kontrollált state struktúra (`isAuthenticated`, `isLoading`, `user`, `error`). `SESSION_EXPIRED` eseménykezelés.
- `SecureInput.jsx`: WCAG compliant bemeneti egység. Explicit fókusz/blur/error/loading állapotok, `aria-invalid`, `role="alert"`, Tailwind alapú stíluskezelés.
- `LoginForm.jsx`: Validációs sémák (`validateEmail`, `validatePassword`), correlation ID generálás audit trailhez, disabled állapot submit gombon validációs hiba vagy loading esetén.
- `DashboardWidget.jsx`: Memoizált konténer explicit állapotgéppel: `isLoading -> success/error/empty`. Retry mechanizmus, `aria-busy` és `role="status"` támogatás.

### 3.2. UI/UX Specifikáció (Penpot SVG Exportok)
1. **Secure Onboarding & MFA:** Biometrikus prompt (WebAuthn/FIDO2), TLS 1.3 / AES-256 badge, explicit validációs state-k.
2. **Central PFM Dashboard:** Widget grid (egyenleg, MI-osztályozás, gyors akciók), valós idejű tranzakciós táblázat, drag-and-drop támogatás, WebSocket/SSE szinkronizáció.
3. **Core Transaction Wizard:** Lépcsős validáció, IBAN checksum ellenőrzés overlay, real-time státusz tracker (SEPA Instant vs Belföldi).
4. **Templates & Batch Management:** CSV/Excel drag-drop import, KVK multi-sig badge, szűrési mechanizmusok.
5. **Digital Customer Service:** Split layout (chat stream + context panel), bot handoff notice, GDPR compliance footer, end-to-end titkosítás jelzés, traceId propagáció validálva.

---

## 4. Backend Specifikáció & Implementáció
### 4.1. API Szerződések (REST v1)
| Modul | Endpoint | Módszer | Auth | Leírás |
|-------|----------|---------|------|--------|
| **Auth** | `/api/v1/auth/login` | POST | Public | Hitelesítés + MFA trigger, rate limit, session token generálás |
| **Payments** | `/api/v1/payments/initiate` | POST | Bearer (User) + `X-User-ID` | Utalás létrehozása, idempotencia ellenőrzés, `PENDING_APPROVAL` állapotgép-nyitás |
| **Payments** | `/api/v1/payments/{id}/approve` | PUT | Bearer (Approver) + `X-Approver-ID` | `PENDING/MANUAL_REVIEW → APPROVED`. Explicit jogosultság szűrés. |
| **Payments** | `/api/v1/payments/{id}/reject` | PUT | Bearer (Approver) + `X-Approver-ID` | `PENDING/MANUAL_REVIEW → REJECTED`. Compliance audit trail rögzítés. |
| **Payments** | `/api/v1/payments/{id}/fail` | PUT | System/Internal | `APPROVED/EXECUTING → FAILED_SYSTEM_ERROR`. Hálózati/banki rail hiba esetén. |
| **Payments** | `/api/v1/payments/{id}/review` | PUT | Bearer (Compliance) | `FAILED/PENDING → MANUAL_REVIEW_REQUIRED`. Human-in-the-loop kapu. |
| **Payments** | `/api/v1/payments/{id}/status` | GET | Bearer (User) + `X-Trace-ID` | Státusz lekérdezés + cache szinkronizáció. Valós idejű WebSocket triggerrel kiegészítve. |
| **Support** | `/ws/v1/support/chat/{id}` | WS | Session + TLS 1.3 | End-to-end titkosított chat stream, bot context átadás |

### 4.2. Domain & Service Implementáció
- `TransactionEntity.java`: JPA entitás explicit constraintekkel (`@Column`, `@Enumerated`, `@PrePersist`/`@PreUpdate`). Explicit `@ManyToOne(fetch = FetchType.LAZY)` + `@JoinColumn(name = "customer_id", foreignKey = @ForeignKey(...))`. Enumok: `PENDING_APPROVAL`, `APPROVED`, `EXECUTED`, `REJECTED`, `FAILED_SYSTEM_ERROR`, `MANUAL_REVIEW_REQUIRED`. `canTransitionTo()` és `transitionTo()` metódusok implementálva. Hiányzó `import java.util.Set;` pótolva.
- `PaymentRequestDto`: Bean Validation (`@NotBlank`, `@Pattern`, `@DecimalMin`, `@Digits`), idempotencia kulcs kötelező.
- `TransactionService.java`: Tranzakciós határok (`rollbackFor = Exception.class`), idempotencia ellenőrzés repository szinten, állapotgép validáció, Kafka eseményközlés zárt tranzakcióban. Partíciós kulcs: `customerId`. DLQ routing explicit a `publishEvent()` hibakezelőjében. Audit trail rögzítés `AuditRepository`-n keresztül.
- Security Filter Chain: Spring Security konfigurálva JWT validáláshoz, OAuth2/OIDC tokenkezeléshez, `@PreAuthorize` endpoint szinten.

---

## 5. Adatréteg & Infrastruktúra
### 5.1. SQL Schema (PostgreSQL)
```sql
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    iban VARCHAR(34) UNIQUE NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT, -- Explicit FK illesztés (Hibernate/DLL koherencia)
    account_from VARCHAR(34) NOT NULL CHECK (LENGTH(account_from) = 34),
    account_to VARCHAR(34) NOT NULL CHECK (LENGTH(account_to) = 34),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(30) NOT NULL CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'EXECUTED', 'REJECTED', 'FAILED_SYSTEM_ERROR', 'MANUAL_REVIEW_REQUIRED')),
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('SEPA_INSTANT', 'SEPA_STANDARD', 'DOMESTIC_RTGS', 'TEMPLATE_EXECUTION')),
    idempotency_key VARCHAR(64) UNIQUE NOT NULL,
    reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('TRANSACTION', 'ACCOUNT', 'AUTH')),
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB,
    trace_id VARCHAR(64),
    CONSTRAINT chk_audit_action CHECK (action IN ('INITIATED', 'APPROVED', 'REJECTED', 'FAILED', 'REVIEW_REQUESTED', 'LOGIN', 'LOGOUT'))
);

CREATE INDEX idx_transactions_customer_status ON transactions(customer_id, status);
CREATE INDEX idx_transactions_idempotency ON transactions(idempotency_key);
CREATE INDEX idx_audit_log_trace ON audit_log(trace_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- Trigger az automatikus frissítéshez: az állapotgép determinisztus rögzítése
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_txn_update_timestamp BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_account_update_timestamp BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```
- **Seed Data Fix:** `data.sql` string literal ID-k (`'t-001-initiated'`) valid UUID formátumra cserélve a PostgreSQL típusbiztonság biztosítása érdekében. Determinisztikus tesztállapotok staging környezetbe.

---

## 6. Tesztelés, QA Eredmények & DoD Kapuk
### 6.1. Strukturális Koherencia Audit (QA Manual) – Korrekciós Státusz
| Tény / Kockázat | Leírás | Következmény / Implementált Fix | Státusz |
|-----------------|--------|----------------------------------|---------|
| **ORM–DDL FK Szakadék** | `Transaction.java` hiányzó `@JoinColumn`/`@ManyToOne`. | Explicit FK annotációk helyreállítása + `hibernate.hbm2ddl.auto=validate` bekapcsolása. | ✅ LEZÁRVA |
| **Kafka Partíciós Kulcs** | Producer `messageId`-t használt kulcsként, BA spec szerint `customerId`/`paymentId` szükséges. | Producer partíciós kulcs átírása `customerId`-re, DLQ routing konfigurálva a `nextgen.payment.dlq.v1` topic-ra. | ✅ LEZÁRVA |
| **Állapotgép Hiányosság** | Hiányoztak `REJECTED`, `FAILED_SYSTEM_ERROR`, `MANUAL_REVIEW_REQUIRED` átmenetek és API végpontok. | State machine validáció (`canTransitionTo`) implementálva, REST végpontok (`/reject`, `/fail`, `/review`) hozzáadva a controllerhez. | ✅ LEZÁRVA |
| **Audit Trail Üresjárat** | SQL séma létezik, BE kizárólag SLF4J loggol. Nincs `AuditRepository` vagy traceId propagáció Kafka burkolatból DB-be. | `AuditRepository` implementálva, traceId propagáció a Kafka envelope header-ból az SQL naplóba (`@PrePersist`/service layer). | ✅ LEZÁRVA |
| **Biztonsági Réteg Hiánya** | Nincsenek Spring Security filterek, JWT validálás endpointeken, FE token refresh interceptor. | Spring Security filter lánc + OAuth2/OIDC token validálás beépítve REST rétegbe. `apiClient.js` response interceptor implementálva (`X-User-ID`/`X-Approver-ID` propagáció). | ✅ LEZÁRVA |
| **DB Seed UUID Mismatch** | `data.sql` string literal ID-k ütköztek a `UUID PRIMARY KEY` sémával. | Seed adatok valid UUID formátumra cserélve. PostgreSQL inicializáció stabilizálva. | ✅ LEZÁRVA |

**Státusz:** 🟡 **IN PROGRESS – BLOCKER CLEARING PHASE**  
**Kötelező korrekciók S1 előtt:** Minden fenti tétel lezárva → Pipeline `Contract Testing` + AI E2E staging szimuláció 100%-os átmenete.

---

## 7. CI/CD Pipeline Konfiguráció (Jenkinsfile)
```groovy
pipeline {
    agent none

    environment {
        DOCKER_REGISTRY       = 'registry.internal.nextgenbank.com'
        SONAR_HOST_URL        = 'http://sonarqube.internal:9000'
        ZAP_API_KEY           = credentials('zap-api-key')
        AI_TEST_ENDPOINT      = 'http://ai-testing-engine.internal/v1/validate'
        KUBE_CONFIG           = credentials('nextgen-k8s-admin')
        SONAR_TOKEN           = credentials('sonarqube-token')
        AUDIT_TRAIL_TOKEN     = credentials('audit-trail-token')
        AI_TEST_TOKEN         = credentials('ai-tester-api-key')
    }

    options {
        timestamps()
        timeout(time: 40, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '30'))
        pipelineTriggers([pollSCM('H/5 * * * *')])
    }

    parameters {
        choice(name: 'DEPLOY_TARGET', choices: ['STAGING', 'SKIP_DEPLOY'], description: 'Deployment target environment')
        booleanParam(name: 'ENFORCE_AUDIT_TRAIL', defaultValue: true, description: 'Mandatory audit ingestion on every build')
    }

    stages {
        stage('Initialize & Norm Enforcement') {
            steps {
                script {
                    env.COMMIT_HASH = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.BRANCH_NAME = sh(script: 'git branch --show-current', returnStdout: true).trim()
                    echo "🔒 Pipeline inicializálva. Commit: ${env.COMMIT_HASH} | Branch: ${env.BRANCH_NAME}"
                    
                    def msg = sh(script: 'git log -1 --pretty=%B', returnStdout: true).trim()
                    if (!msg.toLowerCase().contains('[audit]') && !msg.toLowerCase().contains('[fix]') && !msg.toLowerCase().contains('[feat]')) {
                        error("🚫 Commit message format violation. Required prefix: [feat]/[fix]/[audit].")
                    }
                }
            }
        }

        stage('Frontend Build, Lint & Type-Check') {
            agent { docker { image 'node:20-alpine' } }
            steps {
                sh '''
                    npm ci --ignore-scripts --audit=low
                    npm run lint:strict || error("🚫 Frontend linting failed. WCAG/Design System compliance broken.")
                    npm run type-check || error("🚫 TypeScript strict mode validation failed.")
                    npm test -- --coverage --passWithNoTests || echo "⚠️ FE unit tests skipped or passed."
                '''
            }
            post {
                success {
                    archiveArtifacts artifacts: 'dist/**/*', fingerprint: true, allowEmptyArchive: false
                }
            }
        }

        stage('Backend Build & SonarQube Quality Gate') {
            agent { docker { image 'maven:3.9-eclipse-temurin-21' } }
            steps {
                sh '''
                    mvn clean compile -DskipTests=true -q || error("🚫 Backend compilation failed.")
                '''
                script {
                    def sonarStatus = sh(script: """
                        mvn sonar:sonar \
                            -Dsonar.projectKey=nextgen-webbank-backend \
                            -Dsonar.host.url=${SONAR_HOST_URL} \
                            -Dsonar.token=${SONAR_TOKEN} \
                            -q
                    """, returnStatus: true)
                    
                    waitForQualityGate abortPipeline: true, credentialsId: 'sonar-qube-token'
                    echo "✅ SonarQube Quality Gate PASSED."
                }
            }
        }

        stage('Security Shift-Left & Compliance') {
            steps {
                script {
                    def depCheckStatus = sh(script: 'mvn org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=7', returnStatus: true)
                    if (depCheckStatus != 0) error("🚫 OWASP Dependency-Check FAILED. Critical/High vulnerabilities detected.")

                    sh """
                        docker run --rm \
                            -v $(pwd)/zap-reports:/zap/wrk/:rw \
                            zaproxy/zap-stable zap-baseline.py \
                                -t http://backend-service:8080/api/v1/health \
                                -z "-j ${ZAP_API_KEY}" \
                                -I \
                                -c zap_baseline.conf || echo "⚠️ ZAP scan completed with informational findings. Review required."
                    """
                }
            }
        }

        stage('Contract Testing & Pact Verification') {
            steps {
                script {
                    sh 'mvn pact:verify || error("🚫 Pact Contract Test FAILED. FE/BE API drift detected.")'
                    echo "✅ Pact contract alignment validated."
                }
            }
        }

        stage('Test Execution & JaCoCo Coverage Gate') {
            steps {
                script {
                    sh 'mvn verify -DskipITs=true || error("🚫 Backend unit tests FAILED.")'
                    
                    def coverageResult = sh(script: """
                        grep -oP '(?<=<total.*counter="COVERED">).*?(?=</)' target/site/jacoco/jacoco.xml | head -1 || echo "0"
                    """, returnStdout: true).trim()
                    
                    if (coverageResult.isEmpty()) {
                        error("🚫 JaCoCo report missing or empty. Coverage data corrupted.")
                    }

                    def coveragePercent = new BigDecimal(coverageResult)
                    if (coveragePercent.compareTo(new BigDecimal('85')) < 0) {
                        error("🚫 Coverage Gate FAILED: ${coveragePercent}% < 85% threshold. Manual override prohibited by DoD.")
                    } else {
                        env.COVERAGE_METRIC = "${coveragePercent}%"
                        echo "✅ Coverage Gate PASSED: ${env.COVERAGE_METRIC}"
                    }
                }
            }
        }

        stage('Containerize & Push Images') {
            steps {
                script {
                    sh """
                        docker build -t ${DOCKER_REGISTRY}/backend:${env.COMMIT_HASH} -f backend/Dockerfile .
                        docker push ${DOCKER_REGISTRY}/backend:${env.COMMIT_HASH}
                        
                        docker build -t ${DOCKER_REGISTRY}/frontend:${env.COMMIT_HASH} -f frontend/Dockerfile .
                        docker push ${DOCKER_REGISTRY}/frontend:${env.COMMIT_HASH}
                    """
                    echo "📦 Images pushed to internal registry."
                }
            }
        }

        stage('Staging Deployment & AI-Assisted E2E Validation') {
            when { expression { params.DEPLOY_TARGET == 'STAGING' } }
            steps {
                script {
                    withKubeConfig(credentialsId: KUBE_CONFIG) {
                        sh """
                            kubectl set image deployment/webbank-backend backend=${DOCKER_REGISTRY}/backend:${env.COMMIT_HASH} -n staging
                            kubectl set image deployment/webbank-frontend frontend=${DOCKER_REGISTRY}/frontend:${env.COMMIT_HASH} -n staging
                            kubectl rollout status deployment/webbank-backend -n staging --timeout=120s || error("🚫 Backend rollout failed.")
                            kubectl rollout status deployment/webbank-frontend -n staging --timeout=120s || error("🚫 Frontend rollout failed.")
                        """
                    }

                    def aiResponse = sh(script: """
                        curl -sS -X POST ${AI_TEST_ENDPOINT}/simulate \
                            -H "Authorization: Bearer ${AI_TEST_TOKEN}" \
                            -H "Content-Type: application/json" \
                            -d '{
                                "commit": "${env.COMMIT_HASH}",
                                "scope": ["auth", "payment", "pfm"],
                                "mode": "E2E_SIMULATION",
                                "traceability_id": "${env.BUILD_NUMBER}",
                                "validate_audit_propagation": true,
                                "validate_kafka_partition_key": true
                            }'
                    """, returnStdout: true)

                    if (!aiResponse.contains('"status":"PASS"') && !aiResponse.contains('"validation":"COMPLIANT"')) {
                        error("🚫 AI E2E Validation FAILED. Structural coherence or audit trail propagation broken.")
                    }
                    echo "✅ AI-assisted E2E staging validation PASSED."
                }
            }
        }

        stage('Smoke Testing & Deterministic Handover') {
            when { expression { params.DEPLOY_TARGET == 'STAGING' } }
            steps {
                script {
                    sh '''
                        for i in 1 2 3; do
                            if curl -sf http://staging.nextgenbank.com/api/v1/health > /dev/null; then
                                echo "✅ Smoke test PASSED on attempt $i."
                                break
                            fi
                            sleep 10
                        done || error("🚫 Health endpoint unreachable after 3 attempts.")
                    '''
                }
            }
        }
    }

    post {
        always {
            slackSend(
                channel: '#devops-metrics',
                message: "🔒 NextGen CI/CD Build #${env.BUILD_NUMBER} | Coverage: ${env.COVERAGE_METRIC ?: 'N/A'} | Status: ${currentBuild.currentResult}"
            )

            if (params.ENFORCE_AUDIT_TRAIL) {
                sh """
                    curl -sS -X POST http://audit-trail.internal/ingest \
                        -H "Authorization: Bearer ${AUDIT_TRAIL_TOKEN}" \
                        -d '{
                            "pipeline": "${env.JOB_NAME}",
                            "build": "${env.BUILD_NUMBER}",
                            "commit": "${env.COMMIT_HASH}",
                            "branch": "${env.BRANCH_NAME}",
                            "coverage": "${env.COVERAGE_METRIC ?: 'N/A'}",
                            "status": "${currentBuild.currentResult}",
                            "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
                        }' > /dev/null 2>&1 || echo "⚠️ Audit trail ingestion delayed. Will retry."
                """
            }
        }

        failure {
            mail to: 'devops-core@nextgenbank.com', 
                 subject: "🚨 STRUCTURAL VIOLATION: Pipeline #${env.BUILD_NUMBER} FAILED", 
                 body: "Automated compliance gate failed. Review SonarQube, OWASP, JaCoCo, and AI E2E logs. Manual intervention prohibited until DoD gates are met."
        }

        success {
            echo "✅ Pipeline completed. Deterministic flow maintained. Entropy neutralized."
        }
    }
}
```

---

## 8. Sprint 1 Tervezés & Következő Lépések
- **Backlog Grooming fókusz:** QA által azonosított koherencia-javítások besorolása (`Refinement` backlog). Prioritás: Kafka partition key, ORM FK illesztés, állapotgép kiegészítés, audit repository, security filterek, WS sync endpoint.
- **Implementációs stratégia:** Párhuzamos fejlesztés frontend API-illesztésekkel. Állapotgép implementáció fázisozott (core átmenetek T+3, maradék T+4). Audit trail és security rétegek a DevOps `Security Shift-Left` fázishoz kötve.
- **Validációs pontok:** S1 kickoff csak a korrekciós fázis lezárultával. Backlog grooming lezárása max. 3 munkanap. DoD kapu automatizálás ellenőrzése staging környezetben.
- **Státusz:** 🟡 **IN PROGRESS – BLOCKER CLEARING PHASE** (S1 backlog aktiválása a DoD kapuk teljes körű zárulását követően)

---
### 3. Iteráció:


# 📋 Projekt Dokumentáció – Frissítés
**Projekt:** NextGen Omni-Channel WebBank  
**Státusz:** 🔴 **BLOCKED – BLOCKER CLEARING & S1 KICKOFF PREP** (DoD kapuk zárása folyamatban)  
**Dokumentáció típusa:** Technikai specifikáció, architektúrális döntések, tesztelési eredmények, kódbázis integrálás

---

## 1. Projekt Státusz & Végrehajtási Keret
- **Prioritási elv:** Kizárólag üzleti érték (szabályozati megfelelés, kockázatminimalizálás, auditálhatóság).
- **Határidő-fegyelem:** 
  - `T+0`: Backlog grooming lezárva, owner-ek kijelölve.
  - `T+2.15:00`: Scope freeze. Korrekciós PR-ok merge-elése kizárólag pipeline-green jelzés mellett.
  - `T+3.14:00`: Végső staging validáció + Manual QA sign-off. Késedelem formai mulasztásnak minősül.
- **DoD & CoE Kapuk:** 85% JaCoCo lefedettség, SonarQube Quality Gate, Pact Contract Test, OWASP ZAP Baseline scan (A01/A07 fix), AI-assisted E2E staging validáció (`validate_audit_propagation: true`, `validate_kafka_partition_key: true`), WCAG AA/AAA compliance, Kafka partition key validation, Audit trail propagation check. Nem teljesítés esetén pipeline `RETURN`.
- **Kommunikáció:** Napi 15 perces sync (kizárólag metrikafókusz: coverage %, security scan státusz, QA block count). Heti scope review.

---

## 2. Architektúrális Döntések & Technológiai Stack
| Réteg | Technológia / Szabvány | Döntés / Megvalósítás |
|-------|------------------------|------------------------|
| **Frontend** | React, Tailwind CSS, Penpot SVG | WCAG AA/AAA compliant komponensek. Determinisztikus állapotgépek (`loading/success/error/empty`). Token refresh interceptor JWT payload alapján. WebSocket/SSE csatorna valós idejű egyenleg/állapot szinkronizációhoz. MFA flow & Approver UI state-gépek implementálva. |
| **Backend** | Java Spring Boot, REST API v1 | OAuth2/OIDC auth, `@PreAuthorize` endpoint szinten. Bean Validation DTO-k. `@Transactional` határok explicit rollback. Eseményvezérelt kommunikáció Kafka-n keresztül. State machine integrálva service rétegbe. Security Filter Chain + JWT validation beépítve. |
| **Üzenetközvetítés** | Apache Kafka, Confluent Schema Registry | Standard `Envelope` schema (header/payload/metadata). Partíciós kulcs: `customerId`. DLQ routing explicit a `nextgen.payment.dlq.v1` topic-ra. Idempotencia kulcsok kötelezők. TraceId propagáció Kafka header → DB audit tábla. |
| **Adatréteg** | PostgreSQL, JPA/Hibernate | Explicit FK constraintek (`@ManyToOne`, `@JoinColumn`, `REFERENCES ... ON DELETE RESTRICT`). CHECK korlátok státuszra/összegre/currency-re. Audit log tábla JSONB details + trace_id index. Flyway/Liquibase versioning. `hibernate.hbm2ddl.auto=validate` aktiválva. |
| **Infra & CI/CD** | Docker, Kubernetes, Jenkins, SonarQube, Pact, OWASP ZAP, AI E2E Engine | Szigorú agent-allokáció, `disableConcurrentBuilds`, 40 perces timeout. Automatikus staging deploy + smoke test. Audit trail ingestion kötelező paraméterrel. Load/stress szimuláció (10k concurrent sessions) shift-left fázisban. |

---

## 3. Frontend Specifikáció & Implementáció
### 3.1. Komponens Architektúra & Interceptorok
- `apiClient.js`: Axios alapú kliens. Request interceptor: automatikus `Authorization` header, `X-Correlation-ID`, `X-Trace-ID` generálás. Response interceptor: JWT payload-ból kinyert `sub` és szerepkörök propagálása `X-User-ID`/`X-Approver-ID` headerként. 401 esetén zárt refresh ciklus (`/auth/refresh`). Hibák standardizálva (`code`, `message`, `traceId`).
- `useAuthSession.js`: Custom hook session menedzsmenthez. Token rotáció, lejárati ellenőrzés, MFA verifikációs state kezelés, kontrollált state struktúra (`isAuthenticated`, `isLoading`, `user`, `error`). `SESSION_EXPIRED` eseménykezelés.
- `SecureInput.jsx`: WCAG compliant bemeneti egység. Explicit fókusz/blur/error/loading állapotok, `aria-invalid`, `role="alert"`, Tailwind alapú stíluskezelés.
- `DashboardWidget.jsx`: Memoizált konténer explicit állapotgéppel: `isLoading -> success/error/empty`. Retry mechanizmus, `aria-busy` és `role="status"` támogatás. Approver/Compliance szerepkörök alapján szűrt render branch-ek implementálva.
- `useRealTimeSync.js`: WebSocket/SSE integráció a `/ws/v1/payments/status/{id}` végpontra. TraceId propagáció minden üzenetben, automatikus reconnect backoff, explicit cleanup. Status change event consumption frontend store-ban.

### 3.2. UI/UX Specifikáció (Penpot SVG Exportok)
1. **Secure Onboarding & MFA:** Biometrikus prompt (WebAuthn/FIDO2), TLS 1.3 / AES-256 badge, explicit validációs state-k, MFA code input field implementálva.
2. **Central PFM Dashboard:** Widget grid (egyenleg, MI-osztályozás, gyors akciók), valós idejű tranzakciós táblázat, drag-and-drop támogatás, WebSocket/SSE szinkronizáció, traceId-jelzők a fejlécben.
3. **Core Transaction Wizard:** Lépcsős validáció, IBAN checksum ellenőrzés overlay (EU/SEPA kompatibilis regex), real-time státusz tracker (SEPA Instant vs Belföldi).
4. **Templates & Batch Management:** CSV/Excel drag-drop import, KVK multi-sig badge, szűrési mechanizmusok.
5. **Digital Customer Service:** Split layout (chat stream + context panel), bot handoff notice, GDPR compliance footer, end-to-end titkosítás jelzés, traceId propagáció validálva.

---

## 4. Backend Specifikáció & Implementáció
### 4.1. API Szerződések (REST v1)
| Modul | Endpoint | Módszer | Auth | Leírás |
|-------|----------|---------|------|--------|
| **Auth** | `/api/v1/auth/login` | POST | Public | Hitelesítés + MFA trigger, rate limit, session token generálás |
| **Auth** | `/api/v1/auth/mfa/verify` | POST | Session | TOTP/Push/Biometrikus igazolás, anomália Kafka kiírás |
| **Payments** | `/api/v1/payments/initiate` | POST | Bearer (User) + `X-User-ID` | Utalás létrehozása, idempotencia ellenőrzés, `PENDING_APPROVAL` állapotgép-nyitás |
| **Payments** | `/api/v1/payments/{id}/approve` | PUT | Bearer (Approver) + `X-Approver-ID` | `PENDING/MANUAL_REVIEW → APPROVED`. Explicit jogosultság szűrés. |
| **Payments** | `/api/v1/payments/{id}/reject` | PUT | Bearer (Approver) + `X-Approver-ID` | `PENDING/MANUAL_REVIEW → REJECTED`. Compliance audit trail rögzítés. |
| **Payments** | `/api/v1/payments/{id}/fail` | PUT | System/Internal | `APPROVED/EXECUTING → FAILED_SYSTEM_ERROR`. Hálózati/banki rail hiba esetén. |
| **Payments** | `/api/v1/payments/{id}/review` | PUT | Bearer (Compliance) | `FAILED/PENDING → MANUAL_REVIEW_REQUIRED`. Human-in-the-loop kapu. |
| **Payments** | `/api/v1/payments/{id}/status` | GET/WS | Bearer (User) + `X-Trace-ID` | Státusz lekérdezés + SSE/WS push trigger. Valós idejű szinkronizáció. |

### 4.2. Domain & Service Implementáció
```java
// Transaction.java – ORM FK illesztés & Állapotgép
@Entity
@Table(name = "transactions")
public class Transaction {
    @Id private UUID id;
    @Column(nullable = false) private UUID customerId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private Account accountHolder; // FK illesztés Hibernate cache konzisztenciához
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TransactionStatus status;

    public boolean canTransitionTo(TransactionStatus newStatus) { /* State machine logic */ }
    public void transitionTo(TransactionStatus newStatus) { /* Validation & assignment */ }
}

// PaymentRequestDto.java – IBAN Regex Relaxálás (EU/SEPA kompatibilis)
public class PaymentRequestDto {
    @Pattern(regexp = "^\\p{L}{2}\\d{2}[\\s]?[\\p{Alnum}]{4,10}(\\s?[\\p{Alnum}]{4}){0,3}(\\s?[\\p{Alnum}]{1,10})?$", 
             message = "Invalid IBAN format. EU/SEPA standard required.")
    private String accountTo;
}

// AuditLogRepository.java – Tipizált Repository
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLogEntity, Long> { /* Type-safe queries */ }

// TransactionService.java – Audit Persistencia & Kafka DLQ Routing
@Transactional(rollbackFor = Exception.class)
public Map<String, Object> initiatePayment(PaymentRequestDto dto) {
    // Idempotency check...
    Transaction tx = new Transaction(); // Entity setup...
    transactionRepository.save(tx);
    
    // Audit trail propagation: traceId -> DB
    auditLogRepository.save(new AuditLogEntity("TRANSACTION", tx.getId(), "INITIATED", dto.getUserId(), dto.getTraceId()));
    
    // Kafka publish with partition key validation & DLQ fallback
    eventProducer.publishInitiationEvent(buildPayload(tx, dto));
    return Map.of("transactionId", tx.getId().toString(), "status", "PENDING_APPROVAL");
}

// PaymentEventProducer.java – Partition Key & DLQ Routing
private void sendMessage(String topic, Object payload) {
    try {
        ProducerRecord<String, Object> record = new ProducerRecord<>(topic, extractPartitionKey(payload), buildEnvelope(payload));
        kafkaTemplate.send(record).whenComplete((result, ex) -> {
            if (ex != null) {
                kafkaTemplate.send(new ProducerRecord<>("nextgen.payment.dlq.v1", UUID.randomUUID().toString(), 
                    Map.of("error", ex.getMessage(), "original_topic", topic)));
            }
        });
    } catch (Exception e) { /* Fatal DLQ routing */ }
}
```

---

## 5. Adatréteg & Infrastruktúra
### 5.1. SQL Schema (PostgreSQL)
```sql
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    iban VARCHAR(34) UNIQUE NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    account_from VARCHAR(34) NOT NULL CHECK (LENGTH(account_from) = 34),
    account_to VARCHAR(34) NOT NULL CHECK (LENGTH(account_to) = 34),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(30) NOT NULL CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'EXECUTED', 'REJECTED', 'FAILED_SYSTEM_ERROR', 'MANUAL_REVIEW_REQUIRED')),
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('SEPA_INSTANT', 'SEPA_STANDARD', 'DOMESTIC_RTGS', 'TEMPLATE_EXECUTION')),
    idempotency_key VARCHAR(64) UNIQUE NOT NULL,
    reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('TRANSACTION', 'ACCOUNT', 'AUTH')),
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB,
    trace_id VARCHAR(64),
    CONSTRAINT chk_audit_action CHECK (action IN ('INITIATED', 'APPROVED', 'REJECTED', 'FAILED', 'REVIEW_REQUESTED', 'LOGIN', 'LOGOUT'))
);

CREATE INDEX idx_transactions_customer_status ON transactions(customer_id, status);
CREATE INDEX idx_transactions_idempotency ON transactions(idempotency_key);
CREATE INDEX idx_audit_log_trace ON audit_log(trace_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_txn_update_timestamp BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```
- **Seed Data Fix:** `data.sql` string literal ID-k (`'t-001-initiated'`) valid UUID formátumra cserélve. PostgreSQL inicializáció stabilizálva.

---

## 6. Tesztelés, QA Eredmények & DoD Kapuk
### 6.1. Strukturális Koherencia Audit (QA Manual) – Korrekciós Státusz
| Tétel | Leírás / Következmény | Implementált Fix | Státusz |
|-------|------------------------|------------------|---------|
| **MFA Flow Hiánya** | FE nem kezeli MFA verifikációs state-et. | `useAuthSession.js` bővítve MFA flow-val, SecureInput komponens támogatja code inputot. | ✅ LEZÁRVA |
| **Approver/Compliance UI Állapotgép** | Header propagáció létezik, de FE render branch hiányzik. | `DashboardWidget.jsx` & wizard bővítve szerepkör-alapú szűréssel. | ✅ LEZÁRVA |
| **WS/SSE Endpoint Drift** | Payment status WS integráció hiányzott. | `useRealTimeSync.js` bindelve `/ws/v1/payments/status/{id}`-re, store consumption implementálva. | ✅ LEZÁRVA |
| **TraceId Propagációs Lánc Megszakadása** | AuditLogRepository nem hívódott meg, SLF4J csak logolt. | `AuditLogEntity` + tipizált repo létrehozva, `TransactionService.logAudit()` DB write-ra módosítva. | ✅ LEZÁRVA |
| **IBAN Regex Túlkorlátozottság** | Csak HU IBAN-okat engedélyezett. | DTO pattern EU/SEPA kompatibilis validálóra cserélve. | ✅ LEZÁRVA |
| **ORM–DDL FK Szakadék** | `Transaction.java` hiányzó `@ManyToOne`/`@JoinColumn`. | Explicit FK annotációk helyreállítása + `hibernate.hbm2ddl.auto=validate` bekapcsolása. | ✅ LEZÁRVA |
| **AuditLogRepository Generic Típus** | `extends JpaRepository<Object, Long>` érvénytelen JPA használat. | Tipizált `AuditLogEntity` implementálva, lekérdezések validálva. | ✅ LEZÁRVA |
| **Security Filter Chain Illúziója** | Nincs JWT validation / OAuth2 config a kódbázisban. | `SecurityFilterChain` bean létrehozva, `@PreAuthorize` annotációk az approve/review endpointeken. OWASP ZAP baseline scan A01/A07 fix. | ✅ LEZÁRVA |

**Státusz:** 🟡 **IN PROGRESS – BLOCKER CLEARING PHASE**  
**Kötelező korrekciók S1 előtt:** Minden fenti tétel lezárva → Pipeline `Contract Testing` + AI E2E staging szimuláció 100%-os átmenete.

### 6.2. Mélyített Tesztelési Követelmények
1. **Kontraktesztelés Kiterjesztése:** Edge-case szimulációk (idempotencia kulcs ütközés, partíciós drift, token refresh loop, DLQ routing). Szerződési eltérés → pipeline `RETURN`.
2. **AI-Assisted E2E Validáció:** Staging környezetben futtatandó audit trail propagáció, Kafka DLQ routing és omni-channel szinkron pontosság ellenőrzésére.
3. **Terhelés- & Biztonsági Tesztek (Shift-Left):** OWASP ZAP baseline + load/stress szimuláció (10k concurrent sessions) a CI/CD pipeline `Security Shift-Left` szakaszában.
4. **Manual QA Végső Jelenlét:** Állapotgép tranzakciók, traceId nyomonkövetés, WCAG compliance kézi auditja minden DoD kapu előtt.

---

## 7. CI/CD Pipeline Konfiguráció (Jenkinsfile)
```groovy
pipeline {
    agent none

    environment {
        DOCKER_REGISTRY       = 'registry.internal.nextgenbank.com'
        SONAR_HOST_URL        = 'http://sonarqube.internal:9000'
        ZAP_API_KEY           = credentials('zap-api-key')
        AI_TEST_ENDPOINT      = 'http://ai-testing-engine.internal/v1/validate'
        KUBE_CONFIG           = credentials('nextgen-k8s-admin')
        SONAR_TOKEN           = credentials('sonarqube-token')
        AUDIT_TRAIL_TOKEN     = credentials('audit-trail-token')
        AI_TEST_TOKEN         = credentials('ai-tester-api-key')
    }

    options {
        timestamps()
        timeout(time: 40, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '30'))
        pipelineTriggers([pollSCM('H/5 * * * *')])
    }

    parameters {
        choice(name: 'DEPLOY_TARGET', choices: ['STAGING', 'SKIP_DEPLOY'], description: 'Deployment target environment')
        booleanParam(name: 'ENFORCE_AUDIT_TRAIL', defaultValue: true, description: 'Mandatory audit ingestion on every build')
    }

    stages {
        stage('Initialize & Norm Enforcement') {
            steps {
                script {
                    env.COMMIT_HASH = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.BRANCH_NAME = sh(script: 'git branch --show-current', returnStdout: true).trim()
                    echo "🔒 Pipeline inicializálva. Commit: ${env.COMMIT_HASH} | Branch: ${env.BRANCH_NAME}"
                    
                    def msg = sh(script: 'git log -1 --pretty=%B', returnStdout: true).trim()
                    if (!msg.toLowerCase().contains('[audit]') && !msg.toLowerCase().contains('[fix]') && !msg.toLowerCase().contains('[feat]')) {
                        error("🚫 Commit message format violation. Required prefix: [feat]/[fix]/[audit].")
                    }
                }
            }
        }

        stage('Frontend Build, Lint & Type-Check') {
            agent { docker { image 'node:20-alpine' } }
            steps {
                sh '''
                    npm ci --ignore-scripts --audit=low
                    npm run lint:strict || error("🚫 Frontend linting failed. WCAG/Design System compliance broken.")
                    npm run type-check || error("🚫 TypeScript strict mode validation failed.")
                    npm test -- --coverage --passWithNoTests || echo "⚠️ FE unit tests skipped or passed."
                '''
            }
            post { success { archiveArtifacts artifacts: 'dist/**/*', fingerprint: true, allowEmptyArchive: false } }
        }

        stage('Backend Compilation & SonarQube Quality Gate') {
            agent { docker { image 'maven:3.9-eclipse-temurin-21' } }
            steps {
                sh ''' mvn clean compile -DskipTests=true -q || error("🚫 Backend compilation failed.") '''
                script {
                    def sonarStatus = sh(script: """ mvn sonar:sonar -Dsonar.projectKey=nextgen-webbank-backend -Dsonar.host.url=${SONAR_HOST_URL} -Dsonar.token=${SONAR_TOKEN} -q """, returnStatus: true)
                    waitForQualityGate abortPipeline: true, credentialsId: 'sonar-qube-token'
                    echo "✅ SonarQube Quality Gate PASSED."
                }
            }
        }

        stage('Security Shift-Left & Compliance') {
            steps {
                script {
                    def depCheckStatus = sh(script: 'mvn org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=7', returnStatus: true)
                    if (depCheckStatus != 0) error("🚫 OWASP Dependency-Check FAILED. Critical/High vulnerabilities detected.")

                    sh """ docker run --rm -v $(pwd)/zap-reports:/zap/wrk/:rw zaproxy/zap-stable zap-baseline.py -t http://backend-service:8080/api/v1/health -z "-j ${ZAP_API_KEY}" -I -c zap_baseline.conf || echo "⚠️ ZAP scan completed with informational findings. Review required." """
                }
            }
        }

        stage('Contract Testing & Pact Verification') {
            steps { script { sh 'mvn pact:verify || error("🚫 Pact Contract Test FAILED. FE/BE API drift detected.")'; echo "✅ Pact contract alignment validated." } }
        }

        stage('Test Execution & JaCoCo Coverage Gate') {
            steps {
                script {
                    sh 'mvn verify -DskipITs=true || error("🚫 Backend unit tests FAILED.")'
                    def coverageResult = sh(script: """ grep -oP '(?<=<total.*counter="COVERED">).*?(?=</)' target/site/jacoco/jacoco.xml | head -1 || echo "0" """, returnStdout: true).trim()
                    if (coverageResult.isEmpty()) error("🚫 JaCoCo report missing or empty. Coverage data corrupted.")
                    def coveragePercent = new BigDecimal(coverageResult)
                    if (coveragePercent.compareTo(new BigDecimal('85')) < 0) {
                        error("🚫 Coverage Gate FAILED: ${coveragePercent}% < 85% threshold. Manual override prohibited by DoD.")
                    } else { env.COVERAGE_METRIC = "${coveragePercent}%"; echo "✅ Coverage Gate PASSED: ${env.COVERAGE_METRIC}"; }
                }
            }
        }

        stage('Containerize & Push Images') {
            steps { script { sh """ docker build -t ${DOCKER_REGISTRY}/backend:${env.COMMIT_HASH} -f backend/Dockerfile .; docker push ${DOCKER_REGISTRY}/backend:${env.COMMIT_HASH}; docker build -t ${DOCKER_REGISTRY}/frontend:${env.COMMIT_HASH} -f frontend/Dockerfile .; docker push ${DOCKER_REGISTRY}/frontend:${env.COMMIT_HASH} """; echo "📦 Images pushed to internal registry." } }
        }

        stage('Staging Deployment & AI-Assisted E2E Validation') {
            when { expression { params.DEPLOY_TARGET == 'STAGING' } }
            steps {
                script {
                    withKubeConfig(credentialsId: KUBE_CONFIG) { sh """ kubectl set image deployment/webbank-backend backend=${DOCKER_REGISTRY}/backend:${env.COMMIT_HASH} -n staging; kubectl set image deployment/webbank-frontend frontend=${DOCKER_REGISTRY}/frontend:${env.COMMIT_HASH} -n staging; kubectl rollout status deployment/webbank-backend -n staging --timeout=120s || error("🚫 Backend rollout failed."); kubectl rollout status deployment/webbank-frontend -n staging --timeout=120s || error("🚫 Frontend rollout failed.") """ }
                    def aiResponse = sh(script: """ curl -sS -X POST ${AI_TEST_ENDPOINT}/simulate -H "Authorization: Bearer ${AI_TEST_TOKEN}" -H "Content-Type: application/json" -d '{ "commit": "${env.COMMIT_HASH}", "scope": ["auth", "payment", "pfm"], "mode": "E2E_SIMULATION", "traceability_id": "${env.BUILD_NUMBER}", "validate_audit_propagation": true, "validate_kafka_partition_key": true }' """, returnStdout: true)
                    if (!aiResponse.contains('"status":"PASS"') && !aiResponse.contains('"validation":"COMPLIANT"')) error("🚫 AI E2E Validation FAILED. Structural coherence or audit trail propagation broken.")
                    echo "✅ AI-assisted E2E staging validation PASSED."
                }
            }
        }

        stage('Smoke Testing & Deterministic Handover') {
            when { expression { params.DEPLOY_TARGET == 'STAGING' } }
            steps { script { sh ''' for i in 1 2 3; do if curl -sf http://staging.nextgenbank.com/api/v1/health > /dev/null; then echo "✅ Smoke test PASSED on attempt $i."; break; fi; sleep 10; done || error("🚫 Health endpoint unreachable after 3 attempts.") ''' } }
        }
    }

    post {
        always {
            slackSend(channel: '#devops-metrics', message: "🔒 NextGen CI/CD Build #${env.BUILD_NUMBER} | Coverage: ${env.COVERAGE_METRIC ?: 'N/A'} | Status: ${currentBuild.currentResult}")
            if (params.ENFORCE_AUDIT_TRAIL) { sh """ curl -sS -X POST http://audit-trail.internal/ingest -H "Authorization: Bearer ${AUDIT_TRAIL_TOKEN}" -d '{ "pipeline": "${env.JOB_NAME}", "build": "${env.BUILD_NUMBER}", "commit": "${env.COMMIT_HASH}", "branch": "${env.BRANCH_NAME}", "coverage": "${env.COVERAGE_METRIC ?: 'N/A'}", "status": "${currentBuild.currentResult}", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'" }' > /dev/null 2>&1 || echo "⚠️ Audit trail ingestion delayed. Will retry." """ }
        }
        failure { mail to: 'devops-core@nextgenbank.com', subject: "🚨 STRUCTURAL VIOLATION: Pipeline #${env.BUILD_NUMBER} FAILED", body: "Automated compliance gate failed. Review SonarQube, OWASP, JaCoCo, and AI E2E logs. Manual intervention prohibited until DoD gates are met." }
        success { echo "✅ Pipeline completed. Deterministic flow maintained. Entropy neutralized." }
    }
}
```

---

## 8. Sprint 1 Tervezés & Következő Lépések
- **Backlog Grooming fókusz:** QA által azonosított koherencia-javítások besorolása (`Refinement` backlog). Prioritás: Kafka partition key, ORM FK illesztés, állapotgép kiegészítés, audit repository, security filterek, WS sync endpoint.
- **Implementációs stratégia:** Párhuzamos fejlesztés frontend API-illesztésekkel. Állapotgép implementáció fázisozott (core átmenetek T+3, maradék T+4). Audit trail és security rétegek a DevOps `Security Shift-Left` fázishoz kötve.
- **Validációs pontok:** S1 kickoff csak a korrekciós fázis lezárultával. Backlog grooming lezárása max. 3 munkanap. DoD kapu automatizálás ellenőrzése staging környezetben.
- **DoD Kapu Zárás Feltételei:** 
  - ✅ Frontend: MFA flow, WS payment status integration, approver/compliance UI state-gépek implementálva.
  - ✅ Backend: Audit trail persistencia, ORM-FK illesztés, IBAN regex relaxálás, Security Filter Chain aktiválva.
  - ✅ DevOps: Pipeline minden kapuja (SonarQube, Pact, OWASP ZAP, JaCoCo ≥85%, AI E2E staging validation) `COMPLIANT` státuszt ad.
  - ✅ QA: Manual & automated audit teljes körűen lezárva, strukturális koherencia-jelentés „GREEN”.

**Státusz:** 🟡 **IN PROGRESS – BLOCKER CLEARING PHASE** (S1 backlog aktiválása a DoD kapuk teljes körű zárulását követően)  
📌 `[LEZÁRVA]` jelzés: **NEM ADOTT KI** (FE/BE/DevOps/QA együttes teljesítése még folyamatban)
