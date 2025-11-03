-- CleanStay Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  whatsapp_message_id VARCHAR(255) UNIQUE,
  from_number VARCHAR(50) NOT NULL,
  to_number VARCHAR(50) NOT NULL,
  message_type VARCHAR(20) NOT NULL,
  raw_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message Parsing Results Table
CREATE TABLE IF NOT EXISTS message_parsing_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  parsed_data JSONB NOT NULL,
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_tenant_id ON messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_id ON messages(whatsapp_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_from_number ON messages(from_number);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Indexes for parsing results
CREATE INDEX IF NOT EXISTS idx_parsing_results_message_id ON message_parsing_results(message_id);
CREATE INDEX IF NOT EXISTS idx_parsing_results_confidence ON message_parsing_results(confidence);
CREATE INDEX IF NOT EXISTS idx_parsing_results_created_at ON message_parsing_results(created_at);

-- RLS policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_parsing_results ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages in their tenant
CREATE POLICY "Users can view tenant messages" ON messages
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE id = tenant_id
    )
  );

-- Policy: Only service role can manage messages
CREATE POLICY "Service role can manage messages" ON messages
  FOR ALL USING (auth.role() = 'service_role');

-- Policy: Users can view parsing results for their tenant messages
CREATE POLICY "Users can view tenant parsing results" ON message_parsing_results
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM messages WHERE tenant_id IN (
        SELECT id FROM tenants WHERE id = tenant_id
      )
    )
  );

-- Policy: Only service role can manage parsing results
CREATE POLICY "Service role can manage parsing results" ON message_parsing_results
  FOR ALL USING (auth.role() = 'service_role');
