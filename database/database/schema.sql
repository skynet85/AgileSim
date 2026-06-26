// File: database/schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    elo_rating INTEGER DEFAULT 1200 CHECK (elo_rating >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE game_phase AS ENUM ('PLACING', 'MOVING', 'REMOVE_PHASE', 'GAME_OVER');

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mode VARCHAR(20) CHECK(mode IN('SINGLE','MULTI')),
    status VARCHAR(20) DEFAULT 'WAITING',
    board_state JSONB NOT NULL,
    current_player INTEGER NOT NULL DEFAULT 1,
    phase game_phase NOT NULL DEFAULT 'PLACING',
    version INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE moves (
    id BIGSERIAL PRIMARY KEY,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    player_id UUID REFERENCES users(id),
    from_pos INT CHECK(from_pos BETWEEN 0 AND 23),
    to_pos INT CHECK(to_pos BETWEEN 0 AND 23),
    move_type VARCHAR(20),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE analytics_events (
    id BIGSERIAL PRIMARY KEY,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    player_id UUID,
    event_name VARCHAR(100) NOT NULL,
    payload JSONB,
    correlation_id UUID DEFAULT gen_random_uuid(),
    collected_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (collected_at);

CREATE INDEX idx_analytics_collected ON analytics_events (collected_at DESC);
CREATE INDEX idx_rooms_version ON rooms(version);