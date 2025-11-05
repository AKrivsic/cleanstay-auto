'use client';
import Link from 'next/link';
import { useState, FormEvent } from 'react';

export default function Footer() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('sending');
    setMessage('');

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message')
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Zpráva byla úspěšně odeslána. Brzy se vám ozveme!');
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus('error');
        setMessage(result.error || 'Došlo k chybě při odesílání.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Došlo k chybě při odesílání. Zkuste to prosím znovu.');
    }
  };

  return (
    <footer id="kontakt" className="footer-contact">
      <h2 className="title">Kontaktujte nás</h2>
      <p>Rádi vám připravíme nezávaznou nabídku nebo zodpovíme jakékoliv dotazy.</p>
      <form className="contact-form" onSubmit={handleSubmit}>
        <label>
          Jméno<br />
          <input type="text" name="name" required disabled={status === 'sending'} />
        </label>
        <label>
          E-mail<br />
          <input type="email" name="email" required disabled={status === 'sending'} />
        </label>
        <label>
          Zpráva<br />
          <textarea name="message" rows={3} required disabled={status === 'sending'}></textarea>
        </label>
        <button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Odesílám...' : 'Odeslat zprávu'}
        </button>
        {message && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: '4px',
            backgroundColor: status === 'success' ? '#d4edda' : '#f8d7da',
            color: status === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${status === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {message}
          </div>
        )}
      </form>
      <div className="contact-info">
        <p>
          <a href="tel:+420776292312">📞 +420 776 292 312</a> &nbsp; | &nbsp;
          <a href="mailto:info@cleanstay.cz">✉️ info@cleanstay.cz</a>
        </p>
      </div>
      <nav className="footer-nav">
        <Link href="/uklid-domacnosti">Domácnost</Link>
        <Link href="/uklid-firem">Pro firmy</Link>
        <Link href="/airbnb">Airbnb</Link>
        <Link href="/cenik">Ceník</Link>
        <Link href="/login">Přihlášení</Link>
      </nav>
      <div className="footer-social">
        <a
          className="social-link facebook"
          href="https://www.facebook.com/CleanStayPraha/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Facebook
        </a>
        <a
          className="social-link instagram"
          href="https://www.instagram.com/cleanstay.cz/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Instagram
        </a>
      </div>
      <div className="footer-legal">
        <p>
          &copy; 2025 CleanStay | <Link href="/gdpr">Zásady ochrany osobních údajů</Link>
        </p>
      </div>
    </footer>
  );
}

