export interface IPharmacist {
  id: string;
  name: string;
  phoneNumber?: string;
}

export interface IUser {
  _id: string;
  email: string;
  fullName: string;
  role: string;
  phoneNumber?: string;
  companyName?: string;
  companyLogo?: string;
  primaryColor?: string;
}

export interface IPatient {
  id: string;
  userId: string;
  pharmacistName: string;
  fullName: string;
  age: number;
  address: string;
  phoneNumber: string;
  /** @legacy kept for reading pre-form-builder records */
  prescriptions: string[];
  /** @legacy kept for reading pre-form-builder records */
  appointmentDates: string[];
  notes: string;
  customFields: Record<string, unknown>;
  formSnapshot?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ICustomFieldDef {
  _id?: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'file' | 'dropdown';
  required: boolean;
  description: string;
  options?: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResult {
  message: string;
}

export interface VerifyEmailPayload {
  token: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
}

export interface CreatePatientPayload {
  fullName: string;
  age: number;
  phoneNumber: string;
  pharmacistName: string;
  address?: string;
  notes?: string;
  customFields?: Record<string, unknown>;
}

export type UpdatePatientPayload = Partial<CreatePatientPayload>;

export interface FileMetadata {
  url: string;
  publicId: string;
  /** Original filename — stored client-side, not returned by backend */
  name: string;
}

export interface PaginatedPatients {
  patients: IPatient[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface OnboardingSteps {
  profileComplete: boolean;
  firstPharmacistAdded: boolean;
  formBuilt: boolean;
  firstPatientAdded: boolean;
}

export interface OnboardingStatus {
  allComplete: boolean;
  steps: OnboardingSteps;
}
