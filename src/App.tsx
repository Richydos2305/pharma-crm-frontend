import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthProvider';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { CheckEmailPage } from './pages/auth/CheckEmailPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { PatientsPage } from './pages/patients/PatientsPage';
import { CreatePatientPage } from './pages/patients/CreatePatientPage';
import { UpdatePatientPage } from './pages/patients/UpdatePatientPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { PharmacistsPage } from './pages/pharmacists/PharmacistsPage';
import { FormBuilderPage } from './pages/patients/FormBuilderPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 }
  }
});

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/check-email', element: <CheckEmailPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/patients',
    element: (
      <ProtectedRoute>
        <PatientsPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/patients/new',
    element: (
      <ProtectedRoute>
        <CreatePatientPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/patients/form-builder',
    element: (
      <ProtectedRoute>
        <FormBuilderPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/patients/:id',
    element: (
      <ProtectedRoute>
        <UpdatePatientPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/pharmacists',
    element: (
      <ProtectedRoute>
        <PharmacistsPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    )
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> }
]);

export default function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
      <Analytics />
    </>
  );
}
