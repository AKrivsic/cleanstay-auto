import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Úklid domácnosti v Praze | Pravidelně i jednorázově | CleanStay',
  description:
    'Hledáte spolehlivý úklid domácnosti v Praze? CleanStay nabízí pravidelný i jednorázový úklid, včetně generálního úklidu a mytí oken. Férové ceny a rychlá domluva.',
  keywords: [
    'úklid domácností Praha',
    'úklid bytu',
    'pravidelný úklid',
    'generální úklid',
    'mytí oken',
    'úklid po malování',
  ],
};

export default function UklidDomacnostiPage() {
  return (
    <>
      <Header />

      <div className="spacer" />

      <main className="main-content">
        <section className="hero section">
          <h1>Úklid domácnosti Praha</h1>

          <p>
            Hledáte spolehlivý a kvalitní <strong>úklid domácnosti v Praze</strong>? Jsme CleanStay – úklidová firma,
            která vám pomůže udržet váš domov čistý a voňavý bez zbytečného stresu. Naše profesionální uklízečky
            přizpůsobí úklid vašim požadavkům a harmonogramu.
          </p>
        </section>

        <h2 className="title title-home">Co zahrnuje náš domácí úklid?</h2>
        <ul>
          <li>Vytírání podlah, vysávání koberců a čalounění</li>
          <li>Úklid kuchyně – včetně spotřebičů</li>
          <li>Čištění koupelny a WC</li>
          <li>Utírání prachu, leštění zrcadel a skleněných ploch</li>
          <li>Mytí oken (na přání)</li>
        </ul>

        <h2 className="title title-home">Proč právě CleanStay?</h2>
        <ul>
          <li>Flexibilní termíny (včetně víkendů)</li>
          <li>Pečlivý výběr a školení uklízeček</li>
          <li>Možnost pravidelného i jednorázového úklidu</li>
          <li>Transparentní ceny – žádné skryté poplatky</li>
          <li>Recenze od spokojených klientů v celé Praze</li>
        </ul>

        <h2 className="title title-home">Úklidové služby pro všechny městské části Prahy</h2>
        <p>
          Poskytujeme <strong>úklid domácností po celé Praze</strong> – Praha 1 až Praha 10 i přilehlé oblasti. Ať už
          bydlíte na Vinohradech, na Smíchově nebo v Letňanech, rádi za vámi přijedeme.
        </p>

        <h2 className="title title-home">Nezávazná poptávka</h2>
        <p>
          Vyzkoušejte si náš profesionální přístup. Objednejte si <strong>úklid domácnosti v Praze</strong> snadno a
          rychle. Stačí vyplnit <a href="#kontakt" className="btn">kontaktní formulář</a> nebo nám zavolat.
        </p>

        <a href="/#kalkulacka" className="btn">Spočítejte si cenu úklidu</a>
      </main>

      <Footer />
    </>
  );
}


