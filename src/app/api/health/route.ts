import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

// Get Supabase client (lazy initialization to avoid build-time errors)
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Get git SHA for version
function getGitSha(): string {
  try {
    // In production, this would be set by CI/CD
    return process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'unknown';
  } catch {
    return 'unknown';
  }
}

// Get environment
function getEnvironment(): string {
  return process.env.NODE_ENV || process.env.VERCEL_ENV || 'development';
}

// Check database connectivity
async function checkDatabase(): Promise<{ status: 'ok' | 'fail'; message: string }> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);
      
    if (error) {
      return { status: 'fail', message: error.message };
    }
    
    return { status: 'ok', message: 'Database connection successful' };
  } catch (error) {
    return { status: 'fail', message: error instanceof Error ? error.message : 'Unknown database error' };
  }
}

// Check storage connectivity
async function checkStorage(): Promise<{ status: 'ok' | 'fail'; message: string }> {
  try {
    const supabase = getSupabaseClient();
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      return { status: 'fail', message: error.message };
    }
    
    const mediaBucket = buckets.find(bucket => bucket.name === 'cleanstay_media');
    if (!mediaBucket) {
      return { status: 'fail', message: 'Media bucket not found' };
    }
    
    return { status: 'ok', message: 'Storage connection successful' };
  } catch (error) {
    return { status: 'fail', message: error instanceof Error ? error.message : 'Unknown storage error' };
  }
}

// Check RLS policies
async function checkRLS(): Promise<{ status: 'ok' | 'fail'; message: string }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('tenants')
      .select('id, name')
      .limit(1);
      
    if (error) {
      return { status: 'fail', message: error.message };
    }
    
    return { status: 'ok', message: 'RLS policies working' };
  } catch (error) {
    return { status: 'fail', message: error instanceof Error ? error.message : 'Unknown RLS error' };
  }
}

// Check pilot data
async function checkPilotData(): Promise<{ status: 'ok' | 'fail'; message: string }> {
  try {
    const supabase = getSupabaseClient();
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('id', '00000000-0000-0000-0000-000000000000');
      
    if (tenantError) {
      return { status: 'fail', message: tenantError.message };
    }
    
    if (!tenants || tenants.length === 0) {
      return { status: 'fail', message: 'Pilot tenant not found' };
    }
    
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, name, type')
      .eq('tenant_id', '00000000-0000-0000-0000-000000000000');
      
    if (propError) {
      return { status: 'fail', message: propError.message };
    }
    
    const airbnbCount = properties.filter(p => p.type === 'airbnb').length;
    const svjCount = properties.filter(p => p.type === 'svj').length;
    
    if (airbnbCount < 8 || svjCount < 2) {
      return { status: 'fail', message: `Pilot data incomplete: ${airbnbCount} Airbnb, ${svjCount} SVJ` };
    }
    
    return { status: 'ok', message: 'Pilot data complete' };
  } catch (error) {
    return { status: 'fail', message: error instanceof Error ? error.message : 'Unknown pilot data error' };
  }
}

// Check feature flags
function checkFeatureFlags(): { status: 'ok' | 'fail'; message: string } {
  const cleanstayEnabled = process.env.CLEANSTAY_ENABLED === 'true';
  
  if (!cleanstayEnabled) {
    return { status: 'fail', message: 'CleanStay features disabled' };
  }
  
  return { status: 'ok', message: 'Feature flags OK' };
}

// Check environment variables
function checkEnvironment(): { status: 'ok' | 'fail'; message: string } {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
    'WABA_API_KEY'
  ];
  
  const missing = requiredVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    return { status: 'fail', message: `Missing environment variables: ${missing.join(', ')}` };
  }
  
  return { status: 'ok', message: 'Environment variables OK' };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Run all health checks
    const [dbCheck, storageCheck, rlsCheck, pilotCheck, featureCheck, envCheck] = await Promise.all([
      checkDatabase(),
      checkStorage(),
      checkRLS(),
      checkPilotData(),
      checkFeatureFlags(),
      checkEnvironment()
    ]);
    
    const latency = Date.now() - startTime;
    
    // Determine overall status
    const allChecks = [dbCheck, storageCheck, rlsCheck, pilotCheck, featureCheck, envCheck];
    const failedChecks = allChecks.filter(check => check.status === 'fail');
    const overallStatus = failedChecks.length === 0 ? 'ok' : 'fail';
    
    // Prepare response
    const response = {
      status: overallStatus,
      version: getGitSha(),
      env: getEnvironment(),
      timestamp: new Date().toISOString(),
      latency_ms: latency,
      checks: {
        database: dbCheck,
        storage: storageCheck,
        rls: rlsCheck,
        pilot_data: pilotCheck,
        feature_flags: featureCheck,
        environment: envCheck
      }
    };
    
    // Set appropriate HTTP status
    const httpStatus = overallStatus === 'ok' ? 200 : 503;
    
    return NextResponse.json(response, { status: httpStatus });
    
  } catch (error) {
    const latency = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'fail',
      version: getGitSha(),
      env: getEnvironment(),
      timestamp: new Date().toISOString(),
      latency_ms: latency,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}

// Health check for load balancers (simple ping)
export async function HEAD(request: NextRequest) {
  try {
    // Quick database ping
    const supabase = getSupabaseClient();
    await supabase
      .from('tenants')
      .select('id')
      .limit(1);
      
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}




