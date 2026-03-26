import { z } from 'zod'

export const ShowSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  genre: z.string(),
  url: z.string(),
})
export type Show = z.infer<typeof ShowSchema>

export const ScheduleItemSchema = z.object({
  id: z.number(),
  starts: z.string(),
  ends: z.string(),
  show_id: z.number(),
  show_name: z.string(),
  broadcasted: z.number(),
})
export type ScheduleItem = z.infer<typeof ScheduleItemSchema>

export const StreamStateSchema = z.object({
  source_enabled: z.boolean(),
}).passthrough()
export type StreamState = z.infer<typeof StreamStateSchema>
