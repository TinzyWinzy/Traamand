import { create } from 'zustand'
import type { Booking, WorkType, BookingRequirements, ClientAddress } from '../types'

interface BookingFormData {
  workerId: string
  workerName: string
  startDate: string
  workType: WorkType | null
  address: Partial<ClientAddress>
  requirements: BookingRequirements
}

const defaultRequirements: BookingRequirements = {
  cooking: false,
  childcare: false,
  elderlyCare: false,
  pets: false,
  driving: false,
  languages: [],
}

interface BookingState {
  currentBooking: Booking | null
  formData: BookingFormData
  bookings: Booking[]
  isLoading: boolean
  setCurrentBooking: (booking: Booking | null) => void
  updateFormData: (data: Partial<BookingFormData>) => void
  resetForm: () => void
  setBookings: (bookings: Booking[]) => void
  setLoading: (loading: boolean) => void
}

const defaultForm: BookingFormData = {
  workerId: '',
  workerName: '',
  startDate: '',
  workType: null,
  address: {},
  requirements: defaultRequirements,
}

export const useBookingStore = create<BookingState>((set) => ({
  currentBooking: null,
  formData: { ...defaultForm },
  bookings: [],
  isLoading: false,
  setCurrentBooking: (currentBooking) => set({ currentBooking }),
  updateFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),
  resetForm: () => set({ formData: { ...defaultForm } }),
  setBookings: (bookings) => set({ bookings }),
  setLoading: (isLoading) => set({ isLoading }),
}))
