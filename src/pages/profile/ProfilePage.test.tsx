import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMe, updateMe } from '../../api/users';
import { ProfilePage } from './ProfilePage';

vi.mock('../../api/users', () => ({
  getMe: vi.fn(),
  updateMe: vi.fn(),
  uploadLogo: vi.fn()
}));
vi.mock('../../api/auth', () => ({ logout: vi.fn() }));

afterEach(() => {
  vi.clearAllMocks();
});

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderProfilePage() {
  const queryClient = createTestQueryClient();
  const router = createMemoryRouter(
    [
      { path: '/profile', element: <ProfilePage /> },
      { path: '/login', element: <div>Login Page</div> }
    ],
    { initialEntries: ['/profile'] }
  );

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

const baseUser = {
  _id: 'user-1',
  email: 'owner@test.com',
  fullName: 'Test Owner',
  role: 'admin',
  companyName: 'Acme Pharmacy',
  branches: ['Downtown', 'North Wing']
};

async function openPharmacyEditMode(user: ReturnType<typeof userEvent.setup>) {
  const card = (await screen.findByRole('heading', { name: 'Pharmacy Details' })).closest('.card') as HTMLElement;
  await user.click(within(card).getByText('Edit'));
  return within(card);
}

beforeEach(() => {
  vi.mocked(getMe).mockResolvedValue(baseUser);
});

// ─── Branch management ────────────────────────────────────────────────────────

describe('Pharmacy Details branch management', () => {
  it('should display the user’s branches in the read-only card view', async () => {
    renderProfilePage();

    const card = (await screen.findByRole('heading', { name: 'Pharmacy Details' })).closest('.card') as HTMLElement;

    expect(within(card).getByText('Downtown')).toBeInTheDocument();
    expect(within(card).getByText('North Wing')).toBeInTheDocument();
  });

  it('should show a dash placeholder when the user has no branches', async () => {
    vi.mocked(getMe).mockResolvedValue({ ...baseUser, branches: [] });
    renderProfilePage();

    const card = (await screen.findByRole('heading', { name: 'Pharmacy Details' })).closest('.card') as HTMLElement;

    expect(within(card).getByText('Branches')).toBeInTheDocument();
    expect(within(card).getByText('—')).toBeInTheDocument();
  });

  it('should list the user’s existing branches when entering edit mode', async () => {
    const user = userEvent.setup();
    renderProfilePage();

    const card = await openPharmacyEditMode(user);

    expect(card.getByText('Downtown')).toBeInTheDocument();
    expect(card.getByText('North Wing')).toBeInTheDocument();
  });

  it('should add a new branch to the list when typing a name and clicking Add', async () => {
    const user = userEvent.setup();
    renderProfilePage();

    const card = await openPharmacyEditMode(user);
    await user.type(card.getByPlaceholderText('e.g. North Wing'), 'East Wing');
    await user.click(card.getByRole('button', { name: 'Add' }));

    expect(card.getByText('East Wing')).toBeInTheDocument();
  });

  it('should not add a duplicate or blank branch', async () => {
    const user = userEvent.setup();
    renderProfilePage();

    const card = await openPharmacyEditMode(user);
    await user.type(card.getByPlaceholderText('e.g. North Wing'), 'Downtown');
    await user.click(card.getByRole('button', { name: 'Add' }));
    await user.click(card.getByRole('button', { name: 'Add' }));

    expect(card.getAllByText('Downtown')).toHaveLength(1);
  });

  it('should remove a branch when its delete button is clicked', async () => {
    const user = userEvent.setup();
    renderProfilePage();

    const card = await openPharmacyEditMode(user);
    await user.click(card.getByRole('button', { name: 'Remove Downtown' }));

    expect(card.queryByText('Downtown')).not.toBeInTheDocument();
    expect(card.getByText('North Wing')).toBeInTheDocument();
  });

  it('should include the updated branches list in the save payload', async () => {
    const user = userEvent.setup();
    vi.mocked(updateMe).mockResolvedValue({ ...baseUser, branches: ['North Wing'] });
    renderProfilePage();

    const card = await openPharmacyEditMode(user);
    await user.click(card.getByRole('button', { name: 'Remove Downtown' }));
    await user.click(card.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(updateMe).toHaveBeenCalled());
    expect(vi.mocked(updateMe).mock.calls[0][0]).toEqual({ companyName: 'Acme Pharmacy', branches: ['North Wing'] });
  });

  it('should surface the "branch still assigned" error via the pharmacy error banner', async () => {
    const user = userEvent.setup();
    vi.mocked(updateMe).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Cannot remove branch(es) still assigned to a pharmacist: Downtown' } }
    });
    renderProfilePage();

    const card = await openPharmacyEditMode(user);
    await user.click(card.getByRole('button', { name: 'Remove Downtown' }));
    await user.click(card.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(card.getByText('Cannot remove branch(es) still assigned to a pharmacist: Downtown')).toBeInTheDocument());
  });

  it('should clear the pharmacy error banner when re-entering edit mode', async () => {
    const user = userEvent.setup();
    vi.mocked(updateMe).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Cannot remove branch(es) still assigned to a pharmacist: Downtown' } }
    });
    renderProfilePage();

    let card = await openPharmacyEditMode(user);
    await user.click(card.getByRole('button', { name: 'Remove Downtown' }));
    await user.click(card.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(card.getByText('Cannot remove branch(es) still assigned to a pharmacist: Downtown')).toBeInTheDocument());

    await user.click(card.getByText('Cancel'));
    card = await openPharmacyEditMode(user);

    expect(card.queryByText('Cannot remove branch(es) still assigned to a pharmacist: Downtown')).not.toBeInTheDocument();
  });
});
