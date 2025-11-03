-- Verification queries for CleanStay multi-tenant schema
-- These queries should be run after migrations are applied

-- 1. Check all tables exist
select tablename from pg_tables where schemaname='public' order by tablename;

-- 2. Verify tenant data
select id, name from public.tenants;

-- 3. Check properties
select name, type from public.properties order by name;

-- 4. Count cleanings
select count(*) as cleanings_cnt from public.cleanings;

-- 5. Check events
select type, done, created_at from public.events order by created_at desc limit 10;

-- 6. Check supplies
select name, sku from public.supplies order by name;

-- 7. Check inventory movements
select direction, quantity from public.inventory order by created_at desc limit 10;

-- 8. Check messages
select channel, direction, raw->>'from' as msg_from from public.messages order by created_at desc limit 5;

-- 9. Verify foreign key relationships
select 
  t.table_name,
  t.constraint_name,
  t.constraint_type
from information_schema.table_constraints t
where t.table_schema = 'public' 
  and t.constraint_type = 'FOREIGN KEY'
order by t.table_name;

-- 10. Check indexes
select 
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes 
where schemaname = 'public'
order by tablename, indexname;

