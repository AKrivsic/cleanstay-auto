import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Calculator from '@/components/Calculator';

export const metadata: Metadata = {
  title: 'Úklid domácností, kanceláří a Airbnb | CleanStay Praha',
  description: 'Profesionální úklid bytů, kanceláří a Airbnb v Praze. Férové ceny, spolehlivost a rychlost. Vyzkoušejte CleanStay.',
  keywords: 'úklid domácností Praha, úklid kanceláří, správa Airbnb, CleanStay',
};

export default function HomePage() {
  return (
    <>
      <div className="spacer"></div>
      <Header />
      <main className="main-content">
      {/* HERO */}
      <section className="hero section">
        <div className="container">
          <h1>Profesionální úklid domácností, kanceláří i Airbnb</h1>
          <p>Rychle. Spolehlivě. Za férové ceny.</p>
          <div className="hero-buttons">
            <a href="#kalkulacka" className="btn-primary">Spočítejte si úklid</a>
            <a href="#kontakt" className="btn-secondary">Kontaktujte nás</a>
          </div>
        </div>
      </section>

      {/* Služby */}
      <section className="services section">
        <div className="container">
          <h2 className="title">Naše služby</h2>
          <div className="services-grid">
            <div className="service-card">
              <img src="/images/kitchen288.webp" alt="Úklid domácností" />
              <h3>Úklid domácností</h3>
              <p>Běžný, generální, expresní i úklid po rekonstrukci.</p>
              <Link href="/uklid-domacnosti">Více →</Link>
            </div>
            <div className="service-card">
              <img src="/images/office288.webp" alt="Úklid kanceláří" />
              <h3>Úklid firemních prostor</h3>
              <p>Pravidelný úklid kanceláří, obchodů a dalších firemních prostor.</p>
              <Link href="/uklid-firem">Více →</Link>
            </div>
            <div className="service-card">
              <img src="/images/hotel288.webp" alt="Airbnb a hotely" />
              <h3>Airbnb & hotely</h3>
              <p>Úklid, výměna prádla a kompletní správa vašich nemovitostí.</p>
              <Link href="/airbnb">Více →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Kalkulačka */}
      <Calculator />

      {/* Reference */}
      <section className="reference section">
        <div className="container">
          <div className="reference-inner">
            <h2 className="title">Co říkají naši zákazníci</h2>
            <div className="reference-grid">
              <div className="reference-card">
                <p>„Skvělý servis! Úklid proběhl rychle a naprosto profesionálně. Doporučuji."</p>
                <p className="author">– Jana K., Praha</p>
              </div>
              <div className="reference-card">
                <p>„Moje Airbnb je díky nim vždy připravené. Nemusím nic řešit."</p>
                <p className="author">– Tomáš B., Praha</p>
              </div>
              <div className="reference-card">
                <p>„Úklid po rekonstrukci zvládli bez problémů. Skvělá domluva."</p>
                <p className="author">– Petra N., Praha</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}
