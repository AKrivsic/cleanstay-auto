# CleanStay AI - Pilot Checklist

## Přehled

Tento checklist obsahuje kroky pro spuštění pilotního provozu CleanStay AI na 8 Airbnb bytech a 2 SVJ objektech.

## Před spuštěním

### 1. Technické požadavky

- [ ] **Staging prostředí** - funkční a otestované
- [ ] **Production prostředí** - nasazené a zdravé
- [ ] **Database migrace** - aplikované
- [ ] **Pilot data** - načtená (8 Airbnb + 2 SVJ)
- [ ] **Health checks** - všechny prošly
- [ ] **WhatsApp webhook** - nakonfigurovaný
- [ ] **OpenAI API** - funkční
- [ ] **Sentry monitoring** - aktivní

### 2. Bezpečnostní ověření

- [ ] **RLS politiky** - aktivní a testované
- [ ] **Signed URLs** - fungují s 48h expirací
- [ ] **Secret keys** - pouze v server prostředí
- [ ] **Audit logging** - aktivní
- [ ] **Cost limits** - nastavené (€2 AI, €5 WhatsApp)

### 3. Pilotní data

- [ ] **Tenant:** CleanStay Pilot
- [ ] **8 Airbnb bytů:** Nikolajka 302, 205, Václavské nám. 15, Karlova 8, Staroměstské nám. 12, Národní 25, Malá Strana 7, Hradčany 3
- [ ] **2 SVJ objekty:** SVJ Vinohrady 15, SVJ Žižkov 22
- [ ] **3 uklízečky:** Marie Nováková, Anna Svobodová, Elena Petrová
- [ ] **1 admin:** Admin Pilot
- [ ] **1 klient:** Klient Pilot
- [ ] **5 zásob:** Domestos, Jar, Kávové kapsle, Toaletní papír, Povlečení

## Spuštění pilotu

### Týden 1-2: Interní provoz

#### Den 1: Spuštění
- [ ] **Deploy na production**
  ```bash
  npm run deploy:prod
  ```

- [ ] **Ověření health check**
  ```bash
  curl -f https://cleanstay.ai/api/health
  ```

- [ ] **Test WhatsApp webhook**
  ```bash
  curl -X POST https://cleanstay.ai/api/webhook/whatsapp \
    -H "Content-Type: application/json" \
    -d '{"test": "webhook"}'
  ```

- [ ] **Test AI parsing**
  ```bash
  curl -X POST https://cleanstay.ai/api/ai/parse \
    -H "Content-Type: application/json" \
    -d '{"text": "Začínám úklid 302"}'
  ```

#### Den 2-7: Interní testování
- [ ] **Test všech 8 Airbnb bytů**
  - [ ] Nikolajka 302
  - [ ] Nikolajka 205
  - [ ] Václavské nám. 15
  - [ ] Karlova 8
  - [ ] Staroměstské nám. 12
  - [ ] Národní 25
  - [ ] Malá Strana 7
  - [ ] Hradčany 3

- [ ] **Test obou SVJ objektů**
  - [ ] SVJ Vinohrady 15
  - [ ] SVJ Žižkov 22

- [ ] **Test všech 3 uklízeček**
  - [ ] Marie Nováková (+420111222333)
  - [ ] Anna Svobodová (+420444555666)
  - [ ] Elena Petrová (+420777888999)

- [ ] **Test všech WhatsApp příkazů**
  - [ ] "Začínám úklid 302"
  - [ ] "Došel Domestos"
  - [ ] "6 postelí vyměněno"
  - [ ] "Hotovo"
  - [ ] "Fotka kuchyň"

#### Den 8-14: Ladění a optimalizace
- [ ] **Monitoring výkonu**
  - [ ] Response time < 500ms
  - [ ] Error rate < 1%
  - [ ] AI parsing success > 95%

- [ ] **Monitoring nákladů**
  - [ ] AI náklady < €2/den
  - [ ] WhatsApp náklady < €5/den
  - [ ] Celkové náklady < €7/den

- [ ] **Optimalizace**
  - [ ] Ladění AI promptů
  - [ ] Optimalizace databázových dotazů
  - [ ] Zlepšení error handlingu

### Týden 3-4: Klientský portál + reporty

