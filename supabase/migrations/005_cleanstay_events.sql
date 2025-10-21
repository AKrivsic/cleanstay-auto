-- CleanStay Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cleaning_id UUID REFERENCES cleanings(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_events_tenant_id ON events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_cleaning_id ON events(cleaning_id);
CREATE INDEX IF NOT EXISTS idx_events_property_id ON events(property_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

-- RLS policies for events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view events in their tenant
CREATE POLICY "Users can view tenant events" ON events
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE id = tenant_id
    )
  );

-- Policy: Only service role can manage events
CREATE POLICY "Service role can manage events" ON events
  FOR ALL USING (auth.role() = 'service_role');
