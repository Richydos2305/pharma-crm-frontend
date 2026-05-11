import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys';
import { listPatients } from '../../api/patients';
import { listPharmacists } from '../../api/pharmacists';
import { getMe } from '../../api/users';
import { AppLayout } from '../../components/layout/AppLayout';
import type { IPatient, IPharmacist } from '../../types';

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

const AVATAR_COLORS = ['#7D6B3D', '#5c6b8a', '#5c6b4a', '#6b5c3e', '#4a5c6b', '#5b4f6b'];
function avatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

type SortKey = 'recent' | 'oldest' | 'name-asc' | 'name-desc' | 'age-asc' | 'age-desc';
type AgeFilter = 'all' | 'under30' | '30-50' | '50-70' | 'over70';
type LastApptFilter = 'any' | 'last7' | 'last30' | 'last3months';

const SORT_LABELS: Record<SortKey, string> = {
  recent: 'Most Recent',
  oldest: 'Oldest First',
  'name-asc': 'Name A – Z',
  'name-desc': 'Name Z – A',
  'age-asc': 'Age (Youngest)',
  'age-desc': 'Age (Oldest)'
};

const AGE_LABELS: Record<AgeFilter, string> = {
  all: 'All Ages',
  under30: 'Under 30',
  '30-50': '30 – 50',
  '50-70': '50 – 70',
  over70: 'Over 70'
};

const LAST_APPT_LABELS: Record<LastApptFilter, string> = {
  any: 'Any Time',
  last7: 'Last 7 days',
  last30: 'Last 30 days',
  last3months: 'Last 3 months'
};

const PAGE_SIZE = 20;

