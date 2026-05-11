import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthProvider';
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

export default function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/check-email" element={<CheckEmailPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patients"
                element={
                  <ProtectedRoute>
                    <PatientsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patients/new"
                element={
                  <ProtectedRoute>
                    <CreatePatientPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patients/form-builder"
                element={
                  <ProtectedRoute>
                    <FormBuilderPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patients/:id"
                element={
                  <ProtectedRoute>
                    <UpdatePatientPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacists"
                element={
                  <ProtectedRoute>
                    <PharmacistsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
      <Analytics />
    </>
  );
}
