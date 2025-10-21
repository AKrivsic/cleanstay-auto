-- CleanStay Client Profile Table
CREATE TABLE IF NOT EXISTS client_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  client_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  whatsapp_number VARCHAR(50),
  preferences JSONB DEFAULT '{}',
  special_instructions TEXT,
  access_instructions TEXT,
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client Feedback Table
CREATE TABLE IF NOT EXISTS client_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_profile_id UUID NOT NULL REFERENCES client_profile(id) ON DELETE CASCADE,
  cleaning_id UUID REFERENCES cleanings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('positive', 'negative', 'suggestion', 'complaint')),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for client profile
CREATE INDEX IF NOT EXISTS idx_client_profile_tenant_id ON client_profile(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_profile_property_id ON client_profile(property_id);
CREATE INDEX IF NOT EXISTS idx_client_profile_email ON client_profile(email);
CREATE INDEX IF NOT EXISTS idx_client_profile_phone ON client_profile(phone);
CREATE INDEX IF NOT EXISTS idx_client_profile_created_at ON client_profile(created_at);

-- Indexes for client feedback
CREATE INDEX IF NOT EXISTS idx_client_feedback_tenant_id ON client_feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_feedback_client_profile_id ON client_feedback(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_client_feedback_cleaning_id ON client_feedback(cleaning_id);
CREATE INDEX IF NOT EXISTS idx_client_feedback_rating ON client_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_client_feedback_type ON client_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_client_feedback_created_at ON client_feedback(created_at);

-- RLS policies for client profile
ALTER TABLE client_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view client profiles in their tenant
CREATE POLICY "Users can view tenant client profiles" ON client_profile
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE id = tenant_id
    )
  );

-- Policy: Only service role can manage client profiles
CREATE POLICY "Service role can manage client profiles" ON client_profile
  FOR ALL USING (auth.role() = 'service_role');

-- Policy: Users can view client feedback in their tenant
CREATE POLICY "Users can view tenant client feedback" ON client_feedback
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE id = tenant_id
    )
  );

-- Policy: Only service role can manage client feedback
CREATE POLICY "Service role can manage client feedback" ON client_feedback
  FOR ALL USING (auth.role() = 'service_role');
