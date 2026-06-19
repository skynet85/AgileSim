# LLMOps Szimuláció Eredménye

## 🎯 Eredeti Üzleti Igény
> Kérek egy általános banki alkalmazást ami versenyre tud kellni a revoluttal

## 🤖 A Csapat Munkája és a Működés
Ez a kódbázis egy többágenses (Multi-Agent) agilis LLMOps szimuláció végterméke. A folyamat során a PO, BA, UX, Frontend, Backend, DevOps, QA és Scrum Master ágensek iteratív viták során dolgozták ki a specifikációt, a kódokat, valamint a UI/UX és Penpot terveket.

## 📂 Projekt Memória (Záró állapot)

### 1. Iteráció:


# 📄 Projekt Dokumentáció Frissítés – D+0
**Státusz:** Indítás / MVP Fejlesztés  
**Dokumentálási Szint:** Technikai Specifikáció & Implementációs Állapot  

---

## 1. Üzleti & Műszaki Követelmények (Definition of Done)
| Metrika | Célérték | Validáció Módszere |
|---------|----------|---------------------|
| Tranzakciós végrehajtás | `<200ms` p95 latency | `/health/system` endpoint metrikák, load test ≥3x peak forgalommal |
| Rendszer rendelkezésre állás | `99.95%` SLA | Uptime monitorozás, failover szimulációk |
| API válaszidő | `<500ms` | Gateway logok, OpenTelemetry tracing |
| Díjmentes sáv | Első 50k havi forgalom | Billing modul konfiguráció, tranzakció aggregáció |
| Felhasználói megtartás | `>85%` (3. hónapig) | Cohort analitika, churn rate tracking |
| Compliance | PSD2/AML teljes megfelelés | Audit trail konzisztencia, szabályrendszer verziókezelése, havi automatikus report generálás |

**Szabálykövetés:** Minden feladathoz szigorú DoD köthető. Státuszjelentések: `D+3`, `D+7`, `D+10`. Csak progress percent és blockerek rögzítendők. Késedelem esetén a következő feladat blokkolása root cause dokumentálásáig.

---

## 2. Architektúrális Döntések
- **Eseményalapú (Event-Driven) architektúra:** Kafka üzenetsor mint központi adatfolyam. Idempotencia kulcs (`correlationId`) kötelező minden írási műveletnél.
- **CQRS + Hibrid Event Sourcing:** Kritikus tranzakciós útvonalakon eseményforrás, kevésbé kritikus lekérdezéseken OLTP cache a `≥3x peak` terhelési küszöb eléréséig.
- **Sémakezelés:** Avro sémák + Schema Registry. Kompatibilitási szabály: `BACKWARD` / `FORWARD`. Runtime típuskonverzió tiltva.
- **Hibakezelés & Reziliencia:** API Gateway versioning (`/api/v1/...`), Circuit Breaker (`Resilience4j`), Dead Letter Topic (DLT) konfiguráció a compliance topicokra.

---

## 3. Frontend Specifikációk & Kódstruktúra
- **Stack:** React 18+, TypeScript, Tailwind CSS, `useReducer` determinisztikus állapotkezeléshez.
- **Állapotmenedzsment:** Lokális state mock helyett SSE/WebSocket fogyasztás a `transactions.raw` topicból. Optimistic/Pessimistic update stratégia implementálandó.
- **Pagináció:** Keyset pagination (`createdAt` + `id`), cache invalidáció tranzakció eseményre. Mock `Math.random()` cursor tiltva.
- **Kötelező HTTP Interceptor:** 
  - Fejlécek injektálása: `Idempotency-Key` (UUIDv7), `X-Request-ID`, `Authorization: Bearer <JWT>`.
  - Hibaátvitel blokkolása, retry logika exponenciális backoffkal.
- **Komponensarchitektúra:** `React.memo` optimalizálás, custom hookok (`useBalance`, `useKycStateMachine`, `useComplianceSignals`), globális stílusinjekció a design systemből.

---

## 4. Backend & API Integráció
- **Stack:** Spring Boot, Java 17+, Testcontainers (Kafka/Postgres integration tesztekhez).
- **Tranzakciós Motor (`TransactionService`):** 
  - Idempotencia guard DB szinten a Kafka publish előtt.
  - Eseménykonstruktor: `TransactionEvent` builder pattern, metadata `riskScore` dinamikus értékelésre cserélendő (hardcoded `0.1f` tiltva).
  - CQRS read model projection: `getBalance()` végrehajtása eventually consistent read replica-ról.
- **API Végpontok:**
  | Módszer | Endpoint | Kötelező Fejlécek | Visszatérési Kód |
  |---------|----------|-------------------|------------------|
  | `POST` | `/api/v1/users/registration` | `Content-Type`, `Authorization` | `201 Created` |
  | `POST` | `/api/v1/kyc/documents` | `Idempotency-Key`, `X-Request-ID` | `202 Accepted` |
  | `POST` | `/api/v1/accounts/{accountId}/transactions` | `Idempotency-Key`, `Authorization` | `202 Accepted` |
  | `GET` | `/api/v1/accounts/{accountId}/balance` | `Authorization` | `200 OK` |
  | `POST` | `/api/v1/compliance/review/{signalId}` | `Authorization` | `200 OK` |
  | `GET` | `/api/v1/health/system` | – | `200 OK` (SLA metrikák) |

