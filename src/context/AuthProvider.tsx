import { type ReactNode } from 'react';
import { useState } from 'react';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(localStorage.getItem('accessToken')));

  function setAuthenticated(val: boolean) {
    setIsAuthenticated(val);
  }

  return <AuthContext value={{ isAuthenticated, setAuthenticated }}>{children}</AuthContext>;
}
