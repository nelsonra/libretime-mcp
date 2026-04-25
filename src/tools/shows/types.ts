import { z } from 'zod'

export const ShowSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  genre: z.string().nullable(),
  url: z.string().nullable(),
  linked: z.boolean().optional(),
  linkable: z.boolean().optional(),
  auto_playlist_enabled: z.boolean().optional(),
  auto_playlist_repeat: z.boolean().optional(),
  override_intro_playlist: z.boolean().optional(),
  override_outro_playlist: z.boolean().optional(),
}).passthrough()
export type Show = z.infer<typeof ShowSchema>

export const ShowInstanceSchema = z.object({
  id: z.number(),
  starts_at: z.string(),
  ends_at: z.string(),
  filled_time: z.string().nullable(),
  description: z.string().nullable(),
  modified: z.boolean(),
  auto_playlist_built: z.boolean(),
  show: z.number(),
  instance: z.number().nullable(),
}).passthrough()
export type ShowInstance = z.infer<typeof ShowInstanceSchema>

export const ScheduleItemSchema = z.object({
  id: z.number(),
  starts_at: z.string(),
  ends_at: z.string(),
  instance: z.number(),
  file: z.number().nullable(),
  broadcasted: z.number(),
  played: z.boolean().nullable(),
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

