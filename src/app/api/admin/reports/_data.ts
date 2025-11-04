import { createSupabaseClient } from '@/lib/supabase/client';
import { getSignedPhotoUrls } from '@/lib/media/getSignedPhotoUrls';

// Types for report data
export interface CleaningReport {
  type: 'cleaning_report';
  property: {
    id: string;
    name: string;
    address?: {
      street: string;
      city: string;
      zip: string;
    };
  };
  date: string;
  cleaner?: {
    name: string;
    phone: string;
  };
  startedAt?: string;
  endedAt?: string;
  durationMin?: number;
  events: Array<{
    t: 'start' | 'note' | 'supply_out' | 'linen_used' | 'photo' | 'done';
    ts: string;
    data?: any;
  }>;
  photos?: Array<{
    thumbUrl: string;
    mainUrl?: string;
    phase: string;
  }>;
  summary: {
    notesCount: number;
    photosCount: number;
    supplies: string[];
    linen: {
      changed?: number;
      dirty?: number;
    };
  };
}

export interface PhotosReport {
  type: 'photos';
  property: {
    id: string;
    name: string;
  };
  date: string;
  items: Array<{
    eventId: string;
    thumbUrl: string;
    phase: string;
  }>;
}

export interface InventoryReport {
  type: 'inventory';
  property: {
    id: string;
    name: string;
  };
  range: {
    from: string;
    to: string;
  };
  consumption: Array<{
    item: string;
    unit: string;
    used: number;
  }>;
  recommendation?: Array<{
    item: string;
    buy: number;
    rationale: string;
  }>;
}

// Get cleaning report for a specific property and date
export async function getCleaningReport(
  tenantId: string,
  propertyId: string,
  date: string,
  withPhotos: boolean = false
): Promise<CleaningReport> {
  const supabase = createSupabaseClient();

  try {
    // Get property info
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, name, address')
      .eq('tenant_id', tenantId)
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      throw new Error('Property not found');
    }

    // Get cleaning for the date
    const { data: cleaning, error: cleaningError } = await supabase
      .from('cleanings')
      .select(`
        id,
        status,
        scheduled_start,
        scheduled_end,
        users!inner(name, phone)
      `)
      .eq('tenant_id', tenantId)
      .eq('property_id', propertyId)
      .gte('scheduled_start', `${date}T00:00:00`)
      .lt('scheduled_start', `${date}T23:59:59`)
      .single();

    // Get events for the cleaning or date
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, type, start, note, phase, width, height')
      .eq('tenant_id', tenantId)
      .eq('property_id', propertyId)
      .gte('start', `${date}T00:00:00`)
      .lt('start', `${date}T23:59:59`)
      .order('start', { ascending: true });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
    }

    // Process events
    const processedEvents = events?.map((event: any) => ({
      t: event.type as 'start' | 'note' | 'supply_out' | 'linen_used' | 'photo' | 'done',
      ts: event.start,
      data: event.note
    })) || [];

    // Calculate duration
    let durationMin: number | undefined;
    let startedAt: string | undefined;
    let endedAt: string | undefined;

    if (cleaning) {
      startedAt = cleaning.scheduled_start;
      endedAt = cleaning.scheduled_end || undefined;
      
      if (startedAt && endedAt) {
        const start = new Date(startedAt);
        const end = new Date(endedAt);
        durationMin = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      }
    } else {
      // Try to find start/done events to calculate duration
      const startEvent = events?.find((e: any) => e.type === 'cleaning_start');
      const doneEvent = events?.find((e: any) => e.type === 'done');
      
      if (startEvent) {
        startedAt = startEvent.start;
      }
      if (doneEvent) {
        endedAt = doneEvent.start;
      }
      
      if (startedAt && endedAt) {
        const start = new Date(startedAt);
        const end = new Date(endedAt);
        durationMin = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      }
    }

    // Get photos if requested
    let photos: Array<{ thumbUrl: string; mainUrl?: string; phase: string }> | undefined;
    
    if (withPhotos && events) {
      const photoEvents = events.filter((e: any) => e.type === 'photo');
      
      if (photoEvents.length > 0) {
        try {
          const photoUrls = await getSignedPhotoUrls({
            eventIds: photoEvents.map((e: any) => e.id),
            tenantId: tenantId
          });

          photos = photoEvents.map((event: any, index: number) => ({
            thumbUrl: photoUrls[index]?.thumbUrl || '',
            mainUrl: photoUrls[index]?.mainUrl,
            phase: event.phase || 'other'
          }));

          // Limit main URLs to 6 most important photos
          if (photos && photos.length > 6) {
            photos = photos.slice(0, 6);
          }
        } catch (error) {
          console.error('Error generating signed URLs:', error);
        }
      }
    }

    // Calculate summary
    const notesCount = events?.filter((e: any) => e.type === 'note').length || 0;
    const photosCount = events?.filter((e: any) => e.type === 'photo').length || 0;
    
    const supplies = events?.filter((e: any) => e.type === 'supply_out')
      .map((e: any) => e.note)
      .filter(Boolean) || [];
    
    const linenEvents = events?.filter((e: any) => e.type === 'linen_used') || [];
    const linen = {
      changed: linenEvents.filter((e: any) => e.note?.includes('změněno')).length,
      dirty: linenEvents.filter((e: any) => e.note?.includes('špinavé')).length
    };

    // Log safe metadata
    console.log('Cleaning report generated:', {
      propertyId: propertyId.substring(0, 8) + '...',
      date,
      eventsCount: events?.length || 0,
      photosCount,
      tenantId: tenantId.substring(0, 8) + '...'
    });

    return {
      type: 'cleaning_report',
      property: {
        id: property.id,
        name: property.name,
        address: property.address
      },
      date,
      cleaner: cleaning ? {
        name: cleaning.users.name,
        phone: cleaning.users.phone
      } : undefined,
      startedAt,
      endedAt,
      durationMin,
      events: processedEvents,
      photos,
      summary: {
        notesCount,
        photosCount,
        supplies,
        linen
      }
    };

  } catch (error) {
    console.error('Error in getCleaningReport:', error);
    throw new Error('Failed to generate cleaning report');
  }
}

