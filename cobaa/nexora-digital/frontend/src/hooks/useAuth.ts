import { useContext } from 'react';
import { AuthContext } from './auth-context';
import type { AuthState } from './use-auth';
import { useProvideAuth } from './use-auth';

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export { useProvideAuth };
