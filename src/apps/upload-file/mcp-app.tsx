import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import styles from './upload-file.module.css'
import { useFileUploader } from './useFileUploader.js'
import libreTimeIcon from '../assets/libretime-icon.svg'
import powerFmLogo from '../assets/logo_yellow_64.svg'

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <img src={libreTimeIcon} alt="LibreTime" className={styles.headerIcon} />
        <span className={styles.headerTitle}>LibreTime File Uploader</span>
      </div>
      <a
        href="https://powerfm.org"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.headerRight}
      >
        <span className={styles.poweredBy}>powered by</span>
        <img src={powerFmLogo} alt="PowerFM" className={styles.powerFmLogo} />
      </a>
    </header>
  )
}

function FileUploaderApp() {
  const {
    mode, uploadState, uploadedFile, errorMsg,
    file, libraries, selectedLibrary, metadata, busy,
    app, error, fileInputRef,
    handleFileChange, handleMetadataChange,
    handleFilePick, handleReset,
    setSelectedLibrary,
  } = useFileUploader()

  if (error) return <div className={styles.message}>Error: {error.message}</div>
  if (!app || mode === 'loading') return <div className={styles.message}>Loading…</div>

  if (uploadState === 'success' && uploadedFile) {
    return (
      <div className={styles.wrapper}>
        <Header />
        <div className={styles.container}>
          <div className={styles.successIcon}>✓</div>
          <p className={styles.successLabel}>Uploaded successfully</p>
          <dl className={styles.fileDetails}>
            <dt>Title</dt><dd>{uploadedFile.track_title ?? uploadedFile.name}</dd>
            {uploadedFile.artist_name && <><dt>Artist</dt><dd>{uploadedFile.artist_name}</dd></>}
            {uploadedFile.album_title && <><dt>Album</dt><dd>{uploadedFile.album_title}</dd></>}
            {uploadedFile.genre && <><dt>Genre</dt><dd>{uploadedFile.genre}</dd></>}
            <dt>ID</dt><dd>{uploadedFile.id}</dd>
          </dl>
          <button className={styles.button} onClick={handleReset}>Upload another</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <Header />
      <div className={styles.container}>

      <label className={`${styles.dropZone} ${file ? styles.dropZoneHasFile : ''}`}>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className={styles.hiddenInput}
          disabled={busy}
        />
        {file
          ? <span className={styles.fileName}>{file.name}</span>
          : <span className={styles.dropHint}>Click to choose an audio file</span>
        }
      </label>

      {libraries.length > 0 && (
        <label className={styles.fieldLabel}>
          <span className={styles.fieldName}>Track type</span>
          <select
            value={selectedLibrary ?? ''}
            onChange={(e) => setSelectedLibrary(e.target.value ? Number(e.target.value) : null)}
            className={styles.input}
            disabled={busy}
          >
            <option value="">— Select —</option>
            {libraries.filter(l => l.enabled).map(l => (
              <option key={l.id} value={l.id}>{l.name ?? l.code}</option>
            ))}
          </select>
        </label>
      )}

      <div className={styles.fields}>
        {(['track_title', 'artist_name', 'album_title', 'genre'] as const).map((field) => (
          <label key={field} className={styles.fieldLabel}>
            <span className={styles.fieldName}>{field.replace('_', ' ')}</span>
            <input
              type="text"
              value={metadata[field]}
              onChange={handleMetadataChange(field)}
              className={styles.input}
              disabled={busy}
              placeholder="Optional"
            />
          </label>
        ))}
      </div>

      {uploadState === 'error' && <p className={styles.errorMsg}>{errorMsg}</p>}

      <button
        className={styles.button}
        onClick={handleFilePick}
        disabled={busy || !file}
      >
        {busy ? 'Uploading…' : 'Upload'}
      </button>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FileUploaderApp />
  </StrictMode>
)