---

## 5. Kafka Topikarchitektúra & Sémák
| Topic | Partíciókulcs | Retenció | Min Replicas | Kulcsmezők |
|-------|---------------|----------|--------------|------------|
| `transactions.raw` | `userId` | 90 nap | 3 | `id`(UUIDv7), `timestamp`, `type`(ENUM), `amount`(DECIMAL), `currency`, `correlationId`, `status`, `metadata.channel/riskScore` |
| `kyc.events` | `userId` | 7 év | 3 | `eventType`(ENUM), `documentType`, `verificationHash`(SHA-256), `complianceOfficerId` |
| `aml.risk.signals` | `riskLevel` | 180 nap | 2 | `signalId`(UUIDv7), `triggeredRule`, `actionRequired`(ENUM), `transactionContext.velocity` |

**Validáció:** Producer oldali Avro séma validáció kötelező. Null/empty `userId` esetén fallback partíciókulcs (`correlationId`) alkalmazandó.

---

## 6. Tesztelési Eredmények & Hibajegyzék (QA)
| Hibakód | Leírás | Szint | Prioritás | Intézkedés / Validáció |
|---------|--------|-------|-----------|------------------------|
| `F-B-01` | HTTP interceptor hiánya (`Idempotency-Key`, `X-Request-ID`) | FE/BE | P0 | Globális API client wrapper implementálása. Newman test: minden POST tartalmazza a fejléceket, 409 returned duplicate esetén. |
| `F-B-02` | Aszinkron állapot-drift (frontend mock vs backend read model) | FE/Kafka | P1 | SSE/WebSocket subscriber implementálása. Load test: UI frissülés <3s backend állapot szerint. |
| `K-01` | JSON serializáció vs Avro séma szakadék | BE/Kafka | P0 | Confluent AvroSerializer + Schema Registry csatolás. `kafka-console-consumer` schema validation zöldek. |
| `K-03` | Hiányzó KYC/AML topik producer/consumer | BE/Compliance | P1 | Dedikált service implementálása, DLT konfiguráció. E2E compliance flow teszt: upload → topic → risk signal → UI review. |
| `C-01` | Hardcoded `riskScore (0.1f)` | BE/AML | P1 | Async AML rule engine integráció, státusz `PENDING_RISK_ASSESSMENT` használata. |

---

## 7. CI/CD Pipeline Konfiguráció
**Eszköz:** Jenkinsfile (Mono-repo, párhuzamos végrehajtás)  
**Stádiumok & Kapuk:**
1. **Source Validation:** Repository struktúra ellenőrzése (`package.json`, `pom.xml`).
2. **Parallel Build & Test:** 
   - FE: `npm ci`, `lint:ci`, `test --coverage`, `build`
   - BE: `mvn clean verify` (Testcontainers: Kafka/Postgres, Idempotency & Outbox integration tesztek)
3. **Schema & Contract Gate:** Avro `BACKWARD` kompatibilitás ellenőrzése. `grep` alapú tiltólista `//.*TODO\|//.*mock` jelekre a header/idempotencia implementációkban.
4. **Security Audit:** `npm audit`, `mvn dependency-check:check -DfailBuildOnCVSS=7`.
5. **Package & Push:** Docker image build & push (`registry.nexusbank.internal`).
6. **Deploy to Staging:** Helm upgrade (`--wait --timeout=5m`), 0 downtime rolling update.
7. **Post-Deploy Smoke Test:** `curl -sf http://nexus-staging.internal/health/system`, p95 latency & topic lag validáció.

**Kimenet:** Slack notification (`#nexus-pipeline-success/failure`). Sikertelen build esetén azonnali blokkolás, nem engedélyezi a devianciát.

---

## 8. Zárási Kritériumok
A projekt státusza `[LEZÁRVA]` **CSAK** akkor módosítható, ha az alábbi feltételek formálisan és metrikailag igazoltan teljesülnek:
- ✅ **Frontend:** Interceptor implementálva + state sync (SSE/WebSocket) validálva + cursor pagination refactor tesztelt.
- ✅ **Backend:** AvroSerializer + Schema Registry csatolva + Outbox pattern transactional publish működik + KYC/AML topikok producer/consumer aktiválva + riskScore dinamikus értékelés integrálva.
- ✅ **DevOps:** Jenkins pipeline sikeresen lefutott (zöld) + staging deploy végrehajtva + smoke test metrikák (`p95`, `topic lag`, `error rate`) keretben.
- ✅ **QA:** E2E compliance flow validálva + DoD teljesül + SLA metrikák dokumentálva.

**Következő lépés:** Fenti pontok teljesítése után a sprint átadása operatív üzemeltetésre. Dokumentáció frissítve: D+0.

---
### 2. Iteráció:


# 📄 Projekt Dokumentáció Frissítés – D+0 (Sprint 1 / P0/P1 Javítás)
**Státusz:** `[FOLYAMBAN] | BLOKKOLÓK KEZELESE ALATT`  
**Dokumentálási Szint:** Technikai Specifikáció & Implementációs Állapot  

---

