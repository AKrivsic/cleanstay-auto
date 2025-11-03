#!/usr/bin/env node

/**
 * Database Seed Script
 * Populates database with pilot data (8 Airbnb + 2 SVJ, 3 cleaners, 1 admin, 1 client)
 */

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvironment() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    log(`❌ Missing required environment variables: ${missing.join(', ')}`, 'red');
    log('Please set these variables in your .env.local file', 'yellow');
    process.exit(1);
  }
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Pilot data
const pilotData = {
  tenant: {
    id: 'tenant-pilot-123',
    name: 'CleanStay Pilot',
    domain: 'pilot.cleanstay.ai',
    created_at: new Date().toISOString()
  },
  
  users: [
    {
      id: 'user-admin-001',
      tenant_id: 'tenant-pilot-123',
      name: 'Admin Pilot',
      email: 'admin@pilot.cleanstay.ai',
      phone: '+420123456789',
      role: 'admin',
      language: 'cs',
      created_at: new Date().toISOString()
    },
    {
      id: 'user-client-001',
      tenant_id: 'tenant-pilot-123',
      name: 'Klient Pilot',
      email: 'klient@pilot.cleanstay.ai',
      phone: '+420987654321',
      role: 'client',
      language: 'cs',
      created_at: new Date().toISOString()
    }
  ],
  
  cleaners: [
    {
      id: 'cleaner-001',
      tenant_id: 'tenant-pilot-123',
      name: 'Marie Nováková',
      phone: '+420111222333',
      language: 'cs',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'cleaner-002',
      tenant_id: 'tenant-pilot-123',
      name: 'Anna Svobodová',
      phone: '+420444555666',
      language: 'cs',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'cleaner-003',
      tenant_id: 'tenant-pilot-123',
      name: 'Elena Petrová',
      phone: '+420777888999',
      language: 'cs',
      is_active: true,
      created_at: new Date().toISOString()
    }
  ],
  
  properties: [
    // 8 Airbnb properties
    {
      id: 'prop-001',
      tenant_id: 'tenant-pilot-123',
      name: 'Nikolajka 302',
      address: 'Nikolajka 302, Praha 1',
      type: 'airbnb',
      size_sqm: 45,
      bedrooms: 1,
      bathrooms: 1,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'prop-002',
      tenant_id: 'tenant-pilot-123',
      name: 'Nikolajka 205',
      address: 'Nikolajka 205, Praha 1',
      type: 'airbnb',
      size_sqm: 38,
      bedrooms: 1,
      bathrooms: 1,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'prop-003',
      tenant_id: 'tenant-pilot-123',
      name: 'Václavské nám. 15',
      address: 'Václavské náměstí 15, Praha 1',
      type: 'airbnb',
      size_sqm: 52,
      bedrooms: 2,
      bathrooms: 1,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'prop-004',
      tenant_id: 'tenant-pilot-123',
      name: 'Karlova 8',
      address: 'Karlova 8, Praha 1',
      type: 'airbnb',
      size_sqm: 41,
      bedrooms: 1,
      bathrooms: 1,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'prop-005',
      tenant_id: 'tenant-pilot-123',
      name: 'Staroměstské nám. 12',
      address: 'Staroměstské náměstí 12, Praha 1',
      type: 'airbnb',
      size_sqm: 48,
      bedrooms: 1,
      bathrooms: 1,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'prop-006',
      tenant_id: 'tenant-pilot-123',
      name: 'Národní 25',
      address: 'Národní 25, Praha 1',
      type: 'airbnb',
      size_sqm: 35,
      bedrooms: 1,
      bathrooms: 1,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'prop-007',
      tenant_id: 'tenant-pilot-123',
      name: 'Malá Strana 7',
      address: 'Malá Strana 7, Praha 1',
      type: 'airbnb',
      size_sqm: 58,
      bedrooms: 2,
      bathrooms: 1,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'prop-008',
      tenant_id: 'tenant-pilot-123',
      name: 'Hradčany 3',
      address: 'Hradčany 3, Praha 1',
      type: 'airbnb',
      size_sqm: 42,
      bedrooms: 1,
      bathrooms: 1,
      is_active: true,
      created_at: new Date().toISOString()
    },
    // 2 SVJ properties
    {
      id: 'prop-009',
      tenant_id: 'tenant-pilot-123',
      name: 'SVJ Vinohrady 15',
      address: 'Vinohrady 15, Praha 2',
      type: 'svj',
      size_sqm: 75,
      bedrooms: 3,
      bathrooms: 2,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'prop-010',
      tenant_id: 'tenant-pilot-123',
      name: 'SVJ Žižkov 22',
      address: 'Žižkov 22, Praha 3',
      type: 'svj',
      size_sqm: 68,
      bedrooms: 2,
      bathrooms: 2,
      is_active: true,
      created_at: new Date().toISOString()
    }
  ],
  
  supplies: [
    {
      id: 'supply-001',
      tenant_id: 'tenant-pilot-123',
      name: 'Domestos',
      unit: 'ks',
      sku: 'DOM-001',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'supply-002',
      tenant_id: 'tenant-pilot-123',
      name: 'Jar',
      unit: 'ks',
      sku: 'JAR-001',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'supply-003',
      tenant_id: 'tenant-pilot-123',
      name: 'Kávové kapsle',
      unit: 'ks',
      sku: 'KAFE-001',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'supply-004',
      tenant_id: 'tenant-pilot-123',
      name: 'Toaletní papír',
      unit: 'ks',
      sku: 'TP-001',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'supply-005',
      tenant_id: 'tenant-pilot-123',
      name: 'Povlečení',
      unit: 'sada',
      sku: 'POV-001',
      is_active: true,
      created_at: new Date().toISOString()
    }
  ]
};

