-- ============================================================
-- Nanytaxi — Esquema SQL para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Crear tablas
CREATE TABLE IF NOT EXISTS taxis (
  id SERIAL PRIMARY KEY,
  plate TEXT UNIQUE NOT NULL,
  driver_name TEXT NOT NULL,
  rest_day TEXT NOT NULL CHECK (rest_day IN ('Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo')),
  daily_fee INTEGER NOT NULL CHECK (daily_fee > 0),
  daily_savings INTEGER NOT NULL DEFAULT 0 CHECK (daily_savings >= 0),
  accumulated_savings INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  taxi_plate TEXT NOT NULL REFERENCES taxis(plate) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  covered_days JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_taxi_date ON payments(taxi_plate, date);

CREATE TABLE IF NOT EXISTS insurances (
  id SERIAL PRIMARY KEY,
  taxi_plate TEXT NOT NULL REFERENCES taxis(plate) ON DELETE CASCADE,
  type TEXT NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  notes TEXT,
  renewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurances_expiry ON insurances(expiry_date);

CREATE TABLE IF NOT EXISTS savings_history (
  id SERIAL PRIMARY KEY,
  taxi_plate TEXT NOT NULL REFERENCES taxis(plate) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  date DATE NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_savings_plate ON savings_history(taxi_plate);

CREATE TABLE IF NOT EXISTS unavailability (
  id SERIAL PRIMARY KEY,
  taxi_plate TEXT NOT NULL REFERENCES taxis(plate) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT NOT NULL DEFAULT 'Taller',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(taxi_plate, date)
);

CREATE INDEX IF NOT EXISTS idx_unavail_plate_date ON unavailability(taxi_plate, date);

-- ============================================================
-- SEED: 3 taxis de ejemplo
-- ============================================================
INSERT INTO taxis (plate, driver_name, rest_day, daily_fee, daily_savings, accumulated_savings) VALUES
  ('ABC-123', 'Juan Pérez',   'Domingo',   80000, 5000, 0),
  ('DEF-456', 'María García', 'Domingo',   90000, 3000, 0),
  ('GHI-789', 'Carlos López', 'Miércoles', 75000, 4000, 0)
ON CONFLICT (plate) DO NOTHING;
