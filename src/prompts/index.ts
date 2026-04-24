import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

export function register(server: McpServer) {
  server.registerPrompt('on_air_now', {
    description: 'Check what is currently on air and what is coming up next',
  }, () => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: 'What is currently on air right now, and what shows are coming up next? Use get_stream_state for the live status and get_schedule to check today\'s schedule.',
      },
    }],
  }))

  server.registerPrompt('station_status', {
    description: 'Full station overview — stream state, current schedule, and configuration',
  }, () => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: 'Give me a full status overview of the station. Check get_stream_state for what is on air, get_schedule for the upcoming schedule, and get_station_info for the station configuration.',
      },
    }],
  }))

  server.registerPrompt('show_overview', {
    description: 'Get a full overview of a specific show including upcoming instances',
    argsSchema: {
      show_name: z.string().describe('Name of the show'),
    },
  }, ({ show_name }) => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: `Give me a full overview of the show called "${show_name}". Use get_shows to find it by name, then get_show_instances to list its upcoming scheduled slots.`,
      },
    }],
  }))

  server.registerPrompt('upload_and_schedule', {
    description: 'Upload an audio file and schedule it into a show',
    argsSchema: {
      show_name: z.string().describe('Name of the show to schedule the file into'),
    },
  }, ({ show_name }) => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: `I want to upload an audio file and schedule it into the show called "${show_name}". Start by using upload_file to get the file from me. Once it is uploaded, use get_shows to find the show, get_show_instances to find the next available instance, then schedule_file to add it to the schedule.`,
      },
    }],
  }))

  server.registerPrompt('manage_playlist', {
    description: 'View or manage playlists — list all playlists or inspect a specific one',
    argsSchema: {
      playlist_name: z.string().optional().describe('Name of a specific playlist to inspect. Leave blank to list all playlists.'),
    },
  }, ({ playlist_name }) => {
    const text = playlist_name
      ? `Show me the contents of the playlist called "${playlist_name}". Use get_playlists to find it by name, then get_playlist_contents to list its tracks.`
      : 'List all playlists in the media library using get_playlists, and show the contents of each one using get_playlist_contents.'
    return {
      messages: [{ role: 'user', content: { type: 'text', text } }],
    }
  })
}