async function seedTenant() {
  log('🏢 Creating tenant...', 'cyan');
  
  const { error } = await supabase
    .from('tenants')
    .insert(pilotData.tenant);
    
  if (error) {
    log(`❌ Error creating tenant: ${error.message}`, 'red');
    throw error;
  }
  
  log('✅ Tenant created', 'green');
}

async function seedUsers() {
  log('👥 Creating users...', 'cyan');
  
  const { error } = await supabase
    .from('users')
    .insert(pilotData.users);
    
  if (error) {
    log(`❌ Error creating users: ${error.message}`, 'red');
    throw error;
  }
  
  log('✅ Users created', 'green');
}

async function seedCleaners() {
  log('🧹 Creating cleaners...', 'cyan');
  
  const { error } = await supabase
    .from('cleaners')
    .insert(pilotData.cleaners);
    
  if (error) {
    log(`❌ Error creating cleaners: ${error.message}`, 'red');
    throw error;
  }
  
  log('✅ Cleaners created', 'green');
}

async function seedProperties() {
  log('🏠 Creating properties...', 'cyan');
  
  const { error } = await supabase
    .from('properties')
    .insert(pilotData.properties);
    
  if (error) {
    log(`❌ Error creating properties: ${error.message}`, 'red');
    throw error;
  }
  
  log('✅ Properties created', 'green');
}

async function seedSupplies() {
  log('📦 Creating supplies...', 'cyan');
  
  const { error } = await supabase
    .from('supplies')
    .insert(pilotData.supplies);
    
  if (error) {
    log(`❌ Error creating supplies: ${error.message}`, 'red');
    throw error;
  }
  
  log('✅ Supplies created', 'green');
}

async function seedInventory() {
  log('📊 Creating inventory...', 'cyan');
  
  const inventoryData = [];
  
  // Create inventory for each property and supply combination
  for (const property of pilotData.properties) {
    for (const supply of pilotData.supplies) {
      inventoryData.push({
        id: uuidv4(),
        tenant_id: 'tenant-pilot-123',
        property_id: property.id,
        supply_id: supply.id,
        min_qty: 2,
        max_qty: 10,
        current_qty: 5,
        created_at: new Date().toISOString()
      });
    }
  }
  
  const { error } = await supabase
    .from('inventory')
    .insert(inventoryData);
    
  if (error) {
    log(`❌ Error creating inventory: ${error.message}`, 'red');
    throw error;
  }
  
  log('✅ Inventory created', 'green');
}

async function runHealthCheck() {
  log('🔍 Running health check...', 'cyan');
  
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);
      
    if (error) {
      throw error;
    }
    
    log('✅ Database connection OK', 'green');
    
    // Test storage bucket
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      throw bucketError;
    }
    
    const mediaBucket = buckets.find(bucket => bucket.name === 'cleanstay_media');
    if (!mediaBucket) {
      log('⚠️  Media bucket not found - please create it manually', 'yellow');
    } else {
      log('✅ Storage bucket OK', 'green');
    }
    
  } catch (error) {
    log(`❌ Health check failed: ${error.message}`, 'red');
    throw error;
  }
}

async function main() {
  log('🌱 CleanStay Pilot Data Seeding', 'magenta');
  log('================================', 'magenta');
  
  try {
    checkEnvironment();
    
    log('🚀 Starting seed process...', 'blue');
    
    await seedTenant();
    await seedUsers();
    await seedCleaners();
    await seedProperties();
    await seedSupplies();
    await seedInventory();
    
    log('', 'reset');
    log('🎉 Seed process completed successfully!', 'green');
    log('', 'reset');
    log('📊 Pilot data summary:', 'blue');
    log(`• 1 tenant: ${pilotData.tenant.name}`, 'blue');
    log(`• 2 users: 1 admin, 1 client`, 'blue');
    log(`• 3 cleaners: Marie, Anna, Elena`, 'blue');
    log(`• 10 properties: 8 Airbnb + 2 SVJ`, 'blue');
    log(`• 5 supplies: Domestos, Jar, Kapsle, TP, Povlečení`, 'blue');
    log(`• 50 inventory items: 10 properties × 5 supplies`, 'blue');
    
    log('', 'reset');
    log('🔍 Running health check...', 'cyan');
    await runHealthCheck();
    
    log('', 'reset');
    log('✅ Pilot environment ready!', 'green');
    log('Next steps:', 'blue');
    log('1. Configure WhatsApp webhook', 'blue');
    log('2. Set up OpenAI API key', 'blue');
    log('3. Start pilot testing', 'blue');
    
  } catch (error) {
    log(`💥 Seed process failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  seedTenant,
  seedUsers,
  seedCleaners,
  seedProperties,
  seedSupplies,
  seedInventory,
  runHealthCheck
};