## 1. Üzleti & Műszaki Követelmények (Definition of Done)
| Metrika | Célérték | Validáció Módszere |
|---------|----------|---------------------|
| Tranzakciós végrehajtás | `<200ms` p95 latency | `/health/system` endpoint metrikák, load test ≥3x peak forgalommal |
| Rendszer rendelkezésre állás | `99.95%` SLA | Uptime monitorozás, failover szimulációk, DLQ消费率 <0.1% |
| API válaszidő | `<500ms` | Gateway logok, OpenTelemetry tracing |
| Díjmentes sáv | Első 50k havi forgalom | Billing modul konfiguráció, tranzakció aggregáció |
| Felhasználói megtartás | `>85%` (3. hónapig) | Cohort analitika, churn rate tracking |
| Compliance | PSD2/AML teljes megfelelés | Audit trail konzisztencia, szabályrendszer verziókezelése, havi automatikus report generálás |

**Tesztelési Követelmény:** Mélyebb E2E tesztelés kötelező előfeltétel. Load környezetben minden komponensnél le kell futtatni a teljes forgatókönyvet (Kafka topikok partíciókiosztásának szimulálása, compliance audit trail konzisztenciájának formális igazolása). Mock state használata tiltott. Aszinkron drift tolerálása nem engedélyezett.

**Határidők & Következmények:**
- `D+2 17:00:` Minden P0 javítás staging-re kerül. Pipeline konfiguráció finalizálása.
- `D+3 09:00:` Smoke test lefutása valós metrikafogyasztással (`p95`, `topic lag`, `error rate`). Baseline mérése.
- Késedelem esetén a következő sprint feladatai blokkolva maradnak root cause dokumentálásáig.

---

## 2. Architektúrális Döntések
- **Eseményalapú (Event-Driven) architektúra:** Kafka üzenetsor mint központi adatfolyam. Idempotencia kulcs (`correlationId`/UUIDv7) kötelező minden írási műveletnél. Élettartam: `24h` DB tárolásban, automatikus TTL purge.
- **CQRS + Hibrid Event Sourcing:** Kritikus tranzakciós útvonalakon Outbox pattern + `KafkaTransactionManager` kombináció garantálja az atomaritást. Read modellek eventually consistent read replica-ról szinkronizálódnak SSE/WebSocket-en keresztül.
- **Sémakezelés:** Avro sémák + Schema Registry. Kompatibilitási szabály: `BACKWARD`. Runtime típuskonverzió tiltva. Producer oldali validáció kötelező a pipeline `Schema & Contract Gate` lépésében.
- **Hibakezelés & Reziliencia:** API Gateway versioning (`/api/v1/...`), Circuit Breaker (`Resilience4j`), Dead Letter Topic (DLT) konfiguráció compliance topicokra. Exponenciális backoff retry (max 3x). Sikertelen feldolgozás esetén `DLT.<topic>.dead` routing + alerting hook.
- **Partíciókulcs Routing:** Alapértelmezett: `userId`. Ha null/empty: fallback `correlationId`. Hash-algoritmus: `Murmur3`. Hot partition kizárása peak terhelésnél kötelező.

---

## 3. Frontend Specifikációk & Kódstruktúra
- **Stack:** React 18+, TypeScript, Tailwind CSS, `useReducer` determinisztikus állapotkezeléshez.
- **Állapotmenedzsment:** Lokális mock helyett valós `EventSource('/transactions.raw/stream')` vagy WebSocket fogyasztás. Optimistic/Pessimistic update stratégia implementálva: `OPTIMISTIC_ADD` → `EVENT_COMMIT`/`EVENT_REJECT` átmenetekkel, delta-kalkuláció kezeli a `PENDING → APPROVED/FAILED` visszavonást.
- **Pagináció:** Keyset pagination (`createdAt` + `id`), cache invalidáció tranzakció eseményre. Mock `Math.random()` cursor tiltva. DB lekérdezés: `WHERE (created_at, id) < ?`.
- **Kötelező HTTP Interceptor:** 
  - Fejlécek injektálása: `Idempotency-Key` (UUIDv7), `X-Request-ID` (UUIDv4), `Authorization: Bearer <JWT>`. Propagálás írási és olvasási útvonalakon is.
  - Hibaátvitel blokkolása, retry logika exponenciális backoffkal. 409 esetén azonnali blokkolás.
- **Komponensarchitektúra:** `React.memo` optimalizálás, custom hookok (`useBalance`, `useKycStateMachine`, `useComplianceSignals`), globális stílusinjekció a design systemből. UI struktúra: Balance card, transaction list (optimistic → eventual consistency), modal flow.

---

## 4. Backend & API Integráció
- **Stack:** Spring Boot, Java 17+, Testcontainers (Kafka/Postgres integration tesztekhez).
- **Tranzakciós Motor (`TransactionService`):** 
  - Idempotencia guard DB szinten `IdempotencyKeyEntity` táblában.
  - Outbox pattern: `@Transactional` scope kiterjesztése DB jegyzés + Kafka publish egységére. Scheduled processor (`fixedRate=1000ms`) kezeli a `PENDING → SENT/FAILED` átmenetet.
  - Eseménykonstruktor: Strict Avro serialization (`KafkaAvroSerializer`). Metadata `riskScore` dinamikus értékelésre cserélendő (async AML rule engine hívás, hardcoded tiltva).
  - CQRS read model projection: `getBalance()` végrehajtása eventually consistent read replica-ról.