export function PatientsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [pendingSort, setPendingSort] = useState<SortKey>('recent');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('all');
  const [pendingAge, setPendingAge] = useState<AgeFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [lastApptFilter, setLastApptFilter] = useState<LastApptFilter>('any');
  const [pendingLastAppt, setPendingLastAppt] = useState<LastApptFilter>('any');
  const [pharmacistFilter, setPharmacistFilter] = useState('');
  const [pendingPharmacist, setPendingPharmacist] = useState('');

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [referenceTime, setReferenceTime] = useState(0);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: queryKeys.patients.all,
    queryFn: () => listPatients(),
    gcTime: 15 * 60 * 1000
  });

  const { data: pharmacists = [] } = useQuery({
    queryKey: queryKeys.pharmacists,
    queryFn: listPharmacists,
    gcTime: 30 * 60 * 1000
  });

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReferenceTime(Date.now());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search, sortKey, ageFilter, lastApptFilter, pharmacistFilter]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function applyFilter() {
    setAgeFilter(pendingAge);
    setLastApptFilter(pendingLastAppt);
    setPharmacistFilter(pendingPharmacist);
    setFilterOpen(false);
  }
  function clearFilter() {
    setPendingAge('all');
    setAgeFilter('all');
    setPendingLastAppt('any');
    setLastApptFilter('any');
    setPendingPharmacist('');
    setPharmacistFilter('');
    setFilterOpen(false);
  }
  function applySort() {
    setSortKey(pendingSort);
    setSortOpen(false);
  }
  function clearSort() {
    setPendingSort('recent');
    setSortKey('recent');
    setSortOpen(false);
  }

  const filtered = useMemo(() => {
    return patients
      .filter((p: IPatient) => {
        const q = search.toLowerCase();
        if (q && !p.fullName.toLowerCase().includes(q) && !p.phoneNumber?.toLowerCase().includes(q)) return false;
        if (ageFilter === 'under30' && p.age >= 30) return false;
        if (ageFilter === '30-50' && (p.age < 30 || p.age > 50)) return false;
        if (ageFilter === '50-70' && (p.age < 50 || p.age > 70)) return false;
        if (ageFilter === 'over70' && p.age <= 70) return false;
        if (lastApptFilter !== 'any') {
          const lastAppt = p.appointmentDates.length > 0 ? p.appointmentDates[p.appointmentDates.length - 1] : null;
          if (!lastAppt) return false;
          const diffMs = referenceTime - new Date(lastAppt).getTime();
          if (lastApptFilter === 'last7' && diffMs > 7 * 86400000) return false;
          if (lastApptFilter === 'last30' && diffMs > 30 * 86400000) return false;
          if (lastApptFilter === 'last3months' && diffMs > 90 * 86400000) return false;
        }
        if (pharmacistFilter && p.pharmacistName !== pharmacistFilter) return false;
        return true;
      })
      .sort((a: IPatient, b: IPatient) => {
        if (sortKey === 'name-asc') return a.fullName.localeCompare(b.fullName);
        if (sortKey === 'name-desc') return b.fullName.localeCompare(a.fullName);
        if (sortKey === 'age-asc') return a.age - b.age;
        if (sortKey === 'age-desc') return b.age - a.age;
        if (sortKey === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [patients, search, ageFilter, lastApptFilter, pharmacistFilter, sortKey, referenceTime]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const filterActive = ageFilter !== 'all' || lastApptFilter !== 'any' || pharmacistFilter !== '';
  const sortActive = sortKey !== 'recent';

  const { data: user } = useQuery({ queryKey: queryKeys.me, queryFn: getMe, staleTime: Infinity, gcTime: Infinity });

  const mobileTopBar = (
    <div className="mobile-topbar">
      <span className="mobile-topbar-title">Patients</span>
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
      <div className="form-page-header">
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          Patients
        </h1>
        <span className="badge-count">{isLoading ? '…' : `${patients.length} total`}</span>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder="Search patients by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="toolbar-right">
          {/* Filter dropdown */}
          <div className="dropdown-wrap" ref={filterRef}>
            <button
              className={`btn-ghost${filterActive ? ' btn-active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}
              onClick={() => {
                setFilterOpen((o) => !o);
                setSortOpen(false);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filter
            </button>
            <div className={`dropdown-panel${filterOpen ? ' open' : ''}`}>
              <p className="dropdown-section-title">Age Group</p>
              <div className="dropdown-options">
                {(Object.keys(AGE_LABELS) as AgeFilter[]).map((key) => (
                  <button key={key} className={`dropdown-option${pendingAge === key ? ' selected' : ''}`} onClick={() => setPendingAge(key)}>
                    <span className="radio-dot" />
                    {AGE_LABELS[key]}
                  </button>
                ))}
              </div>

              <p className="dropdown-section-title">Last Appointment</p>
              <div className="dropdown-options">
                {(Object.keys(LAST_APPT_LABELS) as LastApptFilter[]).map((key) => (
                  <button
                    key={key}
                    className={`dropdown-option${pendingLastAppt === key ? ' selected' : ''}`}
                    onClick={() => setPendingLastAppt(key)}
                  >
                    <span className="radio-dot" />
                    {LAST_APPT_LABELS[key]}
                  </button>
                ))}
              </div>

              <p className="dropdown-section-title">Pharmacist</p>
              <div className="dropdown-options">
                <button className={`dropdown-option${pendingPharmacist === '' ? ' selected' : ''}`} onClick={() => setPendingPharmacist('')}>
                  <span className="radio-dot" />
                  All Pharmacists
                </button>
                {pharmacists.map((ph: IPharmacist) => (
                  <button
                    key={ph.id}
                    className={`dropdown-option${pendingPharmacist === ph.name ? ' selected' : ''}`}
                    onClick={() => setPendingPharmacist(ph.name)}
                  >
                    <span className="radio-dot" />
                    {ph.name}
                  </button>
                ))}
              </div>

              <div className="dropdown-footer">
                <button className="btn-ghost" onClick={clearFilter}>
                  Clear
                </button>
                <button className="btn-save" onClick={applyFilter}>
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Sort dropdown */}
          <div className="dropdown-wrap" ref={sortRef}>
            <button
              className={`btn-ghost${sortActive ? ' btn-active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}
              onClick={() => {
                setSortOpen((o) => !o);
                setFilterOpen(false);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="21" y1="10" x2="7" y2="10" />
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="21" y1="14" x2="3" y2="14" />
                <line x1="21" y1="18" x2="7" y2="18" />
              </svg>
              Sort
            </button>
            <div className={`dropdown-panel${sortOpen ? ' open' : ''}`}>
              <p className="dropdown-section-title">Sort By</p>
              <div className="dropdown-options">
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <button key={key} className={`dropdown-option${pendingSort === key ? ' selected' : ''}`} onClick={() => setPendingSort(key)}>
                    <span className="radio-dot" />
                    {SORT_LABELS[key]}
                  </button>
                ))}
              </div>
              <div className="dropdown-footer">
                <button className="btn-ghost" onClick={clearSort}>
                  Clear
                </button>
                <button className="btn-save" onClick={applySort}>
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>{search ? 'No patients match your search.' : 'No patients yet.'}</p>
          {!search && (
            <button className="btn-primary" style={{ width: 'auto', marginTop: 0 }} onClick={() => navigate('/patients/new')}>
              Add your first patient
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="patient-cards-grid">
            {paginated.map((p: IPatient, i: number) => (
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
          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn-ghost" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                ← Prev
              </button>
              <span className="pagination-info">
                Page {page} of {totalPages}
              </span>
              <button className="btn-ghost" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
