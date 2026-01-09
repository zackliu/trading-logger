PRAGMA foreign_keys = ON;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  datetime TEXT NOT NULL,
  symbol TEXT NOT NULL,
  account_type TEXT NOT NULL,
  result TEXT NOT NULL,
  pnl REAL NOT NULL,
  risk_amount REAL NOT NULL,
  r_multiple REAL,
  complied INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_records_datetime ON records(datetime);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_records_symbol ON records(symbol);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_records_complied ON records(complied);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_records_account_type ON records(account_type);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_records_result ON records(result);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS record_tags (
  record_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (record_id, tag_id),
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_record_tags_tag_id ON record_tags(tag_id, record_id);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER,
  file_path TEXT NOT NULL,
  mime TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  size_bytes INTEGER,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS custom_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  is_required INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_fields_key ON custom_fields(key);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS custom_field_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  field_id INTEGER NOT NULL,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (field_id) REFERENCES custom_fields(id) ON DELETE CASCADE
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_custom_field_options_field ON custom_field_options(field_id);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS record_field_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL,
  field_id INTEGER NOT NULL,
  value_text TEXT,
  value_number REAL,
  value_bool INTEGER,
  value_date TEXT,
  value_datetime TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
  FOREIGN KEY (field_id) REFERENCES custom_fields(id) ON DELETE CASCADE
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_record_field_values_record ON record_field_values(record_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_record_field_values_field ON record_field_values(field_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_record_field_values_text ON record_field_values(field_id, value_text);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_record_field_values_number ON record_field_values(field_id, value_number);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_record_field_values_date ON record_field_values(field_id, value_date);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_record_field_values_datetime ON record_field_values(field_id, value_datetime);