- **API Végpontok:**
| Módszer | Endpoint | Kötelező Fejlécek | Kérés Struktúra | Visszatérési Kód |
|---------|----------|-------------------|-----------------|------------------|
| `POST` | `/api/v1/users/registration` | `Content-Type`, `Idempotency-Key`, `X-Request-ID` | `{ "personalData": {...}, "kycLevel": "UNVERIFIED" }` | `201 Created` + `Location` |
| `POST` | `/api/v1/kyc/documents` | `Idempotency-Key`, `X-Request-ID`, `Authorization` | Multipart: `{ "documentType", "file" }` | `202 Accepted` |
| `POST` | `/api/v1/accounts/{accountId}/transactions` | `Idempotency-Key`, `Authorization`, `X-Request-ID` | `{ "amount", "currency", "type", "counterpartyId" }` | `202 Accepted` |
| `GET` | `/api/v1/accounts/{accountId}/balance` | `Authorization`, `X-Request-ID` | – | `200 OK`: `{ "available", "pending", "currency", "lastSyncedAt" }` |
| `GET` | `/api/v1/accounts/{accountId}/transactions?cursor=&limit=6` | `Authorization`, `X-Request-ID` | Query params: `cursor` (createdAt+id), `limit` (max 50) | `200 OK`: `{ "data", "nextCursor", "hasMore" }` |
| `POST` | `/api/v1/compliance/review/{signalId}` | `Authorization`, `X-Request-ID` | `{ "action", "notes" }` | `200 OK` |
| `GET` | `/api/v1/health/system` | – | – | `200 OK`: `{ "uptime", "p95_latency", "topic_lag", "sla_compliance" }` |

---

## 5. Kafka Topikarchitektúra & Sémák
| Topic | Partíciókulcs | Retenció | Min Replicas | Kulcsmezők / Envelope Struktúra |
|-------|---------------|----------|--------------|--------------------------------|
| `transactions.raw` | `userId` (fallback: `correlationId`) | 90 nap | 3 | `meta.correlationId`, `headers.Idempotency-Key/X-Request-ID/Authorization`, `payload.userId/type/amount/currency/status/metadata.riskScore` |
| `kyc.events` | `userId` | 7 év | 3 | `eventType`, `documentType`, `verificationHash`(SHA-256), `complianceOfficerId` |
| `aml.risk.signals` | `riskLevel` | 180 nap | 2 | `signalId`, `triggeredRule`, `actionRequired`, `transactionContext.velocity` |

**Validáció & Hibakezelés:** Producer oldali Avro séma validáció kötelező. Null/empty `userId` esetén fallback partíciókulcs (`correlationId`) alkalmazandó. Exponenciális backoff retry (max 3x). Sikertelen feldolgozás esetén `DLT.<topic>.dead` topicra routing + alerting hook. Compliance topikoknál azonnali DLT kötelező.

---

## 6. Tesztelési Eredmények & Hibajegyzék (QA)
| Hibakód | Leírás | Szint | Prioritás | Intézkedés / Validáció |
|---------|--------|-------|-----------|------------------------|
| `F-B-01` | Mock UUID generálás (`Math.random()`), hiányzó `X-Request-ID` propagálás olvasási útvonalakon | FE/BE | P0 | `uuid-v7` library integrálása. Interceptor fejléc-injektálása minden írási és olvasási kéréshez. Newman test: 409 returned duplicate esetén. |
| `F-B-02` | Aszinkron állapot-drift (frontend mock interval vs backend read model) | FE/Kafka | P1 | Valós `EventSource('/transactions.raw/stream')` implementálása. Reducer delta-logika kiegészítése `APPROVED/FAILED` visszavonással. Load test: UI frissülés <3s. |
| `K-01` | JSON serializáció vs Avro séma szakadék, null producer config | BE/Kafka | P0 | `KafkaAvroSerializer` beállítása Schema Registry URL-lel. `buildAvroPayload()` helyett `GenericRecord`/binary encoder használata. `kafka-console-consumer` schema validation zöldek. |
| `K-03` | Hiányzó KYC/AML topik producer/consumer, DLT & retry logika hiánya | BE/Compliance | P1 | Dedikált service implementálása. `DLT.<topic>.dead` routing + alerting hook. E2E compliance flow teszt: upload → topic → risk signal → UI review. DLQ消费率 <0.1%. |
| `C-01` | Hardcoded `riskScore (0.1f)` | BE/AML | P1 | Async AML rule engine integráció, státusz `PENDING_RISK_ASSESSMENT` használata. Load test: DB crash sim → 0 adatvesztés/duplikáció. |

**Státusz:** `[BLOKKOLVA javításig]`. Pipeline `Schema & Contract Gate` és `Idempotency Audit` lépések automatikusan blokkolják a devianciát.

---

## 7. CI/CD Pipeline Konfiguráció
**Eszköz:** Jenkinsfile (Mono-repo, párhuzamos végrehajtás)  
**Stádiumok & Kapuk:**
1. **Source Validation:** Repository struktúra ellenőrzése (`package.json`, `pom.xml`). TODO/mock tiltólista (`grep`) a kritikus útvonalakon.
2. **Parallel Build & Test:** 
   - FE: `npm ci`, `lint:ci`, `test --coverage`, `build`
   - BE: `mvn clean verify` (Testcontainers: Kafka/Postgres, Idempotency & Outbox integration tesztek)
