import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys';
import { getMe, updateMe, uploadLogo } from '../../api/users';
import { logout } from '../../api/auth';
import { AppLayout } from '../../components/layout/AppLayout';

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ProfilePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: user, isLoading } = useQuery({ queryKey: queryKeys.me, queryFn: getMe, staleTime: Infinity, gcTime: Infinity });

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState(false);
  const [pharmacyError, setPharmacyError] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setLogoError('');
    try {
      await uploadLogo(file);
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    } catch {
      setLogoError('Logo upload failed. Please try again.');
    } finally {
      setLogoUploading(false);
      e.target.value = '';
    }
  }

  const updateMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      setEditing(false);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to save changes.');
    }
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
    try {
      await logout(refreshToken);
    } catch {
      /* ignore */
    }
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
      <button className="btn-save" style={{ padding: '6px 12px', fontSize: 13 }} onClick={handleSignOut}>
        Sign Out
      </button>
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

  return (
    <AppLayout mobileTopBar={mobileTopBar}>
      {/* Mobile header */}
      <div className="mobile-profile-header">
        <div className="avatar-lg">
          {user?.companyLogo ? (
            <img src={user.companyLogo} alt={user?.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          ) : (
            userInitials
          )}
        </div>
        <div style={{ fontFamily: "'Funnel Sans', system-ui, sans-serif", fontSize: 18, fontWeight: 700 }}>{user?.fullName}</div>
        <span className="profile-badge">{roleLabel}</span>
      </div>

      {/* Desktop hero */}
      <div className="profile-hero">
        <div className="avatar-lg">
          {user?.companyLogo ? (
            <img src={user.companyLogo} alt={user?.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          ) : (
            userInitials
          )}
        </div>
        <div>
          <div style={{ fontFamily: "'Funnel Sans', system-ui, sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{user?.fullName}</div>
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
                <span className="edit-link" onClick={() => setEditing(false)}>
                  Cancel
                </span>
                <button className="btn-save" style={{ padding: '6px 16px', fontSize: 13 }} onClick={handleSave} disabled={saveLoading}>
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <span className="edit-link" onClick={startEdit}>
                Edit
              </span>
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
                <span className="edit-link" onClick={() => setEditingPharmacy(false)}>
                  Cancel
                </span>
                <button className="btn-save" style={{ padding: '6px 16px', fontSize: 13 }} onClick={handleSavePharmacy} disabled={saveLoading}>
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <span className="edit-link" onClick={startEditPharmacy}>
                Edit
              </span>
            )}
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {editingPharmacy ? (
              <>
                <div className="logo-section">
                  <span className="field-label">Company Logo</span>
                  <div className="logo-upload-row">
                    <div className="logo-preview">{user?.companyLogo ? <img src={user.companyLogo} alt="Logo" /> : companyInitials}</div>
                    <button className="upload-btn" type="button" onClick={() => logoInputRef.current?.click()} disabled={logoUploading}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="16 16 12 12 8 16" />
                        <line x1="12" y1="12" x2="12" y2="21" />
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                      </svg>
                      {logoUploading ? 'Uploading...' : 'Upload Logo'}
                    </button>
                    <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
                  </div>
                  {logoError && (
                    <div className="error-banner" style={{ marginTop: 6 }}>
                      {logoError}
                    </div>
                  )}
                </div>
                {pharmacyError && <div className="error-banner">{pharmacyError}</div>}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Pharmacy Name</label>
                  <input className="form-input" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
              </>
            ) : (
              <div className="pharmacy-card-top">
                <div className="logo-section">
                  <span className="field-label">Company Logo</span>
                  <div className="logo-preview">{user?.companyLogo ? <img src={user.companyLogo} alt="Logo" /> : companyInitials}</div>
                </div>
                <div className="pharmacy-name-block">
                  <span className="field-label">Pharmacy Name</span>
                  <span className="field-value">{user?.companyName ?? '—'}</span>
                </div>
              </div>
            )}

            {/* Patient Intake Form shortcut */}
            <div className="profile-intake-section">
              <div className="profile-intake-title">Patient Intake Form</div>
              <div className="profile-intake-desc">Manage the form you fill when creating patients</div>
              <button type="button" className="profile-intake-btn" onClick={() => navigate('/patients/form-builder')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
                Open Form Builder
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
