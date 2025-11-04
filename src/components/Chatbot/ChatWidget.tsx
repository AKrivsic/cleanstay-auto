"use client";
import { useState, useEffect } from 'react';
import ChatThread from './ChatThread';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    try {
      let id = localStorage.getItem('chatSessionId');
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('chatSessionId', id);
      }
      setSessionId(id);
    } catch (e) {
      console.warn('Failed to get sessionId:', e);
    }
  }, []);

  return (
    <div style={{ position: 'fixed', right: '24px', bottom: '24px', zIndex: 9999 }}>
      {/* FAB Button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Otevřít chat"
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '24px',
          border: 'none',
          background: '#34D399',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        💬
      </button>

      {/* Chat Panel */}
      {open && sessionId && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: '56px',
            width: '360px',
            height: '480px',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
            background: '#fff',
            overflow: 'hidden'
          }}
        >
          <ChatThread sessionId={sessionId} />
        </div>
      )}
    </div>
  );
}

