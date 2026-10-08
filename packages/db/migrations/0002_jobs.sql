-- 0002_jobs: job heartbeat for the system-ping Workflow, plus a P0a review fix:
-- open invites are unique per agency (not globally), so one agency's invites
-- never reveal or block another agency's.

CREATE TABLE job_heartbeat (
  id TEXT PRIMARY KEY NOT NULL,
  agency_id TEXT NOT NULL REFERENCES agency(id) ON DELETE CASCADE,
  job_name TEXT NOT NULL,
  -- Workflow instance id; unique so a retried step never writes twice.
  instance_id TEXT NOT NULL UNIQUE,
  requested_by TEXT REFERENCES member(id) ON DELETE SET NULL,
  requested_at TEXT NOT NULL,
  ran_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  worker_id TEXT NOT NULL
);
CREATE INDEX job_heartbeat_agency_ran_idx ON job_heartbeat (agency_id, ran_at);

DROP INDEX staff_invite_open_email_idx;
CREATE UNIQUE INDEX staff_invite_open_agency_email_idx ON staff_invite (agency_id, email) WHERE accepted_at IS NULL;
