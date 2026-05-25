-- ============================================================
-- ELECTRICIAN SYSTEM — Migration: Materials, Operations, Work Items update
-- ============================================================

-- Materials catalog (searchable)
CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'buc',
  price_per_unit numeric(10,2) DEFAULT 0,
  category text DEFAULT 'general',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Operations catalog (searchable)
CREATE TABLE IF NOT EXISTS operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  default_price numeric(10,2) DEFAULT 0,
  category text DEFAULT 'general',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns to work_items
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_items' AND column_name='location_address') THEN
    ALTER TABLE work_items ADD COLUMN location_address text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_items' AND column_name='location_lat') THEN
    ALTER TABLE work_items ADD COLUMN location_lat numeric(10,6);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_items' AND column_name='location_lng') THEN
    ALTER TABLE work_items ADD COLUMN location_lng numeric(10,6);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_items' AND column_name='team_lead_id') THEN
    ALTER TABLE work_items ADD COLUMN team_lead_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_items' AND column_name='team_member_ids') THEN
    ALTER TABLE work_items ADD COLUMN team_member_ids uuid[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_items' AND column_name='materials_json') THEN
    ALTER TABLE work_items ADD COLUMN materials_json jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_items' AND column_name='operations_json') THEN
    ALTER TABLE work_items ADD COLUMN operations_json jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_items' AND column_name='notes') THEN
    ALTER TABLE work_items ADD COLUMN notes text;
  END IF;
  -- Remove type column if exists (deprecated)
  -- ALTER TABLE work_items DROP COLUMN IF EXISTS type;
END $$;

-- Work item status history
CREATE TABLE IF NOT EXISTS work_item_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id uuid REFERENCES work_items(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid,
  note text,
  changed_at timestamptz DEFAULT now()
);

-- Work item files (photos)
CREATE TABLE IF NOT EXISTS work_item_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id uuid REFERENCES work_items(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text,
  uploaded_by uuid,
  uploaded_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_materials_tenant ON materials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_materials_name ON materials(name);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_operations_tenant ON operations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_operations_name ON operations(name);
CREATE INDEX IF NOT EXISTS idx_operations_category ON operations(category);
CREATE INDEX IF NOT EXISTS idx_work_items_location ON work_items(location_address);
CREATE INDEX IF NOT EXISTS idx_work_items_team_lead ON work_items(team_lead_id);
CREATE INDEX IF NOT EXISTS idx_status_history_work_item ON work_item_status_history(work_item_id);
CREATE INDEX IF NOT EXISTS idx_work_item_files_work_item ON work_item_files(work_item_id);

-- RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_item_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_item_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_materials" ON materials;
CREATE POLICY "allow_all_materials" ON materials FOR ALL USING (true);

DROP POLICY IF EXISTS "allow_all_operations" ON operations;
CREATE POLICY "allow_all_operations" ON operations FOR ALL USING (true);

DROP POLICY IF EXISTS "allow_all_status_history" ON work_item_status_history;
CREATE POLICY "allow_all_status_history" ON work_item_status_history FOR ALL USING (true);

DROP POLICY IF EXISTS "allow_all_work_item_files" ON work_item_files;
CREATE POLICY "allow_all_work_item_files" ON work_item_files FOR ALL USING (true);

-- Updated_at trigger for materials & operations
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS materials_updated_at ON materials;
CREATE TRIGGER materials_updated_at BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS operations_updated_at ON operations;
CREATE TRIGGER operations_updated_at BEFORE UPDATE ON operations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update work_item status with history logging
CREATE OR REPLACE FUNCTION update_work_item_status(
  p_work_item_id uuid,
  p_new_status text,
  p_changed_by uuid DEFAULT null,
  p_note text DEFAULT null
)
RETURNS void AS $$
DECLARE
  v_old_status text;
BEGIN
  SELECT status INTO v_old_status FROM work_items WHERE id = p_work_item_id;
  
  UPDATE work_items SET status = p_new_status, updated_at = now()
  WHERE id = p_work_item_id;
  
  INSERT INTO work_item_status_history (work_item_id, from_status, to_status, changed_by, note)
  VALUES (p_work_item_id, v_old_status, p_new_status, p_changed_by, p_note);
END;
$$ LANGUAGE plpgsql;

-- Seed default materials
INSERT INTO materials (tenant_id, name, unit, price_per_unit, category) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Cablu electric 2.5mm', 'm', 3.50, 'cablu'),
  ('00000000-0000-0000-0000-000000000000', 'Cablu electric 4mm', 'm', 5.20, 'cablu'),
  ('00000000-0000-0000-0000-000000000000', 'Cablu electric 6mm', 'm', 7.80, 'cablu'),
  ('00000000-0000-0000-0000-000000000000', 'Priză dublă', 'buc', 12.00, 'prize'),
  ('00000000-0000-0000-0000-000000000000', 'Întrerupător simplu', 'buc', 10.00, 'intrerupatoare'),
  ('00000000-0000-0000-0000-000000000000', 'Cutie distribuție 12 module', 'buc', 85.00, 'cutii'),
  ('00000000-0000-0000-0000-000000000000', 'Fusibil 16A', 'buc', 4.50, 'protectie'),
  ('00000000-0000-0000-0000-000000000000', 'Difuzor 200mm', 'buc', 15.00, 'iluminat'),
  ('00000000-0000-0000-0000-000000000000', 'Tub PVC 20mm', 'm', 2.80, 'tub'),
  ('00000000-0000-0000-0000-000000000000', 'Clema electrică', 'buc', 1.50, 'conectica')
ON CONFLICT DO NOTHING;

-- Seed default operations
INSERT INTO operations (tenant_id, name, description, default_price, category) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Montaj priză', 'Montare priză electrică nouă', 35.00, 'montaj'),
  ('00000000-0000-0000-0000-000000000000', 'Montaj întrerupător', 'Montare întrerupător electric', 30.00, 'montaj'),
  ('00000000-0000-0000-0000-000000000000', 'Tăiere cablu', 'Tăiere și pregătire cablu electric', 15.00, 'pregatire'),
  ('00000000-0000-0000-0000-000000000000', 'Sondare electrică', 'Verificare și sondare circuit electric', 50.00, 'verificare'),
  ('00000000-0000-0000-0000-000000000000', 'Instalare cutie distribuție', 'Montare cutie de distribuție', 120.00, 'montaj'),
  ('00000000-0000-0000-0000-000000000000', 'Înlocuire fir electric', 'Înlocuire fir/cablu electric vechi', 40.00, 'inlocuire'),
  ('00000000-0000-0000-0000-000000000000', 'Montaj corp iluminat', 'Montare corp de iluminat', 45.00, 'montaj'),
  ('00000000-0000-0000-0000-000000000000', 'Verificare instalație', 'Verificare completă instalație electrică', 80.00, 'verificare'),
  ('00000000-0000-0000-0000-000000000000', 'Dezmontare vechime', 'Dezmontare echipamente electrice vechi', 25.00, 'dezmontare'),
  ('00000000-0000-0000-0000-000000000000', 'Cătușe și conectică', 'Conectare și izolație fire/cabluri', 20.00, 'conectica')
ON CONFLICT DO NOTHING;