3. **Schema & Contract Gate:** Avro `BACKWARD` kompatibilitás ellenőrzése Schema Registry-n keresztül. Fejléc-propagáció validálása (`grep` alapú).
4. **Security Audit:** `npm audit`, `mvn dependency-check:check -DfailBuildOnCVSS=7`.
5. **Package & Push:** Docker image build & push (`registry.nexusbank.internal`).
6. **Deploy to Staging:** Helm upgrade/install (`--wait --timeout=5m`), 0 downtime rolling update.
7. **Post-Deploy Smoke Test:** `curl -sf http://nexus-staging.internal/health/system`. Validáció: `sla_compliance=true`, `p95_latency < 200ms`, `topic_lag['transactions.raw'] < 500`.

**Kimenet:** Slack notification (`#nexus-pipeline-success/failure`). Sikertelen build esetén azonnali blokkolás, nem engedélyezi a devianciát.

---

## 8. Zárási Kritériumok & Státusz
A projekt státusza `[LEZÁRVA]` **CSAK** akkor módosítható, ha az alábbi feltételek formálisan és metrikailag igazoltan teljesülnek:
- ✅ **Frontend:** Interceptor implementálva (UUIDv7, X-Request-ID) + state sync (SSE/WebSocket) validálva + cursor pagination refactor tesztelt. Reducer delta-logika kezeli a státuszátmeneteket.
- ✅ **Backend:** `KafkaAvroSerializer` + Schema Registry csatolva + Outbox pattern transactional publish (`KafkaTransactionManager`) működik + KYC/AML topikok producer/consumer aktiválva + DLT routing beállítva + riskScore dinamikus értékelés integrálva.
- ✅ **DevOps:** Jenkins pipeline sikeresen lefutott (zöld) + staging deploy végrehajtva + smoke test metrikák (`p95 < 200ms`, `topic lag < 500`, `sla_compliance = true`) keretben.
- ✅ **QA:** E2E compliance flow validálva + DoD teljesül + SLA metrikák dokumentálva + P0/P1 hibajegyzék lezárva.

**Jelenlegi Státusz:** `[FOLYAMBAN] | BLOKKOLÓK KEZELESE ALATT`  
**Következő lépés:** Fenti pontok teljesítése után a sprint átadása operatív üzemeltetésre. Dokumentáció frissítve: D+0 → Sprint 1 / P0/P1 Javítás.

---
### 3. Iteráció:


# 📄 Projekt Dokumentáció Frissítés – D+0 → Sprint 2 / QA Audit & Architectural Contract Alignment
**Státusz:** `[FOLYAMBAN] | BLOKKOLÓK KEZELESE ALATT` (QA Audit v3.1)  
**Dokumentálási Szint:** Technikai Specifikáció, Implementációs Állapot & Hibajegyzék  

---

## 1. Üzleti & Műszaki Követelmények (Definition of Done)
| Metrika | Célérték | Validáció Módszere |
|---------|----------|---------------------|
| Tranzakciós végrehajtás | `<200ms` p95 latency | `/health/system` endpoint metrikák, load test ≥3x peak forgalommal |
| Rendszer rendelkezésre állás | `99.95%` SLA | Uptime monitorozás, failover szimulációk, DLQ消费率 <0.1% |
| API válaszidő | `<500ms` | Gateway logok, OpenTelemetry tracing |
| Díjmentes sáv | Első 50k havi forgalom | Billing modul konfiguráció, tranzakció aggregáció |
| Felhasználói megtartás | `>85%` (3. hónapig) | Cohort analitika, churn rate tracking |
| Compliance | PSD2/AML teljes megfelelés | Audit trail konzisztencia, szabályrendszer verziókezelése, havi automatikus report generálás |

**Mélytesztelési Követelmények (Automatikus Gate-k):**
1. **Kontraktus- & Séma-drift Validáció:** Pact/Contract validation minden FE↔BE határfelületen. CI pipeline automatikusan detektál és blokkol séma-inkompatibilitást vagy fejléc-propagációs hiányt.
2. **Chaos & Reziliencia Szimulációk:** Kafka broker leállítás, DB failover, Circuit Breaker trigger, network partition szimuláció. Peak terhelés alatt káosztűrés garantált.
3. **Compliance Audit Flow E2E Tesztelés:** High-risk FX, velocity trigger, dokumentum upload → KYC state machine → AML risk signal → UI review. Audit trail konzisztencia formális igazolása kötelező.
4. **Load & SLA Metrikai Validáció:** ≥3x peak terhelés szimuláció. `p95 < 200ms`, `topic lag < 500`, `sla_compliance = true` metrikák valós időben monitorozva. Kilépés → automatikus rollback.

**Határidők & Következmények:**
- `D+2 17:00:` Minden P0 javítás staging-re kerül. Pipeline konfiguráció finalizálása.
- `D+3 09:00:` Smoke test lefutása valós metrikafogyasztással (`p95`, `topic lag`, `error rate`). Baseline mérése dokumentálva.
- Késedelem esetén a következő sprint feladatai automatikusan blokkolva maradnak root cause dokumentálásáig.

---

