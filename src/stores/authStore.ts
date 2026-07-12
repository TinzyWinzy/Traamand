import { create } from 'zustand'
import type { User } from '../types'

interface AuthState {
  user: User | null
  firebaseUser: unknown | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setFirebaseUser: (fbUser: unknown | null) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  firebaseUser: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () =>
    set({ user: null, firebaseUser: null, isAuthenticated: false, isLoading: false }),
}))
