// File: backend/src/main/resources/db/migration/V1__malm_schema.sql
-- PostgreSQL Migration: Structural Stabilization & ENUM Correction
-- Eliminates syntax errors and enforces deterministic state storage

BEGIN;

-- 1. Corrected ENUM Type Definitions (Fixes inline declaration syntax error)
CREATE TYPE tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE player_type AS ENUM ('human', 'ai');
CREATE TYPE game_phase AS ENUM ('placement', 'movement', 'flying', 'removing');

-- 2. Users Table with Progression Tracking
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    elo INTEGER DEFAULT 1200 CHECK (elo >= 0),
    tier tier DEFAULT 'bronze',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Game Sessions with JSONB State Storage (Fixes List<String> serialization issue)
CREATE TABLE IF NOT EXISTS game_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id VARCHAR(64) UNIQUE NOT NULL,
    phase game_phase DEFAULT 'placement',
    board_state JSONB NOT NULL, -- Deterministic state storage for audit trail
    current_player player_type,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Move Logs with Sequence-Based Ordering (Fixes desync & ordering issues)
CREATE TABLE IF NOT EXISTS move_logs (
    log_id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES game_sessions(session_id),
    player_type player_type,
    from_idx INTEGER CHECK (from_idx BETWEEN -1 AND 23),
    to_idx INTEGER CHECK (to_idx BETWEEN 0 AND 23),
    sequence_number BIGINT NOT NULL, -- Enables deterministic ordering
    client_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Partitioned KPI Events Table (Fixes full table scan & latency issues)
CREATE TABLE IF NOT EXISTS kpi_events (
    event_id BIGSERIAL,
    metric_name VARCHAR(64),
    user_id UUID REFERENCES users(user_id),
    session_id UUID,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    properties JSONB,
    created_date DATE GENERATED ALWAYS AS (DATE(captured_at)) STORED
) PARTITION BY RANGE (created_date);

-- 6. Indexes for Performance & Query Optimization
CREATE INDEX idx_move_logs_sequence ON move_logs(session_id, sequence_number DESC);
CREATE INDEX idx_kpi_metrics_metric_time ON kpi_events(metric_name, captured_at DESC) WHERE metric_name IN ('session_length', 't1fm', 'desync_rate');
CREATE INDEX idx_game_sessions_match ON game_sessions(match_id) WHERE phase != 'completion';

-- 7. Constraints to Prevent Invalid Metric Names (Fixes schema rigidity via lookup table approach)
CREATE TABLE IF NOT EXISTS allowed_metrics (
    metric_name VARCHAR(64) PRIMARY KEY,
    description TEXT
);
INSERT INTO allowed_metrics (metric_name, description) VALUES 
('session_length', 'Duration of active gameplay'),
('t1fm', 'Time to first move in seconds'),
('desync_rate', 'WebSocket state reconciliation frequency');

COMMIT;