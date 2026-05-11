import { apiClient } from './client';
import type { IPatient, CreatePatientPayload, UpdatePatientPayload, FileMetadata } from '../types';

export interface ListPatientsParams {
  search?: string;
  sort?: string;
  age?: string;
}

export async function listPatients(params?: ListPatientsParams): Promise<IPatient[]> {
  const { data } = await apiClient.get<{ data: { patients: IPatient[]; total: number } }>('/api/patients', { params });
  return data.data.patients;
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

export async function uploadPatientFile(patientId: string, file: File): Promise<FileMetadata> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<{ data: { url: string; publicId: string } }>(`/api/files/upload/${patientId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return { url: data.data.url, publicId: data.data.publicId, name: file.name };
}

export async function deletePatientFile(publicId: string): Promise<void> {
  await apiClient.delete(`/api/files/${encodeURIComponent(publicId)}`);
}
