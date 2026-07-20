-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Rooms Table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(10) UNIQUE NOT NULL,
    room_name VARCHAR(100) NOT NULL,
    host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    auction_type VARCHAR(50) NOT NULL DEFAULT 'Standard',
    budget DECIMAL(15, 2) NOT NULL DEFAULT 1000000000.00, -- 100 Crores
    timer INT NOT NULL DEFAULT 30, -- 30 seconds
    status VARCHAR(50) NOT NULL DEFAULT 'Lobby', -- Lobby, Active, Paused, Completed
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for searching rooms by code
CREATE INDEX idx_rooms_room_code ON rooms(room_code);

-- 3. Room Participants Table (Multiplayer presence tracking)
CREATE TABLE room_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'Player', -- Host, Player, Spectator
    is_ready BOOLEAN NOT NULL DEFAULT FALSE,
    is_connected BOOLEAN NOT NULL DEFAULT FALSE,
    connection_id VARCHAR(100), -- SignalR Connection ID
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(room_id, user_id)
);

CREATE INDEX idx_room_participants_room ON room_participants(room_id);
CREATE INDEX idx_room_participants_connection ON room_participants(connection_id);

-- 4. Teams Table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_name VARCHAR(100) NOT NULL,
    logo VARCHAR(255),
    remaining_budget DECIMAL(15, 2) NOT NULL,
    indian_players INT NOT NULL DEFAULT 0,
    overseas_players INT NOT NULL DEFAULT 0,
    total_players INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(room_id, owner_id),
    UNIQUE(room_id, team_name)
);

CREATE INDEX idx_teams_room_id ON teams(room_id);

-- 5. Players Master Table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    image_url VARCHAR(255),
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    role VARCHAR(50) NOT NULL, -- Batsman, Bowler, AllRounder, WicketKeeper
    batting_style VARCHAR(50),
    bowling_style VARCHAR(50),
    age INT,
    rating DECIMAL(3, 1) NOT NULL DEFAULT 0.0,
    base_price DECIMAL(15, 2) NOT NULL DEFAULT 2000000.00, -- 20 Lakhs
    category VARCHAR(50) NOT NULL, -- Capped, Uncapped
    ipl_runs INT DEFAULT 0,
    ipl_wickets INT DEFAULT 0,
    strike_rate DECIMAL(5, 2) DEFAULT 0.0,
    economy DECIMAL(4, 2) DEFAULT 0.0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for searching and filtering players
CREATE INDEX idx_players_role ON players(role);
CREATE INDEX idx_players_country ON players(country);

-- 6. Bids Table
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    bid_amount DECIMAL(15, 2) NOT NULL,
    bid_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_bids_room_player ON bids(room_id, player_id);

-- 7. Purchases Table
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    sold_price DECIMAL(15, 2) NOT NULL,
    purchased_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(room_id, player_id) -- Player can only be bought once in a room
);

CREATE INDEX idx_purchases_room_id ON purchases(room_id);
CREATE INDEX idx_purchases_team_id ON purchases(team_id);

-- 8. Chats Table
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_chats_room_id ON chats(room_id);

-- 9. Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
