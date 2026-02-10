"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/hooks';

export function HeaderAuthControl() {
  const { session, isAuthenticated, isLoading, signInWithGoogle, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  if (isLoading) {
    return <div style={{ fontSize: 14, color: '#555' }}>Checking session…</div>;
  }

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => signInWithGoogle()}
        style={{
          padding: '6px 12px',
          borderRadius: 16,
          border: '1px solid #ddd',
          background: '#fff',
          fontSize: 14,
          cursor: 'pointer'
        }}
      >
        Sign in with Google
      </button>
    );
  }

  const user = session?.user;

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 8px',
          borderRadius: 999,
          border: '1px solid #e5e5e5',
          background: '#fff',
          cursor: 'pointer'
        }}
      >
        <span style={{ fontSize: 14, color: '#111' }}>{user?.email ?? 'Account'}</span>
        {user?.image && !avatarFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name ?? user.email ?? 'User avatar'}
            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#eee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#777'
            }}
          >
            {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            marginTop: 8,
            minWidth: 220,
            borderRadius: 12,
            border: '1px solid #e5e5e5',
            background: '#fff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            padding: 12,
            fontSize: 14,
            zIndex: 10
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 500 }}>{user?.name ?? user?.email ?? 'Signed in user'}</div>
            {user?.email && (
              <div style={{ fontSize: 12, color: '#666' }}>{user.email}</div>
            )}
          </div>
          <div style={{ marginBottom: 8 }}>
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'block',
                padding: '6px 0',
                fontSize: 14,
                color: '#111827',
                textDecoration: 'none'
              }}
            >
              View / edit profile
            </Link>
            <Link
              href="/sessions"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'block',
                padding: '6px 0',
                fontSize: 14,
                color: '#111827',
                textDecoration: 'none'
              }}
            >
              My sessions
            </Link>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              signOut();
            }}
            style={{
              marginTop: 4,
              padding: '6px 12px',
              width: '100%',
              borderRadius: 8,
              border: '1px solid #ddd',
              background: '#f8f8f8',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
