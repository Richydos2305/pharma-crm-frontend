import { apiClient } from './client';
import type {
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  RegisterResult,
  VerifyEmailPayload,
  ResendVerificationPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload
} from '../types';

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const { data } = await apiClient.post<{ data: AuthTokens }>('/api/auth/login', payload);
  return data.data;
}

export async function register(payload: RegisterPayload): Promise<RegisterResult> {
  const { data } = await apiClient.post<{ data: RegisterResult }>('/api/auth/register', payload);
  return data.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/api/auth/logout', { token: refreshToken });
}

export async function verifyEmail(payload: VerifyEmailPayload): Promise<void> {
  await apiClient.post('/api/auth/verify-email', payload);
}

export async function resendVerification(payload: ResendVerificationPayload): Promise<void> {
  await apiClient.post('/api/auth/resend-verification', payload);
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
  await apiClient.post('/api/auth/forgot-password', payload);
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await apiClient.post('/api/auth/reset-password', payload);
}
