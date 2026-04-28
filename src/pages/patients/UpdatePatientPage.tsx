import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys';
import { getPatient, updatePatient, deletePatient } from '../../api/patients';
import { AppLayout } from '../../components/layout/AppLayout';
import { PatientForm, type PatientFormValues } from '../../components/PatientForm';

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

  const updateMutation = useMutation({
    mutationFn: (values: PatientFormValues) =>
      updatePatient(id!, {
        fullName: values.fullName,
        age: Number(values.age),
        phoneNumber: values.phoneNumber,
        address: values.address,
        prescriptions: values.prescriptions.map(({ text }) => text),
        appointmentDates: values.appointmentDate ? [values.appointmentDate] : [],
        ...(values.notes ? { notes: values.notes } : {}),
        customFields: Object.fromEntries(values.customFields.filter((f) => f.name).map((f) => [f.name, f.value]))
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.detail(id!) });
      navigate('/patients');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to update patient.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePatient(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      navigate('/patients');
    }
  });

  async function handleSubmit(values: PatientFormValues) {
    setError('');
    await updateMutation.mutateAsync(values);
  }

  // Build initial values from existing patient data
  const initialValues: Partial<PatientFormValues> | undefined = patient
    ? {
        fullName: patient.fullName,
        age: String(patient.age),
        phoneNumber: patient.phoneNumber,
        address: patient.address,
        pharmacistName: patient.pharmacistName ?? '',
        appointmentDate: patient.appointmentDates?.length
          ? new Date(patient.appointmentDates[patient.appointmentDates.length - 1]).toISOString().slice(0, 10)
          : '',
        notes: patient.notes,
        prescriptions: Array.isArray(patient.prescriptions) ? patient.prescriptions.map((text: string) => ({ text })) : [],
        customFields: Object.entries(patient.customFields ?? {}).map(([name, value]) => ({
          id: name,
          name,
          type: 'text' as const,
          value: String(value)
        }))
      }
    : undefined;

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

      <PatientForm
        key={patient.id}
        initialValues={initialValues}
        isUpdate={true}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/patients')}
        submitLabel="Update Patient"
        loading={updateMutation.isPending}
        error={error}
      />
    </AppLayout>
  );
}
