import { z } from 'zod'

export const PlaylistSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  length: z.string().nullable(),
  owner: z.number().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
}).passthrough()
export type Playlist = z.infer<typeof PlaylistSchema>

export const PlaylistContentSchema = z.object({
  id: z.number(),
  kind: z.number().describe('0=File, 1=Stream, 2=Block'),
  position: z.number().nullable(),
  offset: z.number(),
  length: z.string().nullable(),
  cue_in: z.string().nullable(),
  cue_out: z.string().nullable(),
  fade_in: z.string().nullable(),
  fade_out: z.string().nullable(),
  playlist: z.number().nullable(),
  file: z.number().nullable(),
  stream: z.number().nullable(),
}).passthrough()
export type PlaylistContent = z.infer<typeof PlaylistContentSchema>
