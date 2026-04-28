import { createContext } from 'react';

export interface AuthContextValue {
  isAuthenticated: boolean;
  setAuthenticated: (val: boolean) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
