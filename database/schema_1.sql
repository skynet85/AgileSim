-- Flyway V1.0 Migration: Core Game Entities & Audit Trail
-- Deterministic schema designed to eliminate partial write states and enforce referential integrity.

CREATE TABLE IF NOT EXISTS matches (
    room_code UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PLACEMENT', 'MOVEMENT', 'REMOVAL', 'COMPLETED')),
    current_turn VARCHAR(10) NOT NULL, -- P1, P2, P3
    pieces_left JSONB NOT NULL DEFAULT '{"P1": 9, "P2": 4, "P3": 4}',
    board_state JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_history (
    id BIGSERIAL PRIMARY KEY,
    room_code UUID REFERENCES matches(room_code) ON DELETE CASCADE,
    action_type VARCHAR(20) NOT NULL, -- placement, move, removal
    payload JSONB,
    idempotency_key UUID UNIQUE,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_match_history_room ON match_history(room_code);
CREATE INDEX idx_match_status ON matches(status);