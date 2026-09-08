CREATE TABLE IF NOT EXISTS brands (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS perfumers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS accords (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS perfumes (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  brand_id INTEGER REFERENCES brands(id),
  gender TEXT,
  release_year INTEGER,
  rating REAL,
  image_url TEXT,
  url TEXT
);

CREATE TABLE IF NOT EXISTS perfume_perfumers (
  perfume_id INTEGER NOT NULL REFERENCES perfumes(id),
  perfumer_id INTEGER NOT NULL REFERENCES perfumers(id),
  PRIMARY KEY (perfume_id, perfumer_id)
);

CREATE TABLE IF NOT EXISTS perfume_notes (
  perfume_id INTEGER NOT NULL REFERENCES perfumes(id),
  note_id INTEGER NOT NULL REFERENCES notes(id),
  position TEXT NOT NULL CHECK (position IN ('top', 'middle', 'base', 'unspecified')),
  PRIMARY KEY (perfume_id, note_id, position)
);

CREATE TABLE IF NOT EXISTS perfume_accords (
  perfume_id INTEGER NOT NULL REFERENCES perfumes(id),
  accord_id INTEGER NOT NULL REFERENCES accords(id),
  strength REAL NOT NULL DEFAULT 1,
  PRIMARY KEY (perfume_id, accord_id)
);

CREATE INDEX IF NOT EXISTS idx_perfumes_brand ON perfumes(brand_id);
CREATE INDEX IF NOT EXISTS idx_perfumes_name ON perfumes(name);
CREATE INDEX IF NOT EXISTS idx_perfume_notes_note ON perfume_notes(note_id);
CREATE INDEX IF NOT EXISTS idx_perfume_accords_accord ON perfume_accords(accord_id);
