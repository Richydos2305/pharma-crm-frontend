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
