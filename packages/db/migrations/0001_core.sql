-- 0001_core: tenancy tables for Spear Studio (Cloudflare D1 / SQLite).
-- Mirrors packages/db/src/schema.ts. D1 has no RLS: isolation is enforced by
-- apps/web/lib/data/*. Timestamps are ISO-8601 UTC text. Ids are text UUIDs.

CREATE TABLE agency (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  settings TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by TEXT
);

CREATE TABLE member (
  id TEXT PRIMARY KEY NOT NULL,
  agency_id TEXT NOT NULL REFERENCES agency(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by TEXT,
  CONSTRAINT member_email_lower CHECK (email = lower(email)),
  CONSTRAINT member_role_check CHECK (role IN ('owner', 'strategist', 'editor', 'account_manager', 'freelancer'))
);
CREATE INDEX member_agency_idx ON member (agency_id);

CREATE TABLE client (
  id TEXT PRIMARY KEY NOT NULL,
  agency_id TEXT NOT NULL REFERENCES agency(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  timezone TEXT NOT NULL,
  language TEXT NOT NULL,
  region TEXT NOT NULL,
  brand_kit TEXT NOT NULL DEFAULT '{}',
  approval_rules TEXT NOT NULL DEFAULT '{}',
  is_sample INTEGER NOT NULL DEFAULT 0,
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by TEXT
);
CREATE UNIQUE INDEX client_agency_slug_idx ON client (agency_id, slug);
CREATE INDEX client_agency_idx ON client (agency_id);

CREATE TABLE client_member (
  id TEXT PRIMARY KEY NOT NULL,
  client_id TEXT NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by TEXT,
  CONSTRAINT client_member_role_check CHECK (role IN ('freelancer', 'client_approver', 'client_viewer'))
);
CREATE UNIQUE INDEX client_member_unique_idx ON client_member (client_id, member_id);
CREATE INDEX client_member_member_idx ON client_member (member_id);

CREATE TABLE social_account (
  id TEXT PRIMARY KEY NOT NULL,
  client_id TEXT NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'manual',
  buffer_channel_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by TEXT,
  CONSTRAINT social_account_platform_check CHECK (platform IN ('ig', 'tiktok', 'youtube')),
  CONSTRAINT social_account_status_check CHECK (status IN ('manual', 'connected', 'needs_reconnect', 'disconnected'))
);
CREATE UNIQUE INDEX social_account_unique_idx ON social_account (client_id, platform, handle);

CREATE TABLE staff_invite (
  id TEXT PRIMARY KEY NOT NULL,
  agency_id TEXT NOT NULL REFERENCES agency(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  client_id TEXT REFERENCES client(id) ON DELETE CASCADE,
  accepted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by TEXT,
  CONSTRAINT staff_invite_email_lower CHECK (email = lower(email)),
  CONSTRAINT staff_invite_role_check CHECK (role IN ('owner', 'strategist', 'editor', 'account_manager', 'freelancer'))
);
CREATE UNIQUE INDEX staff_invite_open_email_idx ON staff_invite (email) WHERE accepted_at IS NULL;
