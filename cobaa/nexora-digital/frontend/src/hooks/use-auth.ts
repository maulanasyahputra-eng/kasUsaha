import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

export interface AuthState {
  user: { id: string; email: string; name: string; role: string } | null;
  loading: boolean;
  login: (token: string, user: AuthState['user']) => void;
  logout: () => Promise<void>;
}

export function useProvideAuth(): AuthState {
  const [user, setUser] = useState<AuthState['user']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nexora_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => { localStorage.removeItem('nexora_token'); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((token: string, u: AuthState['user']) => {
    localStorage.setItem('nexora_token', token);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    // Panggil backend untuk revoke sesi server-side, lalu bersihkan lokal
    try { await api.post('/auth/logout'); } catch { /* abaikan */ }
    localStorage.removeItem('nexora_token');
    setUser(null);
  }, []);

  return { user, loading, login, logout };
}
