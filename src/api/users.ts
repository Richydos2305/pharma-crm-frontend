import { apiClient } from './client';
import type { IUser } from '../types';

export async function getMe(): Promise<IUser> {
  const { data } = await apiClient.get<{ data: IUser }>('/api/users/profile');
  return data.data;
}

export async function updateMe(payload: Partial<IUser>): Promise<IUser> {
  const { data } = await apiClient.put<{ data: IUser }>('/api/users/profile', payload);
  return data.data;
}

export async function uploadLogo(file: File): Promise<IUser> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<{ data: IUser }>('/api/users/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data.data;
}
