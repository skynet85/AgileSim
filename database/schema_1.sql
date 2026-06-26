-- PostgreSQL Event Sourcing & Audit Trail Schema v0.2
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Guest session management (GDPR-light, 30d TTL)
CREATE TABLE sessions (
    guest_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_fingerprint TEXT NOT NULL,
    ip_hash CHAR(64) NOT NULL,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match metadata (stateless, only control plane data)
CREATE TABLE matches (
    match_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mode VARCHAR(10) CHECK (mode IN ('1P', '2P')),
    status VARCHAR(20) DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'ACTIVE', 'FINISHED')),
    start_ts TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_ts TIMESTAMP WITH TIME ZONE,
    winner_player INT CHECK (winner_player IS NULL OR winner_player IN (1, 2))
);

-- Append-only event log for deterministic state reconstruction & analytics
CREATE TABLE match_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(match_id) ON DELETE CASCADE,
    player_id INT CHECK (player_id IN (1, 2)),
    type VARCHAR(30) NOT NULL CHECK (type IN ('MOVE_ATTEMPT', 'VALIDATED', 'PHASE_TRANSITION', 'MILL_TRIGGERED', 'GAME_END')),
    payload JSONB NOT NULL, -- Explicit Jackson serialization enforced in BE layer
    seq_id BIGINT NOT NULL,
    ts TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT append_only_guard UNIQUE (match_id, seq_id) ON CONFLICT DO NOTHING
);

-- Optimized indexes for analytics traceability & replay recovery
CREATE INDEX idx_events_match_seq ON match_events USING btree (match_id, seq_id);
CREATE INDEX idx_events_type_ts ON match_events USING btree (type, ts) WHERE type IN ('GAME_END', 'SESSION_DURATION');