import { describe, expect, it } from 'vitest'

import type { FootprintProject } from '../types/pcb'
import type { DraftStoragePort } from './draftStorage'
import { loadDraft, saveDraft, setDraftStorage, validateDraftEnvelope } from './draftStorage'

// ─── validateDraftEnvelope ────────────────────────────────────────────────────

describe('validateDraftEnvelope', () => {
  const validProject: FootprintProject = {
    projectId: 'test-123',
    lastModified: 1000,
    metadata: { name: 'Test', author: 'test' },
    gridSize: 1,
    elements: {},
    nets: {},
  }

  it('returns the project for a valid v1 envelope', () => {
    const envelope = { version: 1, project: validProject, savedAt: 1000 }
    expect(validateDraftEnvelope(envelope)).toEqual(validProject)
  })

  it('returns null for non-object input', () => {
    expect(validateDraftEnvelope(null)).toBeNull()
    expect(validateDraftEnvelope('string')).toBeNull()
    expect(validateDraftEnvelope(42)).toBeNull()
  })

  it('returns null for wrong version', () => {
    expect(validateDraftEnvelope({ version: 2, project: validProject, savedAt: 1000 })).toBeNull()
    expect(validateDraftEnvelope({ version: 0, project: validProject, savedAt: 1000 })).toBeNull()
  })

  it('returns null when project field is missing', () => {
    expect(validateDraftEnvelope({ version: 1, savedAt: 1000 })).toBeNull()
  })

  it('returns null when project is missing required fields', () => {
    expect(validateDraftEnvelope({ version: 1, project: { lastModified: 1 }, savedAt: 1 })).toBeNull()
    expect(
      validateDraftEnvelope({
        version: 1,
        project: { projectId: 'x', lastModified: 1, elements: {} },
        savedAt: 1,
      }),
    ).toBeNull()
  })

  it('returns null for an empty object', () => {
    expect(validateDraftEnvelope({})).toBeNull()
  })
})

// ─── mock adapter integration ─────────────────────────────────────────────────

const makeMockStorage = (): DraftStoragePort & { store: Map<string, unknown> } => {
  const store = new Map<string, unknown>()
  return {
    store,
    save: async (project) => { store.set('current', project) },
    load: async () => (store.has('current') ? (store.get('current') as FootprintProject) : null),
    clear: async () => { store.delete('current') },
  }
}

describe('draftStorage save/load/clear cycle', () => {
  const project: FootprintProject = {
    projectId: 'proj-1',
    lastModified: 9000,
    metadata: { name: 'My PCB', author: 'me' },
    gridSize: 1,
    elements: { e1: { id: 'e1', type: 'rect', role: 'unassigned', pcbLayer: 'copper0', geom: { x: 0, y: 0, w: 10, h: 10 } } },
    nets: {},
  }

  it('round-trips a project through the mock adapter', async () => {
    const mock = makeMockStorage()
    setDraftStorage(mock)

    await saveDraft(project)
    const loaded = await loadDraft()
    expect(loaded).toEqual(project)
  })

  it('returns null when no draft has been saved', async () => {
    const mock = makeMockStorage()
    setDraftStorage(mock)

    const loaded = await loadDraft()
    expect(loaded).toBeNull()
  })
})
