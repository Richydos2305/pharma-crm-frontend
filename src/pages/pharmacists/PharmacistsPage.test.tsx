import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listPharmacists, createPharmacist, updatePharmacist } from '../../api/pharmacists';
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
    role: 'admin',
    branches: ['Downtown', 'North Wing']
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

// ─── Add Pharmacist modal — branch field ─────────────────────────────────────

describe('Add Pharmacist modal branch field', () => {
  function openAddModal(container: HTMLElement) {
    const overlays = container.querySelectorAll('.modal-overlay');
    return within(overlays[0] as HTMLElement);
  }

  it('should populate the branch select with options from the current user’s branches', async () => {
    const user = userEvent.setup();
    const { container } = renderPharmacistsPage();

    await user.click(await screen.findByRole('button', { name: '+ Add a pharmacist' }));

    const modal = openAddModal(container);
    const select = modal.getByLabelText('Branch') as HTMLSelectElement;
    const optionLabels = Array.from(select.options).map((o) => o.textContent);
    expect(optionLabels).toEqual(['Select a branch', 'Downtown', 'North Wing']);
  });

  it('should submit the selected branch when saving a new pharmacist', async () => {
    const user = userEvent.setup();
    vi.mocked(createPharmacist).mockResolvedValue({ id: 'ph-1', name: 'Dr. Ada', branch: 'Downtown' });
    const { container } = renderPharmacistsPage();

    await user.click(await screen.findByRole('button', { name: '+ Add a pharmacist' }));
    const modal = openAddModal(container);
    await user.type(modal.getByLabelText('Full Name'), 'Dr. Ada');
    await user.selectOptions(modal.getByLabelText('Branch'), 'Downtown');
    await user.click(modal.getByRole('button', { name: 'Save Pharmacist' }));

    await waitFor(() => expect(createPharmacist).toHaveBeenCalledWith({ name: 'Dr. Ada', phoneNumber: undefined, branch: 'Downtown' }));
  });

  it('should surface the server’s invalid-branch error message in the modal', async () => {
    const user = userEvent.setup();
    vi.mocked(createPharmacist).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Branch "Ghost Wing" is not a valid branch for this user' } }
    });
    const { container } = renderPharmacistsPage();

    await user.click(await screen.findByRole('button', { name: '+ Add a pharmacist' }));
    const modal = openAddModal(container);
    await user.type(modal.getByLabelText('Full Name'), 'Dr. Ada');
    await user.click(modal.getByRole('button', { name: 'Save Pharmacist' }));

    await waitFor(() => expect(modal.getByText('Branch "Ghost Wing" is not a valid branch for this user')).toBeInTheDocument());
  });
});

// ─── Edit Pharmacist modal — branch field ────────────────────────────────────

describe('Edit Pharmacist modal branch field', () => {
  beforeEach(() => {
    vi.mocked(listPharmacists).mockResolvedValue([{ id: 'ph-1', name: 'Dr. Ada', phoneNumber: '0801', branch: 'North Wing' }]);
  });

  function openEditModal(container: HTMLElement) {
    const overlays = container.querySelectorAll('.modal-overlay');
    return within(overlays[1] as HTMLElement);
  }

  it('should pre-select the pharmacist’s current branch', async () => {
    const user = userEvent.setup();
    const { container } = renderPharmacistsPage();

    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    const modal = openEditModal(container);
    const select = modal.getByLabelText('Branch') as HTMLSelectElement;
    expect(select.value).toBe('North Wing');
  });

  it('should submit the updated branch when saving an edited pharmacist', async () => {
    const user = userEvent.setup();
    vi.mocked(updatePharmacist).mockResolvedValue({ id: 'ph-1', name: 'Dr. Ada', branch: 'Downtown' });
    const { container } = renderPharmacistsPage();

    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    const modal = openEditModal(container);
    await user.selectOptions(modal.getByLabelText('Branch'), 'Downtown');
    await user.click(modal.getByRole('button', { name: 'Save Pharmacist' }));

    await waitFor(() => expect(updatePharmacist).toHaveBeenCalledWith('ph-1', { name: 'Dr. Ada', phoneNumber: '0801', branch: 'Downtown' }));
  });

  it('should surface the server’s branch-still-assigned error message in the modal', async () => {
    const user = userEvent.setup();
    vi.mocked(updatePharmacist).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Cannot remove branch(es) still assigned to a pharmacist: North Wing' } }
    });
    const { container } = renderPharmacistsPage();

    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    const modal = openEditModal(container);
    await user.click(modal.getByRole('button', { name: 'Save Pharmacist' }));

    await waitFor(() => expect(modal.getByText('Cannot remove branch(es) still assigned to a pharmacist: North Wing')).toBeInTheDocument());
  });
});