#### Den 15-21: Klientský portál
- [ ] **Test klientského portálu**
  - [ ] Přihlášení klienta
  - [ ] Zobrazení vlastních objektů
  - [ ] Zobrazení úklidů
  - [ ] Zobrazení fotografií

- [ ] **Test reportů přes chat**
  - [ ] "Report 302 dnes"
  - [ ] "Fotky 302 včera"
  - [ ] "Zásoby Nikolajka 3 týdny"

#### Den 22-28: Finální testování
- [ ] **End-to-end testy**
  - [ ] Kompletní úklidový cyklus
  - [ ] Nahrání fotografií
  - [ ] Generování reportů
  - [ ] Klientské notifikace

- [ ] **Load testing**
  - [ ] Souběžné úklidy
  - [ ] Vysoký počet zpráv
  - [ ] Velké soubory

## Monitoring během pilotu

### Denní monitoring
- [ ] **Health check** - každou hodinu
- [ ] **Error rate** - < 1%
- [ ] **Response time** - < 500ms
- [ ] **Cost monitoring** - AI < €2, WhatsApp < €5

### Týdenní monitoring
- [ ] **Performance review**
- [ ] **Cost analysis**
- [ ] **Error analysis**
- [ ] **User feedback**

### Měsíční monitoring
- [ ] **SLA compliance**
- [ ] **Cost efficiency**
- [ ] **User satisfaction**
- [ ] **System stability**

## Metriky pro hodnocení

### Technické metriky
- [ ] **Uptime:** > 99.9%
- [ ] **Response time:** < 500ms
- [ ] **Error rate:** < 1%
- [ ] **AI parsing success:** > 95%

### Business metriky
- [ ] **Počet úklidů:** 50+ za týden
- [ ] **Délka úklidu:** 30-60 minut
- [ ] **Počet fotografií:** 5+ na úklid
- [ ] **Počet doptání:** < 10% úklidů

### Nákladové metriky
- [ ] **AI náklady:** < €2/den
- [ ] **WhatsApp náklady:** < €5/den
- [ ] **Celkové náklady:** < €7/den
- [ ] **Náklady na úklid:** < €0.50

## Řešení problémů

### Časté problémy
1. **AI parsing chyby**
   - Zkontroluj OpenAI API key
   - Ověř prompt engineering
   - Zkontroluj rate limits

2. **WhatsApp webhook chyby**
   - Ověř webhook URL
   - Zkontroluj signature verification
   - Ověř message processing

3. **Database performance**
   - Zkontroluj indexy
   - Ověř RLS politiky
   - Monitor connection pool

4. **Cost overrun**
   - Zkontroluj cost limits
   - Ověř usage patterns
   - Implementuj throttling

### Emergency kontakty
- **Technical:** dev@cleanstay.ai
- **Operations:** ops@cleanstay.ai
- **Support:** support@cleanstay.ai

## Checkpointy

### T+7 dní
- [ ] **Technické metriky** - všechny OK
- [ ] **Business metriky** - 25+ úklidů
- [ ] **Nákladové metriky** - < €50 celkem
- [ ] **Seznam fixů** - připraven

### T+14 dní
- [ ] **Technické metriky** - všechny OK
- [ ] **Business metriky** - 50+ úklidů
- [ ] **Nákladové metriky** - < €100 celkem
- [ ] **User feedback** - pozitivní

### T+21 dní
- [ ] **GO/NO-GO rozhodnutí**
- [ ] **Rozšíření pilotu** - ano/ne
- [ ] **Production readiness** - ano/ne
- [ ] **Scaling plán** - připraven

## Dokumentace

### Technická dokumentace
- [ ] **API dokumentace** - aktualizovaná
- [ ] **Database schema** - dokumentovaná
- [ ] **Deployment guide** - připravený
- [ ] **Troubleshooting guide** - připravený

### Uživatelská dokumentace
- [ ] **Uklízečka guide** - připravený
- [ ] **Manager guide** - připravený
- [ ] **Client guide** - připravený
- [ ] **Support guide** - připravený

## Závěr

Po dokončení všech úkolů v tomto checklistu bude pilotní provoz CleanStay AI připraven k spuštění. Pravidelné monitorování a rychlé řešení problémů zajistí úspěšný pilot.

---

**Vytvořeno:** 2024-01-22  
**Verze:** 1.0  
**Kontakt:** pilot@cleanstay.ai





