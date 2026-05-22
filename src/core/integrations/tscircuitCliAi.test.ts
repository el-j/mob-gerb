import { describe, expect, it } from 'vitest'

import type { FootprintProject } from '../types/pcb'
import { createAiFootprintPrompt, createTscircuitCliScript } from './tscircuitCliAi'

const makeProject = (): FootprintProject => ({
  projectId: 'demo/project',
  lastModified: 1,
  metadata: { name: 'Demo Board', author: 'mob' },
  gridSize: 1,
  layerCount: 2,
  elements: {
    connector0pin: {
      id: 'connector0pin',
      type: 'circle',
      role: 'connector',
      pcbLayer: 'copper0',
      geom: { x: 5, y: 5, r: 0.6 },
      connector: { kind: 'through-hole', pin: 1, connectorId: 'connector0', svgId: 'connector0pin' },
    },
  },
  nets: {},
})

describe('tscircuitCliAi integration helpers', () => {
  it('creates CLI publish script with package metadata and circuit-json payload', () => {
    const script = createTscircuitCliScript(makeProject(), {
      packageName: 'scope/pkg',
      registryUrl: 'https://registry.example.com',
    })

    expect(script).toContain('PACKAGE_NAME="scope/pkg"')
    expect(script).toContain('REGISTRY_URL="https://registry.example.com"')
    expect(script).toContain('scope_pkg.circuit.json')
    expect(script).toContain('npx tscircuit registry publish')
    expect(script).toContain('JSON')
  })

  it('creates AI prompt with goal and circuit-json instructions', () => {
    const prompt = createAiFootprintPrompt(makeProject(), 'Reduce board area by 10%')

    expect(prompt).toContain('Goal: Reduce board area by 10%')
    expect(prompt).toContain('Project: Demo Board (demo/project)')
    expect(prompt).toContain('Return a valid circuit-json array.')
    expect(prompt).toContain('Current circuit-json snapshot')
  })
})