## 2. Architektúrális Döntések
- **Eseményalapú (Event-Driven) architektúra:** Kafka üzenetsor mint központi adatfolyam. Idempotencia kulcs (`correlationId`/UUIDv7) kötelező minden írási műveletnél. Élettartam: `24h` DB tárolásban, automatikus TTL purge.
- **CQRS + Hibrid Event Sourcing:** Kritikus tranzakciós útvonalakon Outbox pattern + `KafkaTransactionManager` kombináció garantálja az atomaritást. Read modellek eventually consistent read replica-ról szinkronizálódnak SSE/WebSocket-en keresztül.
- **Sémakezelés:** Avro sémák + Schema Registry. Kompatibilitási szabály: `BACKWARD`. Runtime típuskonverzió tiltva. Producer oldali validáció kötelező a pipeline `Schema & Contract Gate` lépésében.
- **Hibakezelés & Reziliencia:** API Gateway versioning (`/api/v1/...`), Circuit Breaker (`Resilience4j`), Dead Letter Topic (DLT) konfiguráció compliance topicokra. Exponenciális backoff retry (max 3x). Sikertelen feldolgozás esetén `DLT.<topic>.dead` routing + alerting hook.
- **Partíciókulcs Routing:** Alapértelmezett: `userId`. Ha null/empty: fallback `correlationId`. Hash-algoritmus: `Murmur3`. Hot partition kizárása peak terhelésnél kötelező.

---

## 3. Frontend Specifikációk & Kódstruktúra
- **Stack:** React 18+, TypeScript, Tailwind CSS, `useReducer` determinisztikus állapotkezeléshez.
- **Állapotmenedzsment:** Valós `EventSource('/transactions.raw/stream')` fogyasztás. Optimistic/Pessimistic update stratégia: `OPTIMISTIC_ADD` → `EVENT_COMMIT`/`EVENT_REJECT`. Delta-kalkuláció kezeli a `PENDING → APPROVED/FAILED` visszavonást.
- **Pagináció:** Keyset pagination (`createdAt` + `id`), cache invalidáció tranzakció eseményre. DB lekérdezés: `WHERE (created_at, id) < ?`. Mock `Math.random()` cursor tiltva.
- **Kötelező HTTP Interceptor:** 
  - Fejlécek injektálása: `Idempotency-Key` (UUIDv7), `X-Request-ID` (UUIDv4), `Authorization: Bearer <JWT>`. Propagálás írási és olvasási útvonalakon is.
  - Hibaátvitel blokkolása, retry logika exponenciális backoffkal. 409 esetén azonnali blokkolás.
- **Komponensarchitektúra:** `React.memo` optimalizálás, custom hookok (`useBalance`, `useKycStateMachine`, `useComplianceSignals`). UI struktúra: Balance card (sync indicator), transaction list (keyset pagination + compliance signal flow), modal flow.

```typescript
// FE Kódstruktúra - Reducer & Interceptor (Kivonat)
type AppAction = 
  | { type: 'INIT_DATA'; payload: { transactions: Transaction[]; balance: BalanceState } }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_STATUS'; payload: { id: string; status: TransactionStatus } }
  | { type: 'REVERT_BALANCE'; payload: number }
  | { type: 'LOAD_MORE'; payload: Transaction[] };

const appReducer = (state: any, action: AppAction): any => {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions], balance: { ...state.balance, available: state.balance.available - action.payload.amount } };
    case 'UPDATE_STATUS':
      const txIndex = state.transactions.findIndex((t: Transaction) => t.id === action.payload.id);
      if (txIndex === -1) return state;
      const updatedTx = { ...state.transactions[txIndex], status: action.payload.status };
      let balanceUpdate = 0;
      if (action.payload.status === 'FAILED') balanceUpdate = updatedTx.amount;
      return { ...state, transactions: [...state.transactions.slice(0, txIndex), updatedTx, ...state.transactions.slice(txIndex + 1)], balance: { ...state.balance, pending: state.balance.pending - updatedTx.amount, available: state.balance.available + balanceUpdate } };
    default: return state;
  }
};

const apiClient = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const requestId = generateRequestID();
  const headers = new Headers(options.headers);
  headers.set('X-Request-ID', requestId);
  if (options.method !== 'GET') headers.set('Idempotency-Key', generateUUIDv7());
  const response = await fetch(`/api/v1${endpoint}`, { ...options, headers });
  if (!response.ok) throw new Error(`API_ERROR: ${response.statusText}`);
  return response.json();
};
```

---

## 4. Backend & API Integráció
- **Stack:** Spring Boot, Java 17+, Testcontainers (Kafka/Postgres integration tesztekhez).
- **Tranzakciós Motor (`TransactionService`):** 
  - Idempotencia guard DB szinten `IdempotencyKeyEntity` táblában.
  - Outbox pattern: `@Transactional` scope kiterjesztése DB jegyzés + Kafka publish egységére. Scheduled processor (`fixedRate=1000ms`) kezeli a `PENDING → SENT/FAILED` átmenetet.
  - Eseménykonstruktor: Strict Avro serialization (`KafkaAvroSerializer`). Metadata `riskScore` dinamikus értékelésre cserélendő (async AML rule engine hívás, hardcoded tiltva).
  - CQRS read model projection: `getBalance()` végrehajtása eventually consistent read replica-ról.
