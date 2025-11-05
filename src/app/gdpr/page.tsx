import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Zásady ochrany osobních údajů (GDPR) | CleanStay',
  description: 'Informace o zpracování osobních údajů společností CleanStay v souladu s GDPR.',
};

export default function GDPRPage() {
  return (
    <>
      <div className="spacer"></div>
      <Header />
      <main className="main-content">
        <section className="section">
          <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1>Zásady ochrany osobních údajů (GDPR)</h1>
            
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '2rem' }}>
              Účinnost od: 1. ledna 2025
            </p>

            <h2 className="title">1. Správce osobních údajů</h2>
            <p>
              Správcem vašich osobních údajů je <strong>CleanStay</strong>, se sídlem v Praze, 
              IČO: 01719408, kontaktní email: <a href="mailto:info@cleanstay.cz">info@cleanstay.cz</a>, 
              telefon: <a href="tel:+420776292312">+420 776 292 312</a>.
            </p>

            <h2 className="title">2. Jaké osobní údaje zpracováváme</h2>
            <p>V rámci poskytování našich služeb můžeme zpracovávat následující osobní údaje:</p>
            <ul>
              <li><strong>Identifikační údaje:</strong> jméno, příjmení</li>
              <li><strong>Kontaktní údaje:</strong> email, telefonní číslo, adresa</li>
              <li><strong>Objednávkové údaje:</strong> informace o objednaných službách, termínech, požadavcích</li>
              <li><strong>Komunikační údaje:</strong> zprávy z kontaktního formuláře, chatbotu, WhatsApp konverzace</li>
              <li><strong>Technické údaje:</strong> IP adresa, cookies (pro fungování webu)</li>
            </ul>

            <h2 className="title">3. Účel a právní základ zpracování</h2>
            <p>Vaše osobní údaje zpracováváme z následujících důvodů:</p>
            <ul>
              <li>
                <strong>Plnění smlouvy</strong> – poskytování úklidových služeb, komunikace o objednávkách, 
                fakturace (čl. 6 odst. 1 písm. b) GDPR)
              </li>
              <li>
                <strong>Souhlas</strong> – zasílání marketingových sdělení, newsletter (čl. 6 odst. 1 písm. a) GDPR)
              </li>
              <li>
                <strong>Oprávněný zájem</strong> – prevence podvodů, zlepšování služeb, archivace komunikace 
                (čl. 6 odst. 1 písm. f) GDPR)
              </li>
              <li>
                <strong>Právní povinnost</strong> – účetní a daňová evidence (čl. 6 odst. 1 písm. c) GDPR)
              </li>
            </ul>

            <h2 className="title">4. Doba uložení údajů</h2>
            <ul>
              <li><strong>Objednávky a faktury:</strong> 10 let (daňové a účetní předpisy)</li>
              <li><strong>Marketingové souhlasy:</strong> do odvolání souhlasu</li>
              <li><strong>Kontaktní formuláře:</strong> 2 roky od posledního kontaktu</li>
              <li><strong>Chatbot konverzace:</strong> 1 rok</li>
            </ul>

            <h2 className="title">5. Komu předáváme vaše údaje</h2>
            <p>Vaše osobní údaje můžeme předávat následujícím kategoriím příjemců:</p>
            <ul>
              <li><strong>IT poskytovatelé:</strong> hosting (Vercel), databáze (Supabase), komunikace (WhatsApp API)</li>
              <li><strong>Účetní a daňoví poradci</strong></li>
              <li><strong>Banky a platební instituce</strong> (pro zpracování plateb)</li>
            </ul>
            <p>
              Všichni zpracovatelé jsou vázáni smlouvou o zpracování osobních údajů a dodržují GDPR. 
              Vaše data neprodáváme třetím stranám.
            </p>

            <h2 className="title">6. Vaše práva</h2>
            <p>Máte následující práva:</p>
            <ul>
              <li><strong>Právo na přístup</strong> – zjistit, jaké údaje o vás zpracováváme</li>
              <li><strong>Právo na opravu</strong> – opravit nesprávné nebo neúplné údaje</li>
              <li><strong>Právo na výmaz</strong> („právo být zapomenut") – za určitých podmínek</li>
              <li><strong>Právo na omezení zpracování</strong> – dočasně pozastavit zpracování</li>
              <li><strong>Právo na přenositelnost údajů</strong> – získat své údaje ve strukturovaném formátu</li>
              <li><strong>Právo vznést námitku</strong> – proti zpracování na základě oprávněného zájmu</li>
              <li><strong>Právo odvolat souhlas</strong> – kdykoliv, bez vlivu na zákonnost předchozího zpracování</li>
            </ul>
            <p>
              Pro uplatnění svých práv nás kontaktujte na <a href="mailto:info@cleanstay.cz">info@cleanstay.cz</a>. 
              Odpovíme do 30 dnů.
            </p>

            <h2 className="title">7. Zabezpečení údajů</h2>
            <p>
              Vaše osobní údaje chráníme technickými a organizačními opatřeními: šifrování komunikace (HTTPS), 
              zabezpečená databáze, přístup pouze oprávněných osob, pravidelné zálohy.
            </p>

            <h2 className="title">8. Cookies</h2>
            <p>
              Náš web používá pouze technické cookies nezbytné pro jeho fungování (např. session ID pro chatbot). 
              Nepoužíváme reklamní ani analytické cookies třetích stran.
            </p>

            <h2 className="title">9. Změny těchto zásad</h2>
            <p>
              Tyto zásady můžeme čas od času aktualizovat. Aktuální verze je vždy dostupná na této stránce. 
              O zásadních změnách vás budeme informovat emailem.
            </p>

            <h2 className="title">10. Kontakt a stížnosti</h2>
            <p>
              Máte-li dotazy nebo stížnosti ohledně zpracování osobních údajů, kontaktujte nás:
            </p>
            <p>
              Email: <a href="mailto:info@cleanstay.cz">info@cleanstay.cz</a><br />
              Telefon: <a href="tel:+420776292312">+420 776 292 312</a>
            </p>
            <p>
              Máte také právo podat stížnost u <strong>Úřadu pro ochranu osobních údajů</strong> 
              (<a href="https://www.uoou.cz" target="_blank" rel="noopener">www.uoou.cz</a>).
            </p>

            <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                <strong>Děkujeme za důvěru!</strong> Vaše soukromí bereme vážně a zavazujeme se chránit vaše osobní údaje.
              </p>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <Link href="/" className="btn-primary">Zpět na hlavní stránku</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

