import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys';
import { createPatient, updatePatient, uploadPatientFile } from '../../api/patients';
import { getSettings } from '../../api/settings';
import { listPharmacists } from '../../api/pharmacists';
import { getMe } from '../../api/users';
import { AppLayout } from '../../components/layout/AppLayout';
import { SchemaForm } from '../../components/SchemaForm';
import { SuccessCheck } from '../../components/SuccessCheck';
import { buildDefaultTemplate } from '../../types/formBuilder';
import type { FormSchema } from '../../types/formBuilder';
import type { FileState, RepeatableFileState } from '../../components/schemaFormUtils';

export function CreatePatientPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: user } = useQuery({ queryKey: queryKeys.me, queryFn: getMe, staleTime: Infinity, gcTime: Infinity });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: getSettings
  });

  const { data: pharmacists = [] } = useQuery({
    queryKey: queryKeys.pharmacists,
    queryFn: listPharmacists,
    gcTime: 30 * 60 * 1000
  });

  const schema: FormSchema = useMemo(() => {
    const published = settings?.formConfig?.schema;
    return published ? (published as FormSchema) : buildDefaultTemplate();
  }, [settings]);

  async function handleSubmit(payload: import('../../types').CreatePatientPayload, fileState: FileState, repFileState: RepeatableFileState) {
    setError('');
    setSaving(true);
    try {
      const patient = await createPatient(payload);

      // Upload any pending files and write metadata back to customFields
      let hasFiles = false;
      const sections = await Promise.all(
        (payload.customFields?.sections ?? []).map(async (section) => {
          const schemaSection = schema.sections.find((s) => s.id === section.name);
          if (!schemaSection) return section;

          if (schemaSection.type === 'standard') {
            const fileFields = schemaSection.fields.filter((f) => f.type === 'file');
            if (fileFields.length === 0) return section;
            const fieldsRow = { ...(section.fields[0] ?? {}) };
            for (const field of fileFields) {
              const fState = fileState[field.id];
              if (!fState || fState.pending.length === 0) continue;
              hasFiles = true;
              const uploaded = await Promise.all(fState.pending.map((f) => uploadPatientFile(patient.id, f)));
              fieldsRow[field.id] = uploaded;
            }
            return { name: section.name, fields: [fieldsRow] };
          }

          // Repeatable section
          const rowMap = repFileState[section.name];
          if (!rowMap) return section;
          const rowEntries = Object.entries(rowMap);
          if (rowEntries.length === 0) return section;
          const fields = await Promise.all(
            section.fields.map(async (rowValues, idx) => {
              const rowFileState = rowEntries[idx]?.[1] ?? {};
              const merged: Record<string, unknown> = { ...rowValues };
              for (const [fieldId, fstate] of Object.entries(rowFileState)) {
                if (fstate.pending.length > 0) {
                  hasFiles = true;
                  const uploaded = await Promise.all(fstate.pending.map((f) => uploadPatientFile(patient.id, f)));
                  merged[fieldId] = uploaded;
                }
              }
              return merged;
            })
          );
          return { name: section.name, fields };
        })
      );

      if (hasFiles) {
        await updatePatient(patient.id, { customFields: { sections } });
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
      setShowSuccess(true);
      setTimeout(() => navigate('/patients'), 700);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to create patient.');
    } finally {
      setSaving(false);
    }
  }

  const mobileTopBar = (
    <div className="mobile-topbar">
      <button className="mobile-back-btn" onClick={() => navigate('/patients')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span className="mobile-topbar-title">New Patient</span>
      <div className="mobile-topbar-avatar">
        {user?.companyLogo ? (
          <img src={user.companyLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
        ) : user?.fullName ? (
          user.fullName
            .split(' ')
            .map((w: string) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        ) : (
          'U'
        )}
      </div>
    </div>
  );

  if (settingsLoading) {
    return (
      <AppLayout mobileTopBar={mobileTopBar}>
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <SuccessCheck visible={showSuccess} />
      <AppLayout mobileTopBar={mobileTopBar}>
        <h1 className="page-title">New Patient</h1>
        <SchemaForm
          schema={schema}
          pharmacists={pharmacists}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/patients')}
          submitLabel="Save Patient"
          loading={saving}
          error={error}
        />
      </AppLayout>
    </>
  );
}
