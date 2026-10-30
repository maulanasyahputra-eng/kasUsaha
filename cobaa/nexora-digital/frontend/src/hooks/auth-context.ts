import { createContext } from 'react';
import type { AuthState } from './use-auth';

export type { AuthState };

export const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: () => undefined,
  logout: () => Promise.resolve(),
});
