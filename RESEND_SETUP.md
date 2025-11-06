# 📧 Nastavení Resend pro email notifikace

## ✅ Krok 1: Získejte API Key z Resend

1. Přihlaste se na https://resend.com/
2. Jděte do **API Keys** (nebo https://resend.com/api-keys)
3. Klikněte **Create API Key**
4. Pojmenujte ho např. "CleanStay Production"
5. **Zkopírujte API key** (začína `re_...`)

## 🔧 Krok 2: Přidejte do Environment Variables

### Lokálně (development):

Vytvořte soubor `.env.local`:

```bash
RESEND_API_KEY=re_your_api_key_here
```

### Na Vercelu (production):

1. Jděte do **Vercel Dashboard** → váš projekt
2. **Settings** → **Environment Variables**
3. Přidejte:
   - **Key:** `RESEND_API_KEY`
   - **Value:** `re_your_api_key_here`
   - **Environment:** Production, Preview, Development (všechny)
4. Klikněte **Save**
5. **Důležité:** Redeploy projekt (Deployments → ... → Redeploy)

## 📨 Krok 3: (Volitelné) Ověřte vlastní doménu

### Pokud chcete posílat z vlastní domény (např. `kontakt@cleanstay.cz`):

1. V Resend jděte do **Domains**
2. Přidejte `cleanstay.cz`
3. Přidejte DNS záznamy (SPF, DKIM, DMARC) do vaší DNS (např. na Wedos/Cloudflare)
4. Počkejte na ověření (pár minut)
5. Změňte v kódu (`src/app/api/contact/route.ts`):
   ```typescript
   from: 'CleanStay Kontakt <kontakt@cleanstay.cz>', // místo onboarding@resend.dev
   ```

### Pokud NEchcete ověřovat doménu:

- Nechat `onboarding@resend.dev` (funguje okamžitě)
- Emaily přijdou, ale od `onboarding@resend.dev`

## 🧪 Testování

1. Po přidání API key restartujte dev server:

   ```bash
   npm run dev
   ```

2. Vyplňte kontaktní formulář na webu

3. Zkontrolujte:
   - Email přijde na `info@cleanstay.cz`
   - V terminálu uvidíte: `✅ Email sent via Resend: { messageId: '...' }`

4. Pokud email nepřijde:
   - Zkontrolujte spam
   - Zkontrolujte Resend logs: https://resend.com/emails

## 📋 Checklist

- [ ] Zkopírován API key z Resend
- [ ] Přidán `RESEND_API_KEY` do `.env.local` (lokálně)
- [ ] Přidán `RESEND_API_KEY` do Vercel env variables
- [ ] Redeployován projekt na Vercelu
- [ ] Otestován kontaktní formulář
- [ ] Email přišel na `info@cleanstay.cz`

## 🎯 Co se posílá:

- **Komu:** `info@cleanstay.cz`
- **Od:** `onboarding@resend.dev` (nebo vaše doména)
- **Obsah:** Jméno, email, zpráva z formuláře
- **Formát:** HTML + plain text

## 🚨 Troubleshooting

### Email nepřichází:

1. Zkontrolujte Vercel logs: Runtime Logs
2. Hledejte: `✅ Email sent via Resend` nebo `⚠️ Email sending failed`
3. Zkontrolujte Resend dashboard: https://resend.com/emails
4. Zkontrolujte spam v info@cleanstay.cz

### Chyba "API key invalid":

- Zkontrolujte, že API key začíná `re_`
- Zkontrolujte, že nemá mezery na začátku/konci
- Vygenerujte nový API key v Resend

### Emaily jdou do spamu:

- Ověřte vlastní doménu v Resend
- Přidejte SPF, DKIM, DMARC DNS záznamy
