DROP TABLE IF EXISTS config;
DROP TABLE IF EXISTS state;
DROP TABLE IF EXISTS seeds;

CREATE TABLE config (
  id INTEGER PRIMARY KEY,
  brand TEXT NOT NULL,
  backend TEXT NOT NULL,
  app_title TEXT NOT NULL,
  customer_label TEXT NOT NULL,
  primary_record_label TEXT NOT NULL,
  create_label TEXT NOT NULL,
  recent_records_label TEXT NOT NULL,
  customer_tier_label TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  primary_hex TEXT NOT NULL,
  secondary_hex TEXT NOT NULL,
  accent_hex TEXT NOT NULL,
  debug INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE seeds (
  scenario_key TEXT PRIMARY KEY,
  backend TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  customer_name TEXT,
  customer_status TEXT,
  primary_subject TEXT,
  primary_status TEXT,
  primary_due_date TEXT,
  recent_count INTEGER NOT NULL DEFAULT 0
);