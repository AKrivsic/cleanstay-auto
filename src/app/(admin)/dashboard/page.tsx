import { Suspense } from 'react';
import { getTodayOverview, getPropertyList, TodayOverview, PropertyList } from './_data';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { RealtimeFeed } from './_realtime';
import { getSignedPhotoUrls } from '@/lib/media/getSignedPhotoUrls';
import { ClientDashboard } from './_client-dashboard';

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

// Admin dashboard overview page
export default async function AdminDashboard() {
  // Get tenant ID from auth (this would be from JWT in real implementation)
  const tenantId = '550e8400-e29b-41d4-a716-446655440000'; // Default tenant for local development
  
  let overview: TodayOverview;
  let properties: PropertyList[];
  let users: any[] = [];
  
  try {
    const supabase = getSupabaseServerClient();
    
    [overview, properties] = await Promise.all([
      getTodayOverview(tenantId),
      getPropertyList(tenantId, { page: 1, pageSize: 10 })
    ]);
    
    // Load users
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role, phone')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true });
    
    if (usersError) {
      console.error('Error loading users:', usersError);
    } else {
      users = usersData || [];
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    // Return fallback data to prevent build crashes
    overview = {
      cleanings: [],
      recentPhotos: []
    };
    properties = [];
    users = [];
  }

  return <ClientDashboard />;
}

// Metadata for admin pages
export const metadata = {
  title: 'Admin Dashboard - CleanStay',
  robots: 'noindex, nofollow'
};