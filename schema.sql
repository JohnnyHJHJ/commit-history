-- Commit History starter schema for Neon PostgreSQL
-- Run this in Neon SQL Editor.
-- This is only the database layer; your API/backend will connect to it.

CREATE TABLE IF NOT EXISTS confessions (
    id BIGSERIAL PRIMARY KEY,
    tag TEXT UNIQUE NOT NULL,
    name TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS memories (
    id BIGSERIAL PRIMARY KEY,
    tag TEXT UNIQUE NOT NULL,
    name TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS reactions (
    id BIGSERIAL PRIMARY KEY,
    post_type TEXT NOT NULL CHECK (post_type IN ('confession', 'memory')),
    post_id BIGINT NOT NULL,
    reaction TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    UNIQUE (post_type, post_id, reaction)
);

CREATE INDEX IF NOT EXISTS idx_confessions_created_at
    ON confessions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memories_created_at
    ON memories (created_at DESC);
