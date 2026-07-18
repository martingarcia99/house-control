import { z } from 'zod'

export const billSchema = z.object({
  amount: z.number().positive('El importe debe ser positivo'),
  description: z.string().optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  householdId: z.string().min(1, 'El hogar es requerido'),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  attachmentUrl: z.string().optional(),
  notes: z.string().optional(),
})

export const recurringBillSchema = z.object({
  amount: z.number().positive('El importe debe ser positivo'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  householdId: z.string().min(1, 'El hogar es requerido'),
  dayOfMonth: z.number().int().min(1).max(28),
  dueDay: z.number().int().min(1).max(28).optional().nullable(),
  active: z.boolean().optional(),
})

export const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(50),
  icon: z.string().optional(),
  color: z.string().optional(),
  householdId: z.string().optional(),
})

export const householdSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
})

export const joinHouseholdSchema = z.object({
  inviteCode: z.string().min(1, 'El código de invitación es requerido'),
})

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'El mensaje no puede estar vacío').max(1000),
})

export type BillInput = z.infer<typeof billSchema>
export type RecurringBillInput = z.infer<typeof recurringBillSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type HouseholdInput = z.infer<typeof householdSchema>
export type JoinHouseholdInput = z.infer<typeof joinHouseholdSchema>
export type ChatMessageInput = z.infer<typeof chatMessageSchema>
