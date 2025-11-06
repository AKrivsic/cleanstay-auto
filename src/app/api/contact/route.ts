import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';
import { getSupabaseConfig } from '@/lib/env';
import { Resend } from 'resend';

export const runtime = 'nodejs';

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

    // Send email via Resend if configured
    if (resend) {
      try {
        const emailResult = await resend.emails.send({
          from: 'CleanStay <kontakt@cleanstay.cz>',
          to: ['info@cleanstay.cz'],
          subject: `Nová zpráva z kontaktního formuláře od ${name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">📧 Nová zpráva z kontaktního formuláře</h2>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 10px 0;"><strong>Jméno:</strong> ${name}</p>
                <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                <p style="margin: 10px 0;"><strong>Čas:</strong> ${new Date().toLocaleString('cs-CZ')}</p>
              </div>
              
              <div style="margin: 20px 0;">
                <h3 style="color: #374151;">Zpráva:</h3>
                <p style="background-color: #ffffff; padding: 15px; border-left: 4px solid #2563eb; white-space: pre-wrap;">${message}</p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
              
              <p style="color: #6b7280; font-size: 14px;">
                Tato zpráva byla odeslána z kontaktního formuláře na cleanstay.cz
              </p>
            </div>
          `,
          text: `
Nová zpráva z kontaktního formuláře CleanStay

Jméno: ${name}
Email: ${email}
Čas: ${new Date().toLocaleString('cs-CZ')}

Zpráva:
${message}

---
Tato zpráva byla odeslána z kontaktního formuláře na cleanstay.cz
          `
        });

        console.log('✅ Email sent via Resend:', { 
          messageId: emailResult.data?.id,
          to: 'info@cleanstay.cz'
        });
      } catch (emailError) {
        console.error('⚠️ Email sending failed (will continue):', emailError);
      }
    } else {
      console.warn('⚠️ Resend not configured. Email not sent. Add RESEND_API_KEY to env.');
    }

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

