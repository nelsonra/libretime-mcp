import { z } from 'zod'

export const ListenerCountSchema = z.object({
  id: z.number(),
  listener_count: z.number(),
  timestamp: z.number(),
  mount_name: z.number(),
})
export type ListenerCount = z.infer<typeof ListenerCountSchema>

export const MountNameSchema = z.object({
  id: z.number(),
  mount_name: z.string(),
})
export type MountName = z.infer<typeof MountNameSchema>

export const PlayoutHistorySchema = z.object({
  id: z.number(),
  starts: z.string(),
  ends: z.string().nullable(),
  file: z.number().nullable(),
  instance: z.number().nullable(),
})
export type PlayoutHistory = z.infer<typeof PlayoutHistorySchema>

export const FileMetadataSchema = z.object({
  id: z.number(),
  track_title: z.string().nullable(),
  artist_name: z.string().nullable(),
  album_title: z.string().nullable(),
  genre: z.string().nullable(),
  length: z.string().nullable(),
})
export type FileMetadata = z.infer<typeof FileMetadataSchema>
