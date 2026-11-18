-- Personal nou: Mihai Andrei (electrician), cerut de patron.
-- Rulează o singură dată în Supabase → SQL Editor. E sigur și dacă îl rulezi de două ori: nu îl dublează.
-- Ca să apară în listele „Șef echipă” și „Membri echipă” de la lucrări, îl pun și într-o echipă:
-- în aceleași echipe ca Ciubotaru Ciprian Mihai sau, dacă el nu e în nicio echipă, în prima echipă.
DO $$
DECLARE
  v_id uuid;
  v_tenant uuid;
  v_col text;
BEGIN
  SELECT id INTO v_id FROM profiles WHERE display_name = 'Mihai Andrei' LIMIT 1;

  IF v_id IS NULL THEN
    v_id := gen_random_uuid();
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'tenant_id') THEN
      -- aceeași firmă (tenant) ca restul personalului
      EXECUTE 'SELECT tenant_id FROM profiles WHERE tenant_id IS NOT NULL ORDER BY created_at LIMIT 1' INTO v_tenant;
      EXECUTE 'INSERT INTO profiles (id, tenant_id, display_name, role, created_at) VALUES ($1, $2, $3, $4::user_role, now())'
        USING v_id, v_tenant, 'Mihai Andrei', 'employee';
    ELSE
      INSERT INTO profiles (id, display_name, role, created_at) VALUES (v_id, 'Mihai Andrei', 'employee'::user_role, now());
    END IF;
  END IF;

  -- coloana care leagă membrul de profil (profile_id sau user_id, după cum e făcută baza)
  SELECT column_name INTO v_col FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'team_members' AND column_name IN ('profile_id', 'user_id', 'member_id')
   ORDER BY (column_name = 'profile_id') DESC, (column_name = 'user_id') DESC
   LIMIT 1;

  IF v_col IS NOT NULL THEN
    EXECUTE format($q$
      INSERT INTO team_members (team_id, %1$I)
      SELECT e.team_id, $1
      FROM (
        SELECT DISTINCT tm.team_id
        FROM team_members tm JOIN profiles p ON p.id = tm.%1$I
        WHERE p.display_name = 'Ciubotaru Ciprian Mihai'
        UNION
        SELECT t.id FROM (SELECT id FROM teams ORDER BY name LIMIT 1) t
        WHERE NOT EXISTS (SELECT 1 FROM team_members tm JOIN profiles p ON p.id = tm.%1$I
                          WHERE p.display_name = 'Ciubotaru Ciprian Mihai')
      ) e
      WHERE NOT EXISTS (SELECT 1 FROM team_members x WHERE x.team_id = e.team_id AND x.%1$I = $1)
    $q$, v_col) USING v_id;
  END IF;
END $$;
