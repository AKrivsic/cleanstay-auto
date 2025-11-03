import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
import { createSupabaseClient } from '@/lib/supabase/client';

// GET /api/admin/schedule/tomorrow
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    
    // Get tenant ID from auth (simplified for now)
    const tenantId = 'tenant-123'; // TODO: Get from auth context

    // Calculate tomorrow's date range (24-36 hours from now)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    dayAfterTomorrow.setHours(0, 0, 0, 0);

    // Get scheduled cleanings for tomorrow
    const { data: cleanings, error } = await supabase
      .from('cleanings')
      .select(`
        id,
        property_id,
        scheduled_start,
        scheduled_end,
        status,
        client_confirmed_at,
        cleaner_confirmed_at,
        properties!inner(
          name,
          address,
          timezone
        ),
        users!cleanings_client_id_fkey(
          phone,
          language,
          timezone
        ),
        cleaners!cleanings_cleaner_id_fkey(
          phone,
          language,
          timezone
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('status', 'scheduled')
      .gte('scheduled_start', tomorrow.toISOString())
      .lt('scheduled_start', dayAfterTomorrow.toISOString());

    if (error) {
      console.error('Error fetching tomorrow schedule:', error);
      return NextResponse.json(
        { error: 'Failed to fetch schedule' },
        { status: 500 }
      );
    }

    // Process cleanings and add quiet hours check
    const processedCleanings = (cleanings || []).map((cleaning: any) => {
      const scheduledStart = new Date(cleaning.scheduled_start);
      const userTimezone = cleaning.users?.timezone || 'Europe/Prague';
      const cleanerTimezone = cleaning.cleaners?.timezone || 'Europe/Prague';
      
      // Check if scheduled time falls within quiet hours
      const userLocalTime = new Date(scheduledStart.toLocaleString('en-US', { timeZone: userTimezone }));
      const cleanerLocalTime = new Date(scheduledStart.toLocaleString('en-US', { timeZone: cleanerTimezone }));
      
      const userHour = userLocalTime.getHours();
      const cleanerHour = cleanerLocalTime.getHours();
      
      const userQuietHours = userHour >= 21 || userHour < 8;
      const cleanerQuietHours = cleanerHour >= 21 || cleanerHour < 8;

      return {
        cleaning_id: cleaning.id,
        property_id: cleaning.property_id,
        property_name: cleaning.properties.name,
        property_address: cleaning.properties.address,
        scheduled_start: cleaning.scheduled_start,
        scheduled_end: cleaning.scheduled_end,
        status: cleaning.status,
        client_confirmed: !!cleaning.client_confirmed_at,
        cleaner_confirmed: !!cleaning.cleaner_confirmed_at,
        client: {
          phone: cleaning.users?.phone,
          language: cleaning.users?.language || 'cs',
          timezone: cleaning.users?.timezone || 'Europe/Prague',
          quiet_hours: userQuietHours
        },
        cleaner: {
          phone: cleaning.cleaners?.phone,
          language: cleaning.cleaners?.language || 'cs',
          timezone: cleaning.cleaners?.timezone || 'Europe/Prague',
          quiet_hours: cleanerQuietHours
        },
        // Generate confirmation links
        client_confirm_link: `${process.env.BASE_URL}/api/confirm/cleaning/${cleaning.id}?type=client&token=${generateConfirmToken(cleaning.id, 'client')}`,
        cleaner_confirm_link: `${process.env.BASE_URL}/api/confirm/cleaning/${cleaning.id}?type=cleaner&token=${generateConfirmToken(cleaning.id, 'cleaner')}`,
        // Check if notification was already sent today
        notification_sent_today: false // TODO: Check from events table
      };
    });

    // Log schedule request
    console.log('Tomorrow schedule requested:', {
      tenantId: tenantId.substring(0, 8) + '...',
      cleaningsCount: processedCleanings.length,
      timestamp: now.toISOString()
    });

    return NextResponse.json({
      success: true,
      data: {
        date: tomorrow.toISOString().split('T')[0],
        cleanings: processedCleanings,
        total: processedCleanings.length
      }
    });

  } catch (error) {
    console.error('Error in schedule/tomorrow GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate confirmation token (simplified)
function generateConfirmToken(cleaningId: string, type: 'client' | 'cleaner'): string {
  // In production, use proper JWT or crypto token
  return Buffer.from(`${cleaningId}-${type}-${Date.now()}`).toString('base64');
}




