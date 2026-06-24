import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login, resendVerification } from '../../api/auth';
import { useAuth } from '../../context/useAuthHook';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthenticated } = useAuth();

  const successMessage = (location.state as { message?: string } | null)?.message ?? '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isUnverified, setIsUnverified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    document.body.classList.add('auth-route');
    return () => document.body.classList.remove('auth-route');
  }, []);

  useEffect(() => {
    if (error) setIsShaking(true);
  }, [error]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tokens = await login({ email, password });
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      setAuthenticated(true);
      navigate('/dashboard');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string; error?: { code?: string } } } };
      const code = apiErr?.response?.data?.error?.code;
      if (code === 'EMAIL_NOT_VERIFIED') {
        setIsUnverified(true);
        setError('Your email address has not been verified yet.');
      } else {
        setIsUnverified(false);
        setError(apiErr?.response?.data?.message ?? 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email || resendLoading) return;
    setResendLoading(true);
    try {
      await resendVerification({ email });
      setResendSent(true);
    } catch {
      // silently ignore — avoids email enumeration
    } finally {
      setResendLoading(false);
    }
  }

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
            <h1>Welcome back</h1>
            <p className="subtitle">Sign in to your PharmaPRS account.</p>

            {successMessage && <div className="success-banner">{successMessage}</div>}
            {error && <div className="error-banner">{error}</div>}
            {isUnverified && (
              <div className="success-banner" style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}>
                {resendSent ? (
                  'Verification email sent. Check your inbox.'
                ) : (
                  <>
                    Need to verify your email?{' '}
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        color: '#92400e',
                        fontWeight: 600,
                        textDecoration: 'underline'
                      }}
                    >
                      {resendLoading ? 'Sending...' : 'Resend verification email'}
                    </button>
                  </>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  className="form-input"
                  type="email"
                  placeholder="jane@pharmacy.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="password">Password</label>
                  <Link className="forgot-link" to="/forgot-password">
                    Forgot password?
                  </Link>
                </div>
                <div className="input-wrapper">
                  <input
                    id="password"
                    className="form-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="pwd-toggle" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility">
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <button
                className={`btn-primary${isShaking ? ' shake' : ''}`}
                type="submit"
                disabled={loading}
                onAnimationEnd={() => setIsShaking(false)}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="auth-footer-link">
              Don't have an account?{' '}
              <Link className="link" to="/register">
                Register →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
