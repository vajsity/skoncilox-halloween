CREATE TABLE IF NOT EXISTS costumes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('solo', 'pair')),
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  costume_id INTEGER NOT NULL REFERENCES costumes(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('solo', 'pair')),
  device_id TEXT NOT NULL,
  voter_name TEXT NOT NULL,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category, device_id)
);

ALTER TABLE votes ADD COLUMN IF NOT EXISTS voter_name TEXT NOT NULL DEFAULT '';

-- Drop duplicate votes from the same name in the same category (keep the earliest),
-- so the unique index below can be created on data that predates this constraint.
DELETE FROM votes a USING votes b
WHERE a.id > b.id
  AND a.category = b.category
  AND lower(a.voter_name) = lower(b.voter_name);

CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_category_voter_name ON votes (category, lower(voter_name));

CREATE INDEX IF NOT EXISTS idx_votes_costume_id ON votes (costume_id);
CREATE INDEX IF NOT EXISTS idx_costumes_category ON costumes (category);
