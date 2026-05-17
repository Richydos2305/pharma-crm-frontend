import { Body, Button, Container, Head, Html, Preview, Section, Text } from '@react-email/components';

interface ResetPasswordTemplateProps {
  fullName: string;
  resetUrl: string;
}

const FONT_STACK = "'Funnel Sans', 'Geist', system-ui, -apple-system, sans-serif";
const FONT_STACK_BODY = "'Geist', 'Funnel Sans', system-ui, -apple-system, sans-serif";

export function ResetPasswordTemplate({ fullName, resetUrl }: ResetPasswordTemplateProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Reset your PharmaPRS password</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Card */}
          <Section style={styles.card}>
            {/* Accent bar */}
            <div style={styles.accentBar} />

            {/* Greeting */}
            <Text style={styles.greeting}>Hi {fullName},</Text>

            {/* Body copy */}
            <Text style={styles.bodyCopy}>
              You requested a password reset. Click the link below to set a new password. This link expires in 1 hour.
            </Text>

            {/* CTA — full-width as per the design */}
            <Section style={styles.buttonWrapper}>
              <Button href={resetUrl} style={styles.button}>
                Reset Password
              </Button>
            </Section>

            {/* Footnote */}
            <Text style={styles.footnote}>If you did not request this, you can safely ignore this email.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: '#f5f2e9',
    margin: '0',
    padding: '96px 24px',
    fontFamily: FONT_STACK_BODY
  },
  container: {
    maxWidth: '620px',
    margin: '0 auto'
  },
  card: {
    backgroundColor: '#fefcf7',
    borderRadius: '12px',
    border: '1px solid #dcd8cb',
    padding: '40px'
  },
  accentBar: {
    backgroundColor: '#7d6b3d',
    borderRadius: '999px',
    height: '4px',
    width: '72px',
    marginBottom: '28px'
  },
  greeting: {
    fontFamily: FONT_STACK,
    fontSize: '28px',
    fontWeight: '700',
    color: '#2d2926',
    lineHeight: '1.25',
    margin: '0 0 28px 0'
  },
  bodyCopy: {
    fontFamily: FONT_STACK_BODY,
    fontSize: '16px',
    fontWeight: '400',
    color: '#4f4a44',
    lineHeight: '1.6',
    margin: '0 0 28px 0'
  },
  buttonWrapper: {
    margin: '0 0 28px 0'
  },
  button: {
    backgroundColor: '#2d2926',
    borderRadius: '10px',
    color: '#fffef8',
    fontFamily: FONT_STACK_BODY,
    fontSize: '14px',
    fontWeight: '500',
    lineHeight: '1.4286',
    padding: '12px 20px',
    textDecoration: 'none',
    display: 'block',
    textAlign: 'center',
    width: '100%',
    boxSizing: 'border-box'
  },
  footnote: {
    fontFamily: FONT_STACK_BODY,
    fontSize: '14px',
    fontWeight: '400',
    color: '#8c8782',
    lineHeight: '1.6',
    margin: '0'
  }
} satisfies Record<string, React.CSSProperties>;

export default ResetPasswordTemplate;
