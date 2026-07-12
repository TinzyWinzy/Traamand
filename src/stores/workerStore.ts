import { create } from 'zustand'
import type { Worker, Category, ServiceCategory } from '../types'

interface WorkerState {
  workers: Worker[]
  categories: Category[]
  selectedCategory: ServiceCategory | null
  selectedWorker: Worker | null
  isLoading: boolean
  setWorkers: (workers: Worker[]) => void
  setCategories: (categories: Category[]) => void
  setSelectedCategory: (category: ServiceCategory | null) => void
  setSelectedWorker: (worker: Worker | null) => void
  setLoading: (loading: boolean) => void
}

export const useWorkerStore = create<WorkerState>((set) => ({
  workers: [],
  categories: [],
  selectedCategory: null,
  selectedWorker: null,
  isLoading: false,
  setWorkers: (workers) => set({ workers }),
  setCategories: (categories) => set({ categories }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setSelectedWorker: (selectedWorker) => set({ selectedWorker }),
  setLoading: (isLoading) => set({ isLoading }),
}))
