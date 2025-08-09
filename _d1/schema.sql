-- Cloudflare D1 schema for Card Rush rankings
CREATE TABLE IF NOT EXISTS rankings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hand INTEGER NOT NULL,
  nickname TEXT NOT NULL,
  ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_rankings_hand_time ON rankings(hand, ms);


