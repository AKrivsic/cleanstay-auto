-- CleanStay Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'cleaner', 'client')),
  phone VARCHAR(50),
  whatsapp_number VARCHAR(50),
  properties UUID[] DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint for email within tenant
  UNIQUE(tenant_id, email)
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- RLS policies for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view users in their tenant
CREATE POLICY "Users can view tenant users" ON users
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE id = tenant_id
    )
  );

-- Policy: Only service role can manage users
CREATE POLICY "Service role can manage users" ON users
  FOR ALL USING (auth.role() = 'service_role');
