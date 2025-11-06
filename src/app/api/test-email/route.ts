import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs';

// GET /api/test-email - Test if Resend is configured
export async function GET(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'RESEND_API_KEY not configured',
      message: 'Přidejte RESEND_API_KEY do Vercel Environment Variables'
    }, { status: 500 });
  }

  try {
    const resend = new Resend(apiKey);
    
    // Send test email
    const result = await resend.emails.send({
      from: 'CleanStay Test <onboarding@resend.dev>',
      to: ['info@cleanstay.cz'],
      subject: '🧪 Test email z CleanStay',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>✅ Test email funguje!</h2>
          <p>Tento testovací email byl úspěšně odeslán z CleanStay kontaktního formuláře.</p>
          <p><strong>Čas odeslání:</strong> ${new Date().toLocaleString('cs-CZ')}</p>
          <p>Pokud vidíte tento email, Resend je správně nakonfigurován.</p>
        </div>
      `,
      text: 'Test email z CleanStay - Resend je nakonfigurován správně!'
    });

    return NextResponse.json({
      success: true,
      message: 'Test email byl odeslán na info@cleanstay.cz',
      emailId: result.data?.id,
      to: 'info@cleanstay.cz'
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Chyba při odesílání test emailu'
    }, { status: 500 });
  }
}

