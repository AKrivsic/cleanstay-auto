-- CleanStay AI System - Initial Schema
-- Created: 2025-01-26
-- Purpose: Multi-tenant cleaning management system

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tenants table (multi-tenant root)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    plan TEXT DEFAULT 'basic',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table (all users across tenants)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    role TEXT DEFAULT 'client',
    language TEXT DEFAULT 'cs',
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Properties table (buildings/apartments)
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    type TEXT DEFAULT 'apartment',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cleanings table (cleaning sessions)
CREATE TABLE IF NOT EXISTS public.cleanings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    cleaner_id UUID REFERENCES public.users(id),
    status TEXT DEFAULT 'scheduled',
    scheduled_date DATE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events table (cleaning events/timeline)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id),
    cleaning_id UUID REFERENCES public.cleanings(id),
    user_id UUID REFERENCES public.users(id),
    event_type TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages table (WhatsApp messages)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    from_phone TEXT NOT NULL,
    to_phone TEXT,
    content TEXT,
    message_type TEXT DEFAULT 'text',
    whatsapp_message_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
