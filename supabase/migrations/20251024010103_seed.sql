-- CleanStay AI System - Seed Data
-- Purpose: Initial data for testing (idempotent)

BEGIN;

 -- === Tenants (funguje i když 'plan' neexistuje) ===
DO $$
DECLARE
  has_plan  boolean;
  has_email boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tenants' AND column_name='plan'
  ) INTO has_plan;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tenants' AND column_name='email'
  ) INTO has_email;

  IF has_email AND has_plan THEN
    INSERT INTO public.tenants (id, name, email, plan) VALUES
      ('550e8400-e29b-41d4-a716-446655440000', 'CleanStay Test', 'demo@cleanstay.test', DEFAULT)
    ON CONFLICT (id) DO NOTHING;

  ELSIF has_email THEN
    INSERT INTO public.tenants (id, name, email) VALUES
      ('550e8400-e29b-41d4-a716-446655440000', 'CleanStay Test', 'demo@cleanstay.test')
    ON CONFLICT (id) DO NOTHING;

  ELSIF has_plan THEN
    INSERT INTO public.tenants (id, name, plan) VALUES
      ('550e8400-e29b-41d4-a716-446655440000', 'CleanStay Test', DEFAULT)
    ON CONFLICT (id) DO NOTHING;

  ELSE
    INSERT INTO public.tenants (id, name) VALUES
      ('550e8400-e29b-41d4-a716-446655440000', 'CleanStay Test')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- === Users (tolerantní na chybějící sloupce language/phone) ===
DO $$
DECLARE
  has_language boolean;
  has_phone    boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='users' AND column_name='language'
  ) INTO has_language;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='users' AND column_name='phone'
  ) INTO has_phone;

  IF has_language AND has_phone THEN
    INSERT INTO public.users (id, tenant_id, email, name, role, language, phone) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001','550e8400-e29b-41d4-a716-446655440000','admin@cleanstay.test',  'Admin User',  'admin',   'cs', '+420123456789'),
    ('550e8400-e29b-41d4-a716-446655440002','550e8400-e29b-41d4-a716-446655440000','client@cleanstay.test', 'Client User', 'client',  'cs', '+420987654321'),
    ('550e8400-e29b-41d4-a716-446655440003','550e8400-e29b-41d4-a716-446655440000','cleaner@cleanstay.test','Cleaner User','cleaner', 'cs', '+420555666777')
    ON CONFLICT (id) DO NOTHING;

  ELSIF has_language AND NOT has_phone THEN
    INSERT INTO public.users (id, tenant_id, email, name, role, language) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001','550e8400-e29b-41d4-a716-446655440000','admin@cleanstay.test',  'Admin User',  'admin',   'cs'),
    ('550e8400-e29b-41d4-a716-446655440002','550e8400-e29b-41d4-a716-446655440000','client@cleanstay.test', 'Client User', 'client',  'cs'),
    ('550e8400-e29b-41d4-a716-446655440003','550e8400-e29b-41d4-a716-446655440000','cleaner@cleanstay.test','Cleaner User','cleaner', 'cs')
    ON CONFLICT (id) DO NOTHING;

  ELSIF NOT has_language AND has_phone THEN
    INSERT INTO public.users (id, tenant_id, email, name, role, phone) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001','550e8400-e29b-41d4-a716-446655440000','admin@cleanstay.test',  'Admin User',  'admin',   '+420123456789'),
    ('550e8400-e29b-41d4-a716-446655440002','550e8400-e29b-41d4-a716-446655440000','client@cleanstay.test', 'Client User', 'client',  '+420987654321'),
    ('550e8400-e29b-41d4-a716-446655440003','550e8400-e29b-41d4-a716-446655440000','cleaner@cleanstay.test','Cleaner User','cleaner', '+420555666777')
    ON CONFLICT (id) DO NOTHING;

  ELSE
    -- ani language, ani phone
    INSERT INTO public.users (id, tenant_id, email, name, role) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001','550e8400-e29b-41d4-a716-446655440000','admin@cleanstay.test',  'Admin User',  'admin'),
    ('550e8400-e29b-41d4-a716-446655440002','550e8400-e29b-41d4-a716-446655440000','client@cleanstay.test', 'Client User', 'client'),
    ('550e8400-e29b-41d4-a716-446655440003','550e8400-e29b-41d4-a716-446655440000','cleaner@cleanstay.test','Cleaner User','cleaner')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;


-- === Properties (tolerantní na check constraint typů) ===
-- 1) Airbnby (apartment) – ok
INSERT INTO public.properties (id, tenant_id, name, address, type) VALUES
('550e8400-e29b-41d4-a716-446655440010','550e8400-e29b-41d4-a716-446655440000','Airbnb 302','Václavské náměstí 1, Praha','apartment'),
('550e8400-e29b-41d4-a716-446655440011','550e8400-e29b-41d4-a716-446655440000','Airbnb 205','Karlova 8, Praha','apartment')
ON CONFLICT (id) DO NOTHING;

-- 2) SVJ – preferujeme 'building', ale když ho schema nepovolí, spadneme na 'apartment'
DO $$
BEGIN
  INSERT INTO public.properties (id, tenant_id, name, address, type) VALUES
  ('550e8400-e29b-41d4-a716-446655440012','550e8400-e29b-41d4-a716-446655440000','SVJ Nikolajka','Nikolajka 3, Praha','building')
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN check_violation THEN  -- SQLSTATE 23514
  INSERT INTO public.properties (id, tenant_id, name, address, type) VALUES
  ('550e8400-e29b-41d4-a716-446655440012','550e8400-e29b-41d4-a716-446655440000','SVJ Nikolajka','Nikolajka 3, Praha','apartment')
  ON CONFLICT (id) DO NOTHING;
END $$;


COMMIT;

