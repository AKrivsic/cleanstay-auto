import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Úklid a správa Airbnb apartmánů v Praze | CleanStay',
  description:
    'Kompletní úklid a správa Airbnb v Praze – výměna prádla, úklid, doplňování zásob a komunikace s hosty. Spolehlivý servis od CleanStay.',
  keywords: [
    'Airbnb úklid Praha',
    'úklid apartmánů',
    'správa Airbnb',
    'praní prádla',
    'CleanStay',
    'krátkodobý pronájem úklid',
  ],
};

export default function AirbnbPage() {
  return (
    <>
      <div className="spacer"></div>
      <Header />
      <main className="main-content">
        <section className="hero">
          <div className="container">
            <h1>Správa a úklid Airbnb apartmánů v Praze</h1>
            <p>Kompletní řešení pro hostitele. Od úklidu po praní prádla – vše na klíč.</p>
            <a href="#kontakt" className="btn-primary">Nezávazná poptávka</a>
          </div>
        </section>

        <section className="services">
          <div className="container">
            <h2 className="title">Co pro vás zajistíme</h2>
            <ul>
              <li>Kompletní úklid před i po každém hostu</li>
              <li>Dezinfekce všech kontaktních ploch</li>
              <li>Doplnění toaletních potřeb</li>
              <li>Praní a výměna ložního prádla (60 Kč/kg)</li>
              <li>Komunikace s hosty (volitelné)</li>
              <li>Zajištění klíčového managementu</li>
              <li>Pravidelné kontroly stavu apartmánu</li>
            </ul>
          </div>
        </section>

        <section className="highlight" style={{ backgroundColor: '#ebf8ff', padding: '40px 20px' }}>
          <div className="container">
            <h2 className="title" style={{ color: '#1a202c' }}>Praní prádla za 60 Kč/kg</h2>
            <p>
              Ušetřete čas i starosti. Ložní prádlo vyzvedneme, vypereme a vrátíme čisté a voňavé přímo do apartmánu.
              Ideální řešení pro častou rotaci hostů.
            </p>
          </div>
        </section>

        <section className="reference">
          <div className="container">
            <h2 className="title">Proč si vybrat CleanStay?</h2>
            <ul>
              <li>Flexibilní termíny a rychlá reakce</li>
              <li>Vlastní zkušenost s provozováním Airbnb bytů</li>
              <li>Profesionální tým s důrazem na detail</li>
              <li>Fakturace a přehledný reporting</li>
              <li>Možnost dlouhodobé spolupráce</li>
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}


