-- Add work schedule columns to work_items
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_items' AND column_name='work_start_time') THEN
    ALTER TABLE work_items ADD COLUMN work_start_time TIME DEFAULT '07:00';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_items' AND column_name='work_end_time') THEN
    ALTER TABLE work_items ADD COLUMN work_end_time TIME DEFAULT '15:30';
  END IF;
END $$;

-- Add personnel: Ciubotaru Ciprian Mihai
-- Run this only if the user does not already exist
INSERT INTO profiles (id, display_name, role, created_at)
SELECT
  gen_random_uuid(),
  'Ciubotaru Ciprian Mihai',
  'employee',
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE display_name = 'Ciubotaru Ciprian Mihai'
);
