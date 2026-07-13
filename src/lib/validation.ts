import { z } from 'zod'

export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^(?:\+263|0)\d{9}$/, 'Enter a valid Zimbabwe phone number')

export const clientInfoSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: phoneSchema,
  email: z.string().email('Invalid email').optional().or(z.literal('')),
})

export const bookingSchema = z.object({
  workerId: z.string().min(1, 'Worker is required'),
  clientName: z.string().min(2, 'Your name is required'),
  clientPhone: phoneSchema,
  clientWhatsapp: phoneSchema,
  clientEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  startDate: z.string().min(1, 'Start date is required'),
  workType: z.enum(['live-in', 'daily', 'part-time', 'temporary'], { message: 'Please select a work type' }),
  street: z.string().min(1, 'Street address is required'),
  suburb: z.string().min(1, 'Suburb is required'),
  city: z.string().default('Harare'),
  requirements: z.object({
    cooking: z.boolean().default(false),
    childcare: z.boolean().default(false),
    elderlyCare: z.boolean().default(false),
    pets: z.boolean().default(false),
    driving: z.boolean().default(false),
    languages: z.array(z.string()).default([]),
  }),
  placementFee: z.number().min(0),
})

export type BookingFormSchema = z.infer<typeof bookingSchema>

export const workerSearchSchema = z.object({
  category: z.string().optional(),
  suburb: z.string().optional(),
  workType: z.string().optional(),
  minRating: z.number().min(1).max(5).optional(),
  skills: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
})

export type WorkerSearchSchema = z.infer<typeof workerSearchSchema>
