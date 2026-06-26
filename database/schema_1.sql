CREATE TABLE IF NOT EXISTS games (
    game_id VARCHAR(36) PRIMARY KEY,
    player_id VARCHAR(36) NOT NULL,
    ai_difficulty_tier ENUM('EASY', 'MEDIUM', 'HARD', 'ADAPTIVE') DEFAULT 'ADAPTIVE' NOT NULL,
    current_phase VARCHAR(20) DEFAULT 'PLACING' NOT NULL,
    turn_player VARCHAR(10) DEFAULT 'PLAYER' NOT NULL,
    board_snapshot JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_events (
    event_id BIGSERIAL PRIMARY KEY,
    game_id VARCHAR(36) NOT NULL REFERENCES games(game_id),
    event_type VARCHAR(20) NOT NULL,
    actor_id VARCHAR(36),
    board_snapshot JSONB NOT NULL,
    move_delta FROM_INDEX INT TO_INDEX INT,
    validation_status VARCHAR(15),
    rejection_reason TEXT,
    ai_decision_latency_ms INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_game_events_game_id ON game_events(game_id);
CREATE INDEX idx_game_events_event_type ON game_events(event_type);