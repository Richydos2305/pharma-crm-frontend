import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { resendVerification } from '../../api/auth';

export function CheckEmailPage() {
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? '';

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleResend() {
    if (!email || loading) return;
    setLoading(true);
    setError('');
    try {
      await resendVerification({ email });
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mobile-brand">
        <div className="mobile-logo">P</div>
        <div className="mobile-brand-name">PharmaCRM</div>
        <div className="mobile-brand-tagline">Patient records, simplified.</div>
      </div>
      <div className="auth-layout">
        <div className="auth-hero">
          <p className="auth-hero-tagline">Patient records, simplified.</p>
          <p className="auth-hero-brand">PharmaCRM</p>
        </div>
        <div className="auth-panel">
          <div className="auth-box">
            <div className="mobile-divider" />

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: 'var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)'
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
            </div>

            <h1 style={{ textAlign: 'center' }}>Check your email</h1>
            <p className="subtitle" style={{ textAlign: 'center' }}>
              We've sent a verification link to
              {email ? (
                <>
                  {' '}
                  <strong>{email}</strong>
                </>
              ) : (
                ' your email address'
              )}
              . Click the link to activate your account.
            </p>

            {sent && <div className="success-banner">Verification email resent. Check your inbox.</div>}
            {error && <div className="error-banner">{error}</div>}

            {email && !sent && (
              <p className="auth-footer-link" style={{ marginTop: 32 }}>
                Didn't receive it?{' '}
                <button
                  type="button"
                  className="link"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 'inherit' }}
                  onClick={handleResend}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Resend verification email'}
                </button>
              </p>
            )}

            <p className="auth-footer-link" style={{ marginTop: email && !sent ? 12 : 32 }}>
              <Link className="link" to="/login">
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
