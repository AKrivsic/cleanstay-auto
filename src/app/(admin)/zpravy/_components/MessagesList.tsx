"use client";
import { useEffect, useMemo, useState } from 'react';

type MsgRow = {
  id: string;
  conversation_id: string | null;
  created_at?: string;
  source?: string | null;
  role?: string | null;
  text?: string | null;
  unread?: boolean | null;
};

type LeadRow = { id: string; conversation_id: string | null };

export default function MessagesList() {
  const [rows, setRows] = useState<MsgRow[]>([]);
  const [thread, setThread] = useState<{ messages: MsgRow[]; lead: any } | null>(null);
  const [openConv, setOpenConv] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<'ALL'|'WEB'|'WA'>('ALL');
  const [filterUnread, setFilterUnread] = useState<'ALL'|'UNREAD'>('ALL');
  const [filterHasContact, setFilterHasContact] = useState<'ALL'|'HAS'>('ALL');
  const [leadsByConv, setLeadsByConv] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Fetch latest messages grouped by conversation
        const res = await fetch('/api/admin/messages/list');
        if (!res.ok) {
          console.error('Failed to load messages:', res.status, await res.text());
          return;
        }
        const data = await res.json();
        console.log('[MessagesList] Loaded:', data.rows?.length || 0, 'messages,', data.leads?.length || 0, 'leads');
        if (data.rows && data.rows.length > 0) {
          console.log('[MessagesList] First message:', {
            id: data.rows[0].id,
            conversation_id: data.rows[0].conversation_id,
            source: data.rows[0].source,
            role: data.rows[0].role,
            text: data.rows[0].text?.substring(0, 30),
            created_at: data.rows[0].created_at
          });
        }
        if (!active) return;
        setRows(data.rows || []);
        const leads: LeadRow[] = data.leads || [];
        const map: Record<string, boolean> = {};
        leads.forEach(l => { if (l.conversation_id) map[l.conversation_id] = true; });
        setLeadsByConv(map);
      } catch (err) {
        console.error('Error loading messages:', err);
      }
    })();
    return () => { active = false; };
  }, []);

  // Group messages by conversation_id and show latest message per conversation
  const conversations = useMemo(() => {
    const convMap = new Map<string, MsgRow>();
    rows.forEach(r => {
      const convId = r.conversation_id || r.id; // Use id as fallback for messages without conversation_id
      const existing = convMap.get(convId);
      if (!existing || (r.created_at && existing.created_at && new Date(r.created_at) > new Date(existing.created_at))) {
        convMap.set(convId, r);
      }
    });
    return Array.from(convMap.values());
  }, [rows]);

  const filtered = useMemo(() => {
    return conversations.filter(r => {
      if (filterSource !== 'ALL') {
        const s = r.source === 'web' ? 'WEB' : (r.source === 'whatsapp' ? 'WA' : '');
        if (s !== filterSource) return false;
      }
      if (filterUnread === 'UNREAD' && !r.unread) return false;
      if (filterHasContact === 'HAS') {
        const convId = r.conversation_id || '';
        if (!leadsByConv[convId]) return false;
      }
      return true;
    });
  }, [conversations, filterSource, filterUnread, filterHasContact, leadsByConv]);

  async function markRead(messageId: string) {
    await fetch('/api/admin/messages/mark-read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: messageId }) });
    setRows(prev => prev.map(r => (r.id === messageId ? { ...r, unread: false } : r)));
  }

  async function openThread(conversationId: string | null) {
    if (!conversationId) return;
    setOpenConv(conversationId);
    const res = await fetch(`/api/admin/messages/thread?conversationId=${conversationId}`);
    if (!res.ok) return;
    const data = await res.json();
    setThread(data);
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '16px 12px' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 20, color: '#111827', flex: 1 }}>Zprávy</h2>
        <select aria-label="Zdroj" value={filterSource} onChange={e => setFilterSource(e.target.value as any)}>
          <option value="ALL">Vše</option>
          <option value="WEB">WEB</option>
          <option value="WA">WA</option>
        </select>
        <select aria-label="Nepřečtené" value={filterUnread} onChange={e => setFilterUnread(e.target.value as any)}>
          <option value="ALL">Vše</option>
          <option value="UNREAD">Nepřečtené</option>
        </select>
        <select aria-label="Kontakt" value={filterHasContact} onChange={e => setFilterHasContact(e.target.value as any)}>
          <option value="ALL">Vše</option>
          <option value="HAS">Má kontakt</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(r => (
          <div
            key={r.id}
            style={{
              border: '1px solid #E5E7EB',
              borderRadius: 10,
              padding: 12,
              background: '#FFFFFF',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
            onClick={() => openThread(r.conversation_id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: r.source === 'web' ? '#34D399' : '#8B5CF6', color: '#fff' }}>{r.source === 'web' ? 'WEB' : 'WA'}</span>
                {r.unread && <span style={{ fontSize: 12, color: '#EF4444' }}>● Nepřečtené</span>}
                {r.conversation_id && leadsByConv[r.conversation_id] && (
                  <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: '#10B981', color: '#fff', fontWeight: 'bold' }}>✓ LEAD</span>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); markRead(r.id); }}
                style={{
                  fontSize: 12,
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid #E5E7EB',
                  background: '#F9FAFB',
                  cursor: 'pointer'
                }}
              >Označit jako přečtené</button>
            </div>
            <div style={{ marginTop: 8, color: '#111827', fontSize: 14, lineHeight: '18px' }}>
              {r.text}
            </div>
            {r.conversation_id && (
              <div style={{ marginTop: 4, fontSize: 12, color: '#4B5563' }}>
                Konverzace: {r.conversation_id.substring(0, 8)}... • {r.created_at ? new Date(r.created_at).toLocaleString('cs-CZ') : ''}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div>Žádné zprávy.</div>}
      </div>

      {openConv && thread && (
        <div style={{ position: 'fixed', right: 0, top: 0, width: 420, height: '100%', background: '#fff', borderLeft: '1px solid #E5E7EB', boxShadow: '-4px 0 12px rgba(0,0,0,0.1)', padding: 12, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Vlákno</h3>
            <button onClick={() => { setOpenConv(null); setThread(null); }}>Zavřít</button>
          </div>
          <div>
            {thread.messages.map((m) => (
              <div key={m.id} style={{ margin: '8px 0', padding: 10, borderRadius: 10, background: m.role === 'user' ? '#F3F4F6' : '#34D399', color: m.role === 'user' ? '#111827' : '#fff' }}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{m.role?.toUpperCase()} • {new Date(m.created_at || '').toLocaleString()}</div>
                <div style={{ fontSize: 14, lineHeight: '18px' }}>{m.text}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <h4>Lead</h4>
            {thread.lead ? (
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: 10, background: '#FFFFFF' }}>
                {thread.lead.name && <div><strong>Jméno:</strong> {thread.lead.name}</div>}
                {thread.lead.email && <div><strong>Email:</strong> {thread.lead.email}</div>}
                {thread.lead.phone && <div><strong>Telefon:</strong> {thread.lead.phone}</div>}
                {thread.lead.service_type && <div><strong>Služba:</strong> {thread.lead.service_type}</div>}
                {thread.lead.city && <div><strong>Město:</strong> {thread.lead.city}</div>}
                {typeof thread.lead.size_m2 === 'number' && <div><strong>Velikost:</strong> {thread.lead.size_m2} m²</div>}
                {thread.lead.cadence && <div><strong>Frekvence:</strong> {thread.lead.cadence}</div>}
                <div><strong>Expres:</strong> {thread.lead.rush ? 'Ano' : 'Ne'}</div>
                <div><strong>Souhlas:</strong> {thread.lead.consent ? 'Ano' : 'Ne'}</div>
              </div>
            ) : (
              <div>Žádný lead.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


