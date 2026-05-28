import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listPharmacists } from '../../api/pharmacists';
import { listPatients } from '../../api/patients';
import { getMe } from '../../api/users';
import { PharmacistsPage } from './PharmacistsPage';

vi.mock('../../api/pharmacists', () => ({
  listPharmacists: vi.fn(),
  createPharmacist: vi.fn(),
  updatePharmacist: vi.fn(),
  deletePharmacist: vi.fn()
}));
vi.mock('../../api/patients', () => ({ listPatients: vi.fn() }));
vi.mock('../../api/users', () => ({ getMe: vi.fn() }));

afterEach(() => {
  vi.clearAllMocks();
});

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPharmacistsPage() {
  const queryClient = createTestQueryClient();
  const router = createMemoryRouter(
    [
      {
        path: '/pharmacists',
        element: (
          <QueryClientProvider client={queryClient}>
            <PharmacistsPage />
          </QueryClientProvider>
        )
      }
    ],
    { initialEntries: ['/pharmacists'] }
  );

  const { container } = render(<RouterProvider router={router} />);
  return { container, queryClient, router };
}

beforeEach(() => {
  vi.mocked(listPharmacists).mockResolvedValue([]);
  vi.mocked(listPatients).mockResolvedValue([]);
  vi.mocked(getMe).mockResolvedValue({
    _id: 'user-1',
    email: 'test@test.com',
    fullName: 'Test User',
    role: 'admin'
  });
});

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('empty state when no pharmacists are registered', () => {
  it('should render "No pharmacists registered" headline', async () => {
    renderPharmacistsPage();

    await waitFor(() => expect(screen.getByText('No pharmacists registered')).toBeInTheDocument());
  });

  it('should render body copy containing "Add your pharmacy team"', async () => {
    renderPharmacistsPage();

    await waitFor(() => expect(screen.getByText(/Add your pharmacy team/)).toBeInTheDocument());
  });

  it('should render a "+ Add a pharmacist" button in the empty state', async () => {
    renderPharmacistsPage();

    await waitFor(() => expect(screen.getByRole('button', { name: '+ Add a pharmacist' })).toBeInTheDocument());
  });

  it('should open the Add Pharmacist modal when "+ Add a pharmacist" is clicked', async () => {
    const user = userEvent.setup();
    const { container } = renderPharmacistsPage();

    await waitFor(() => screen.getByRole('button', { name: '+ Add a pharmacist' }));
    await user.click(screen.getByRole('button', { name: '+ Add a pharmacist' }));

    expect(container.querySelector('.modal-overlay')).toHaveClass('open');
    expect(screen.getByRole('heading', { name: 'Add Pharmacist' })).toBeInTheDocument();
  });
});
