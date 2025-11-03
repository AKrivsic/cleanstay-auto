-- CleanStay Properties Table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('apartment', 'house', 'office', 'hotel', 'other')),
  size_sqm INTEGER,
  rooms INTEGER,
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  notes TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for properties
CREATE INDEX IF NOT EXISTS idx_properties_tenant_id ON properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);

-- RLS policies for properties
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view properties in their tenant
CREATE POLICY "Users can view tenant properties" ON properties
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE id = tenant_id
    )
  );

-- Policy: Only service role can manage properties
CREATE POLICY "Service role can manage properties" ON properties
  FOR ALL USING (auth.role() = 'service_role');
