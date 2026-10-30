import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('nexora_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { error?: { message?: string } })?.error?.message ?? err.message;
  }
  return 'Terjadi kesalahan.';
}
