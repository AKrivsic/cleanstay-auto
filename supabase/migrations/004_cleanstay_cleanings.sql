-- CleanStay Cleanings Table
CREATE TABLE IF NOT EXISTS cleanings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  cleaner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  client_feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for cleanings
CREATE INDEX IF NOT EXISTS idx_cleanings_tenant_id ON cleanings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cleanings_property_id ON cleanings(property_id);
CREATE INDEX IF NOT EXISTS idx_cleanings_cleaner_id ON cleanings(cleaner_id);
CREATE INDEX IF NOT EXISTS idx_cleanings_status ON cleanings(status);
CREATE INDEX IF NOT EXISTS idx_cleanings_scheduled_date ON cleanings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_cleanings_created_at ON cleanings(created_at);

-- RLS policies for cleanings
ALTER TABLE cleanings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view cleanings in their tenant
CREATE POLICY "Users can view tenant cleanings" ON cleanings
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE id = tenant_id
    )
  );

-- Policy: Only service role can manage cleanings
CREATE POLICY "Service role can manage cleanings" ON cleanings
  FOR ALL USING (auth.role() = 'service_role');
