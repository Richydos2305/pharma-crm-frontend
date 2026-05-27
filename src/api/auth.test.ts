import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { login, register, logout, verifyEmail, resendVerification, forgotPassword, resetPassword } from './auth';

const BASE = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:5000';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── login ────────────────────────────────────────────────────────────────────

describe('login', () => {
  it('should POST to /api/auth/login with the supplied email and password', async () => {
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/api/auth/login`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ data: { accessToken: 'acc', refreshToken: 'ref' } });
      })
    );

    await login({ email: 'user@example.com', password: 'secret' });

    expect(capturedBody).toEqual({ email: 'user@example.com', password: 'secret' });
  });

  it('should return { accessToken, refreshToken } from data.data on success', async () => {
    server.use(http.post(`${BASE}/api/auth/login`, () => HttpResponse.json({ data: { accessToken: 'acc-token', refreshToken: 'ref-token' } })));

    const result = await login({ email: 'user@example.com', password: 'secret' });

    expect(result).toEqual({ accessToken: 'acc-token', refreshToken: 'ref-token' });
  });

  it('should reject with the axios error when the server returns an error', async () => {
    server.use(http.post(`${BASE}/api/auth/login`, () => HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })));

    await expect(login({ email: 'user@example.com', password: 'wrong' })).rejects.toMatchObject({
      response: { status: 401 }
    });
  });
});

// ─── register ─────────────────────────────────────────────────────────────────

describe('register', () => {
  it('should POST to /api/auth/register with email, password, and fullName', async () => {
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/api/auth/register`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ data: { message: 'Check your email' } });
      })
    );

    await register({ email: 'new@example.com', password: 'pass123', fullName: 'Jane Doe' });

    expect(capturedBody).toEqual({ email: 'new@example.com', password: 'pass123', fullName: 'Jane Doe' });
  });

  it('should return { message } from data.data on success', async () => {
    server.use(http.post(`${BASE}/api/auth/register`, () => HttpResponse.json({ data: { message: 'Verification email sent' } })));

    const result = await register({ email: 'new@example.com', password: 'pass123', fullName: 'Jane Doe' });

    expect(result).toEqual({ message: 'Verification email sent' });
  });

  it('should reject with the axios error when the server returns an error', async () => {
    server.use(http.post(`${BASE}/api/auth/register`, () => HttpResponse.json({ message: 'Email already in use' }, { status: 409 })));

    await expect(register({ email: 'taken@example.com', password: 'pass123', fullName: 'Jane Doe' })).rejects.toMatchObject({
      response: { status: 409 }
    });
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe('logout', () => {
  it('should POST to /api/auth/logout with { token: refreshToken }', async () => {
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/api/auth/logout`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({});
      })
    );

    await logout('my-refresh-token');

    expect(capturedBody).toEqual({ token: 'my-refresh-token' });
  });

  it('should resolve with undefined on success', async () => {
    server.use(http.post(`${BASE}/api/auth/logout`, () => HttpResponse.json({})));

    const result = await logout('my-refresh-token');

    expect(result).toBeUndefined();
  });

  it('should reject with the axios error when the server returns an error', async () => {
    server.use(http.post(`${BASE}/api/auth/logout`, () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })));

    await expect(logout('bad-token')).rejects.toMatchObject({ response: { status: 401 } });
  });
});

// ─── verifyEmail ──────────────────────────────────────────────────────────────

describe('verifyEmail', () => {
  it('should POST to /api/auth/verify-email with { token }', async () => {
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/api/auth/verify-email`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({});
      })
    );

    await verifyEmail({ token: 'verify-token-abc' });

    expect(capturedBody).toEqual({ token: 'verify-token-abc' });
  });

  it('should resolve with undefined on success', async () => {
    server.use(http.post(`${BASE}/api/auth/verify-email`, () => HttpResponse.json({})));

    const result = await verifyEmail({ token: 'verify-token-abc' });

    expect(result).toBeUndefined();
  });
});

// ─── resendVerification ───────────────────────────────────────────────────────

describe('resendVerification', () => {
  it('should POST to /api/auth/resend-verification with { email }', async () => {
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/api/auth/resend-verification`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({});
      })
    );

    await resendVerification({ email: 'user@example.com' });

    expect(capturedBody).toEqual({ email: 'user@example.com' });
  });

  it('should resolve with undefined on success', async () => {
    server.use(http.post(`${BASE}/api/auth/resend-verification`, () => HttpResponse.json({})));

    const result = await resendVerification({ email: 'user@example.com' });

    expect(result).toBeUndefined();
  });
});

// ─── forgotPassword ───────────────────────────────────────────────────────────

describe('forgotPassword', () => {
  it('should POST to /api/auth/forgot-password with { email }', async () => {
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/api/auth/forgot-password`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({});
      })
    );

    await forgotPassword({ email: 'user@example.com' });

    expect(capturedBody).toEqual({ email: 'user@example.com' });
  });

  it('should resolve with undefined on success', async () => {
    server.use(http.post(`${BASE}/api/auth/forgot-password`, () => HttpResponse.json({})));

    const result = await forgotPassword({ email: 'user@example.com' });

    expect(result).toBeUndefined();
  });
});

// ─── resetPassword ────────────────────────────────────────────────────────────

describe('resetPassword', () => {
  it('should POST to /api/auth/reset-password with { token, newPassword }', async () => {
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/api/auth/reset-password`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({});
      })
    );

    await resetPassword({ token: 'reset-token-xyz', newPassword: 'newpass123' });

    expect(capturedBody).toEqual({ token: 'reset-token-xyz', newPassword: 'newpass123' });
  });

  it('should resolve with undefined on success', async () => {
    server.use(http.post(`${BASE}/api/auth/reset-password`, () => HttpResponse.json({})));

    const result = await resetPassword({ token: 'reset-token-xyz', newPassword: 'newpass123' });

    expect(result).toBeUndefined();
  });
});
