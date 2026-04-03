import { z } from 'zod'

export const LibrarySchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  code: z.string(),
  enabled: z.boolean(),
})
export type Library = z.infer<typeof LibrarySchema>

export const LibreFileSchema = z.object({
  id: z.number(),
  name: z.string(),
  track_title: z.string().nullable(),
  artist_name: z.string().nullable(),
  album_title: z.string().nullable(),
  genre: z.string().nullable(),
  length: z.string().nullable(),
  mime: z.string(),
  import_status: z.number(),
  created_at: z.string().nullable(),
  last_played_at: z.string().nullable(),
})
export type LibreFile = z.infer<typeof LibreFileSchema>
