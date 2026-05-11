import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys';
import { getPatient, updatePatient, deletePatient, uploadPatientFile } from '../../api/patients';
import { listPharmacists } from '../../api/pharmacists';
import { AppLayout } from '../../components/layout/AppLayout';
import { SchemaForm } from '../../components/SchemaForm';
import { hydrateState, hydrateFileState } from '../../components/schemaFormUtils';
import { buildDefaultTemplate } from '../../types/formBuilder';
import type { FormSchema } from '../../types/formBuilder';
import type { FileMetadata } from '../../types';
import type { FileState } from '../../components/schemaFormUtils';

export function UpdatePatientPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: patient, isLoading } = useQuery({
    queryKey: queryKeys.patients.detail(id!),
    queryFn: () => getPatient(id!),
    enabled: Boolean(id)
  });

  const { data: pharmacists = [] } = useQuery({
    queryKey: queryKeys.pharmacists,
    queryFn: listPharmacists,
    gcTime: 30 * 60 * 1000
  });

  const schema: FormSchema = useMemo(() => {
    return patient?.formSnapshot ? (patient.formSnapshot as unknown as FormSchema) : buildDefaultTemplate();
  }, [patient]);

  const initialState = useMemo(() => {
    return patient ? hydrateState(schema, patient) : undefined;
  }, [patient, schema]);

  const initialFileState = useMemo(() => {
    return patient ? hydrateFileState(schema, patient) : undefined;
  }, [patient, schema]);

  const [saving, setSaving] = useState(false);

  async function handleSubmit(payload: import('../../types').CreatePatientPayload, fileState: FileState) {
    setError('');
    setSaving(true);
    try {
      await updatePatient(id!, payload);

      // Always reconcile file fields: upload pending + preserve existing (deletions already done)
      if (Object.keys(fileState).length > 0) {
        const fileCustomFields: Record<string, FileMetadata[]> = {};
        for (const [fieldId, fState] of Object.entries(fileState)) {
          if (fState.pending.length > 0) {
            const uploaded = await Promise.all(fState.pending.map((f) => uploadPatientFile(id!, f)));
            fileCustomFields[fieldId] = [...fState.existing, ...uploaded];
          } else {
            fileCustomFields[fieldId] = fState.existing;
          }
        }
        await updatePatient(id!, {
          customFields: { ...(payload.customFields ?? {}), ...fileCustomFields }
        });
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.detail(id!) });
      navigate('/patients');
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to update patient.');
    } finally {
      setSaving(false);
    }
  }

  const deleteMutation = useMutation({
    mutationFn: () => deletePatient(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      navigate('/patients');
    }
  });

  async function handleExistingFileDeleted(fieldId: string, remaining: import('../../types').FileMetadata[]) {
    const currentCustomFields = { ...(patient?.customFields ?? {}) };
    currentCustomFields[fieldId] = remaining;
    await updatePatient(id!, { customFields: currentCustomFields });
    queryClient.invalidateQueries({ queryKey: queryKeys.patients.detail(id!) });
  }

  const mobileTopBar = (
    <div className="mobile-topbar">
      <button className="mobile-back-btn" onClick={() => navigate('/patients')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span className="mobile-topbar-title">{patient?.fullName ?? 'Patient'}</span>
      <div style={{ width: 24 }} />
    </div>
  );

  if (isLoading) {
    return (
      <AppLayout mobileTopBar={mobileTopBar}>
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      </AppLayout>
    );
  }

  if (!patient) {
    return (
      <AppLayout mobileTopBar={mobileTopBar}>
        <div className="empty-state">
          <p>Patient not found.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout mobileTopBar={mobileTopBar}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          {patient.fullName}
        </h1>
        {confirmDelete ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Are you sure?</span>
            <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
            <button className="delete-btn" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </div>
        ) : (
          <button className="delete-btn" onClick={() => setConfirmDelete(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
            Delete Patient
          </button>
        )}
      </div>

      <SchemaForm
        key={patient.id}
        schema={schema}
        initialState={initialState}
        initialFileState={initialFileState}
        pharmacists={pharmacists}
        isUpdate={true}
        onSubmit={handleSubmit}
        onExistingFileDeleted={handleExistingFileDeleted}
        onCancel={() => navigate('/patients')}
        submitLabel="Update Patient"
        loading={saving}
        error={error}
      />
    </AppLayout>
  );
}
