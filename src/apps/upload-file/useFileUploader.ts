import { useApp } from '@modelcontextprotocol/ext-apps/react'
import { useCallback, useRef, useState } from 'react'
import type { LibreFile, Library } from '../../tools/files/types.js'

// ── Types ──────────────────────────────────────────────────────────────────────

export type Mode = 'loading' | 'ready'
export type UploadState = 'idle' | 'uploading' | 'success' | 'error'

export interface Metadata {
  track_title: string
  artist_name: string
  album_title: string
  genre: string
}

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
  const [mode, setMode] = useState<Mode>('loading')
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadedFile, setUploadedFile] = useState<LibreFile | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const [uploadUrl, setUploadUrl] = useState<string | null>(null)
  const [uploadToken, setUploadToken] = useState<string | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [libraries, setLibraries] = useState<Library[]>([])
  const [selectedLibrary, setSelectedLibrary] = useState<number | null>(null)

  const [metadata, setMetadata] = useState<Metadata>({
    track_title: '',
    artist_name: '',
    album_title: '',
    genre: '',
  })

  const { app, error } = useApp({
    appInfo: { name: 'LibreTime File Uploader', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
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

      app.ontoolresult = async (result) => {
        const text = result.content?.find((c) => c.type === 'text')?.text
        if (!text) return
        try {
          const data = JSON.parse(text) as ToolResultData

          if (data.status === 'success' && data.file) {
            setUploadedFile(data.file)
            setUploadState('success')
            return
          }

          setUploadUrl(data.upload_url ?? null)
          setUploadToken(data.upload_token ?? null)
          setLibraries(data.libraries ?? [])
          setMode('ready')
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
      if (picked && !metadata.track_title) {
        const name = picked.name.replace(/\.[^.]+$/, '')
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

  const handleReset = useCallback(() => {
    setFile(null)
    setUploadState('idle')
    setErrorMsg('')
    setUploadedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    mode,
    uploadState,
    uploadedFile,
    errorMsg,
    file,
    libraries,
    selectedLibrary,
    metadata,
    busy: uploadState === 'uploading',
    app,
    error,
    fileInputRef,
    handleFileChange,
    handleMetadataChange,
    handleFilePick,
    handleReset,
    setSelectedLibrary,
  }
}
