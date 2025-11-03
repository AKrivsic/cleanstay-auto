-- Additive migration for website chatbot (idempotent)

-- conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  session_id TEXT,
  locale TEXT,
  source_url TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  service_type TEXT,
  city TEXT,
  size_m2 INT,
  cadence TEXT,
  rush BOOLEAN,
  consent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extend messages table with web-chat compatible columns
DO $$ BEGIN
  ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS source TEXT;
  ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;
  ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS role TEXT;
  ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS text TEXT;
  ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS intent TEXT;
  ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS confidence NUMERIC;
  ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS unread BOOLEAN DEFAULT TRUE;
  ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS session_id TEXT;
  ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS origin_url TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

-- Constraints/checks (use CREATE DOMAIN-like checks via triggers if needed)
DO $$ BEGIN
  ALTER TABLE public.messages ADD CONSTRAINT messages_role_check CHECK (role IN ('user','assistant','system'));
EXCEPTION WHEN others THEN NULL; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_tenant_created_at ON public.messages(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_web_unread ON public.messages(unread) WHERE source = 'web';

-- RLS enablement
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- RLS policies (service role manage; authenticated read by tenant)
DO $$ BEGIN
  CREATE POLICY conversations_service_all ON public.conversations FOR ALL TO service_role USING (true);
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY leads_service_all ON public.leads FOR ALL TO service_role USING (true);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY conversations_tenant_read ON public.conversations FOR SELECT TO authenticated USING (tenant_id IS NULL OR tenant_id = auth.uid());
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY leads_tenant_read ON public.leads FOR SELECT TO authenticated USING (tenant_id IS NULL OR tenant_id = auth.uid());
EXCEPTION WHEN others THEN NULL; END $$;


