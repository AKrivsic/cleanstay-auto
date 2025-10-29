-- CleanStay AI System - Indexes
-- Created: 2025-01-26
-- Purpose: Performance optimization indexes

-- Tenants indexes
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON public.tenants (created_at);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users (tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users (created_at);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);

-- Properties indexes
CREATE INDEX IF NOT EXISTS idx_properties_tenant_id ON public.properties (tenant_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties (created_at);

-- Cleanings indexes
CREATE INDEX IF NOT EXISTS idx_cleanings_tenant_id ON public.cleanings (tenant_id);
CREATE INDEX IF NOT EXISTS idx_cleanings_property_id ON public.cleanings (property_id);
CREATE INDEX IF NOT EXISTS idx_cleanings_cleaner_id ON public.cleanings (cleaner_id);
CREATE INDEX IF NOT EXISTS idx_cleanings_status ON public.cleanings (status);
CREATE INDEX IF NOT EXISTS idx_cleanings_scheduled_date ON public.cleanings (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_cleanings_created_at ON public.cleanings (created_at);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_tenant_id ON public.events (tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_property_id ON public.events (property_id);
CREATE INDEX IF NOT EXISTS idx_events_cleaning_id ON public.events (cleaning_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events (user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events (event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events (created_at);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_tenant_id ON public.messages (tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at);
