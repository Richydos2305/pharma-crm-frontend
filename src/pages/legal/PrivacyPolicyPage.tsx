const EFFECTIVE_DATE = 'July 7, 2026';

export function PrivacyPolicyPage() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.brand}>
          <div style={styles.logo}>P</div>
          <span style={styles.brandName}>PharmaPRS</span>
        </div>

        <h1 style={styles.h1}>Privacy Policy</h1>
        <p style={styles.effectiveDate}>Effective date: {EFFECTIVE_DATE}</p>

        <p style={styles.p}>
          PharmaPRS (&ldquo;PharmaPRS&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) provides a patient record management service
          for pharmacies, available on the web and as a mobile app. This Privacy Policy explains what information we collect, how we use it, and the
          choices you have. It applies to the PharmaPRS web application and the PharmaPRS mobile app.
        </p>

        <h2 style={styles.h2}>1. Who this policy covers</h2>
        <p style={styles.p}>
          PharmaPRS is used by pharmacies and their staff (&ldquo;Users&rdquo;) to manage records for the patients they serve. Two kinds of personal
          information pass through the service:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>
            <strong>User account information</strong> — belonging to the pharmacist or staff member who registers and signs in to PharmaPRS.
          </li>
          <li style={styles.li}>
            <strong>Patient record information</strong> — entered into PharmaPRS by a User on behalf of the pharmacy, about the pharmacy&rsquo;s own
            patients. Pharmacies act as the data controller for this information; PharmaPRS acts as a data processor providing the software used to
            store and manage it.
          </li>
        </ul>

        <h2 style={styles.h2}>2. Information we collect</h2>
        <p style={styles.p}>
          <strong>Account information:</strong> full name, email address, phone number, and password (stored as a secure hash, never in plain text).
        </p>
        <p style={styles.p}>
          <strong>Patient records:</strong> information entered by a User about a patient, which may include name, contact details, and health or
          medication-related information relevant to pharmacy care, along with any custom forms the pharmacy configures.
        </p>
        <p style={styles.p}>
          <strong>Usage and device information:</strong> basic technical data such as app version, device type, and general usage analytics, used to
          keep the service reliable and to fix bugs.
        </p>

        <h2 style={styles.h2}>3. How we use information</h2>
        <ul style={styles.ul}>
          <li style={styles.li}>To provide and operate the PharmaPRS service, including account authentication and record storage.</li>
          <li style={styles.li}>To sync data between the mobile app and our servers, including when the app has been used offline.</li>
          <li style={styles.li}>To communicate with Users about their account, such as verification emails or important service updates.</li>
          <li style={styles.li}>To maintain the security, integrity, and reliability of the service.</li>
          <li style={styles.li}>To improve PharmaPRS based on aggregate, non-identifying usage patterns.</li>
        </ul>
        <p style={styles.p}>We do not sell personal information, and we do not use patient record information for advertising.</p>

        <h2 style={styles.h2}>4. Offline use and syncing</h2>
        <p style={styles.p}>
          The PharmaPRS mobile app can be used without an internet connection. While offline, data you enter is stored securely on your device. As
          soon as the app detects a connection, that data is automatically synced to our servers so nothing is lost.
        </p>

        <h2 style={styles.h2}>5. How we protect information</h2>
        <ul style={styles.ul}>
          <li style={styles.li}>All data is transmitted between the app and our servers over encrypted connections (HTTPS).</li>
          <li style={styles.li}>Passwords are hashed and never stored in plain text.</li>
          <li style={styles.li}>Authentication tokens on mobile are stored in the device&rsquo;s secure, encrypted storage.</li>
          <li style={styles.li}>Access to production data is restricted to what is necessary to operate and support the service.</li>
        </ul>

        <h2 style={styles.h2}>6. Sharing of information</h2>
        <p style={styles.p}>
          We do not sell personal information. We share information only with service providers that help us operate PharmaPRS — such as database
          hosting, file storage, and transactional email delivery — and only to the extent needed for them to provide that service to us. We may also
          disclose information if required to do so by law.
        </p>

        <h2 style={styles.h2}>7. Data retention</h2>
        <p style={styles.p}>
          We retain account and patient record information for as long as the account is active, or as needed to provide the service. If you would
          like your account or associated data deleted, contact us using the details below and we will act on your request, subject to any legal or
          regulatory retention requirements.
        </p>

        <h2 style={styles.h2}>8. Your rights</h2>
        <p style={styles.p}>
          PharmaPRS currently operates in Nigeria. In line with the Nigeria Data Protection Act (NDPA) 2023, you have the right to access, correct, or
          request deletion of your personal information, and to object to certain uses of it. To exercise any of these rights, contact us at the email
          address below.
        </p>

        <h2 style={styles.h2}>9. Children&rsquo;s privacy</h2>
        <p style={styles.p}>
          PharmaPRS is intended for use by pharmacy professionals and is not directed at children. We do not knowingly collect personal information
          directly from children.
        </p>

        <h2 style={styles.h2}>10. Changes to this policy</h2>
        <p style={styles.p}>
          We may update this Privacy Policy from time to time. If we make material changes, we will update the effective date above and, where
          appropriate, notify Users through the app.
        </p>

        <h2 style={styles.h2}>11. Contact us</h2>
        <p style={styles.p}>
          If you have questions about this Privacy Policy or how your information is handled, contact us at{' '}
          <a href="mailto:pharmact26@gmail.com" style={styles.link}>
            pharmact26@gmail.com
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
    margin: '0 0 4px',
    color: 'var(--surface-inverse)'
  },
  effectiveDate: {
    color: 'var(--fg-muted)',
    fontSize: 14,
    marginBottom: 32
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
