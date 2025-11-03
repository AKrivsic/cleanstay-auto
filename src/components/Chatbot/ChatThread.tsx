"use client";
import { useEffect, useRef, useState } from 'react';
import LeadForm from './LeadForm';

type Message = { id: string; role: 'user' | 'assistant'; text: string };

export function ChatThread({ sessionId, seedPrompt, onSeedConsumed }: { sessionId: string; seedPrompt?: string | null; onSeedConsumed?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [detectedPhone, setDetectedPhone] = useState<string | null>(null);
  const [detectedEmail, setDetectedEmail] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (seedPrompt) {
      setInput(seedPrompt);
      if (onSeedConsumed) onSeedConsumed();
    }
  }, [seedPrompt, onSeedConsumed]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, streaming]);

  async function send(text: string) {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Detect phone number in message
    const phoneClean = text.replace(/[\s\-]+/g, ' ').trim();
    const phoneMatch = phoneClean.match(/(\+?420)?\s?(\d{3}[\s\-]?){2}\d{3}/);
    const foundPhone = phoneMatch ? phoneMatch[0].replace(/[\s\-]/g, '') : null;
    if (foundPhone && !detectedPhone) {
      setDetectedPhone(foundPhone);
    }
    
    // Detect email in message
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    const foundEmail = emailMatch ? emailMatch[0] : null;
    if (foundEmail && !detectedEmail) {
      setDetectedEmail(foundEmail);
    }

    // If user confirms phone ("ano", "jo", "správně") after phone was detected, show lead form immediately
    const confirmText = text.toLowerCase().trim();
    if (detectedPhone && (confirmText === 'ano' || confirmText === 'jo' || confirmText === 'správně' || confirmText === 'ok' || confirmText === 'yes')) {
      setShowLeadForm(true);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', text: 'Skvělé! Prosím vyplňte formulář níže.' }]);
      return;
    }

    setStreaming(true);
    const willShowLeadForm = !!(foundPhone || foundEmail); // Remember if we detected phone or email in this message
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, text, metadata: { originUrl: typeof window !== 'undefined' ? window.location.href : undefined, locale: 'cs' } })
    });

    if (!res.ok || !res.body) {
      setStreaming(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let assistantAccum = '';
    const assistantId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', text: '' }]);
    
    let buffer = ''; // Buffer for incomplete lines

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (!line) continue;
        if (line.startsWith('data: ')) {
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          
          let piece = '';
          if (payload.startsWith('{')) {
            try {
              const obj = JSON.parse(payload);
              piece = obj?.choices?.[0]?.delta?.content || '';
            } catch (e) {
              // Invalid JSON - skip this chunk (it's probably incomplete or malformed)
              console.warn('Skipping invalid JSON chunk:', payload.substring(0, 50));
              continue;
            }
          } else {
            // Not JSON, skip (shouldn't happen in OpenAI SSE format)
            continue;
          }
          
          if (piece) {
            assistantAccum += piece;
            setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, text: assistantAccum } : m)));
          }
        }
      }
    }
    
    // Process remaining buffer
    if (buffer.trim() && buffer.startsWith('data: ')) {
      const payload = buffer.slice(6).trim();
      if (payload && payload !== '[DONE]' && payload.startsWith('{')) {
        try {
          const obj = JSON.parse(payload);
          const piece = obj?.choices?.[0]?.delta?.content || '';
          if (piece) {
            assistantAccum += piece;
            setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, text: assistantAccum } : m)));
          }
        } catch {
          // Ignore incomplete JSON at end
        }
      }
    }

    setStreaming(false);
    
    // If phone was detected in this message, show lead form after assistant response
    if (willShowLeadForm && !showLeadForm) {
      setTimeout(() => {
        setShowLeadForm(true);
        setMessages(prev => [...prev, { 
          id: crypto.randomUUID(), 
          role: 'assistant', 
          text: 'Skvělé! Prosím vyplňte formulář níže s vašimi údaji.' 
        }]);
      }, 500); // Small delay to let user read the response
    }
  }

  return (
    <div id="chat-thread">
      <div id="chat-list" ref={listRef}>
        {messages.map(m => (
          <div key={m.id} className={`msg ${m.role}`}>{m.text}</div>
        ))}
        {streaming && <div className="msg assistant">…</div>}
        {showLeadForm && (
          <div className="msg assistant">
            <LeadForm 
              sessionId={sessionId} 
              initialPhone={detectedPhone || undefined}
              initialEmail={detectedEmail || undefined}
              onSubmitted={() => {
                setShowLeadForm(false);
                setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', text: 'Díky! Zavoláme do 30 minut.' }]);
              }} 
            />
          </div>
        )}
      </div>
      {!showLeadForm && (
        <form id="chat-input-form" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <input aria-label="Zpráva" value={input} onChange={e => setInput(e.target.value)} placeholder="Zeptej se na úklid…" />
          <button type="submit" disabled={streaming} aria-label="Odeslat">📤</button>
        </form>
      )}
    </div>
  );
}

export default ChatThread;


