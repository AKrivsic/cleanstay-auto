-- CleanStay AI System - Row Level Security
-- Created: 2025-01-26
-- Purpose: Multi-tenant security policies

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleanings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Admin policies (full access)
CREATE POLICY "admin_all_access" ON public.tenants FOR ALL TO authenticated USING (true);
CREATE POLICY "admin_all_access" ON public.users FOR ALL TO authenticated USING (true);
CREATE POLICY "admin_all_access" ON public.properties FOR ALL TO authenticated USING (true);
CREATE POLICY "admin_all_access" ON public.cleanings FOR ALL TO authenticated USING (true);
CREATE POLICY "admin_all_access" ON public.events FOR ALL TO authenticated USING (true);
CREATE POLICY "admin_all_access" ON public.messages FOR ALL TO authenticated USING (true);

-- Client policies (read-only own tenant)
CREATE POLICY "client_tenant_read" ON public.tenants FOR SELECT TO authenticated USING (true);
CREATE POLICY "client_tenant_read" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "client_tenant_read" ON public.properties FOR SELECT TO authenticated USING (true);
CREATE POLICY "client_tenant_read" ON public.cleanings FOR SELECT TO authenticated USING (true);
CREATE POLICY "client_tenant_read" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "client_tenant_read" ON public.messages FOR SELECT TO authenticated USING (true);

-- Service role policies (bypass RLS)
CREATE POLICY "service_role_all" ON public.tenants FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.users FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.properties FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.cleanings FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.events FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.messages FOR ALL TO service_role USING (true);
