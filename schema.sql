-- Rate Hackathons — PostgreSQL schema
-- Run once against your Render Postgres database:
--   psql $DATABASE_URL -f schema.sql

CREATE TABLE IF NOT EXISTS users (
    id               TEXT        PRIMARY KEY,
    username         TEXT        NOT NULL UNIQUE,
    devpost_username TEXT        NOT NULL UNIQUE,
    password_hash    TEXT        NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    token_jti        TEXT        NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS votes (
    id         TEXT             PRIMARY KEY,
    winner_id  INTEGER          NOT NULL,
    loser_id   INTEGER          NOT NULL,
    weight     DOUBLE PRECISION NOT NULL,
    tier       TEXT             NOT NULL,
    voter      TEXT             NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS votes_winner_id_idx ON votes (winner_id);
CREATE INDEX IF NOT EXISTS votes_loser_id_idx  ON votes (loser_id);

-- Per-user cache of hackathons scraped from Devpost
CREATE TABLE IF NOT EXISTS attendance_cache (
    username         TEXT        PRIMARY KEY,  -- lowercase
    devpost_username TEXT        NOT NULL,
    cached_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hackathons       JSONB       NOT NULL DEFAULT '[]'
);

-- Per-user cache of projects scraped from Devpost
CREATE TABLE IF NOT EXISTS projects_cache (
    username  TEXT        PRIMARY KEY,  -- lowercase
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    projects  JSONB       NOT NULL DEFAULT '[]'
);
