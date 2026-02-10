"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  useEffect(() => {
    // Placeholder for any side effects such as analytics.
  }, []);

  return (
    <div>
      <h1>Sign in</h1>
      {message && (
        <p style={{ color: '#666', fontSize: 14, maxWidth: 480 }}>{message}</p>
      )}
      <button
        type="button"
        onClick={() => signIn('google')}
        style={{
          marginTop: 16,
          padding: '8px 16px',
          borderRadius: 16,
          border: '1px solid #ddd',
          background: '#fff',
          cursor: 'pointer'
        }}
      >
        Continue with Google
      </button>
    </div>
  );
}
