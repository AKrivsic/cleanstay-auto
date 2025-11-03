import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Úklid kanceláří a společných prostor SVJ v Praze | CleanStay',
  description:
    'CleanStay zajišťuje pravidelný i jednorázový úklid kanceláří a společných prostor SVJ v Praze. Spolehlivý servis, flexibilní termíny a kvalitní výsledek.',
  keywords: [
    'úklid firem Praha',
    'úklid kanceláří',
    'úklid SVJ',
    'správa budov',
    'úklid společných prostor',
    'firemní úklid',
  ],
};

export default function UklidFiremPage() {
  return (
    <>
      <div className="spacer"></div>
      <Header />
      <main className="main-content">
        <section className="hero section">
          <div className="container">
            <h1>Profesionální úklid firem a SVJ v Praze</h1>
            <p>
              Nabízíme komplexní a pravidelný úklid kanceláří, komerčních prostor a společných částí bytových domů (SVJ) v Praze.
              Naše služby přizpůsobíme přesně vašim požadavkům – ať už potřebujete denní, týdenní nebo jednorázový úklid.
            </p>
          </div>
        </section>

        <section className="services">
          <div className="container">
            <h2 className="title">Co zahrnuje úklid pro firmy</h2>
            <ul>
              <li>Vysávání a vytírání podlah</li>
              <li>Úklid kuchyňky, lednice, mikrovlnky</li>
              <li>Úklid a dezinfekce toalet</li>
              <li>Vynášení odpadků a výměna pytlů</li>
              <li>Otírání prachu z nábytku, parapetů a techniky</li>
              <li>Leštění skleněných ploch</li>
            </ul>

            <h2 className="title">Úklid společných prostor pro SVJ</h2>
            <ul>
              <li>Úklid vstupních hal, chodeb a schodišť</li>
              <li>Čištění výtahů, madel a klik</li>
              <li>Utírání poštovních schránek a zábradlí</li>
              <li>Vynášení domovního odpadu</li>
              <li>Sezónní úklid (např. mytí oken, úklid po malování)</li>
            </ul>
          </div>
        </section>

        <section className="hero">
          <div className="container">
            <h2 className="title">Proč si vybrat CleanStay?</h2>
            <ul>
              <li>Pravidelnost a spolehlivost – přijedeme vždy včas</li>
              <li>Diskrétní a proškolený personál</li>
              <li>Čistící prostředky i techniku zajistíme my</li>
              <li>Férová cena a žádné skryté poplatky</li>
              <li>Působíme výhradně v Praze a okolí</li>
            </ul>
            <a href="#kontakt" className="btn-primary">Nezávazná poptávka</a>
          </div>
        </section>

        <section className="reference">
          <div className="reference-inner">
            <h2 className="title">Zkušenosti našich klientů</h2>
            <div className="reference-grid">
              <div className="reference-card">
                <p>"Máme kanceláře na Praze 4 a CleanStay se o úklid stará už přes rok. Maximální spokojenost!"</p>
                <p className="author">— Jan K., Office Manager</p>
              </div>
              <div className="reference-card">
                <p>"Úklid společných prostor v domě probíhá pravidelně a kvalitně. Doporučuji!"</p>
                <p className="author">— Petra S., SVJ Praha 3</p>
              </div>
              <div className="reference-card">
                <p>"Spolupráce je bezproblémová, paní uklízečky jsou milé a pečlivé. Jsme velmi spokojeni."</p>
                <p className="author">— Eva L., bytové družstvo Praha 6</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
