"use client";

import { useState, Suspense } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

function RegisterContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Hesla se neshodují');
      setLoading(false);
      return;
    }

    try {
      const supabase = createSupabaseClient();
      
      // Check if email exists in users table first
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('email, role')
        .eq('email', email)
        .single();

      if (checkError || !existingUser) {
        setError('Tento email není zaregistrován. Kontaktujte nás prosím.');
        setLoading(false);
        return;
      }

      // Create auth user (registration)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: existingUser.role,
          }
        }
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        setSuccess(true);
        // Wait a bit then redirect
        setTimeout(() => {
          window.location.href = '/portal';
        }, 2000);
      }
    } catch (err: any) {
      setError('Chyba při registraci');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>Registrace úspěšná!</h1>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>
            Přesměrujeme vás na portál...
          </p>
        </div>
      </main>
    );
  }

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
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0 0 0.5rem 0', textAlign: 'center' }}>Registrace</h1>
        <p style={{ color: '#6b7280', margin: '0 0 1.5rem 0', textAlign: 'center', fontSize: '0.875rem' }}>
          Zadejte svůj email a vytvořte si heslo
        </p>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                outline: 'none'
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
              minLength={6}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none'
              }}
              placeholder="Minimálně 6 znaků"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
              Potvrzení hesla
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none'
              }}
              placeholder="Znovu zadejte heslo"
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
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Registruji...' : 'Zaregistrovat se'}
          </button>

          <p style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center', margin: 0 }}>
            Už máte účet? <a href="/login" style={{ color: '#111827', fontWeight: '500' }}>Přihlásit se</a>
          </p>
        </form>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Načítání...</h1>
      </main>
    }>
      <RegisterContent />
    </Suspense>
  );
}

