#!/usr/bin/env node

/**
 * Health Check Script
 * Verifies database connectivity, storage, and system health
 */

const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');

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

function getGitSha() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().substring(0, 7);
  } catch (error) {
    return 'unknown';
  }
}

function getEnvironment() {
  return process.env.NODE_ENV || process.env.VERCEL_ENV || 'development';
}

function checkEnvironment() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    log(`❌ Missing required environment variables: ${missing.join(', ')}`, 'red');
    return false;
  }
  
  return true;
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabase() {
  try {
    log('🔍 Checking database connectivity...', 'cyan');
    
    const { data, error } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);
      
    if (error) {
      throw error;
    }
    
    log('✅ Database connection OK', 'green');
    return { status: 'ok', message: 'Database connection successful' };
    
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'red');
    return { status: 'fail', message: error.message };
  }
}

async function checkStorage() {
  try {
    log('🔍 Checking storage connectivity...', 'cyan');
    
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw error;
    }
    
    const mediaBucket = buckets.find(bucket => bucket.name === 'cleanstay_media');
    if (!mediaBucket) {
      log('⚠️  Media bucket not found', 'yellow');
      return { status: 'fail', message: 'Media bucket not found' };
    }
    
    log('✅ Storage connection OK', 'green');
    return { status: 'ok', message: 'Storage connection successful' };
    
  } catch (error) {
    log(`❌ Storage connection failed: ${error.message}`, 'red');
    return { status: 'fail', message: error.message };
  }
}

async function checkTables() {
  try {
    log('🔍 Checking database tables...', 'cyan');
    
    const tables = [
      'tenants',
      'users',
      'cleaners',
      'properties',
      'cleanings',
      'events',
      'messages',
      'supplies',
      'inventory',
      'metrics_daily',
      'kpi_monthly',
      'audit_log'
    ];
    
    const results = {};
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
          
        if (error) {
          results[table] = { status: 'fail', message: error.message };
        } else {
          results[table] = { status: 'ok', message: 'Table accessible' };
        }
      } catch (error) {
        results[table] = { status: 'fail', message: error.message };
      }
    }
    
    const failedTables = Object.entries(results)
      .filter(([_, result]) => result.status === 'fail')
      .map(([table, _]) => table);
      
    if (failedTables.length > 0) {
      log(`❌ Failed tables: ${failedTables.join(', ')}`, 'red');
      return { status: 'fail', message: `Failed tables: ${failedTables.join(', ')}` };
    }
    
    log('✅ All tables accessible', 'green');
    return { status: 'ok', message: 'All tables accessible' };
    
  } catch (error) {
    log(`❌ Table check failed: ${error.message}`, 'red');
    return { status: 'fail', message: error.message };
  }
}

async function checkRLS() {
  try {
    log('🔍 Checking RLS policies...', 'cyan');
    
    // Test RLS by trying to access data with service role
    const { data, error } = await supabase
      .from('tenants')
      .select('id, name')
      .limit(1);
      
    if (error) {
      throw error;
    }
    
    log('✅ RLS policies OK', 'green');
    return { status: 'ok', message: 'RLS policies working' };
    
  } catch (error) {
    log(`❌ RLS check failed: ${error.message}`, 'red');
    return { status: 'fail', message: error.message };
  }
}

async function checkPilotData() {
  try {
    log('🔍 Checking pilot data...', 'cyan');
    
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('id', 'tenant-pilot-123');
      
    if (tenantError) {
      throw tenantError;
    }
    
    if (!tenants || tenants.length === 0) {
      log('⚠️  Pilot tenant not found', 'yellow');
      return { status: 'fail', message: 'Pilot tenant not found' };
    }
    
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, name, type')
      .eq('tenant_id', 'tenant-pilot-123');
      
    if (propError) {
      throw propError;
    }
    
    const airbnbCount = properties.filter(p => p.type === 'airbnb').length;
    const svjCount = properties.filter(p => p.type === 'svj').length;
    
    if (airbnbCount < 8 || svjCount < 2) {
      log(`⚠️  Pilot data incomplete: ${airbnbCount} Airbnb, ${svjCount} SVJ`, 'yellow');
      return { status: 'fail', message: 'Pilot data incomplete' };
    }
    
    log('✅ Pilot data OK', 'green');
    return { status: 'ok', message: 'Pilot data complete' };
    
  } catch (error) {
    log(`❌ Pilot data check failed: ${error.message}`, 'red');
    return { status: 'fail', message: error.message };
  }
}

async function generateHealthReport() {
  const version = getGitSha();
  const env = getEnvironment();
  
  log('🏥 CleanStay Health Check Report', 'magenta');
  log('================================', 'magenta');
  
  const results = {
    status: 'ok',
    version,
    env,
    timestamp: new Date().toISOString(),
    checks: {}
  };
  
  // Run all health checks
  results.checks.database = await checkDatabase();
  results.checks.storage = await checkStorage();
  results.checks.tables = await checkTables();
  results.checks.rls = await checkRLS();
  results.checks.pilotData = await checkPilotData();
  
  // Determine overall status
  const failedChecks = Object.values(results.checks)
    .filter(check => check.status === 'fail');
    
  if (failedChecks.length > 0) {
    results.status = 'fail';
  }
  
  // Display summary
  log('', 'reset');
  log('📊 Health Check Summary:', 'blue');
  log(`• Overall Status: ${results.status === 'ok' ? '✅ OK' : '❌ FAIL'}`, results.status === 'ok' ? 'green' : 'red');
  log(`• Version: ${version}`, 'blue');
  log(`• Environment: ${env}`, 'blue');
  log(`• Timestamp: ${results.timestamp}`, 'blue');
  
  log('', 'reset');
  log('🔍 Individual Checks:', 'blue');
  Object.entries(results.checks).forEach(([check, result]) => {
    const status = result.status === 'ok' ? '✅' : '❌';
    const color = result.status === 'ok' ? 'green' : 'red';
    log(`• ${check}: ${status} ${result.message}`, color);
  });
  
  if (results.status === 'fail') {
    log('', 'reset');
    log('🚨 Health check failed! Please fix the issues above.', 'red');
    process.exit(1);
  } else {
    log('', 'reset');
    log('🎉 All health checks passed! System is ready.', 'green');
  }
  
  return results;
}

async function main() {
  try {
    if (!checkEnvironment()) {
      process.exit(1);
    }
    
    await generateHealthReport();
    
  } catch (error) {
    log(`💥 Health check failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkDatabase,
  checkStorage,
  checkTables,
  checkRLS,
  checkPilotData,
  generateHealthReport
};





