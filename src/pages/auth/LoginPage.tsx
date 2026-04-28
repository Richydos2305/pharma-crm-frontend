import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';
import { useAuth } from '../../context/useAuthHook';

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Invalid email or password.');
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
            <h1>Welcome back</h1>
            <p className="subtitle">Sign in to your PharmaCRM account.</p>

            {error && <div className="error-banner">{error}</div>}

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
              <button className="btn-primary" type="submit" disabled={loading}>
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
