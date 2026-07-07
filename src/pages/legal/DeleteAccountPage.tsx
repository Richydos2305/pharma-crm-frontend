const CONTACT_EMAIL = 'pharmact26@gmail.com';

export function DeleteAccountPage() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.brand}>
          <div style={styles.logo}>P</div>
          <span style={styles.brandName}>PharmaPRS</span>
        </div>

        <h1 style={styles.h1}>Delete Your Account</h1>
        <p style={styles.p}>
          If you would like to delete your PharmaPRS account and associated data, follow the steps below. This applies to both the PharmaPRS web
          application and the PharmaPRS mobile app.
        </p>

        <h2 style={styles.h2}>How to request deletion</h2>
        <ol style={styles.ol}>
          <li style={styles.li}>
            Send an email to{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} style={styles.link}>
              {CONTACT_EMAIL}
            </a>{' '}
            from the email address registered on your PharmaPRS account.
          </li>
          <li style={styles.li}>Include the subject line &ldquo;Account Deletion Request&rdquo; and the name of your pharmacy.</li>
          <li style={styles.li}>We will verify the request and confirm back to you by email.</li>
          <li style={styles.li}>Your account and associated data will be deleted within 30 days of a verified request.</li>
        </ol>

        <h2 style={styles.h2}>What gets deleted</h2>
        <ul style={styles.ul}>
          <li style={styles.li}>Your user account information — name, email address, phone number, and password.</li>
          <li style={styles.li}>Pharmacy profile information associated with your account, such as pharmacy name and logo.</li>
          <li style={styles.li}>
            Patient records created under your account, including custom form data, medical visit notes, and prescriptions, unless retention is
            required as described below.
          </li>
        </ul>

        <h2 style={styles.h2}>What may be retained</h2>
        <p style={styles.p}>
          We may retain certain information for a limited period after deletion where required by law, to resolve disputes, prevent fraud, or meet
          regulatory record-keeping obligations relevant to pharmacy practice. Any retained data is kept only as long as necessary for these purposes
          and is not used for any other purpose.
        </p>

        <p style={styles.p}>
          For more detail on how we handle your information, see our{' '}
          <a href="/privacy" style={styles.link}>
            Privacy Policy
          </a>
          . If you have questions about this process, contact us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} style={styles.link}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--surface-primary)',
    padding: '48px 20px'
  },
  container: {
    maxWidth: 720,
    margin: '0 auto',
    background: 'var(--card-fill)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-card)',
    padding: '40px 48px',
    boxShadow: 'var(--shadow)'
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'var(--accent-primary)',
    color: 'var(--card-fill)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 16
  },
  brandName: {
    fontWeight: 700,
    fontSize: 16,
    color: 'var(--surface-inverse)'
  },
  h1: {
    fontSize: 28,
    margin: '0 0 16px',
    color: 'var(--surface-inverse)'
  },
  h2: {
    fontSize: 18,
    marginTop: 32,
    marginBottom: 8,
    color: 'var(--surface-inverse)'
  },
  p: {
    color: 'var(--fg-secondary)',
    fontSize: 15,
    lineHeight: 1.7,
    margin: '0 0 12px'
  },
  ul: {
    margin: '0 0 12px',
    paddingLeft: 20,
    color: 'var(--fg-secondary)'
  },
  ol: {
    margin: '0 0 12px',
    paddingLeft: 20,
    color: 'var(--fg-secondary)'
  },
  li: {
    fontSize: 15,
    lineHeight: 1.7,
    marginBottom: 6
  },
  link: {
    color: 'var(--accent-primary)',
    fontWeight: 600
  }
};
