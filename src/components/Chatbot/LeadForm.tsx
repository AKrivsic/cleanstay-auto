"use client";
import { useState, useEffect } from 'react';
import { GDPR_SENTENCE } from '@/config/chatbot.config';

export default function LeadForm({ sessionId, initialPhone, initialEmail, onSubmitted }: { sessionId: string; initialPhone?: string; initialEmail?: string; onSubmitted: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail || '');
  const [phone, setPhone] = useState(initialPhone || '');
  
  useEffect(() => {
    if (initialPhone) {
      setPhone(initialPhone);
    }
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialPhone, initialEmail]);
  const [consent, setConsent] = useState(false);
  const [serviceType, setServiceType] = useState('');
  const [city, setCity] = useState('Praha');
  const [sizeM2, setSizeM2] = useState<number | ''>('');
  const [cadence, setCadence] = useState('');
  const [rushFlag, setRushFlag] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!consent) { setError('Je vyžadován souhlas se zpracováním osobních údajů.'); return; }
    if (!phone || !phone.trim()) { setError('Telefon je povinný.'); return; }
    const res = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, name, email, phone, consent, serviceType, city, sizeM2: sizeM2 || undefined, cadence, rushFlag })
    });
    if (!res.ok) { setError('Odeslání se nezdařilo.'); return; }
    setSent(true);
    onSubmitted();
  }

  if (sent) {
    return <div className="lead-success">Díky! Zavoláme do 30 minut.</div>;
  }

  return (
    <div className="lead-form" role="form" aria-label="Kontaktní formulář">
      {error && <div className="lead-error" role="alert">{error}</div>}
      <div className="row">
        <label>Jméno (volitelně)</label>
        <input value={name} onChange={e => setName(e.target.value)} aria-label="Jméno" />
      </div>
      <div className="row">
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} aria-label="Email" />
      </div>
      <div className="row">
        <label>Telefon *</label>
        <input value={phone} onChange={e => setPhone(e.target.value)} aria-label="Telefon" required />
      </div>
      <div className="row">
        <label>Služba</label>
        <input value={serviceType} onChange={e => setServiceType(e.target.value)} aria-label="Služba" />
      </div>
      <div className="row">
        <label>Město</label>
        <input value={city} onChange={e => setCity(e.target.value)} aria-label="Město" />
      </div>
      <div className="row">
        <label>Velikost (m²)</label>
        <input inputMode="numeric" value={sizeM2} onChange={e => setSizeM2(e.target.value ? parseInt(e.target.value, 10) : '')} aria-label="Velikost v metrech čtverečních" />
      </div>
      <div className="row">
        <label>Frekvence</label>
        <input value={cadence} onChange={e => setCadence(e.target.value)} aria-label="Frekvence" />
      </div>
      <div className="row checkbox">
        <label><input type="checkbox" checked={rushFlag} onChange={e => setRushFlag(e.target.checked)} /> Expres</label>
      </div>
      <div className="row checkbox">
        <label><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required /> {GDPR_SENTENCE} *</label>
      </div>
      <div className="actions">
        <button onClick={submit} aria-label="Odeslat poptávku">Odeslat</button>
      </div>
    </div>
  );
}


