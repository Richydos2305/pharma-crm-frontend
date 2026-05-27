import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { apiClient } from './client';

const BASE = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:5000';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

// ─── Request interceptor ──────────────────────────────────────────────────────

describe('request interceptor', () => {
  it('should attach Authorization: Bearer <token> when an access token exists in localStorage', async () => {
    localStorage.setItem('accessToken', 'my-access-token');
    let capturedAuth: string | null = null;

    server.use(
      http.get(`${BASE}/api/test`, ({ request }) => {
        capturedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ data: 'ok' });
      })
    );

    await apiClient.get('/api/test');

    expect(capturedAuth).toBe('Bearer my-access-token');
  });

  it('should not attach an Authorization header when no access token is in localStorage', async () => {
    let capturedAuth: string | null = 'sentinel';

    server.use(
      http.get(`${BASE}/api/test`, ({ request }) => {
        capturedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ data: 'ok' });
      })
    );

    await apiClient.get('/api/test');

    expect(capturedAuth).toBeNull();
  });
});

// ─── Response interceptor — success pass-through ──────────────────────────────

describe('response interceptor — success', () => {
  it('should return the response unchanged for a successful request', async () => {
    server.use(
      http.get(`${BASE}/api/test`, () => {
        return HttpResponse.json({ data: 'hello' }, { status: 200 });
      })
    );

    const response = await apiClient.get('/api/test');

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ data: 'hello' });
  });
});

// ─── Response interceptor — 401 with refresh token present ───────────────────

describe('response interceptor — 401 with refresh token', () => {
  const successRefreshHandler = http.post(`${BASE}/api/auth/refresh`, () =>
    HttpResponse.json({ data: { accessToken: 'new-access', refreshToken: 'new-refresh' } })
  );

  it('should call the refresh endpoint with the stored refresh token on a 401 response', async () => {
    localStorage.setItem('refreshToken', 'old-refresh');
    let refreshBody: unknown;
    let callCount = 0;

    server.use(
      http.get(`${BASE}/api/protected`, () => {
        callCount++;
        return callCount === 1 ? HttpResponse.json({}, { status: 401 }) : HttpResponse.json({ data: 'ok' });
      }),
      http.post(`${BASE}/api/auth/refresh`, async ({ request }) => {
        refreshBody = await request.json();
        return HttpResponse.json({ data: { accessToken: 'new-access', refreshToken: 'new-refresh' } });
      })
    );

    await apiClient.get('/api/protected');

    expect(refreshBody).toEqual({ token: 'old-refresh' });
  });

  it('should save the new access and refresh tokens to localStorage after a successful refresh', async () => {
    localStorage.setItem('refreshToken', 'old-refresh');
    let callCount = 0;

    server.use(
      http.get(`${BASE}/api/protected`, () => {
        callCount++;
        return callCount === 1 ? HttpResponse.json({}, { status: 401 }) : HttpResponse.json({ data: 'ok' });
      }),
      successRefreshHandler
    );

    await apiClient.get('/api/protected');

    expect(localStorage.getItem('accessToken')).toBe('new-access');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
  });

  it('should retry the original request with the new access token in the Authorization header', async () => {
    localStorage.setItem('refreshToken', 'old-refresh');
    let callCount = 0;
    let retryAuth: string | null = null;

    server.use(
      http.get(`${BASE}/api/protected`, ({ request }) => {
        callCount++;
        if (callCount === 1) return HttpResponse.json({}, { status: 401 });
        retryAuth = request.headers.get('Authorization');
        return HttpResponse.json({ data: 'ok' });
      }),
      successRefreshHandler
    );

    await apiClient.get('/api/protected');

    expect(retryAuth).toBe('Bearer new-access');
  });

  it('should return the retried request response to the original caller', async () => {
    localStorage.setItem('refreshToken', 'old-refresh');
    let callCount = 0;

    server.use(
      http.get(`${BASE}/api/protected`, () => {
        callCount++;
        return callCount === 1 ? HttpResponse.json({}, { status: 401 }) : HttpResponse.json({ data: 'success-after-refresh' });
      }),
      successRefreshHandler
    );

    const response = await apiClient.get('/api/protected');

    expect(response.data).toEqual({ data: 'success-after-refresh' });
  });
});

// ─── Response interceptor — concurrent 401s ───────────────────────────────────

