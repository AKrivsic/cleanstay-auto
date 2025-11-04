import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Ceník úklidových služeb v Praze | CleanStay',
  description:
    'Přehledný ceník úklidových služeb pro domácnosti, firmy i Airbnb. Férové ceny, žádné skryté poplatky. Zjistěte, kolik vás bude stát profesionální úklid v Praze.',
  keywords: [
    'úklid ceník',
    'ceny úklidu',
    'úklid Praha cena',
    'úklid domácnosti cena',
    'úklid kanceláří ceník',
    'CleanStay ceník',
  ],
};

export default function CenikPage() {
  return (
    <>
      <div className="spacer"></div>
      <Header />
      <main className="pricing">
        <section className="pricing-header">
          <div className="container">
            <h1>Ceník našich úklidových služeb</h1>
            <p>
              Transparentní ceny, žádné skryté poplatky. Profesionální úklid v Praze pro domácnosti, firmy i Airbnb.
            </p>
          </div>
        </section>

        <section className="pricing-table">
          <div className="container">
            <table>
              <thead>
                <tr>
                  <th>Služba</th>
                  <th>Cena od</th>
                  <th>Poznámka</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Běžný úklid domácnosti</td>
                  <td>350 Kč / hod</td>
                  <td>Min. 2 hodiny</td>
                </tr>
                <tr>
                  <td>Generální úklid</td>
                  <td>45 Kč / m²</td>
                  <td>Včetně mytí oken, koupelny, kuchyně</td>
                </tr>
                <tr>
                  <td>Expresní úklid (do 24h)</td>
                  <td>+30 % příplatek</td>
                  <td>Dostupnost závisí na lokaci</td>
                </tr>
                <tr>
                  <td>Úklid po rekonstrukci</td>
                  <td>55–70 Kč / m²</td>
                  <td>Včetně odstranění prachu a stavební špíny</td>
                </tr>
                <tr>
                  <td>Úklid kanceláří</td>
                  <td>od 25 Kč / m²</td>
                  <td>Pravidelně nebo jednorázově</td>
                </tr>
                <tr>
                  <td>Úklid Airbnb / hotelu</td>
                  <td>od 500 Kč / pobyt</td>
                  <td>Zahrnuje výměnu prádla a desinfekci</td>
                </tr>
                <tr>
                  <td>Správa Airbnb</td>
                  <td>20 % z výdělku</td>
                  <td>Komunikace s hosty, check-in/out, dinamická tvorba cen</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}


