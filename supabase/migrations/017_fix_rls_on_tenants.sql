-- 017_fix_rls_on_tenants.sql
-- Oprava RLS pro tenants (id = jwt_tenant()) a sjednocení zbytku

-- 0) Helper funkce: jwt_tenant()
CREATE OR REPLACE FUNCTION public.jwt_tenant() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.tenant_id', true), '')::uuid
$$;

-- 1) Tabulka tenants -> RLS ON + policy na id
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Smazat staré policy (pokud existují)
DROP POLICY IF EXISTS tenants_tenant_rw ON public.tenants;
DROP POLICY IF EXISTS tenants_tenant_isolation ON public.tenants;

-- Správná policy pro tenants (id = jwt_tenant)
CREATE POLICY tenants_tenant_rw
ON public.tenants
USING (id = public.jwt_tenant())
WITH CHECK (id = public.jwt_tenant());

-- 2) Ostatní tabulky (tenant_id = jwt_tenant) — idempotentní refresher
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','properties','cleanings','events','messages']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_rw ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_isolation ON public.%I;', t, t);
    EXECUTE format($SQL$
      CREATE POLICY %1$I_tenant_rw
      ON public.%1$I
      USING (tenant_id = public.jwt_tenant())
      WITH CHECK (tenant_id = public.jwt_tenant());
    $SQL$, t);
  END LOOP;
END
$$;

-- 3) Doplňkové indexy (idempotentně)
CREATE INDEX IF NOT EXISTS idx_users_tenant_created
  ON public.users (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_properties_tenant_created
  ON public.properties (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_cleanings_tenant_created
  ON public.cleanings (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_tenant_created
  ON public.events (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_tenant_created
  ON public.messages (tenant_id, created_at);

-- 4) Idempotence webhooku
CREATE UNIQUE INDEX IF NOT EXISTS messages_id_uq
  ON public.messages (id);

