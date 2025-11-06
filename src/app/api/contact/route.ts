import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';
import { getSupabaseConfig } from '@/lib/env';

export const runtime = 'nodejs';

// POST /api/contact
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let body: any;

    // Handle both form data and JSON
    if (contentType?.includes('application/x-www-form-urlencoded') || contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message')
      };
    } else {
      body = await request.json();
    }

    const { name, email, message } = body;

    // Validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Všechna pole jsou povinná' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Neplatný email' },
        { status: 400 }
      );
    }

    // Log the contact form submission (always) - including full message
    console.log('📧 CONTACT FORM SUBMISSION:', {
      timestamp: new Date().toISOString(),
      name,
      email,
      message // Full message in logs
    });

    // Try to save to Supabase if configured
    const supabaseConfig = getSupabaseConfig();
    if (supabaseConfig) {
      try {
        const supabase = createSupabaseClient();
        
        // Note: leads table doesn't have 'message' column
        // We save basic contact info and log the full message above
        const { data, error } = await supabase
          .from('leads')
          .insert({
            name,
            email,
            phone: null,
            service_type: 'kontakt',
            consent: true,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('⚠️ Supabase error (contact will be logged only):', error);
        } else {
          console.log('✅ Contact saved to database:', { 
            leadId: data.id,
            note: 'Full message is in logs above'
          });
        }
      } catch (dbError) {
        console.error('⚠️ Database error (contact will be logged only):', dbError);
      }
    } else {
      console.warn('⚠️ Supabase not configured. Contact logged to console only.');
    }

    // Always return success to user (data is logged)
    // Return success - for HTML form, redirect
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      return NextResponse.redirect(new URL('/?message=success', request.url));
    }

    // JSON response for AJAX
    return NextResponse.json({
      success: true,
      message: 'Zpráva byla úspěšně odeslána. Brzy se vám ozveme!'
    });

  } catch (error) {
    console.error('❌ Error in contact POST:', error);
    return NextResponse.json(
      { error: 'Došlo k neočekávané chybě. Zkuste to prosím znovu.' },
      { status: 500 }
    );
  }
}

