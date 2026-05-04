import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys';
import { listPharmacists, createPharmacist, updatePharmacist, deletePharmacist } from '../../api/pharmacists';
import { listPatients } from '../../api/patients';
import { AppLayout } from '../../components/layout/AppLayout';
import type { IPharmacist, IPatient } from '../../types';

function pharmacistInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = ['#7D6B3D', '#5c6b8a', '#5c6b4a', '#6b5c3e', '#4a5c6b', '#5b4f6b'];
function avatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

interface PharmacistModalProps {
  open: boolean;
  title: string;
  subtitle: string;
  initialName?: string;
  initialPhone?: string;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onSave: (name: string, phoneNumber: string) => Promise<void>;
}

function PharmacistModal({ open, title, subtitle, initialName = '', initialPhone = '', loading, error, onClose, onSave }: PharmacistModalProps) {
  const [name, setName] = useState(initialName);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setPhoneNumber(initialPhone);
    }
    // Only reset when the modal opens, not on every prop change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSave(name, phoneNumber);
  }

  return (
    <div
      className={`modal-overlay${open ? ' open' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{title}</h3>
            <p className="modal-subtitle">{subtitle}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-divider" />
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && <div className="error-banner">{error}</div>}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="ph-name">
                Full Name
              </label>
              <input
                id="ph-name"
                className="form-input"
                type="text"
                placeholder="e.g. James Asante"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="ph-phone">
                Phone Number
              </label>
              <input
                id="ph-phone"
                className="form-input"
                type="tel"
                placeholder="e.g. +233 XX XXX XXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-divider" />
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save" style={{ margin: 0 }} disabled={loading}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {loading ? 'Saving...' : 'Save Pharmacist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PharmacistsPage() {
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<IPharmacist | null>(null);
  const [modalError, setModalError] = useState('');

  const { data: pharmacists = [], isLoading } = useQuery({
    queryKey: queryKeys.pharmacists,
    queryFn: listPharmacists,
    gcTime: 30 * 60 * 1000
  });
  const { data: patients = [] } = useQuery({
    queryKey: queryKeys.patients.all,
    queryFn: () => listPatients(),
    gcTime: 15 * 60 * 1000
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; phoneNumber?: string }) => createPharmacist(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pharmacists });
      setAddOpen(false);
      setModalError('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setModalError(msg ?? 'Failed to create pharmacist.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, phoneNumber }: { id: string; name: string; phoneNumber?: string }) => updatePharmacist(id, { name, phoneNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pharmacists });
      setEditTarget(null);
      setModalError('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setModalError(msg ?? 'Failed to update pharmacist.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePharmacist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pharmacists });
    }
  });

  async function handleAdd(name: string, phoneNumber: string) {
    setModalError('');
    await createMutation.mutateAsync({ name, phoneNumber: phoneNumber || undefined });
  }

  async function handleEdit(name: string, phoneNumber: string) {
    if (!editTarget) return;
    setModalError('');
    await updateMutation.mutateAsync({ id: editTarget.id, name, phoneNumber: phoneNumber || undefined });
  }

  const mobileTopBar = (
    <div className="mobile-topbar">
      <span className="mobile-topbar-title">Pharmacists</span>
      <div style={{ width: 24 }} />
    </div>
  );

  return (
    <AppLayout mobileTopBar={mobileTopBar}>
      <div className="form-page-header">
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          Pharmacists
        </h1>
        <button
          className="btn-primary"
          style={{ margin: 0 }}
          onClick={() => {
            setModalError('');
            setAddOpen(true);
          }}
        >
          + Add Pharmacist
        </button>
      </div>

      {isLoading ? (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      ) : pharmacists.length === 0 ? (
        <div className="empty-state">
          <p>No pharmacists yet.</p>
        </div>
      ) : (
        <div className="pharmacist-cards-grid">
          {pharmacists.map((ph, i) => (
            <div className="pharmacist-card" key={ph.id}>
              <div className="pharmacist-card-top">
                <div className="avatar" style={{ background: avatarColor(i) }}>
                  {pharmacistInitials(ph.name)}
                </div>
                <div className="pharmacist-info">
                  <div className="pharmacist-name">{ph.name}</div>
                  <div className="pharmacist-role">Pharmacist</div>
                </div>
              </div>
              <div className="pharmacist-card-divider" />
              <div className="pharmacist-card-bottom">
                <div className="pharmacist-patients-row">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>{patients.filter((p: IPatient) => p.pharmacistName === ph.name).length} patients attended to</span>
                </div>
                <div className="pharmacist-actions">
                  <button
                    className="btn-edit-pharm"
                    onClick={() => {
                      setModalError('');
                      setEditTarget(ph);
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>
                  <button className="btn-delete-pharm" onClick={() => deleteMutation.mutate(ph.id)} disabled={deleteMutation.isPending}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PharmacistModal
        open={addOpen}
        title="Add Pharmacist"
        subtitle="Add a new pharmacist to your team"
        loading={createMutation.isPending}
        error={modalError}
        onClose={() => {
          setAddOpen(false);
          setModalError('');
        }}
        onSave={handleAdd}
      />

      {editTarget && (
        <PharmacistModal
          key={editTarget.id}
          open={true}
          title="Edit Pharmacist"
          subtitle="Update pharmacist details"
          initialName={editTarget.name}
          initialPhone={editTarget.phoneNumber ?? ''}
          loading={updateMutation.isPending}
          error={modalError}
          onClose={() => {
            setEditTarget(null);
            setModalError('');
          }}
          onSave={handleEdit}
        />
      )}
    </AppLayout>
  );
}
