import { describe, expect, it } from 'vitest'

import { parseTscircuitCircuitJson, parseTscircuitCircuitJsonString } from './tscircuitParser'

describe('tscircuitParser', () => {
  it('parses a minimal pcb/source subset into a mob-gerb project', () => {
    const input = [
      { type: 'source_net', source_net_id: 'source_net_gnd', name: 'GND' },
      {
        type: 'pcb_smtpad',
        pcb_smtpad_id: 'pad_1',
        shape: 'circle',
        x: 10,
        y: 12,
        radius: 0.6,
        layer: 'top',
        pcb_port_id: 'pcb_port_1',
        pin_number: 1,
      },
      {
        type: 'pcb_plated_hole',
        pcb_plated_hole_id: 'hole_1',
        x: 16,
        y: 18,
        outer_diameter: 1.2,
        hole_diameter: 0.6,
        pcb_port_id: 'pcb_port_2',
        pin_number: 2,
      },
      {
        type: 'pcb_trace',
        pcb_trace_id: 'trace_1',
        layer: 'top',
        route: [
          { route_type: 'wire', x: 1, y: 1, width: 0.2 },
          { route_type: 'wire', x: 4, y: 1, width: 0.2 },
        ],
      },
      {
        type: 'pcb_silkscreen_line',
        pcb_silkscreen_line_id: 'silk_line_1',
        x1: 0,
        y1: 0,
        x2: 5,
        y2: 0,
        stroke_width: 0.15,
      },
    ]

    const project = parseTscircuitCircuitJson(input, {
      projectId: 'import-proj',
      projectName: 'Import Test',
    })

    expect(project.projectId).toBe('import-proj')
    expect(project.metadata.name).toBe('Import Test')
    expect(project.nets.source_net_gnd?.id).toBe('source_net_gnd')

    const pad = project.elements.pad_1
    expect(pad).toBeDefined()
    expect(pad.type).toBe('circle')
    expect(pad.role).toBe('connector')
    expect(pad.connector?.kind).toBe('smd')

    const hole = project.elements.hole_1
    expect(hole).toBeDefined()
    expect(hole.type).toBe('circle')
    expect(hole.connector?.kind).toBe('through-hole')

    const trace = project.elements.trace_1
    expect(trace).toBeDefined()
    expect(trace.type).toBe('polyline')
    expect(trace.geom.points?.length).toBe(2)

    const silk = project.elements.silk_line_1
    expect(silk).toBeDefined()
    expect(silk.role).toBe('silkscreen')
    expect(silk.pcbLayer).toBe('silkscreen')
  })

  it('parses from json string', () => {
    const json = JSON.stringify([
      {
        type: 'pcb_smtpad',
        pcb_smtpad_id: 'rect_1',
        shape: 'rect',
        x: 2,
        y: 3,
        width: 1,
        height: 2,
        layer: 'bottom',
      },
    ])

    const project = parseTscircuitCircuitJsonString(json)
    expect(project.elements.rect_1).toBeDefined()
    expect(project.elements.rect_1.type).toBe('rect')
    expect(project.elements.rect_1.pcbLayer).toBe('copper0')
  })

  it('throws for non-array input', () => {
    expect(() => parseTscircuitCircuitJson({})).toThrow('Expected circuit-json array input')
  })
})
