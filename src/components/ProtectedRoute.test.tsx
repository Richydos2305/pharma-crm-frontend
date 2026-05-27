import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { AuthProvider } from '../context/AuthProvider';
import { ProtectedRoute } from './ProtectedRoute';

afterEach(() => {
  localStorage.clear();
});

function renderProtectedRoute(authenticated: boolean) {
  if (authenticated) {
    localStorage.setItem('accessToken', 'test-token');
  }

  const router = createMemoryRouter(
    [
      {
        path: '/protected',
        element: (
          <AuthProvider>
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          </AuthProvider>
        )
      },
      {
        path: '/login',
        element: <div>Login Page</div>
      }
    ],
    { initialEntries: ['/protected'] }
  );

  render(<RouterProvider router={router} />);

  return router;
}

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

describe('ProtectedRoute', () => {
  it('should render children when the user is authenticated', () => {
    renderProtectedRoute(true);

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to /login when the user is not authenticated', () => {
    renderProtectedRoute(false);

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should redirect using replace so the user cannot navigate back to the protected route', () => {
    const router = renderProtectedRoute(false);

    expect(router.state.historyAction).toBe('REPLACE');
    expect(router.state.location.pathname).toBe('/login');
  });
});