// Get photos for a specific property and date
export async function getPhotos(
  tenantId: string,
  propertyId: string,
  date: string,
  phase: string = 'all'
): Promise<PhotosReport> {
  const supabase = createSupabaseClient();

  try {
    // Get property info
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      throw new Error('Property not found');
    }

    // Get photo events
    let query = supabase
      .from('events')
      .select('id, start, phase, width, height')
      .eq('tenant_id', tenantId)
      .eq('property_id', propertyId)
      .eq('type', 'photo')
      .gte('start', `${date}T00:00:00`)
      .lt('start', `${date}T23:59:59`);

    if (phase !== 'all') {
      query = query.eq('phase', phase);
    }

    const { data: photoEvents, error: photoError } = await query
      .order('start', { ascending: true });

    if (photoError) {
      console.error('Error fetching photos:', photoError);
    }

    // Generate signed URLs for thumbnails
    let items: Array<{ eventId: string; thumbUrl: string; phase: string }> = [];
    
    if (photoEvents && photoEvents.length > 0) {
      try {
        const photoUrls = await getSignedPhotoUrls({
          eventIds: photoEvents.map((e: any) => e.id),
          tenantId: tenantId
        });

        items = photoEvents.map((event: any, index: number) => ({
          eventId: event.id,
          thumbUrl: photoUrls[index]?.thumbUrl || '',
          phase: event.phase || 'other'
        }));
      } catch (error) {
        console.error('Error generating signed URLs for photos:', error);
      }
    }

    // Log safe metadata
    console.log('Photos report generated:', {
      propertyId: propertyId.substring(0, 8) + '...',
      date,
      phase,
      photosCount: items.length,
      tenantId: tenantId.substring(0, 8) + '...'
    });

    return {
      type: 'photos',
      property: {
        id: property.id,
        name: property.name
      },
      date,
      items
    };

  } catch (error) {
    console.error('Error in getPhotos:', error);
    throw new Error('Failed to generate photos report');
  }
}

// Get inventory snapshot for a property over a date range
export async function getInventorySnapshot(
  tenantId: string,
  propertyId: string,
  from: string,
  to: string
): Promise<InventoryReport> {
  const supabase = createSupabaseClient();

  try {
    // Get property info
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      throw new Error('Property not found');
    }

    // Get supply consumption events
    const { data: supplyEvents, error: supplyError } = await supabase
      .from('events')
      .select('note, start')
      .eq('tenant_id', tenantId)
      .eq('property_id', propertyId)
      .eq('type', 'supply_out')
      .gte('start', `${from}T00:00:00`)
      .lt('start', `${to}T23:59:59`)
      .order('start', { ascending: true });

    if (supplyError) {
      console.error('Error fetching supply events:', supplyError);
    }

    // Get linen usage events
    const { data: linenEvents, error: linenError } = await supabase
      .from('events')
      .select('note, start')
      .eq('tenant_id', tenantId)
      .eq('property_id', propertyId)
      .eq('type', 'linen_used')
      .gte('start', `${from}T00:00:00`)
      .lt('start', `${to}T23:59:59`)
      .order('start', { ascending: true });

    if (linenError) {
      console.error('Error fetching linen events:', linenError);
    }

    // Aggregate consumption
    const consumptionMap = new Map<string, { unit: string; used: number }>();
    
    // Process supply events
    supplyEvents?.forEach((event: any) => {
      if (event.note) {
        const item = event.note.toLowerCase();
        const existing = consumptionMap.get(item) || { unit: 'ks', used: 0 };
        existing.used += 1;
        consumptionMap.set(item, existing);
      }
    });

    // Process linen events
    linenEvents?.forEach((event: any) => {
      if (event.note) {
        const item = event.note.toLowerCase();
        const existing = consumptionMap.get(item) || { unit: 'ks', used: 0 };
        existing.used += 1;
        consumptionMap.set(item, existing);
      }
    });

    const consumption = Array.from(consumptionMap.entries()).map(([item, data]) => ({
      item,
      unit: data.unit,
      used: data.used
    })).sort((a, b) => b.used - a.used);

    // Generate simple recommendations
    const recommendation = consumption.slice(0, 5).map(item => ({
      item: item.item,
      buy: Math.max(1, Math.ceil(item.used * 0.5)), // Recommend 50% of usage
      rationale: `Použito ${item.used} ${item.unit} za období`
    }));

    // Log safe metadata
    console.log('Inventory report generated:', {
      propertyId: propertyId.substring(0, 8) + '...',
      from,
      to,
      consumptionCount: consumption.length,
      tenantId: tenantId.substring(0, 8) + '...'
    });

    return {
      type: 'inventory',
      property: {
        id: property.id,
        name: property.name
      },
      range: {
        from,
        to
      },
      consumption,
      recommendation
    };

  } catch (error) {
    console.error('Error in getInventorySnapshot:', error);
    throw new Error('Failed to generate inventory report');
  }
}




