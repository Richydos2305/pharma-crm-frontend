import { apiClient } from './client';
import type { AuthTokens, LoginPayload, RegisterPayload } from '../types';

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const { data } = await apiClient.post<{ data: AuthTokens }>('/api/auth/login', payload);
  return data.data;
}

export async function register(payload: RegisterPayload): Promise<AuthTokens> {
  const { data } = await apiClient.post<{ data: AuthTokens }>('/api/auth/register', payload);
  return data.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/api/auth/logout', { token: refreshToken });
}
