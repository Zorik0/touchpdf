'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Runtime Error:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      gap: 24,
      padding: 20
    }}>
      <div style={{
        width: 64,
        height: 64,
        background: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--danger)'
      }}>
        <AlertTriangle size={32} />
      </div>
      
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>Something went wrong!</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>
          We encountered an unexpected error. It might be a temporary glitch.
        </p>
        {error.digest && (
           <code style={{display:'block', marginTop: 12, fontSize:'0.75rem', background:'rgba(0,0,0,0.3)', padding: 8, borderRadius: 4}}>
             Error ID: {error.digest}
           </code>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={reset}
          className="btn btn-primary"
        >
          <RefreshCcw size={16} /> Try again
        </button>
        <Link href="/" className="btn btn-ghost">
          <Home size={16} /> Go Home
        </Link>
      </div>
    </div>
  );
}
