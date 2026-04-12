import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
})

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

export const billSchema = z.object({
  amount: z.number().positive('El importe debe ser positivo'),
  description: z.string().optional(),
  issueDate: z.string().optional(),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  householdId: z.string().min(1, 'El hogar es requerido'),
  attachmentUrl: z.string().optional(),
  notes: z.string().optional(),
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

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type BillInput = z.infer<typeof billSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type HouseholdInput = z.infer<typeof householdSchema>
export type JoinHouseholdInput = z.infer<typeof joinHouseholdSchema>
export type ChatMessageInput = z.infer<typeof chatMessageSchema>
