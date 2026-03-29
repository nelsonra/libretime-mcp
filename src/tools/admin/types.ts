import { z } from 'zod'

export const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  role: z.string(),
})
export type User = z.infer<typeof UserSchema>

export const ShowHostSchema = z.object({
  id: z.number(),
  show: z.number(),
  user: z.number(),
})
export type ShowHost = z.infer<typeof ShowHostSchema>
