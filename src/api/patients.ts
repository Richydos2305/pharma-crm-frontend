import { apiClient } from './client';
import type { IPatient, CreatePatientPayload, UpdatePatientPayload } from '../types';

export interface ListPatientsParams {
  search?: string;
  sort?: string;
  age?: string;
  page?: number;
  limit?: number;
}

export async function listPatients(params?: ListPatientsParams): Promise<IPatient[]> {
  const { data } = await apiClient.get<{ data: { patients: IPatient[]; total: number } }>('/api/patients', { params });
  return data.data.patients;
}

export interface PaginatedPatientsResponse {
  patients: IPatient[];
  total: number;
  page: number;
}

export async function listPatientsPaginated(params?: ListPatientsParams): Promise<PaginatedPatientsResponse> {
  const { data } = await apiClient.get<{ data: { patients: IPatient[]; total: number; page: number } }>('/api/patients', { params });
  return { patients: data.data.patients, total: data.data.total, page: params?.page ?? 1 };
}

export async function getPatient(id: string): Promise<IPatient> {
  const { data } = await apiClient.get<{ data: IPatient }>(`/api/patients/${id}`);
  return data.data;
}

export async function createPatient(payload: CreatePatientPayload): Promise<IPatient> {
  const { data } = await apiClient.post<{ data: IPatient }>('/api/patients', payload);
  return data.data;
}

export async function updatePatient(id: string, payload: UpdatePatientPayload): Promise<IPatient> {
  const { data } = await apiClient.put<{ data: IPatient }>(`/api/patients/${id}`, payload);
  return data.data;
}

export async function deletePatient(id: string): Promise<void> {
  await apiClient.delete(`/api/patients/${id}`);
}
