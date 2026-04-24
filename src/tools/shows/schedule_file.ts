import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { libreGet, librePost } from '../../libretime.js'
import { toolText } from '../../tool-response.js'
import { ScheduleItemSchema } from './types.js'
import { LibreFileSchema } from '../files/types.js'

// LibreTime duration format: "H:MM:SS.ffffff" → milliseconds
function parseDurationMs(length: string | null): number | null {
  if (!length) return null
  const match = length.match(/^(\d+):(\d{2}):(\d{2})\.(\d+)$/)
  if (!match) return null
  const [, h, m, s, frac] = match
  const ms = Math.round(parseInt(frac.padEnd(3, '0').slice(0, 3)))
  return (parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s)) * 1000 + ms
}

export function register(server: McpServer) {
  server.tool(
    'schedule_file',
    'Schedule an uploaded file into a show instance at a specific time. ' +
    'Fetches the file duration automatically to calculate the end time. ' +
    'Use get_show_instances to find the instance ID for the show slot you want to fill.',
    {
      instance_id: z.number().describe('Show instance ID to schedule into'),
      file_id: z.number().describe('ID of the uploaded file to schedule'),
      starts_at: z.string().describe('ISO 8601 datetime for when the file should start playing'),
      position: z.number().optional().describe('Position in the show queue (defaults to 0)'),
    },
    async ({ instance_id, file_id, starts_at, position = 0 }) => {
      // Fetch file to get duration for ends_at / cue_out calculation
      const fileRaw = await libreGet(`/api/v2/files/${file_id}`)
      const file = LibreFileSchema.passthrough().parse(fileRaw)
      const length = (file as Record<string, unknown>).length as string | null

      const durationMs = parseDurationMs(length)
      if (!durationMs) {
        return toolText({
          status: 'error',
          reason: `Could not determine file duration (length: ${length ?? 'null'}). ` +
            'The file may still be processing — check import_status and try again.',
        })
      }

      const startsDate = new Date(starts_at)
      const endsDate = new Date(startsDate.getTime() + durationMs)
      const ends_at = endsDate.toISOString()
      const cue_out = length!

      const raw = await librePost('/api/v2/schedule', {
        instance: instance_id,
        file: file_id,
        starts_at,
        ends_at,
        cue_in: '0:00:00.000000',
        cue_out,
        position,
        position_status: 0,
        broadcasted: 0,
      })

      const item = ScheduleItemSchema.parse(raw)
      return toolText({ status: 'scheduled', item })
    }
  )
}
