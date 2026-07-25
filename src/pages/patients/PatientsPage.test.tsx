import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listPatients } from '../../api/patients';
import { listPharmacists } from '../../api/pharmacists';
import { getMe } from '../../api/users';
import { PatientsPage } from './PatientsPage';

vi.mock('../../api/patients', () => ({ listPatients: vi.fn() }));
vi.mock('../../api/pharmacists', () => ({ listPharmacists: vi.fn() }));
vi.mock('../../api/users', () => ({ getMe: vi.fn() }));

afterEach(() => {
  vi.clearAllMocks();
});

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPatientsPage() {
  const queryClient = createTestQueryClient();
  const router = createMemoryRouter(
    [
      {
        path: '/patients',
        element: (
          <QueryClientProvider client={queryClient}>
            <PatientsPage />
          </QueryClientProvider>
        )
      },
      { path: '/patients/new', element: <div>New Patient Page</div> }
    ],
    { initialEntries: ['/patients'] }
  );

  render(<RouterProvider router={router} />);
  return { queryClient, router };
}

beforeEach(() => {
  vi.mocked(listPatients).mockResolvedValue([]);
  vi.mocked(listPharmacists).mockResolvedValue([]);
  vi.mocked(getMe).mockResolvedValue({
    _id: 'user-1',
    email: 'test@test.com',
    fullName: 'Test User',
    role: 'admin',
    branches: ['Downtown', 'North Wing']
  });
});

// ─── Empty state — no search ──────────────────────────────────────────────────

describe('empty state when list is empty and search is empty', () => {
  it('should render "No patients yet" headline', async () => {
    renderPatientsPage();

    await waitFor(() => expect(screen.getByText('No patients yet')).toBeInTheDocument());
  });

  it('should render body copy containing "Patients are the core of PharmaCRM"', async () => {
    renderPatientsPage();

    await waitFor(() => expect(screen.getByText(/Patients are the core of PharmaCRM/)).toBeInTheDocument());
  });

  it('should render a "+ Add your first patient" button', async () => {
    renderPatientsPage();

    await waitFor(() => expect(screen.getByRole('button', { name: '+ Add your first patient' })).toBeInTheDocument());
  });

  it('should navigate to /patients/new when "+ Add your first patient" is clicked', async () => {
    const user = userEvent.setup();
    renderPatientsPage();

    await waitFor(() => screen.getByRole('button', { name: '+ Add your first patient' }));
    await user.click(screen.getByRole('button', { name: '+ Add your first patient' }));

    expect(screen.getByText('New Patient Page')).toBeInTheDocument();
  });
});

// ─── Empty state — search active ─────────────────────────────────────────────

describe('empty state when list is empty and search is active', () => {
  it('should render "No patients match your search." when search is non-empty', async () => {
    const user = userEvent.setup();
    renderPatientsPage();

    await waitFor(() => screen.getByPlaceholderText('Search by name or phone...'));
    await user.type(screen.getByPlaceholderText('Search by name or phone...'), 'john');

    await waitFor(() => expect(screen.getByText('No patients match your search or filters.')).toBeInTheDocument());
  });

  it('should not render the "No patients yet" headline when search is non-empty', async () => {
    const user = userEvent.setup();
    renderPatientsPage();

    await waitFor(() => screen.getByPlaceholderText('Search by name or phone...'));
    await user.type(screen.getByPlaceholderText('Search by name or phone...'), 'john');

    await waitFor(() => screen.getByText('No patients match your search or filters.'));
    expect(screen.queryByText('No patients yet')).not.toBeInTheDocument();
  });
});

// ─── Branch filter ────────────────────────────────────────────────────────────

describe('Branch filter', () => {
  const patients = [
    {
      id: 'p1',
      userId: 'u1',
      pharmacistName: ['Dr. Ada'],
      fullName: 'Alice Smith',
      age: 30,
      phoneNumber: '0801',
      customFields: { sections: [] },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    },
    {
      id: 'p2',
      userId: 'u1',
      pharmacistName: ['Dr. Ben'],
      fullName: 'Bob Jones',
      age: 40,
      phoneNumber: '0802',
      customFields: { sections: [] },
      createdAt: '2024-01-02',
      updatedAt: '2024-01-02'
    },
    {
      id: 'p3',
      userId: 'u1',
      pharmacistName: [],
      fullName: 'Cara Lee',
      age: 50,
      phoneNumber: '0803',
      customFields: { sections: [] },
      createdAt: '2024-01-03',
      updatedAt: '2024-01-03'
    }
  ];

  beforeEach(() => {
    vi.mocked(listPatients).mockResolvedValue(patients);
    vi.mocked(listPharmacists).mockResolvedValue([
      { id: 'ph-1', name: 'Dr. Ada', branch: 'Downtown' },
      { id: 'ph-2', name: 'Dr. Ben', branch: 'North Wing' }
    ]);
  });

  it('should render "All Branches" plus a pill for each of the current user’s branches', async () => {
    const user = userEvent.setup();
    renderPatientsPage();

    await user.click(await screen.findByRole('button', { name: 'Filter' }));

    expect(screen.getByRole('button', { name: 'All Branches' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Downtown' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'North Wing' })).toBeInTheDocument();
  });

  it('should only show patients attended by a pharmacist in the selected branch after applying', async () => {
    const user = userEvent.setup();
    renderPatientsPage();

    await waitFor(() => expect(screen.getByText('Alice Smith')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Filter' }));
    await user.click(screen.getByRole('button', { name: 'Downtown' }));
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }));

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
      expect(screen.queryByText('Cara Lee')).not.toBeInTheDocument();
    });
  });

  it('should show the active filter count on the Filter button after applying a branch filter', async () => {
    const user = userEvent.setup();
    renderPatientsPage();

    await waitFor(() => expect(screen.getByText('Alice Smith')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Filter' }));
    await user.click(screen.getByRole('button', { name: 'Downtown' }));
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Filter · 1' })).toBeInTheDocument());
  });

  it('should reset the branch filter and show all patients again when "All Branches" is clicked', async () => {
    const user = userEvent.setup();
    renderPatientsPage();

    await waitFor(() => expect(screen.getByText('Alice Smith')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Filter' }));
    await user.click(screen.getByRole('button', { name: 'Downtown' }));
    await user.click(screen.getByRole('button', { name: 'All Branches' }));
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }));

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
      expect(screen.getByText('Cara Lee')).toBeInTheDocument();
    });
  });
});
