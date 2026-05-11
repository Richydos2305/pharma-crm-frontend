import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../api/auth';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword({ email });
    } finally {
      setLoading(false);
      setSubmitted(true);
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

            {submitted ? (
              <>
                <h1>Check your email</h1>
                <p className="subtitle">
                  If an account exists for <strong>{email}</strong>, we've sent a password reset link. Check your inbox.
                </p>
                <p className="auth-footer-link" style={{ marginTop: 32 }}>
                  <Link className="link" to="/login">
                    ← Back to sign in
                  </Link>
                </p>
              </>
            ) : (
              <>
                <h1>Forgot password?</h1>
                <p className="subtitle">Enter your email and we'll send you a reset link.</p>

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
                  <button className="btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>

                <p className="auth-footer-link">
                  <Link className="link" to="/login">
                    ← Back to sign in
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
