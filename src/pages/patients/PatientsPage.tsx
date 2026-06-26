import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys';
import { listPatients } from '../../api/patients';
import { listPharmacists } from '../../api/pharmacists';
import { getMe } from '../../api/users';
import { AppLayout } from '../../components/layout/AppLayout';
import { getLastAppointmentDate } from '../../components/schemaFormUtils';
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

type SortKey = 'recent' | 'oldest' | 'updated' | 'name-asc' | 'name-desc' | 'age-asc' | 'age-desc';
type AgeFilter = 'all' | 'under30' | '30-50' | '51-70' | 'over71';
type LastApptFilter = 'any' | 'last7' | 'last14' | 'last30' | 'last3months' | 'custom';
type DateRegFilter = 'any' | 'last7' | 'last14' | 'last30' | 'last3months' | 'custom';

const SORT_LABELS: Record<SortKey, string> = {
  recent: 'Newest first',
  oldest: 'Oldest first',
  updated: 'Recently updated',
  'name-asc': 'Name A – Z',
  'name-desc': 'Name Z – A',
  'age-asc': 'Age (youngest first)',
  'age-desc': 'Age (oldest first)'
};

const AGE_LABELS: Record<AgeFilter, string> = {
  all: 'All Ages',
  under30: 'Under 30',
  '30-50': '30 – 50',
  '51-70': '51 – 70',
  over71: '71+'
};

const DATE_PRESET_LABELS: Record<Exclude<LastApptFilter, 'custom'>, string> = {
  any: 'Any time',
  last7: 'Last 7 days',
  last14: 'Last 14 days',
  last30: 'Last 30 days',
  last3months: 'Last 3 months'
};

const PRESET_MS: Record<Exclude<LastApptFilter, 'any' | 'custom'>, number> = {
  last7: 7 * 86400000,
  last14: 14 * 86400000,
  last30: 30 * 86400000,
  last3months: 90 * 86400000
};

const PAGE_SIZE = 20;

