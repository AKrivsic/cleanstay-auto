-- CleanStay Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  item_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  condition_status VARCHAR(20) NOT NULL CHECK (condition_status IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
  quantity INTEGER DEFAULT 1,
  location VARCHAR(100),
  notes TEXT,
  last_checked TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory Updates Table
CREATE TABLE IF NOT EXISTS inventory_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  cleaning_id UUID REFERENCES cleanings(id) ON DELETE SET NULL,
  update_type VARCHAR(20) NOT NULL CHECK (update_type IN ('check', 'repair', 'replace', 'add', 'remove')),
  previous_condition VARCHAR(20),
  new_condition VARCHAR(20),
  notes TEXT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for inventory
CREATE INDEX IF NOT EXISTS idx_inventory_tenant_id ON inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_property_id ON inventory(property_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_condition ON inventory(condition_status);
CREATE INDEX IF NOT EXISTS idx_inventory_created_at ON inventory(created_at);

-- Indexes for inventory updates
CREATE INDEX IF NOT EXISTS idx_inventory_updates_tenant_id ON inventory_updates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_updates_inventory_id ON inventory_updates(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_updates_cleaning_id ON inventory_updates(cleaning_id);
CREATE INDEX IF NOT EXISTS idx_inventory_updates_update_type ON inventory_updates(update_type);
CREATE INDEX IF NOT EXISTS idx_inventory_updates_created_at ON inventory_updates(created_at);

-- RLS policies for inventory
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_updates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view inventory in their tenant
CREATE POLICY "Users can view tenant inventory" ON inventory
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE id = tenant_id
    )
  );

-- Policy: Only service role can manage inventory
CREATE POLICY "Service role can manage inventory" ON inventory
  FOR ALL USING (auth.role() = 'service_role');

-- Policy: Users can view inventory updates in their tenant
CREATE POLICY "Users can view tenant inventory updates" ON inventory_updates
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE id = tenant_id
    )
  );

-- Policy: Only service role can manage inventory updates
CREATE POLICY "Service role can manage inventory updates" ON inventory_updates
  FOR ALL USING (auth.role() = 'service_role');
