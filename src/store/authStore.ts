import { create } from 'zustand';
import { apiClient } from '@/services/apiClient';
import type { AuthUser, AuthResponse } from '@/types/auth.types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  initialize: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initialize() {
    const token = localStorage.getItem('taskflow:auth_token');
    const userJson = localStorage.getItem('taskflow:user');

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as AuthUser;
        set({ user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem('taskflow:auth_token');
        localStorage.removeItem('taskflow:user');
        set({ user: null, token: null, isAuthenticated: false });
      }
    } else {
      set({ user: null, token: null, isAuthenticated: false });
    }

    // Listen for global unauthorized events
    window.addEventListener('taskflow:unauthorized', () => {
      set({ user: null, token: null, isAuthenticated: false, error: 'Session expired. Please log in again.' });
    });
  },

  async login(email, password) {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
      localStorage.setItem('taskflow:auth_token', response.accessToken);
      localStorage.setItem('taskflow:user', JSON.stringify(response.user));
      set({ user: response.user, token: response.accessToken, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to log in. Please check your credentials.';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  async register(email, password, fullName) {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', { email, password, fullName });
      localStorage.setItem('taskflow:auth_token', response.accessToken);
      localStorage.setItem('taskflow:user', JSON.stringify(response.user));
      set({ user: response.user, token: response.accessToken, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Registration failed. Email may already be registered.';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  logout() {
    localStorage.removeItem('taskflow:auth_token');
    localStorage.removeItem('taskflow:user');
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  clearError() {
    set({ error: null });
  },
}));
