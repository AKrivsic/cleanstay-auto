import Link from 'next/link';

export default function Footer() {
  return (
    <footer id="kontakt" className="footer-contact">
      <h2 className="title">Kontaktujte nás</h2>
      <p>Rádi vám připravíme nezávaznou nabídku nebo zodpovíme jakékoliv dotazy.</p>
      <form className="contact-form" action="/api/contact" method="POST">
        <label>
          Jméno<br />
          <input type="text" name="name" required />
        </label>
        <label>
          E-mail<br />
          <input type="email" name="email" required />
        </label>
        <label>
          Zpráva<br />
          <textarea name="message" rows={3} required></textarea>
        </label>
        <button type="submit">Odeslat zprávu</button>
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

