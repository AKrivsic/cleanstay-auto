"use client";

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nextParam = searchParams.get('next');
  const nextPath = nextParam && nextParam.startsWith('/') ? nextParam : '/portal';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createSupabaseClient();
      console.log('Attempting login with:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Login response:', { data, error });

      if (error) {
        setError(`Chyba: ${error.message}`);
        setLoading(false);
        console.error('Login error details:', error);
        return;
      }

      console.log('Login successful, redirecting...');
      
      // Check if user is admin by checking email domain or hardcoded admin email
      const isAdmin = email === 'info@cleanstay.cz' || email.endsWith('@admin.cleanstay.cz');
      
      console.log('Is admin?', isAdmin, 'Email:', email);
      
      // Redirect accordingly
      if (isAdmin) {
        console.log('Redirecting to /dashboard');
        router.push('/dashboard');
      } else {
        console.log('Redirecting to /portal');
        router.push('/portal');
      }
    } catch (err: any) {
      setError(`Chyba při přihlášení: ${err.message}`);
      setLoading(false);
      console.error('Login exception:', err);
    }
  };

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      gap: '1.5rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0 0 0.5rem 0', textAlign: 'center' }}>Přihlášení</h1>
        <p style={{ color: '#6b7280', margin: '0 0 1.5rem 0', textAlign: 'center', fontSize: '0.875rem' }}>
          Zadejte email a heslo
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
              Email nebo telefon
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              placeholder="vas@email.cz"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
              Heslo
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.625rem 1rem',
              backgroundColor: loading ? '#9ca3af' : '#111827',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? 'Přihlašování...' : 'Přihlásit se'}
          </button>
        </form>
      </div>
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
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Přihlášení</h1>
        <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>Načítání...</p>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}


