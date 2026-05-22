import { describe, expect, it, vi } from 'vitest'

import {
  createRegistryPublishPayload,
  fetchRegistryCircuitJson,
  importProjectFromRegistryCircuitJson,
} from './tscircuitRegistry'
import type { FootprintProject } from '../types/pcb'

const makeProject = (): FootprintProject => ({
  projectId: 'proj-1',
  lastModified: 1,
  metadata: { name: 'Demo', author: 'me' },
  gridSize: 1,
  layerCount: 2,
  elements: {},
  nets: {},
})

describe('tscircuitRegistry', () => {
  it('fetches circuit-json from direct array response', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify([{ type: 'pcb_board', pcb_board_id: 'b1', center: { x: 0, y: 0 }, width: 10, height: 10 }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const circuitJson = await fetchRegistryCircuitJson('pkg/name', fetchImpl)
    expect(circuitJson).toHaveLength(1)
    expect(fetchImpl).toHaveBeenCalledOnce()
  })

  it('fetches circuit-json from wrapped response', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ circuitJson: [{ type: 'pcb_board', pcb_board_id: 'b1', center: { x: 0, y: 0 }, width: 10, height: 10 }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const circuitJson = await fetchRegistryCircuitJson('https://example.com/part.json', fetchImpl)
    expect(circuitJson).toHaveLength(1)
  })

  it('throws for missing circuit-json payload', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await expect(fetchRegistryCircuitJson('pkg/name', fetchImpl)).rejects.toThrow(
      'Registry response did not include a circuit-json array',
    )
  })

  it('creates a mob-gerb project from registry circuit-json', () => {
    const project = importProjectFromRegistryCircuitJson([
      {
        type: 'pcb_smtpad',
        pcb_smtpad_id: 'pad_1',
        shape: 'circle',
        x: 4,
        y: 5,
        radius: 0.6,
        layer: 'top',
      },
    ], { packageName: 'scope/pkg' })

    expect(project.projectId).toBe('registry-scope/pkg')
    expect(project.metadata.name).toContain('scope/pkg')
    expect(project.elements.pad_1).toBeDefined()
  })

  it('creates publish payload from project', () => {
    const payload = createRegistryPublishPayload(makeProject(), 'scope/pkg')
    expect(payload.packageName).toBe('scope/pkg')
    expect(payload.source).toBe('mob-gerb')
    expect(Array.isArray(payload.circuitJson)).toBe(true)
    expect(payload.metadata.projectId).toBe('proj-1')
  })
})
