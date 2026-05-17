import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../../api/auth';

type Status = 'loading' | 'success' | 'error';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<Status>(() => (token ? 'loading' : 'error'));
  const [errorMsg, setErrorMsg] = useState(() => (token ? '' : 'No verification token found in this link.'));
  const called = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (called.current) return;
    called.current = true;

    verifyEmail({ token })
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setErrorMsg(msg ?? 'This link is invalid or has expired.');
        setStatus('error');
      });
  }, [token]);

  return (
    <>
      <div className="mobile-brand">
        <div className="mobile-logo">P</div>
        <div className="mobile-brand-name">PharmaPRS</div>
        <div className="mobile-brand-tagline">Patient records, simplified.</div>
      </div>
      <div className="auth-layout">
        <div className="auth-hero">
          <p className="auth-hero-tagline">Patient records, simplified.</p>
          <p className="auth-hero-brand">PharmaPRS</p>
        </div>
        <div className="auth-panel">
          <div className="auth-box">
            <div className="mobile-divider" />

            {status === 'loading' && (
              <>
                <h1>Verifying your email…</h1>
                <p className="subtitle">Please wait a moment.</p>
              </>
            )}

            {status === 'success' && (
              <>
                <h1>Email verified!</h1>
                <p className="subtitle" style={{ marginBottom: 32 }}>
                  Your account is now active. You can sign in.
                </p>
                <Link
                  to="/login"
                  className="btn-primary"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  Sign In →
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <h1>Verification failed</h1>
                <p className="subtitle">There was a problem with your verification link.</p>
                <div className="error-banner">{errorMsg}</div>
                <p className="auth-footer-link">
                  Need a new link?{' '}
                  <Link className="link" to="/login">
                    Sign in to request one
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
