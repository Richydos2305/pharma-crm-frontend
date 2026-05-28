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
    role: 'admin'
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

    await waitFor(() => screen.getByPlaceholderText('Search patients by name...'));
    await user.type(screen.getByPlaceholderText('Search patients by name...'), 'john');

    await waitFor(() => expect(screen.getByText('No patients match your search.')).toBeInTheDocument());
  });

  it('should not render the "No patients yet" headline when search is non-empty', async () => {
    const user = userEvent.setup();
    renderPatientsPage();

    await waitFor(() => screen.getByPlaceholderText('Search patients by name...'));
    await user.type(screen.getByPlaceholderText('Search patients by name...'), 'john');

    await waitFor(() => screen.getByText('No patients match your search.'));
    expect(screen.queryByText('No patients yet')).not.toBeInTheDocument();
  });
});
