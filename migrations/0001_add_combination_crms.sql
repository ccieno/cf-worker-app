-- Migration: add combination_crms column to config table
-- Run with: wrangler d1 execute <DB_NAME> --file=migrations/0001_add_combination_crms.sql

ALTER TABLE config ADD COLUMN combination_crms TEXT NOT NULL DEFAULT '';
