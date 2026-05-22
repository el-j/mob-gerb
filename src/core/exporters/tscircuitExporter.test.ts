import { describe, expect, it } from 'vitest'

import type { ElementState, FootprintProject } from '../types/pcb'
import {
  exportProjectToTscircuitCircuitJson,
  exportProjectToTscircuitCircuitJsonString,
} from './tscircuitExporter'

const makeProject = (elements: ElementState[], layerCount = 2): FootprintProject => ({
  projectId: 'proj-1',
  lastModified: 1,
  metadata: { name: 'Project', author: 'me' },
  gridSize: 1,
  layerCount,
  elements: Object.fromEntries(elements.map((element) => [element.id, element])),
  nets: {
    net_gnd: {
      id: 'GND',
      padIds: [],
    },
  },
})

describe('tscircuitExporter', () => {
  it('exports board, source_net, connector pads, traces and silkscreen', () => {
    const elements: ElementState[] = [
      {
        id: 'conn-smd',
        type: 'circle',
        role: 'connector',
        pcbLayer: 'copper1',
        geom: { x: 10, y: 10, r: 0.6 },
        connector: {
          kind: 'smd',
          pin: 1,
          connectorId: 'connector1',
          svgId: 'connector1pin',
        },
      },
      {
        id: 'conn-tht',
        type: 'circle',
        role: 'connector',
        pcbLayer: 'copper1',
        geom: { x: 14, y: 10, r: 0.6 },
        connector: {
          kind: 'through-hole',
          pin: 2,
          connectorId: 'connector2',
          svgId: 'connector2pin',
        },
      },
      {
        id: 'trace-1',
        type: 'polyline',
        role: 'copper-surface',
        pcbLayer: 'copper1',
        geom: {
          x: 0,
          y: 0,
          strokeWidth: 0.2,
          points: [
            { x: 0, y: 0 },
            { x: 5, y: 0 },
          ],
        },
      },
      {
        id: 'silk-1',
        type: 'line',
        role: 'silkscreen',
        pcbLayer: 'silkscreen',
        geom: { x: 1, y: 2, w: 3, h: 0, strokeWidth: 0.15 },
      },
    ]

    const output = exportProjectToTscircuitCircuitJson(makeProject(elements))

    expect(output.some((element) => element.type === 'pcb_board')).toBe(true)
    expect(output.some((element) => element.type === 'source_net')).toBe(true)
    expect(output.some((element) => element.type === 'source_component')).toBe(true)
    expect(output.some((element) => element.type === 'source_port')).toBe(true)
    expect(output.some((element) => element.type === 'pcb_port')).toBe(true)
    expect(output.some((element) => element.type === 'pcb_smtpad')).toBe(true)
    expect(output.some((element) => element.type === 'pcb_plated_hole')).toBe(true)
    expect(output.some((element) => element.type === 'pcb_trace')).toBe(true)
    expect(output.some((element) => element.type === 'pcb_silkscreen_line')).toBe(true)
  })

  it('exports formatted json string', () => {
    const output = exportProjectToTscircuitCircuitJsonString(makeProject([]))
    expect(output).toContain('pcb_board')
    expect(() => JSON.parse(output)).not.toThrow()
  })
})
