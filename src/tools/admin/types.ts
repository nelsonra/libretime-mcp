import { z } from 'zod'

export const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().nullable(),
  role: z.string().nullable(),
}).passthrough()
export type User = z.infer<typeof UserSchema>

export const ShowHostSchema = z.object({
  id: z.number(),
  show: z.number(),
  user: z.number(),
}).passthrough()
export type ShowHost = z.infer<typeof ShowHostSchema>
