-- Commit History starter schema for Neon PostgreSQL
-- Run this in Neon SQL Editor.
-- This is only the database layer; your API/backend will connect to it.

CREATE TABLE IF NOT EXISTS confessions (
    id BIGSERIAL PRIMARY KEY,
    tag TEXT UNIQUE NOT NULL,
    name TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS memories (
    id BIGSERIAL PRIMARY KEY,
    tag TEXT UNIQUE NOT NULL,
    name TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved BOOLEAN NOT NULL DEFAULT FALSE
);

-- Safe for existing databases created with older versions of the project.
ALTER TABLE memories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE confessions ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE TABLE IF NOT EXISTS feedback (
    id BIGSERIAL PRIMARY KEY,
    name TEXT,
    message TEXT NOT NULL,
    concern BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS birthdays (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    birthday DATE NOT NULL,
    visitor_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reactions (
    id BIGSERIAL PRIMARY KEY,
    post_type TEXT NOT NULL CHECK (post_type IN ('confession', 'memory')),
    post_id BIGINT NOT NULL,
    reaction TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    UNIQUE (post_type, post_id, reaction)
);

CREATE TABLE IF NOT EXISTS reaction_votes (
    id BIGSERIAL PRIMARY KEY,
    post_type TEXT NOT NULL CHECK (post_type IN ('confession', 'memory')),
    post_id BIGINT NOT NULL,
    reaction TEXT NOT NULL,
    visitor_id TEXT NOT NULL,
    UNIQUE (post_type, post_id, reaction, visitor_id)
);

CREATE TABLE IF NOT EXISTS replies (
    id BIGSERIAL PRIMARY KEY,
    post_type TEXT NOT NULL CHECK (post_type IN ('confession', 'memory')),
    post_id BIGINT NOT NULL,
    name TEXT NOT NULL DEFAULT 'anonymous',
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'Admin',
    priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'IMPORTANT', 'URGENT')),
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'NORMAL';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_confessions_created_at
    ON confessions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memories_created_at
    ON memories (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_public ON announcements (pinned DESC, created_at DESC) WHERE published = TRUE;
CREATE INDEX IF NOT EXISTS idx_replies_post ON replies (post_type, post_id, created_at);
