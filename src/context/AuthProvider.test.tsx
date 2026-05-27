import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuthHook';

afterEach(() => {
  localStorage.clear();
});

// ─── AuthProvider ─────────────────────────────────────────────────────────────

describe('AuthProvider', () => {
  it('should initialise isAuthenticated to false when no access token exists in localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should initialise isAuthenticated to true when an access token exists in localStorage', () => {
    localStorage.setItem('accessToken', 'test-token');

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should update isAuthenticated to true when setAuthenticated(true) is called', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    act(() => {
      result.current.setAuthenticated(true);
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should update isAuthenticated to false when setAuthenticated(false) is called', () => {
    localStorage.setItem('accessToken', 'test-token');

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    act(() => {
      result.current.setAuthenticated(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
  });
});

// ─── useAuth ──────────────────────────────────────────────────────────────────

describe('useAuth', () => {
  it('should return { isAuthenticated, setAuthenticated } when used inside AuthProvider', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    expect(result.current).toHaveProperty('isAuthenticated');
    expect(result.current).toHaveProperty('setAuthenticated');
    expect(typeof result.current.setAuthenticated).toBe('function');
  });

  it('should throw "useAuth must be used inside AuthProvider" when used outside any provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used inside AuthProvider');

    consoleError.mockRestore();
  });
});
