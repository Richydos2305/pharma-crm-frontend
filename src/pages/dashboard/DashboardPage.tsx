import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys';
import { listPatients } from '../../api/patients';
import { getMe } from '../../api/users';
import { AppLayout } from '../../components/layout/AppLayout';
import type { IPatient } from '../../types';

function patientInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const AVATAR_COLORS = ['#7D6B3D', '#5c6b8a', '#5c6b4a', '#6b5c3e', '#4a5c6b', '#5b4f6b'];

function avatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: user } = useQuery({ queryKey: queryKeys.me, queryFn: getMe, staleTime: Infinity, gcTime: Infinity });
  const { data: patients = [], isLoading } = useQuery({
    queryKey: queryKeys.patients.all,
    queryFn: () => listPatients(),
    gcTime: 15 * 60 * 1000
  });

  const recentPatients = [...patients].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);
  const total = patients.length;
  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  const mobileTopBar = (
    <div className="mobile-topbar">
      <span className="mobile-topbar-title">{user?.companyName ?? 'PharmaPRS'}</span>
      <div className="mobile-topbar-avatar">
        {user?.companyLogo ? (
          <img src={user.companyLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
        ) : user?.fullName ? (
          patientInitials(user.fullName)
        ) : (
          'U'
        )}
      </div>
    </div>
  );

  return (
    <AppLayout mobileTopBar={mobileTopBar}>
      <p className="mobile-welcome">
        {getGreeting()}, {firstName} 👋
      </p>
      <h1 className="page-title">Dashboard</h1>

      {/* Mobile stats */}
      <div className="mobile-stats">
        <div className="mobile-stat-card">
          <div className="mobile-stat-value">{total}</div>
          <div className="mobile-stat-label">Total Patients</div>
        </div>
        <div className="mobile-stat-card">
          <div className="mobile-stat-value">{recentPatients.length}</div>
          <div className="mobile-stat-label">Recent</div>
        </div>
      </div>

      {/* Desktop stats */}
      <div className="stats-row">
        <div className="stat-card">
          <p className="stat-label">Total Patients</p>
          <p className="stat-value">{isLoading ? '—' : total}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Recent Patients</p>
          <p className="stat-value">{isLoading ? '—' : recentPatients.length}</p>
        </div>
        <div className="stat-card stat-action">
          <button className="btn-primary" style={{ marginTop: 0 }} onClick={() => navigate('/patients/new')}>
            + Add New Patient
          </button>
          <button className="btn-outline" onClick={() => navigate('/patients')}>
            View All Patients
          </button>
        </div>
      </div>

      <div className="recent-header">
        <h2>Recent Patients</h2>
        <span className="view-all-link" onClick={() => navigate('/patients')}>
          View all →
        </span>
      </div>

      {isLoading ? (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      ) : recentPatients.length === 0 ? (
        <div className="empty-state">
          <p>No patients yet.</p>
        </div>
      ) : (
        <div className="patient-cards-grid">
          {recentPatients.map((p: IPatient, i) => (
            <div className="patient-card" key={p.id}>
              <div className="patient-card-top">
                <div className="avatar" style={{ background: avatarColor(i) }}>
                  {patientInitials(p.fullName)}
                </div>
                <div>
                  <div className="patient-name">{p.fullName}</div>
                  <div className="patient-age">Age {p.age}</div>
                </div>
              </div>
              {p.appointmentDates?.length > 0 && (
                <div className="appt-row">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Last appointment: {formatDate(p.appointmentDates[p.appointmentDates.length - 1])}
                </div>
              )}
              {p.pharmacistName && (
                <div className="attended-row">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <polyline points="16 11 18 13 22 9" />
                  </svg>
                  Attended to by {p.pharmacistName}
                </div>
              )}
              <button className="btn-outline" onClick={() => navigate(`/patients/${p.id}`)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                View Patient
              </button>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
