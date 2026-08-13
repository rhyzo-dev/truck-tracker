-- Truck Tracker MVP Schema
-- Run this in Supabase SQL Editor

-- 1. Plants (your locations)
CREATE TABLE plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,          -- e.g. 'PLANT-01', 'WH-MAIN'
  name TEXT NOT NULL,                 -- e.g. 'Main Warehouse'
  address TEXT,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Logistic Companies (carriers)
CREATE TABLE logistic_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,          -- e.g. 'ABC Transport'
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Trucks (vehicles)
CREATE TABLE trucks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_no TEXT UNIQUE NOT NULL,      -- e.g. 'MH12AB1234'
  owner_type TEXT CHECK (owner_type IN ('owned', 'hired', 'vendor')) DEFAULT 'hired',
  logistic_company_id UUID REFERENCES logistic_companies(id),
  capacity_tons NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Users (your team + optionally drivers)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('admin', 'supervisor', 'gate', 'driver')) DEFAULT 'gate',
  plant_id UUID REFERENCES plants(id),  -- null = all plants access
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Truck Visits (the core log)
CREATE TABLE truck_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identifiers
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  plant_id UUID NOT NULL REFERENCES plants(id),
  truck_id UUID NOT NULL REFERENCES trucks(id),

  -- Timing
  time_in TIMESTAMPTZ,                -- Gate-in timestamp
  time_out TIMESTAMPTZ,               -- Gate-out timestamp

  -- Status
  status TEXT CHECK (status IN ('scheduled', 'arrived', 'weighbridge_in', 'loading', 'loaded', 'weighbridge_out', 'departed', 'delayed', 'cancelled', 'issue')) DEFAULT 'scheduled',
  issue_note TEXT,                    -- Free text when status = 'issue'

  -- Destination & Carrier
  destination TEXT,                   -- e.g. 'Mumbai Plant', 'Client XYZ'
  logistic_company_id UUID REFERENCES logistic_companies(id),
  contact_no TEXT,                    -- Driver/coordinator phone

  -- Metadata
  registered_by UUID REFERENCES profiles(id),
  registered_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_truck_visits_date_plant ON truck_visits(visit_date, plant_id);
CREATE INDEX idx_truck_visits_truck ON truck_visits(truck_id);
CREATE INDEX idx_truck_visits_status ON truck_visits(status);
CREATE INDEX idx_truck_visits_time_in ON truck_visits(time_in);

-- Row Level Security (RLS)
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistic_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_visits ENABLE ROW LEVEL SECURITY;

-- Policies: Admins see everything
CREATE POLICY "admin_all" ON plants FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "admin_all" ON logistic_companies FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "admin_all" ON trucks FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "admin_all" ON profiles FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "admin_all" ON truck_visits FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policies: Supervisors/Gate see their plant's data
CREATE POLICY "plant_staff_read" ON plants FOR SELECT TO authenticated USING (
  id = (SELECT plant_id FROM profiles WHERE id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
);
CREATE POLICY "plant_staff_read" ON logistic_companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "plant_staff_read" ON trucks FOR SELECT TO authenticated USING (true);

CREATE POLICY "plant_visits_read" ON truck_visits FOR SELECT TO authenticated USING (
  plant_id = (SELECT plant_id FROM profiles WHERE id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
);

CREATE POLICY "plant_visits_insert" ON truck_visits FOR INSERT TO authenticated WITH CHECK (
  plant_id = (SELECT plant_id FROM profiles WHERE id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
);

CREATE POLICY "plant_visits_update" ON truck_visits FOR UPDATE TO authenticated USING (
  plant_id = (SELECT plant_id FROM profiles WHERE id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_truck_visits_updated_at
  BEFORE UPDATE ON truck_visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample seed data (optional - run after tables created)
-- INSERT INTO plants (code, name) VALUES ('PLANT-01', 'Main Warehouse'), ('PLANT-02', 'Secondary Yard');
-- INSERT INTO logistic_companies (name, contact_person, phone) VALUES ('ABC Transport', 'Rajesh', '9876543210'), ('XYZ Logistics', 'Priya', '9876543211');