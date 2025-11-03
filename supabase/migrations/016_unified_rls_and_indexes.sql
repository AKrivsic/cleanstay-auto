-- 015b_create_jwt_tenant_fn.sql
-- Vytvoří helper funkci pro RLS: vrací tenant_id z JWT claims.
-- Idempotentní (přepíše existující definici, pokud by byla).

CREATE OR REPLACE FUNCTION public.jwt_tenant() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.tenant_id', true), '')::uuid
$$;

-- 016_unified_rls_and_indexes.sql
-- Sjednocené RLS, indexy, idempotence zpráv a fix typu "building"

-- === 0) Enum/CHECK fix pro properties.type ===
-- Varianta ENUM: přidej 'building', ale jen pokud enum existuje
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type t WHERE t.typname = 'property_type') THEN
    -- Přidá hodnotu, pokud už není
    EXECUTE 'ALTER TYPE property_type ADD VALUE IF NOT EXISTS ''building''';
  ELSE
    -- Varianta CHECK: rozšiř existující CHECK o 'building' (pokud existuje)
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'properties_type_check'
        AND conrelid = 'public.properties'::regclass
    ) THEN
      ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_type_check;
      -- UPRAV dle vlastního seznamu povolených typů:
      ALTER TABLE public.properties
        ADD CONSTRAINT properties_type_check
        CHECK (type IN ('apartment','office','house','building'));
    END IF;
  END IF;
END $$;

-- === 1) Idempotence pro zprávy (WhatsApp) ===
-- UNIQUE klíč na messages.id (message_id z webhooku)
CREATE UNIQUE INDEX IF NOT EXISTS messages_id_uq ON public.messages (id);

-- Užitečné indexy
CREATE INDEX IF NOT EXISTS idx_messages_tenant_created
  ON public.messages (tenant_id, created_at);

-- === 2) Standardní indexy (tenant_id, created_at) pro klíčové tabulky ===
CREATE INDEX IF NOT EXISTS idx_tenants_created            ON public.tenants (id, created_at);
CREATE INDEX IF NOT EXISTS idx_users_tenant_created       ON public.users (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_properties_tenant_created  ON public.properties (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_cleanings_tenant_created   ON public.cleanings (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_tenant_created      ON public.events (tenant_id, created_at);

-- === 3) RLS: zapnout a sjednotit policy = tenant_id = jwt_tenant() pro tabulky s tenant_id ===
-- POZN.: 'tenants' zde ZÁMĚRNĚ NENÍ (ten má sloupec id, viz 017)
DO $rls$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','properties','cleanings','events','messages']
  LOOP
    -- Zapnout RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);

    -- Zrušit staré policy s jiným názvem (pokud existují)
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_rw ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_isolation ON public.%I;', t, t);

    -- Vytvořit jednotnou RW policy
    EXECUTE format($SQL$
      CREATE POLICY %1$I_tenant_rw
      ON public.%1$I
      USING (tenant_id = public.jwt_tenant())
      WITH CHECK (tenant_id = public.jwt_tenant());
    $SQL$, t);
  END LOOP;
END
$rls$;

-- === 4) Doplňkové partial indexy (rychlejší filtry) — volitelně ===
-- Otevřené úklidy do přehledů
CREATE INDEX IF NOT EXISTS idx_cleanings_open
  ON public.cleanings (tenant_id, scheduled_at)
  WHERE status IN ('new','assigned','in_progress');
  
  -- Bezpečný index pro timeline/eventy (bez ne-IMMUTABLE funkce v predikátu)
CREATE INDEX IF NOT EXISTS idx_events_tenant_created
  ON public.events (tenant_id, created_at DESC);

-- (volitelné pro velmi velké tabulky): BRIN index pro levné rozsahové dotazy podle času
-- CREATE INDEX IF NOT EXISTS brin_events_created ON public.events USING BRIN (created_at) WITH (pages_per_range=16);

-- -- Poslední eventy (90 dní) do timeline
-- CREATE INDEX IF NOT EXISTS idx_events_recent
--   ON public.events (tenant_id, created_at DESC)
--   WHERE created_at > now() - interval '90 days';
