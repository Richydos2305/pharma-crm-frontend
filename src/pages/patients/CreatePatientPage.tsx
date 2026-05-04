import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys';
import { createPatient } from '../../api/patients';
import { listPharmacists } from '../../api/pharmacists';
import { AppLayout } from '../../components/layout/AppLayout';
import { PatientForm, type PatientFormValues } from '../../components/PatientForm';

export function CreatePatientPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: pharmacists = [] } = useQuery({
    queryKey: queryKeys.pharmacists,
    queryFn: listPharmacists,
    gcTime: 30 * 60 * 1000
  });

  const mutation = useMutation({
    mutationFn: (values: PatientFormValues) =>
      createPatient({
        fullName: values.fullName,
        age: Number(values.age),
        phoneNumber: values.phoneNumber,
        address: values.address,
        pharmacistName: values.pharmacistName,
        prescriptions: values.prescriptions.map(({ text }) => text),
        appointmentDates: values.appointmentDate ? [values.appointmentDate] : [],
        ...(values.notes ? { notes: values.notes } : {}),
        customFields: Object.fromEntries(values.customFields.filter((f) => f.name).map((f) => [f.name, f.value]))
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      navigate('/patients');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to create patient.');
    }
  });

  async function handleSubmit(values: PatientFormValues) {
    setError('');
    await mutation.mutateAsync(values);
  }

  const mobileTopBar = (
    <div className="mobile-topbar">
      <button className="mobile-back-btn" onClick={() => navigate('/patients')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span className="mobile-topbar-title">New Patient</span>
      <div style={{ width: 24 }} />
    </div>
  );

  return (
    <AppLayout mobileTopBar={mobileTopBar}>
      <h1 className="page-title">New Patient</h1>
      <PatientForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/patients')}
        pharmacists={pharmacists}
        submitLabel="Save Patient"
        loading={mutation.isPending}
        error={error}
      />
    </AppLayout>
  );
}