export function PatientsPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [pendingSort, setPendingSort] = useState<SortKey>('recent');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('all');
  const [pendingAge, setPendingAge] = useState<AgeFilter>('all');

  const [lastApptFilter, setLastApptFilter] = useState<LastApptFilter>('any');
  const [lastApptFrom, setLastApptFrom] = useState('');
  const [lastApptTo, setLastApptTo] = useState('');
  const [pendingLastAppt, setPendingLastAppt] = useState<LastApptFilter>('any');
  const [pendingLastApptFrom, setPendingLastApptFrom] = useState('');
  const [pendingLastApptTo, setPendingLastApptTo] = useState('');

  const [dateRegFilter, setDateRegFilter] = useState<DateRegFilter>('any');
  const [dateRegFrom, setDateRegFrom] = useState('');
  const [dateRegTo, setDateRegTo] = useState('');
  const [pendingDateReg, setPendingDateReg] = useState<DateRegFilter>('any');
  const [pendingDateRegFrom, setPendingDateRegFrom] = useState('');
  const [pendingDateRegTo, setPendingDateRegTo] = useState('');

  const [pharmacistFilter, setPharmacistFilter] = useState<string[]>([]);
  const [pendingPharmacist, setPendingPharmacist] = useState<string[]>([]);

  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [isSortApplied, setIsSortApplied] = useState(false);
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
  }, [search, sortKey, ageFilter, lastApptFilter, lastApptFrom, lastApptTo, dateRegFilter, dateRegFrom, dateRegTo, pharmacistFilter]);

  // Close sort dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Sync pending state when opening the filter drawer
  function openFilter() {
    setPendingAge(ageFilter);
    setPendingLastAppt(lastApptFilter);
    setPendingLastApptFrom(lastApptFrom);
    setPendingLastApptTo(lastApptTo);
    setPendingDateReg(dateRegFilter);
    setPendingDateRegFrom(dateRegFrom);
    setPendingDateRegTo(dateRegTo);
    setPendingPharmacist(pharmacistFilter);
    setFilterOpen(true);
    setSortOpen(false);
  }

  function applyFilter() {
    setAgeFilter(pendingAge);
    setLastApptFilter(pendingLastAppt);
    setLastApptFrom(pendingLastApptFrom);
    setLastApptTo(pendingLastApptTo);
    setDateRegFilter(pendingDateReg);
    setDateRegFrom(pendingDateRegFrom);
    setDateRegTo(pendingDateRegTo);
    setPharmacistFilter(pendingPharmacist);
    setFilterOpen(false);
  }

  function clearFilter() {
    setPendingAge('all');
    setPendingLastAppt('any');
    setPendingLastApptFrom('');
    setPendingLastApptTo('');
    setPendingDateReg('any');
    setPendingDateRegFrom('');
    setPendingDateRegTo('');
    setPendingPharmacist([]);
    setAgeFilter('all');
    setLastApptFilter('any');
    setLastApptFrom('');
    setLastApptTo('');
    setDateRegFilter('any');
    setDateRegFrom('');
    setDateRegTo('');
    setPharmacistFilter([]);
    setFilterOpen(false);
  }

  function applySort() {
    setSortKey(pendingSort);
    setIsSortApplied(true);
    setSortOpen(false);
  }

  function clearSort() {
    setPendingSort('recent');
    setSortKey('recent');
    setIsSortApplied(false);
    setSortOpen(false);
  }

  function togglePharmacist(name: string) {
    setPendingPharmacist((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  function isDateInRange(dateStr: string, from: string, to: string): boolean {
    const d = new Date(dateStr).getTime();
    if (from && d < new Date(from).getTime()) return false;
    if (to && d > new Date(to + 'T23:59:59').getTime()) return false;
    return true;
  }

  const filtered = useMemo(() => {
    return patients
      .filter((p: IPatient) => {
        const q = search.toLowerCase();
        if (q && !p.fullName.toLowerCase().includes(q) && !p.phoneNumber?.toLowerCase().includes(q)) return false;

        if (ageFilter === 'under30' && p.age >= 30) return false;
        if (ageFilter === '30-50' && (p.age < 30 || p.age > 50)) return false;
        if (ageFilter === '51-70' && (p.age < 51 || p.age > 70)) return false;
        if (ageFilter === 'over71' && p.age < 71) return false;

        if (lastApptFilter !== 'any') {
          const lastAppt = getLastAppointmentDate(p);
          if (!lastAppt) return false;
          if (lastApptFilter === 'custom') {
            if (!isDateInRange(lastAppt, lastApptFrom, lastApptTo)) return false;
          } else {
            const diffMs = referenceTime - new Date(lastAppt).getTime();
            if (diffMs > PRESET_MS[lastApptFilter]) return false;
          }
        }

        if (dateRegFilter !== 'any') {
          if (dateRegFilter === 'custom') {
            if (!isDateInRange(p.createdAt, dateRegFrom, dateRegTo)) return false;
          } else {
            const diffMs = referenceTime - new Date(p.createdAt).getTime();
            if (diffMs > PRESET_MS[dateRegFilter]) return false;
          }
        }

        if (pharmacistFilter.length > 0 && !p.pharmacistName.some((n) => pharmacistFilter.includes(n))) return false;

        return true;
      })
      .sort((a: IPatient, b: IPatient) => {
        if (sortKey === 'name-asc') return a.fullName.localeCompare(b.fullName);
        if (sortKey === 'name-desc') return b.fullName.localeCompare(a.fullName);
        if (sortKey === 'age-asc') return a.age - b.age;
        if (sortKey === 'age-desc') return b.age - a.age;
        if (sortKey === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortKey === 'updated') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [
    patients,
    search,
    ageFilter,
    lastApptFilter,
    lastApptFrom,
    lastApptTo,
    dateRegFilter,
    dateRegFrom,
    dateRegTo,
    pharmacistFilter,
    sortKey,
    referenceTime
  ]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const lastApptActive = lastApptFilter !== 'any' || !!lastApptFrom || !!lastApptTo;
  const dateRegActive = dateRegFilter !== 'any' || !!dateRegFrom || !!dateRegTo;
  const activeCount = (ageFilter !== 'all' ? 1 : 0) + (lastApptActive ? 1 : 0) + (dateRegActive ? 1 : 0) + (pharmacistFilter.length > 0 ? 1 : 0);
  const filterActive = activeCount > 0;

  const pendingLastApptActive = pendingLastAppt !== 'any' || !!pendingLastApptFrom || !!pendingLastApptTo;
  const pendingDateRegActive = pendingDateReg !== 'any' || !!pendingDateRegFrom || !!pendingDateRegTo;
  const pendingActiveCount =
    (pendingAge !== 'all' ? 1 : 0) + (pendingLastApptActive ? 1 : 0) + (pendingDateRegActive ? 1 : 0) + (pendingPharmacist.length > 0 ? 1 : 0);
  const sortActive = isSortApplied;

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
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="toolbar-right">
          {/* Filter button */}
          <button
            className={`btn-ghost${filterActive ? ' btn-active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}
            onClick={openFilter}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filter{activeCount > 0 ? ` · ${activeCount}` : ''}
          </button>

          {/* Sort dropdown */}
          <div className="dropdown-wrap" ref={sortRef}>
            <button
              className={`btn-ghost${sortActive ? ' btn-active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}
              onClick={() => {
                setPendingSort(sortKey);
                setSortOpen((o) => !o);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="21" y1="10" x2="7" y2="10" />
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="21" y1="14" x2="3" y2="14" />
                <line x1="21" y1="18" x2="7" y2="18" />
              </svg>
              Sort{sortActive ? `: ${SORT_LABELS[sortKey]}` : ''}
            </button>
            <div className={`dropdown-panel sort-dropdown${sortOpen ? ' open' : ''}`}>
              <p className="dropdown-section-title">Sort By</p>
              <div className="dropdown-options">
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <button
                    key={key}
                    className={`dropdown-option sort-option${pendingSort === key ? ' selected' : ''}`}
                    onClick={() => setPendingSort(key)}
                  >
                    {SORT_LABELS[key]}
                    <span className={`radio-square${pendingSort === key ? ' checked' : ''}`} />
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

      {/* Filter drawer overlay */}
      <div className={`filter-overlay${filterOpen ? ' open' : ''}`} onClick={() => setFilterOpen(false)} />

      {/* Filter drawer */}
      <div className={`filter-drawer${filterOpen ? ' open' : ''}`}>
        <div className="filter-drawer-header">
          <div className="filter-drawer-title">
            Filters
            {pendingActiveCount > 0 && <span className="filter-active-badge">{pendingActiveCount} active</span>}
          </div>
          <button className="filter-close-btn" onClick={() => setFilterOpen(false)} aria-label="Close filters">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="filter-drawer-body">
          {/* AGE GROUP */}
          <section className="filter-section">
            <p className="filter-section-label">Age Group</p>
            <div className="filter-pills">
              {(Object.keys(AGE_LABELS) as AgeFilter[])
                .filter((k) => k !== 'all')
                .map((key) => (
                  <button
                    key={key}
                    className={`filter-pill${pendingAge === key ? ' active' : ''}`}
                    onClick={() => setPendingAge(pendingAge === key ? 'all' : key)}
                  >
                    {AGE_LABELS[key]}
                  </button>
                ))}
            </div>
          </section>

          <div className="filter-divider" />

          {/* LAST APPOINTMENT */}
          <section className="filter-section">
            <p className="filter-section-label">Last Appointment</p>
            <div className="filter-pills">
              {(Object.keys(DATE_PRESET_LABELS) as Array<keyof typeof DATE_PRESET_LABELS>).map((key) => (
                <button
                  key={key}
                  className={`filter-pill${pendingLastAppt === key ? ' active' : ''}`}
                  onClick={() => {
                    setPendingLastAppt(key);
                    setPendingLastApptFrom('');
                    setPendingLastApptTo('');
                  }}
                >
                  {DATE_PRESET_LABELS[key]}
                </button>
              ))}
            </div>
            <div className="filter-date-range">
              <div>
                <label>From</label>
                <input
                  type="date"
                  value={pendingLastApptFrom}
                  onChange={(e) => {
                    setPendingLastApptFrom(e.target.value);
                    if (e.target.value) setPendingLastAppt('custom');
                  }}
                />
              </div>
              <div>
                <label>To</label>
                <input
                  type="date"
                  value={pendingLastApptTo}
                  onChange={(e) => {
                    setPendingLastApptTo(e.target.value);
                    if (e.target.value) setPendingLastAppt('custom');
                  }}
                />
              </div>
            </div>
          </section>

          <div className="filter-divider" />

          {/* DATE REGISTERED */}
          <section className="filter-section">
            <p className="filter-section-label">Date Registered</p>
            <div className="filter-pills">
              {(Object.keys(DATE_PRESET_LABELS) as Array<keyof typeof DATE_PRESET_LABELS>).map((key) => (
                <button
                  key={key}
                  className={`filter-pill${pendingDateReg === key ? ' active' : ''}`}
                  onClick={() => {
                    setPendingDateReg(key);
                    setPendingDateRegFrom('');
                    setPendingDateRegTo('');
                  }}
                >
                  {DATE_PRESET_LABELS[key]}
                </button>
              ))}
            </div>
            <div className="filter-date-range">
              <div>
                <label>From</label>
                <input
                  type="date"
                  value={pendingDateRegFrom}
                  onChange={(e) => {
                    setPendingDateRegFrom(e.target.value);
                    if (e.target.value) setPendingDateReg('custom');
                  }}
                />
              </div>
              <div>
                <label>To</label>
                <input
                  type="date"
                  value={pendingDateRegTo}
                  onChange={(e) => {
                    setPendingDateRegTo(e.target.value);
                    if (e.target.value) setPendingDateReg('custom');
                  }}
                />
              </div>
            </div>
          </section>

          <div className="filter-divider" />

          {/* PHARMACIST */}
          <section className="filter-section">
            <p className="filter-section-label">Pharmacist</p>
            <p className="filter-section-sub">Select one or more to narrow results</p>
            <div className="filter-pills">
              <button className={`filter-pill${pendingPharmacist.length === 0 ? ' active' : ''}`} onClick={() => setPendingPharmacist([])}>
                All Pharmacists
              </button>
              {pharmacists.map((ph: IPharmacist) => (
                <button
                  key={ph.id}
                  className={`filter-pill${pendingPharmacist.includes(ph.name) ? ' active' : ''}`}
                  onClick={() => togglePharmacist(ph.name)}
                >
                  {ph.name}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="filter-drawer-footer">
          <button className="btn-ghost" onClick={clearFilter}>
            Reset
          </button>
          <button className="btn-save" onClick={applyFilter}>
            Apply Filters
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          {search || filterActive ? (
            <p>No patients match your search or filters.</p>
          ) : (
            <>
              <p className="empty-state-headline">No patients yet</p>
              <p className="empty-state-body">
                Patients are the core of PharmaCRM — store prescriptions, appointment dates, and notes all in one place.
              </p>
              <button className="btn-primary" style={{ width: 'auto', marginTop: 0 }} onClick={() => navigate('/patients/new')}>
                + Add your first patient
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="patient-cards-grid">
            {paginated.map((p: IPatient, i: number) => {
              const lastAppt = getLastAppointmentDate(p);
              return (
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
                  {lastAppt && (
                    <div className="appt-row">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Last appointment: {formatDate(lastAppt)}
                    </div>
                  )}
                  {p.pharmacistName.length > 0 && (
                    <div className="attended-row">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <polyline points="16 11 18 13 22 9" />
                      </svg>
                      Attended to by {p.pharmacistName[p.pharmacistName.length - 1]}
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
              );
            })}
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