- **API Végpontok:**
| Módszer | Endpoint | Kötelező Fejlécek | Kérés Struktúra | Visszatérési Kód |
|---------|----------|-------------------|-----------------|------------------|
| `POST` | `/api/v1/users/registration` | `Content-Type`, `Idempotency-Key`, `X-Request-ID` | `{ "personalData": {...}, "kycLevel": "UNVERIFIED" }` | `201 Created` + `Location` |
| `POST` | `/api/v1/kyc/documents` | `Idempotency-Key`, `X-Request-ID`, `Authorization` | Multipart: `{ "documentType", "file" }` | `202 Accepted` |
| `POST` | `/api/v1/accounts/{accountId}/transactions` | `Idempotency-Key`, `Authorization`, `X-Request-ID` | `{ "amount", "currency", "type", "counterpartyId" }` | `202 Accepted` |
| `GET` | `/api/v1/accounts/{accountId}/balance` | `Authorization`, `X-Request-ID` | – | `200 OK`: `{ "available", "pending", "currency", "lastSyncedAt" }` |
| `GET` | `/api/v1/accounts/{accountId}/transactions?cursor=&limit=6` | `Authorization`, `X-Request-ID` | Query params: `cursor` (createdAt+id), `limit` (max 50) | `200 OK`: `{ "data", "nextCursor", "hasMore" }` |
| `POST` | `/api/v1/compliance/review/{signalId}` | `Authorization`, `X-Request-ID` | `{ "action", "notes" }` | `200 OK` |
| `GET` | `/api/v1/health/system` | – | – | `200 OK`: `{ "uptime", "p95_latency", "topic_lag", "sla_compliance" }` |

```java
// BE Kódstruktúra - Outbox & TransactionService (Kivonat)
@Entity @Table(name = "transaction_outbox")
public class TransactionOutboxEntity {
    @Id private String messageId;
    private String topic;
    private byte[] payload;
    private String partitionKey;
    @Enumerated(EnumType.STRING) private OutboxStatus status = OutboxStatus.PENDING;
    public enum OutboxStatus { PENDING, SENT, FAILED }
}

@Transactional
public void initiateTransaction(String accountId, String idempotencyKey, BigDecimal amount, String currency) {
    if (idempotencyRepo.findById(idempotencyKey).isPresent()) throw new IllegalStateException("IDEMPOTENCY_CONFLICT");
    idempotencyRepo.save(new IdempotencyKeyEntity(idempotencyKey));
    String messageId = UUID.randomUUID().toString();
    byte[] avroPayload = serializeTransactionEvent(messageId, accountId, amount, currency);
    outboxRepo.save(new TransactionOutboxEntity(messageId, "transactions.raw", avroPayload, accountId));
}

@Scheduled(fixedRate = 1000)
public void processOutbox() {
    List<TransactionOutboxEntity> pending = outboxRepo.findByStatusAndCreatedOnBefore(OutboxStatus.PENDING, Instant.now().minusSeconds(2));
    for (TransactionOutboxEntity entity : pending) {
        kafkaTemplate.send(entity.getTopic(), entity.getPartitionKey(), entity.getPayload())
            .whenComplete((result, ex) -> entity.setStatus(ex != null ? OutboxStatus.FAILED : OutboxStatus.SENT));
    }
}
```

---

## 5. Kafka Topikarchitektúra & Sémák
| Topic | Partíciókulcs | Retenció | Min Replicas | Kulcsmezők / Envelope Struktúra |
|-------|---------------|----------|--------------|--------------------------------|
| `transactions.raw` | `userId` (fallback: `correlationId`) | 90 nap | 3 | `meta.correlationId`, `headers.Idempotency-Key/X-Request-ID/Authorization`, `payload.userId/type/amount/currency/status/metadata.riskScore` |
| `kyc.events` | `userId` | 7 év | 3 | `eventType`(ENUM), `documentType`, `verificationHash`(SHA-256), `complianceOfficerId` |
| `aml.risk.signals` | `riskLevel` (LOW/MED/HIGH) | 180 nap | 2 | `signalId`, `triggeredRule`, `actionRequired`, `transactionContext.velocity` |

**Validáció & Hibakezelés:** Producer oldali Avro séma validáció kötelező. Null/empty `userId` esetén fallback partíciókulcs (`correlationId`) alkalmazandó. Exponenciális backoff retry (max 3x). Sikertelen feldolgozás esetén `DLT.<topic>.dead` topicra routing + alerting hook. Compliance topikoknál azonnali DLT kötelező.

---

