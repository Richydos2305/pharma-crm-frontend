import { apiClient } from './client';
import type { FormSchema } from '../types/formBuilder';

export interface SettingsData {
  formConfig?: {
    schema?: FormSchema;
  };
}

export async function getSettings(): Promise<SettingsData | null> {
  try {
    const { data } = await apiClient.get<{ data: SettingsData }>('/api/settings');
    return data.data;
  } catch {
    return null;
  }
}

export async function publishFormSchema(schema: FormSchema, hasExisting: boolean): Promise<void> {
  const schemaToSave: FormSchema = { ...schema, status: 'published' };
  const payload = { formConfig: { schema: schemaToSave } };
  if (!hasExisting) {
    // Backend createSettings ignores req.body — create bare doc first, then set schema
    await apiClient.post('/api/settings');
  }
  await apiClient.patch('/api/settings', payload);
}
