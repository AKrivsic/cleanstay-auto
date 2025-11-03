"use client";

import { useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginContent() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const nextPath = nextParam && nextParam.startsWith('/') ? nextParam : '/portal';

  const setCookie = useCallback((name: string, value: string) => {
    document.cookie = `${name}=${value}; path=/; SameSite=Lax`;
  }, []);

  const handleClientLogin = useCallback(() => {
    setCookie('client-role', 'client');
    window.location.href = nextPath.startsWith('/portal') ? nextPath : '/portal';
  }, [nextPath, setCookie]);

  const handleAdminLogin = useCallback(() => {
    setCookie('admin-role', 'admin');
    window.location.href = nextPath.startsWith('/dashboard') ? nextPath : '/dashboard';
  }, [nextPath, setCookie]);

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      gap: '1rem',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji'
    }}>
      <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Přihlášení</h1>
      <p style={{ color: '#555', margin: 0 }}>Vyberte, kam chcete vstoupit.</p>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
        <button onClick={handleClientLogin} style={{ padding: '0.6rem 1rem', background: '#111827', color: '#fff', borderRadius: 8, border: 0, cursor: 'pointer' }}>Klientský portál</button>
        <button onClick={handleAdminLogin} style={{ padding: '0.6rem 1rem', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}>Administrace</button>
      </div>
      <p style={{ fontSize: 12, color: '#666' }}>Po kliknutí nastavíme cookie a přesměrujeme na {nextPath}.</p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        gap: '1rem',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji'
      }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Přihlášení</h1>
        <p style={{ color: '#555', margin: 0 }}>Načítání...</p>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}


