-- CleanStay Extended Fields Migration
-- Purpose: Add all required fields for clients, cleaners, and properties

-- Add client-specific fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ico VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS dic VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_terms TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_frequency VARCHAR(20) CHECK (billing_frequency IN ('after_cleaning', 'monthly', 'weekly', 'quarterly'));

-- Add cleaner-specific fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS messenger VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS document_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS document_type VARCHAR(20) CHECK (document_type IN ('passport', 'id_card', 'driving_license', 'other'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS document_valid_until DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS requested_hourly_rate_from DECIMAL(10,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS languages TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS specializations TEXT[];

-- Add property-specific fields to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS size_sqm INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS layout VARCHAR(50);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bathrooms INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cleaning_instructions TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS access_instructions TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS equipment_on_site TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS preferred_cleaning_times TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS special_requirements TEXT;

-- Update existing properties to have required fields
UPDATE properties SET 
  size_sqm = COALESCE(size_sqm, 0),
  bathrooms = COALESCE(bathrooms, 1),
  layout = COALESCE(layout, 'unknown')
WHERE size_sqm IS NULL OR bathrooms IS NULL OR layout IS NULL;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_users_billing_frequency ON users(billing_frequency);
CREATE INDEX IF NOT EXISTS idx_users_document_type ON users(document_type);
CREATE INDEX IF NOT EXISTS idx_users_document_valid_until ON users(document_valid_until);
CREATE INDEX IF NOT EXISTS idx_users_requested_hourly_rate ON users(requested_hourly_rate_from);
CREATE INDEX IF NOT EXISTS idx_properties_client_id ON properties(client_id);
CREATE INDEX IF NOT EXISTS idx_properties_size_sqm ON properties(size_sqm);
CREATE INDEX IF NOT EXISTS idx_properties_bathrooms ON properties(bathrooms);

-- Add constraints
ALTER TABLE users ADD CONSTRAINT check_client_required_fields 
  CHECK (
    role != 'client' OR (
      name IS NOT NULL AND 
      email IS NOT NULL AND 
      phone IS NOT NULL AND 
      billing_address IS NOT NULL
    )
  );

ALTER TABLE users ADD CONSTRAINT check_cleaner_required_fields 
  CHECK (
    role != 'cleaner' OR (
      name IS NOT NULL AND 
      phone IS NOT NULL
    )
  );

ALTER TABLE properties ADD CONSTRAINT check_property_required_fields 
  CHECK (
    name IS NOT NULL AND 
    address IS NOT NULL AND 
    type IS NOT NULL AND 
    client_id IS NOT NULL
  );

-- Add comments for documentation
COMMENT ON COLUMN users.billing_address IS 'Fakturační adresa klienta';
COMMENT ON COLUMN users.ico IS 'IČO klienta';
COMMENT ON COLUMN users.dic IS 'DIČ klienta';
COMMENT ON COLUMN users.payment_terms IS 'Platební podmínky';
COMMENT ON COLUMN users.billing_frequency IS 'Frekvence fakturace (after_cleaning, monthly, weekly, quarterly)';
COMMENT ON COLUMN users.messenger IS 'Messenger kontakt uklízečky';
COMMENT ON COLUMN users.document_number IS 'Číslo dokladu uklízečky';
COMMENT ON COLUMN users.document_type IS 'Typ dokladu uklízečky';
COMMENT ON COLUMN users.document_valid_until IS 'Datum platnosti dokladu';
COMMENT ON COLUMN users.requested_hourly_rate_from IS 'Požadovaná hodinová sazba od';
COMMENT ON COLUMN users.languages IS 'Jazyky uklízečky';
COMMENT ON COLUMN users.availability IS 'Dostupnost uklízečky';
COMMENT ON COLUMN users.specializations IS 'Specializace uklízečky';
COMMENT ON COLUMN properties.client_id IS 'ID klienta vlastníka nemovitosti';
COMMENT ON COLUMN properties.layout IS 'Dispozice nemovitosti';
COMMENT ON COLUMN properties.cleaning_instructions IS 'Pokyny k úklidu';
COMMENT ON COLUMN properties.access_instructions IS 'Instrukce pro přístup';
COMMENT ON COLUMN properties.equipment_on_site IS 'Vybavení co je na místě';
COMMENT ON COLUMN properties.preferred_cleaning_times IS 'Požadované časy úklidu';
COMMENT ON COLUMN properties.special_requirements IS 'Speciální požadavky';
