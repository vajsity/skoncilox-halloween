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
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category, device_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_costume_id ON votes (costume_id);
CREATE INDEX IF NOT EXISTS idx_costumes_category ON costumes (category);
