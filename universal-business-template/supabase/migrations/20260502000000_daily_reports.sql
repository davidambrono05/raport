CREATE TABLE IF NOT EXISTS daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  date date NOT NULL DEFAULT current_date,
  materials_used text,
  operations_done text NOT NULL,
  equipment_used boolean DEFAULT false,
  equipment_duration text,
  notes text,
  images text,
  created_at timestamptz DEFAULT now()
);

-- Allow anon inserts (form submits via anon key)
CREATE POLICY "Allow anon inserts" ON daily_reports
  FOR INSERT WITH CHECK (true);

-- Allow anon reads (n8n queries via service role, but if using anon, adjust)
-- n8n will use service role key, so no RLS needed for service role
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
