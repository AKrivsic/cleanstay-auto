-- CleanStay Supplies Table
CREATE TABLE IF NOT EXISTS supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  current_stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  unit VARCHAR(20) NOT NULL,
  cost_per_unit DECIMAL(10,2),
  supplier VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supply Usage Tracking Table
CREATE TABLE IF NOT EXISTS supply_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supply_id UUID NOT NULL REFERENCES supplies(id) ON DELETE CASCADE,
  cleaning_id UUID REFERENCES cleanings(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  quantity_used INTEGER NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Indexes for supplies
CREATE INDEX IF NOT EXISTS idx_supplies_tenant_id ON supplies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_supplies_property_id ON supplies(property_id);
CREATE INDEX IF NOT EXISTS idx_supplies_category ON supplies(category);
CREATE INDEX IF NOT EXISTS idx_supplies_current_stock ON supplies(current_stock);
CREATE INDEX IF NOT EXISTS idx_supplies_created_at ON supplies(created_at);

-- Indexes for supply usage
CREATE INDEX IF NOT EXISTS idx_supply_usage_tenant_id ON supply_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_supply_usage_supply_id ON supply_usage(supply_id);
CREATE INDEX IF NOT EXISTS idx_supply_usage_cleaning_id ON supply_usage(cleaning_id);
CREATE INDEX IF NOT EXISTS idx_supply_usage_property_id ON supply_usage(property_id);
CREATE INDEX IF NOT EXISTS idx_supply_usage_used_at ON supply_usage(used_at);

-- RLS policies for supplies
ALTER TABLE supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view supplies in their tenant
CREATE POLICY "Users can view tenant supplies" ON supplies
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE id = tenant_id
    )
  );

-- Policy: Only service role can manage supplies
CREATE POLICY "Service role can manage supplies" ON supplies
  FOR ALL USING (auth.role() = 'service_role');

-- Policy: Users can view supply usage in their tenant
CREATE POLICY "Users can view tenant supply usage" ON supply_usage
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE id = tenant_id
    )
  );

-- Policy: Only service role can manage supply usage
CREATE POLICY "Service role can manage supply usage" ON supply_usage
  FOR ALL USING (auth.role() = 'service_role');
