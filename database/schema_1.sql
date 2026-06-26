-- Determinisztikus állapotgép alapjai. Az emberi felejtés helyett a relációs szigorútság lép színpadra.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    auth_provider_id VARCHAR(255),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_a_uuid UUID REFERENCES users(id) ON DELETE SET NULL,
    player_b_uuid UUID REFERENCES users(id) ON DELETE SET NULL,
    mode VARCHAR(10) CHECK (mode IN ('1p','2p')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','completed','aborted')),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    winner_uuid UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}' -- Board state snapshot placeholder for recovery
);

CREATE TABLE moves_log (
    move_id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES sessions(session_id) ON DELETE CASCADE,
    player_id UUID REFERENCES users(id),
    phase VARCHAR(20) CHECK (phase IN ('placing','moving','capturing')),
    coords JSONB NOT NULL, -- {"from": int, "to": int} or {"place": int}
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(50),
    item_id VARCHAR(100),
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, item_id)
);

CREATE TABLE config_flags (
    key VARCHAR(100) PRIMARY KEY,
    value_json JSONB NOT NULL,
    updated_by UUID REFERENCES users(id),
    version INT DEFAULT 1
);

-- Partitionált analitika: az idő nem áll meg, de az adatok rendezve maradnak.
CREATE TABLE analytics_events (
    event_id BIGSERIAL,
    session_id UUID,
    user_id UUID,
    event_name VARCHAR(100) NOT NULL,
    ts TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payload_json JSONB,
    PRIMARY KEY (event_id, ts)
) PARTITION BY RANGE (ts);

CREATE TABLE analytics_events_y2024m01 PARTITION OF analytics_events 
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');