'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredAuthToken, useAuthStore } from '@/store/authStore';
import {
  shouldRedirectToLogin,
  shouldShowSessionVerificationFailure,
} from '@/lib/authRedirect';
import { getDefaultDashboardRoute } from '@/lib/routeAccess';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isAuthReady, loadUser, user } = useAuthStore();
  const hasStoredToken = Boolean(getStoredAuthToken());
  const showSessionVerificationFailure = shouldShowSessionVerificationFailure(
    isAuthenticated,
    isAuthReady,
    hasStoredToken
  );

  useEffect(() => {
    if (!isAuthReady) return;
    if (isAuthenticated) {
      const nextRoute = getDefaultDashboardRoute(user?.permissions);
      router.push(nextRoute || '/login');
    } else if (shouldRedirectToLogin(isAuthenticated, isAuthReady, Boolean(getStoredAuthToken()))) {
      router.push('/login');
    }
  }, [isAuthenticated, isAuthReady, router, user?.permissions]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background:
          'linear-gradient(135deg, rgb(13, 148, 136) 0%, rgb(15, 118, 110) 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'white',
          borderRadius: 20,
          padding: 28,
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)',
          color: '#0f172a',
        }}
      >
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0f766e' }}>
          Bika Banquet
        </p>
        <h1 style={{ margin: '10px 0 0', fontSize: 30, lineHeight: 1.2 }}>
          {!isAuthReady
            ? 'Loading your workspace...'
            : showSessionVerificationFailure
              ? 'Could not verify your session.'
              : 'Taking you to the right page...'}
        </h1>
        <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.6, color: '#334155' }}>
          {showSessionVerificationFailure
            ? 'Check your connection and retry session restore.'
            : 'If this page does not move in a moment, open the login screen directly.'}
        </p>
        <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {showSessionVerificationFailure && (
            <button
              type="button"
              onClick={() => void loadUser({ silent: true })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                padding: '10px 16px',
                border: 0,
                background: '#0d9488',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          )}
          <a
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              padding: '10px 16px',
              background: showSessionVerificationFailure ? '#fff' : '#0d9488',
              color: showSessionVerificationFailure ? '#334155' : 'white',
              border: showSessionVerificationFailure ? '1px solid #cbd5e1' : undefined,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Open Login
          </a>
          <a
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              padding: '10px 16px',
              border: '1px solid #cbd5e1',
              color: '#334155',
              textDecoration: 'none',
              fontWeight: 600,
              background: '#fff',
            }}
          >
            Open Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
