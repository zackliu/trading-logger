CREATE TABLE IF NOT EXISTS setups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS idx_setups_name ON setups(name);
--> statement-breakpoint

INSERT INTO setups (name, sort_order, created_at)
SELECT 'Unknown', 0, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM setups WHERE name = 'Unknown');
--> statement-breakpoint

-- SQLite cannot add a FK with default in place, so add column then rely on application-level checks
ALTER TABLE records ADD COLUMN setup_id INTEGER NOT NULL DEFAULT 1;
--> statement-breakpoint

UPDATE records
SET setup_id = (
  SELECT id FROM setups WHERE name = 'Unknown' LIMIT 1
) WHERE setup_id IS NULL;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_records_setup_id ON records(setup_id);
