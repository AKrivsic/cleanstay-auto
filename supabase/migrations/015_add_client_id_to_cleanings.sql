-- 015_add_client_id_to_cleanings.sql

-- 1) Sloupec client_id (pokud neexistuje)
ALTER TABLE public.cleanings
  ADD COLUMN IF NOT EXISTS client_id uuid;

-- 2) Doplň client_id z properties.client_id (jednorázově)
UPDATE public.cleanings c
SET client_id = p.client_id
FROM public.properties p
WHERE c.property_id = p.id
  AND c.client_id IS NULL
  AND p.client_id IS NOT NULL;

-- 3) FK na users(id) — bezpečně, nemusí být NOT NULL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cleanings_client_fk'
  ) THEN
    ALTER TABLE public.cleanings
      ADD CONSTRAINT cleanings_client_fk
      FOREIGN KEY (client_id) REFERENCES public.users(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

-- 4) Index pro rychlé filtry podle tenant/klient/termínu
CREATE INDEX IF NOT EXISTS idx_cleanings_tenant_client_sched
  ON public.cleanings (tenant_id, client_id, scheduled_at);

-- 5) (volitelné) Index pro tenant + created_at (pokud ještě není)
CREATE INDEX IF NOT EXISTS idx_cleanings_tenant_created
  ON public.cleanings (tenant_id, created_at);
