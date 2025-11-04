import { NextRequest, NextResponse } from 'next/server';
import { getCleaningReport, getPhotos, getInventorySnapshot } from '../_data';
import { formatCleaningReportForChat, formatPhotosForChat, formatInventoryForChat } from '@/lib/reports/formatters';

// Admin reports API with RLS-safe queries
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const [reportType] = params.slug;

    // Get tenant ID from auth (this would be from JWT in real implementation)
    const tenantId = request.headers.get('x-tenant-id') || 'test-tenant-123';
    
    // Verify admin role
    const adminRole = request.headers.get('x-admin-role');
    if (adminRole !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    switch (reportType) {
      case 'cleaning': {
        const propertyId = searchParams.get('propertyId');
        const date = searchParams.get('date');
        const withPhotos = searchParams.get('withPhotos') === 'true';

        if (!propertyId || !date) {
          return NextResponse.json(
            { error: 'Missing required parameters: propertyId, date' },
            { status: 400 }
          );
        }

        const report = await getCleaningReport(tenantId, propertyId, date, withPhotos);
        
        // Format for chat if requested
        const formatForChat = searchParams.get('format') === 'chat';
        if (formatForChat) {
          const chatText = formatCleaningReportForChat(report);
          return NextResponse.json({
            type: 'chat_response',
            text: chatText,
            data: report
          });
        }

        return NextResponse.json(report);
      }

      case 'photos': {
        const propertyId = searchParams.get('propertyId');
        const date = searchParams.get('date');
        const phase = searchParams.get('phase') || 'all';

        if (!propertyId || !date) {
          return NextResponse.json(
            { error: 'Missing required parameters: propertyId, date' },
            { status: 400 }
          );
        }

        const photos = await getPhotos(tenantId, propertyId, date, phase);
        
        // Format for chat if requested
        const formatForChat = searchParams.get('format') === 'chat';
        if (formatForChat) {
          const chatText = formatPhotosForChat(photos);
          return NextResponse.json({
            type: 'chat_response',
            text: chatText,
            data: photos
          });
        }

        return NextResponse.json(photos);
      }

      case 'inventory': {
        const propertyId = searchParams.get('propertyId');
        const range = searchParams.get('range') || '7d';
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        if (!propertyId) {
          return NextResponse.json(
            { error: 'Missing required parameter: propertyId' },
            { status: 400 }
          );
        }

        // Calculate date range
        let fromDate: string, toDate: string;
        if (from && to) {
          fromDate = from;
          toDate = to;
        } else {
          const now = new Date();
          toDate = now.toISOString().split('T')[0];
          
          const days = range === '7d' ? 7 : range === '14d' ? 14 : range === '30d' ? 30 : 7;
          const fromDateObj = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
          fromDate = fromDateObj.toISOString().split('T')[0];
        }

        const inventory = await getInventorySnapshot(tenantId, propertyId, fromDate, toDate);
        
        // Format for chat if requested
        const formatForChat = searchParams.get('format') === 'chat';
        if (formatForChat) {
          const chatText = formatInventoryForChat(inventory);
          return NextResponse.json({
            type: 'chat_response',
            text: chatText,
            data: inventory
          });
        }

        return NextResponse.json(inventory);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid report type. Use: cleaning, photos, inventory' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Cache configuration for performance
export const runtime = 'edge';
export const dynamic = 'force-dynamic';





