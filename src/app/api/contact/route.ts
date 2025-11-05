import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';

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

    const supabase = createSupabaseClient();

    // Save to leads table
    const { data, error } = await supabase
      .from('leads')
      .insert({
        name,
        email,
        phone: null,
        service_type: 'kontakt',
        message,
        consent: true, // From contact form
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving contact:', error);
      return NextResponse.json(
        { error: 'Nepodařilo se odeslat zprávu. Zkuste to prosím znovu.' },
        { status: 500 }
      );
    }

    // Log success
    console.log('Contact form submitted:', {
      leadId: data.id,
      name,
      email: email.substring(0, 3) + '***'
    });

    // Return success - for HTML form, redirect
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      // HTML form submission - redirect back with success message
      return NextResponse.redirect(new URL('/?message=success', request.url));
    }

    // JSON response for AJAX
    return NextResponse.json({
      success: true,
      message: 'Zpráva byla úspěšně odeslána. Brzy se vám ozveme!'
    });

  } catch (error) {
    console.error('Error in contact POST:', error);
    return NextResponse.json(
      { error: 'Došlo k neočekávané chybě. Zkuste to prosím znovu.' },
      { status: 500 }
    );
  }
}