describe('response interceptor — concurrent 401s', () => {
  it('should only make one refresh call when multiple requests receive a 401 simultaneously', async () => {
    localStorage.setItem('refreshToken', 'old-refresh');
    let refreshCallCount = 0;
    let reqACount = 0;
    let reqBCount = 0;

    server.use(
      http.get(`${BASE}/api/resource-a`, () => {
        reqACount++;
        return reqACount === 1 ? HttpResponse.json({}, { status: 401 }) : HttpResponse.json({ data: 'a' });
      }),
      http.get(`${BASE}/api/resource-b`, () => {
        reqBCount++;
        return reqBCount === 1 ? HttpResponse.json({}, { status: 401 }) : HttpResponse.json({ data: 'b' });
      }),
      http.post(`${BASE}/api/auth/refresh`, () => {
        refreshCallCount++;
        return HttpResponse.json({ data: { accessToken: 'new-access', refreshToken: 'new-refresh' } });
      })
    );

    await Promise.all([apiClient.get('/api/resource-a'), apiClient.get('/api/resource-b')]);

    expect(refreshCallCount).toBe(1);
  });
});

// ─── Response interceptor — refresh fails ────────────────────────────────────

describe('response interceptor — refresh fails', () => {
  it('should remove both tokens from localStorage when the refresh call fails', async () => {
    localStorage.setItem('accessToken', 'old-access');
    localStorage.setItem('refreshToken', 'old-refresh');

    server.use(
      http.get(`${BASE}/api/protected`, () => HttpResponse.json({}, { status: 401 })),
      http.post(`${BASE}/api/auth/refresh`, () => HttpResponse.json({}, { status: 401 }))
    );

    await apiClient.get('/api/protected').catch(() => {});

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('should reject with the original 401 error when the refresh call fails', async () => {
    localStorage.setItem('refreshToken', 'old-refresh');

    server.use(
      http.get(`${BASE}/api/protected`, () => HttpResponse.json({}, { status: 401 })),
      http.post(`${BASE}/api/auth/refresh`, () => HttpResponse.json({}, { status: 401 }))
    );

    await expect(apiClient.get('/api/protected')).rejects.toMatchObject({
      response: { status: 401 }
    });
  });
});

// ─── Response interceptor — no refresh token ─────────────────────────────────

describe('response interceptor — no refresh token', () => {
  it('should not call the refresh endpoint when no refresh token is in localStorage', async () => {
    let refreshCalled = false;

    server.use(
      http.get(`${BASE}/api/protected`, () => HttpResponse.json({}, { status: 401 })),
      http.post(`${BASE}/api/auth/refresh`, () => {
        refreshCalled = true;
        return HttpResponse.json({ data: { accessToken: 'new', refreshToken: 'new-refresh' } });
      })
    );

    await apiClient.get('/api/protected').catch(() => {});

    expect(refreshCalled).toBe(false);
  });

  it('should reject with the original error when no refresh token is available', async () => {
    server.use(http.get(`${BASE}/api/protected`, () => HttpResponse.json({}, { status: 401 })));

    await expect(apiClient.get('/api/protected')).rejects.toMatchObject({
      response: { status: 401 }
    });
  });
});

// ─── Response interceptor — retry guard ──────────────────────────────────────

describe('response interceptor — retry guard', () => {
  it('should not attempt a second refresh if the retried request also returns a 401', async () => {
    localStorage.setItem('refreshToken', 'old-refresh');
    let refreshCallCount = 0;

    server.use(
      http.get(`${BASE}/api/protected`, () => HttpResponse.json({}, { status: 401 })),
      http.post(`${BASE}/api/auth/refresh`, () => {
        refreshCallCount++;
        return HttpResponse.json({ data: { accessToken: 'new-access', refreshToken: 'new-refresh' } });
      })
    );

    await apiClient.get('/api/protected').catch(() => {});

    expect(refreshCallCount).toBe(1);
  });
});

// ─── Response interceptor — non-401 errors ───────────────────────────────────

describe('response interceptor — non-401 errors', () => {
  it('should reject with the error unchanged for non-401 error responses', async () => {
    server.use(http.get(`${BASE}/api/protected`, () => HttpResponse.json({ message: 'Server error' }, { status: 500 })));

    await expect(apiClient.get('/api/protected')).rejects.toMatchObject({
      response: { status: 500 }
    });
  });
});
