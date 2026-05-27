import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../context/AuthProvider';
import { useAuth } from '../../context/useAuthHook';
import { login, resendVerification } from '../../api/auth';
import { LoginPage } from './LoginPage';

vi.mock('../../api/auth', () => ({
  login: vi.fn(),
  resendVerification: vi.fn()
}));

const mockedLogin = vi.mocked(login);
const mockedResendVerification = vi.mocked(resendVerification);

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

// Reads auth state from the same AuthProvider — rendered on /dashboard after nav
function AuthStateDisplay() {
  const { isAuthenticated } = useAuth();
  return <span data-testid="auth-state">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</span>;
}

function renderLoginPage(locationState?: { message: string }) {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <LoginPage /> },
      {
        path: '/dashboard',
        element: (
          <>
            <div>Dashboard</div>
            <AuthStateDisplay />
          </>
        )
      }
    ],
    { initialEntries: [{ pathname: '/login', state: locationState ?? null }] }
  );

  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );

  return router;
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('LoginPage — rendering', () => {
  it('should render the email input, password input, and Sign In button', () => {
    renderLoginPage();

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
  });

  it('should render a success banner with the message passed through location state', () => {
    renderLoginPage({ message: 'Registration successful! Please sign in.' });

    expect(screen.getByText('Registration successful! Please sign in.')).toBeInTheDocument();
  });

  it('should not render an error banner on initial load', () => {
    renderLoginPage();

    expect(document.querySelector('.error-banner')).toBeNull();
  });
});

// ─── Form interaction ─────────────────────────────────────────────────────────

describe('LoginPage — form interaction', () => {
  it('should toggle the password field between "password" and "text" type when the visibility button is clicked', async () => {
    renderLoginPage();
    const user = userEvent.setup();
    const passwordInput = screen.getByLabelText(/^password$/i);

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: /toggle password visibility/i }));
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: /toggle password visibility/i }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should disable the Sign In button and show "Signing in..." while the request is in flight', async () => {
    mockedLogin.mockImplementation(() => new Promise(() => {})); // never resolves

    renderLoginPage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'secret');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in\.\.\./i })).toBeDisabled();
    });
  });
});

// ─── Successful login ─────────────────────────────────────────────────────────

describe('LoginPage — successful login', () => {
  it('should save accessToken and refreshToken to localStorage on success', async () => {
    mockedLogin.mockResolvedValue({ accessToken: 'acc-token', refreshToken: 'ref-token' });

    renderLoginPage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'secret');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBe('acc-token');
      expect(localStorage.getItem('refreshToken')).toBe('ref-token');
    });
  });

  it('should call setAuthenticated(true) on success', async () => {
    mockedLogin.mockResolvedValue({ accessToken: 'acc-token', refreshToken: 'ref-token' });

    renderLoginPage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'secret');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated');
    });
  });

  it('should navigate to /dashboard on success', async () => {
    mockedLogin.mockResolvedValue({ accessToken: 'acc-token', refreshToken: 'ref-token' });

    renderLoginPage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'secret');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
});

// ─── Failed login — generic error ────────────────────────────────────────────

describe('LoginPage — failed login (generic error)', () => {
  it('should display the error message from response.data.message', async () => {
    mockedLogin.mockRejectedValue({
      response: { data: { message: 'Account suspended.', error: { code: 'ACCOUNT_SUSPENDED' } } }
    });

    renderLoginPage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'secret');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByText('Account suspended.')).toBeInTheDocument();
    });
  });

  it('should fall back to "Invalid email or password." when no message is in the response', async () => {
    mockedLogin.mockRejectedValue({ response: { data: {} } });

    renderLoginPage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
    });
  });
});

// ─── Failed login — EMAIL_NOT_VERIFIED ───────────────────────────────────────

describe('LoginPage — EMAIL_NOT_VERIFIED', () => {
  it('should show "Your email address has not been verified yet." as the error message', async () => {
    mockedLogin.mockRejectedValue({
      response: { data: { error: { code: 'EMAIL_NOT_VERIFIED' } } }
    });

    renderLoginPage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'secret');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByText('Your email address has not been verified yet.')).toBeInTheDocument();
    });
  });

  it('should show a "Resend verification email" button only for EMAIL_NOT_VERIFIED errors', async () => {
    mockedLogin.mockRejectedValue({
      response: { data: { error: { code: 'EMAIL_NOT_VERIFIED' } } }
    });

    renderLoginPage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'secret');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument();
    });
  });
});

// ─── Resend verification ──────────────────────────────────────────────────────

describe('LoginPage — resend verification', () => {
  it('should call resendVerification with the entered email when the resend button is clicked', async () => {
    mockedLogin.mockRejectedValue({
      response: { data: { error: { code: 'EMAIL_NOT_VERIFIED' } } }
    });
    mockedResendVerification.mockResolvedValue(undefined);

    renderLoginPage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'secret');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    await waitFor(() => screen.getByRole('button', { name: /resend verification email/i }));
    await user.click(screen.getByRole('button', { name: /resend verification email/i }));

    await waitFor(() => {
      expect(mockedResendVerification).toHaveBeenCalledWith({ email: 'user@example.com' });
    });
  });

  it('should replace the resend button with a confirmation message after a successful resend', async () => {
    mockedLogin.mockRejectedValue({
      response: { data: { error: { code: 'EMAIL_NOT_VERIFIED' } } }
    });
    mockedResendVerification.mockResolvedValue(undefined);

    renderLoginPage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'secret');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    await waitFor(() => screen.getByRole('button', { name: /resend verification email/i }));
    await user.click(screen.getByRole('button', { name: /resend verification email/i }));

    await waitFor(() => {
      expect(screen.getByText('Verification email sent. Check your inbox.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /resend verification email/i })).not.toBeInTheDocument();
    });
  });

  it('should silently ignore a resendVerification failure without showing an error to the user', async () => {
    mockedLogin.mockRejectedValue({
      response: { data: { error: { code: 'EMAIL_NOT_VERIFIED' } } }
    });
    mockedResendVerification.mockRejectedValue(new Error('Network error'));

    renderLoginPage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'secret');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    await waitFor(() => screen.getByRole('button', { name: /resend verification email/i }));
    await user.click(screen.getByRole('button', { name: /resend verification email/i }));

    await waitFor(() => {
      expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument();
    });
  });
});
