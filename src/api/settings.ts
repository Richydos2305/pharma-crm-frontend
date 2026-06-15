import { apiClient } from './client';
import type { FormSchema } from '../types/formBuilder';
import type { OnboardingStatus } from '../types';

export interface SettingsData {
  formConfig?: {
    schema?: FormSchema;
  };
  onboarding?: OnboardingStatus;
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
  const { id, name, sections } = schema;
  const payload = { formConfig: { schema: { id, name, sections } } };
  if (!hasExisting) {
    // Backend createSettings ignores req.body — create bare doc first, then set schema
    await apiClient.post('/api/settings');
  }
  await apiClient.patch('/api/settings', payload);
}
