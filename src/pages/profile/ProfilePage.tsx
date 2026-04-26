import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, updateMe } from '../../api/users';
import { logout } from '../../api/auth';
import { AppLayout } from '../../components/layout/AppLayout';

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export function ProfilePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: user, isLoading } = useQuery({ queryKey: ['me'], queryFn: getMe });

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState(false);
  const [pharmacyError, setPharmacyError] = useState('');

  const updateMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setEditing(false);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to save changes.');
    },
  });

  function startEdit() {
    setFullName(user?.fullName ?? '');
    setEmail(user?.email ?? '');
    setPhoneNumber(user?.phoneNumber ?? '');
    setError('');
    setEditing(true);
  }

  function startEditPharmacy() {
    setCompanyName(user?.companyName ?? '');
    setPharmacyError('');
    setEditingPharmacy(true);
  }

  async function handleSavePharmacy(e: React.FormEvent) {
    e.preventDefault();
    setPharmacyError('');
    setSaveLoading(true);
    try {
      await updateMutation.mutateAsync({ companyName });
      setEditingPharmacy(false);
    } catch {
      // error handled in mutation onError
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaveLoading(true);
    try {
      await updateMutation.mutateAsync({ fullName, phoneNumber });
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleSignOut() {
    const refreshToken = localStorage.getItem('refreshToken') ?? '';
    try { await logout(refreshToken); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  }

  const userInitials = user?.fullName ? initials(user.fullName) : 'U';
  const companyInitials = user?.companyName ? initials(user.companyName) : 'P';
  const roleLabel = !user?.role || user.role === 'pharmacist' ? 'Owner' : user.role.charAt(0).toUpperCase() + user.role.slice(1);

  const mobileTopBar = (
    <div className="mobile-topbar">
      <span className="mobile-topbar-title">My Profile</span>
      <button className="btn-save" style={{ padding: '6px 12px', fontSize: 13 }} onClick={handleSignOut}>Sign Out</button>
    </div>
  );

  if (isLoading) {
    return (
      <AppLayout mobileTopBar={mobileTopBar}>
        <div className="spinner-wrap"><div className="spinner" /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout mobileTopBar={mobileTopBar}>
      {/* Mobile header */}
      <div className="mobile-profile-header">
        <div className="avatar-lg">{userInitials}</div>
        <div style={{ fontFamily: "'Funnel Sans', system-ui, sans-serif", fontSize: 18, fontWeight: 700 }}>
          {user?.fullName}
        </div>
        <span className="profile-badge">{roleLabel}</span>
      </div>

      {/* Desktop hero */}
      <div className="profile-hero">
        <div className="avatar-lg">{userInitials}</div>
        <div>
          <div style={{ fontFamily: "'Funnel Sans', system-ui, sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            {user?.fullName}
          </div>
          <span className="profile-badge">{roleLabel}</span>
        </div>
      </div>

      <div className="profile-cards-row">
        {/* Personal card */}
        <div className="card" id="profile-personal-card">
          <div className="card-header">
            <h3>Personal Information</h3>
            {editing ? (
              <div className="profile-edit-actions">
                <span className="edit-link" onClick={() => setEditing(false)}>Cancel</span>
                <button
                  className="btn-save"
                  style={{ padding: '6px 16px', fontSize: 13 }}
                  onClick={handleSave}
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <span className="edit-link" onClick={startEdit}>Edit</span>
            )}
          </div>

          {editing ? (
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {error && <div className="error-banner">{error}</div>}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" value={email} disabled style={{ opacity: 0.6 }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Phone Number</label>
                <input className="form-input" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="card-body">
              <div className="field-row">
                <span className="field-label">Full Name</span>
                <span className="field-value">{user?.fullName ?? '—'}</span>
              </div>
              <div className="field-row">
                <span className="field-label">Email Address</span>
                <span className="field-value">{user?.email ?? '—'}</span>
              </div>
              <div className="field-row">
                <span className="field-label">Phone Number</span>
                <span className="field-value">{user?.phoneNumber ?? '—'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Pharmacy details card */}
        <div className="card">
          <div className="card-header">
            <h3>Pharmacy Details</h3>
            {editingPharmacy ? (
              <div className="profile-edit-actions">
                <span className="edit-link" onClick={() => setEditingPharmacy(false)}>Cancel</span>
                <button
                  className="btn-save"
                  style={{ padding: '6px 16px', fontSize: 13 }}
                  onClick={handleSavePharmacy}
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <span className="edit-link" onClick={startEditPharmacy}>Edit</span>
            )}
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <span className="field-label" style={{ display: 'block', marginBottom: 4 }}>Company Logo</span>
              <div className="logo-upload-row">
                <div className="logo-preview">
                  {user?.companyLogo ? (
                    <img src={user.companyLogo} alt="Logo" />
                  ) : (
                    companyInitials
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button className="upload-btn" type="button" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="16 16 12 12 8 16"/>
                      <line x1="12" y1="12" x2="12" y2="21"/>
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                    </svg>
                    Upload Logo
                  </button>
                  <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Coming soon</span>
                </div>
              </div>
            </div>
            {editingPharmacy ? (
              <>
                {pharmacyError && <div className="error-banner">{pharmacyError}</div>}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Pharmacy Name</label>
                  <input className="form-input" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
              </>
            ) : (
              <div className="field-row" style={{ paddingTop: 0 }}>
                <span className="field-label">Pharmacy Name</span>
                <span className="field-value">{user?.companyName ?? '—'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
