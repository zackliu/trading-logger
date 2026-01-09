CREATE TABLE IF NOT EXISTS compliance_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS compliance_check_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_id INTEGER NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (check_id) REFERENCES compliance_checks(id) ON DELETE CASCADE
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS record_compliance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL,
  check_id INTEGER NOT NULL,
  is_checked INTEGER,
  option_id INTEGER,
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
  FOREIGN KEY (check_id) REFERENCES compliance_checks(id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES compliance_check_options(id) ON DELETE SET NULL
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_record_compliance_record ON record_compliance(record_id);
