import { useApp } from '@modelcontextprotocol/ext-apps/react'
import { useCallback, useRef, useState } from 'react'
import type { LibreFile, Library } from '../../tools/files/types.js'

// ── Types ──────────────────────────────────────────────────────────────────────

// Which input the UI shows. Set once when ontoolresult fires.
export type Mode = 'loading' | 'file-picker' | 'url-input'

// Tracks the upload lifecycle after the user hits submit.
export type UploadState = 'idle' | 'uploading' | 'success' | 'error'

// Optional metadata fields the LLM may pre-fill or the user can type.
export interface Metadata {
  track_title: string
  artist_name: string
  album_title: string
  genre: string
}

// Shape of the JSON returned by the upload_file tool handler.
interface ToolResultData {
  status: string
  upload_url: string | null
  upload_token: string | null
  libraries?: Library[]
  file?: LibreFile
  reason?: string
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useFileUploader() {
  // Which mode the UI is in — determined by the tool result
  const [mode, setMode] = useState<Mode>('loading')

  // Upload lifecycle
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadedFile, setUploadedFile] = useState<LibreFile | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  // HTTP mode: endpoint + auth token received from the tool result
  const [uploadUrl, setUploadUrl] = useState<string | null>(null)
  const [uploadToken, setUploadToken] = useState<string | null>(null)

  // File picker mode: the File object selected by the user
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // URL input mode: the URL the user types
  const [url, setUrl] = useState('')

  // Track type libraries fetched from LibreTime
  const [libraries, setLibraries] = useState<Library[]>([])
  const [selectedLibrary, setSelectedLibrary] = useState<number | null>(null)

  // Metadata fields — pre-filled by LLM args, editable by the user
  const [metadata, setMetadata] = useState<Metadata>({
    track_title: '',
    artist_name: '',
    album_title: '',
    genre: '',
  })

  // useApp creates the App instance, registers our handlers, then calls app.connect().
  // All handlers must be registered inside onAppCreated — before connect() is called.
  const { app, error } = useApp({
    appInfo: { name: 'LibreTime File Uploader', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {

      // Fires when the LLM calls the tool — gives us the arguments it passed.
      // Use them to pre-populate form fields so the user doesn't have to retype.
      app.ontoolinput = async (input) => {
        const args = input.arguments as Partial<Metadata> | undefined
        if (!args) return
        setMetadata((prev) => ({
          track_title: args.track_title ?? prev.track_title,
          artist_name: args.artist_name ?? prev.artist_name,
          album_title: args.album_title ?? prev.album_title,
          genre: args.genre ?? prev.genre,
        }))
      }

      // Fires when the server-side tool handler returns.
      // We read upload_url to decide which mode to show:
      //   upload_url present → file-picker (HTTP server, direct upload to /upload)
      //   upload_url null    → url-input   (stdio, user provides a URL instead)
      app.ontoolresult = async (result) => {
        const text = result.content?.find((c) => c.type === 'text')?.text
        if (!text) return
        try {
          const data = JSON.parse(text) as ToolResultData

          // If the tool was called with a URL it already uploaded — go straight to success
          if (data.status === 'success' && data.file) {
            setUploadedFile(data.file)
            setUploadState('success')
            return
          }

          setUploadUrl(data.upload_url ?? null)
          setUploadToken(data.upload_token ?? null)
          setLibraries(data.libraries ?? [])
          setMode(data.upload_url ? 'file-picker' : 'url-input')
        } catch {
          // Non-JSON result — ignore, stay in loading state
        }
      }

      app.onteardown = async () => ({})
      app.onerror = console.error
    },
  })

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = e.target.files?.[0] ?? null
      setFile(picked)
      // Auto-fill track title from the filename if the field is still empty
      if (picked && !metadata.track_title) {
        const name = picked.name.replace(/\.[^.]+$/, '') // strip extension
        setMetadata((prev) => ({ ...prev, track_title: prev.track_title || name }))
      }
    },
    [metadata.track_title]
  )

  const handleMetadataChange = useCallback(
    (field: keyof Metadata) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setMetadata((prev) => ({ ...prev, [field]: e.target.value }))
      },
    []
  )

  // FILE-PICKER MODE: POST the file directly to the MCP server's /upload endpoint.
  const handleFilePick = useCallback(async () => {
    if (!file || !uploadUrl || !uploadToken) return
    setUploadState('uploading')

    try {
      const formData = new FormData()
      formData.append('file', file, file.name)
      formData.append('name', file.name)
      formData.append('mime', file.type || 'audio/mpeg')
      formData.append('size', String(file.size))
      formData.append('accessed', String(Math.floor(Date.now() / 1000)))
      for (const [key, value] of Object.entries(metadata)) {
        if (value.trim()) formData.append(key, value.trim())
      }
      if (selectedLibrary !== null) formData.append('library', String(selectedLibrary))

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'X-Upload-Token': uploadToken },
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: response.statusText }))
        const detail = (err as { detail?: string }).detail
        setErrorMsg(`${(err as { error?: string }).error ?? 'Upload failed'}${detail ? `: ${detail}` : ''}`)
        setUploadState('error')
        return
      }

      const data = await response.json() as LibreFile
      setUploadedFile(data)
      setUploadState('success')

      await app?.updateModelContext({
        content: [{ type: 'text', text: `File uploaded: "${data.track_title ?? data.name}" (ID: ${data.id})` }],
      })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
      setUploadState('error')
    }
  }, [file, uploadUrl, uploadToken, metadata, selectedLibrary, app])

  // URL INPUT MODE: call the upload_file tool directly from the UI.
  const handleUrl = useCallback(async () => {
    if (!url.trim() || !app) return
    setUploadState('uploading')

    try {
      const args: Record<string, string | number> = { url: url.trim() }
      for (const [key, value] of Object.entries(metadata)) {
        if (value.trim()) args[key] = value.trim()
      }
      if (selectedLibrary !== null) args.library = selectedLibrary

      const result = await app.callServerTool({ name: 'upload_file', arguments: args })
      const text = result.content?.find((c) => c.type === 'text')?.text ?? ''
      const data = JSON.parse(text) as ToolResultData

      if (data.status === 'success' && data.file) {
        setUploadedFile(data.file)
        setUploadState('success')
        await app.updateModelContext({
          content: [{ type: 'text', text: `File uploaded: "${data.file.track_title ?? data.file.name}" (ID: ${data.file.id})` }],
        })
      } else {
        setErrorMsg(data.reason ?? 'Upload failed')
        setUploadState('error')
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
      setUploadState('error')
    }
  }, [url, app, metadata, selectedLibrary])

  const handleReset = useCallback(() => {
    setFile(null)
    setUrl('')
    setUploadState('idle')
    setErrorMsg('')
    setUploadedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    // State
    mode,
    uploadState,
    uploadedFile,
    errorMsg,
    file,
    url,
    libraries,
    selectedLibrary,
    metadata,
    busy: uploadState === 'uploading',
    app,
    error,
    // Refs
    fileInputRef,
    // Handlers
    handleFileChange,
    handleMetadataChange,
    handleFilePick,
    handleUrl,
    handleReset,
    setUrl,
    setSelectedLibrary,
  }
}