## 6. Tesztelési Eredmények & Hibajegyzék (QA)
| Hibakód | Szint | Prioritás | Intézkedés / Validáció Kriterium | Felelős |
|---------|-------|-----------|----------------------------------|---------|
| `F-B-01` | FE/BE | P0 | `uuid-v7` library integrálása + `X-Request-ID` propagálás olvasási útvonalakon is. Newman test: 409 returned duplicate esetén. | Frontend Lead / BE Architect |
| `F-B-02` | FE/Kafka | P1 | Valós `EventSource('/transactions.raw/stream')` implementálása + Reducer delta-logika javítása (`APPROVED/FAILED` visszavonás). Load test: UI drift <3s. | Frontend Dev |
| `K-01` | BE/Kafka | P0 | `byte[]` helyett `GenericRecord`/SpecificRecord Avro encoder + Schema Registry URL bindelése. `kafka-console-consumer` validation zöldek. | Backend Dev |
| `K-02` | BE/Kafka | P0 | Envelope header propagálás (`Idempotency-Key`, `X-Request-ID`) Kafka üzenetekhez + partition key fallback logika implementálása. | Backend Dev / Architect |
| `K-03` | BE/Compliance | P1 | DLT `<topic>.dead` routing + alerting hook + exponenciális backoff retry (max 3x). DLQ消费率 <0.1%. | Compliance/BE Dev |
| `O-01` | BE/Arch | P0 | Outbox publish kiterjesztése `@Transactional` scope-ba vagy `KafkaTransactionManager` injektálása. Crash sim → 0 adatvesztés/duplikáció. | Backend Architect / Lead |
| `C-01` | BE/AML | P1 | Async AML rule engine integráció, státusz `PENDING_RISK_ASSESSMENT` használata. Load test: DB crash sim → 0 duplikáció. | Compliance/BE Dev |

**Státusz:** `[BLOKKOLVA JAVÍTÁSIG]`. Pipeline `Schema & Contract Gate` és `Idempotency Audit` lépések automatikusan blokkolják a devianciát.

---

## 7. CI/CD Pipeline Konfiguráció
**Eszköz:** Jenkinsfile (Mono-repo, párhuzamos végrehajtás)  
**Stádiumok & Kapuk:**
1. **Source Validation:** Repository struktúra ellenőrzése (`package.json`, `pom.xml`). TODO/mock tiltólista (`grep`) a kritikus útvonalakon.
2. **Parallel Build & Test:** 
   - FE: `npm ci`, `lint:ci`, `test --coverage`, `build`
   - BE: `mvn clean verify` (Testcontainers: Kafka/Postgres, Idempotency & Outbox integration tesztek)
3. **Schema & Contract Gate:** Avro `BACKWARD` kompatibilitás ellenőrzése Schema Registry-n keresztül. Fejléc-propagáció validálása (`grep` alapú).
4. **Security Audit:** `npm audit`, `mvn dependency-check:check -DfailBuildOnCVSS=7`.
5. **Package & Push:** Docker image build & push (`registry.nexusbank.internal`).
6. **Deploy to Staging:** Helm upgrade/install (`--wait --timeout=5m`), 0 downtime rolling update.
7. **Post-Deploy Smoke Test:** `curl -sf http://nexus-staging.internal/health/system`. Validáció: `sla_compliance=true`, `p95_latency < 200ms`, `topic_lag['transactions.raw'] < 500`.

```groovy
// CI/CD Pipeline Konfiguráció (Kivonat)
pipeline {
    stages {
        stage('Schema & Contract Gate') { steps { script { def schemaCheck = sh(script: "curl -sf -X POST ${SCHEMA_REGISTRY_URL}/compatibility/subjects/${env.IMAGE_BE}.avro/versions/latest", returnStatus: true); if (schemaCheck != 0) error 'BLOCKED: Schema Registry validáció sikertelen.'; } } }
        stage('Post-Deploy Smoke Test') { steps { script { def healthResponse = sh(script: "curl -sf http://nexus-staging.internal/health/system", returnStdout: true); def p95Latency = sh(script: "echo '${healthResponse}' | grep -oP '\"p95_latency\":\\s*\\K[0-9]+'", returnStdout: true).trim().toInteger(); if (p95Latency >= 200) error "SMOKE TEST FAILED: p95 latency (${p95Latency}ms) meghaladja a 200ms határt."; } } }
    }
}
```

**Kimenet:** Slack notification (`#nexus-pipeline-success/failure`). Sikertelen build esetén azonnali blokkolás, nem engedélyezi a devianciát.

---

## 8. Zárási Kritériumok & Státusz
A projekt státusza `[LEZÁRVA]` **CSAK** akkor módosítható, ha az alábbi feltételek formálisan és metrikailag igazoltan teljesülnek:
- ✅ **Frontend:** Interceptor implementálva (UUIDv7, X-Request-ID) + state sync (SSE/WebSocket) validálva + cursor pagination refactor tesztelt. Reducer delta-logika kezeli a státuszátmeneteket.
- ✅ **Backend:** `KafkaAvroSerializer` + Schema Registry csatolva + Outbox pattern transactional publish (`KafkaTransactionManager`) működik + KYC/AML topikok producer/consumer aktiválva + DLT routing beállítva + riskScore dinamikus értékelés integrálva.
- ✅ **DevOps:** Jenkins pipeline sikeresen lefutott (zöld) + staging deploy végrehajtva + smoke test metrikák (`p95 < 200ms`, `topic lag < 500`, `sla_compliance = true`) keretben.
- ✅ **QA:** E2E compliance flow validálva + DoD teljesül + SLA metrikák dokumentálva + P0/P1 hibajegyzék lezárva.

**Jelenlegi Státusz:** `[FOLYAMBAN] | BLOKKOLÓK KEZELESE ALATT`  
**Következő lépés:** Impediment Triage Workshop (D+3 09:00) → P0/P1 javítások (D+4-D+5) → Pipeline trigger & Smoke Test (D+5 17:00) → QA Végső Review & DoD Igazolása (D+6 12:00). Dokumentáció frissítve: D+0 → Sprint 2 / QA Audit & Architectural Contract Alignment.
