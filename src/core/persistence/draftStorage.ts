import type { FootprintProject } from '../types/pcb'

// ─── public types ─────────────────────────────────────────────────────────────

export type DraftEnvelope = {
  version: 1
  project: FootprintProject
  savedAt: number
}

/** Dependency-injection interface used in tests. */
export interface DraftStoragePort {
  save(project: FootprintProject): Promise<void>
  load(): Promise<FootprintProject | null>
  clear(): Promise<void>
}

// ─── validation ───────────────────────────────────────────────────────────────

/** Returns the validated project or null if the envelope is unreadable. */
export const validateDraftEnvelope = (raw: unknown): FootprintProject | null => {
  if (!raw || typeof raw !== 'object') return null
  const env = raw as Record<string, unknown>

  if (env['version'] !== 1) return null

  const project = env['project']
  if (!project || typeof project !== 'object') return null
  const p = project as Record<string, unknown>

  // Minimum required fields
  if (typeof p['projectId'] !== 'string') return null
  if (typeof p['lastModified'] !== 'number') return null
  if (!p['elements'] || typeof p['elements'] !== 'object') return null
  if (!p['nets'] || typeof p['nets'] !== 'object') return null

  return project as FootprintProject
}

// ─── IndexedDB adapter ────────────────────────────────────────────────────────

const DB_NAME = 'mob-gerb'
const DB_VERSION = 1
const STORE_NAME = 'drafts'
const DRAFT_KEY = 'current'

const openDb = (): Promise<IDBDatabase> => {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this environment'))
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

const makeIndexedDbStorage = (): DraftStoragePort => ({
  async save(project: FootprintProject): Promise<void> {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const envelope: DraftEnvelope = { version: 1, project, savedAt: Date.now() }
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.objectStore(STORE_NAME).put(envelope, DRAFT_KEY)
    })
  },

  async load(): Promise<FootprintProject | null> {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const request = tx.objectStore(STORE_NAME).get(DRAFT_KEY)
      request.onsuccess = () => resolve(validateDraftEnvelope(request.result))
      request.onerror = () => reject(request.error)
    })
  },

  async clear(): Promise<void> {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.objectStore(STORE_NAME).delete(DRAFT_KEY)
    })
  },
})

// ─── singleton ────────────────────────────────────────────────────────────────

let _storage: DraftStoragePort = makeIndexedDbStorage()

/** Override the storage backend — used in tests. */
export const setDraftStorage = (adapter: DraftStoragePort): void => {
  _storage = adapter
}

export const saveDraft = (project: FootprintProject): Promise<void> => _storage.save(project)
export const loadDraft = (): Promise<FootprintProject | null> => _storage.load()
export const clearDraft = (): Promise<void> => _storage.clear()
