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
  starts_at: z.string(),
  ends_at: z.string(),
  instance: z.number(),
  file: z.number().nullable(),
  broadcasted: z.number(),
  played: z.boolean(),
}).passthrough()
export type ScheduleItem = z.infer<typeof ScheduleItemSchema>

export const StreamStateSchema = z.object({
  input_main_connected: z.boolean(),
  input_main_streaming: z.boolean(),
  input_show_connected: z.boolean(),
  input_show_streaming: z.boolean(),
  schedule_streaming: z.boolean(),
})
export type StreamState = z.infer<typeof StreamStateSchema>
