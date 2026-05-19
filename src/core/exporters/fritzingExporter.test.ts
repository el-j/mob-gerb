import { describe, it, expect } from 'vitest'
import { exportProjectToFritzingSvg, exportProjectToFzpXml } from './fritzingExporter'
import type { FootprintProject, ElementState } from '../types/pcb'

function makeProject(elements: ElementState[]): FootprintProject {
  return {
    projectId: 'test-part',
    lastModified: 0,
    metadata: { name: 'Test Component', author: 'tester' },
    gridSize: 2.54,
    elements: Object.fromEntries(elements.map((e) => [e.id, e])),
    nets: {},
  }
}

describe('fritzingExporter', () => {
  it('exports THT connector with dual-layer mapping and terminalId in FZP XML', () => {
    const pin: ElementState = {
      id: 'circle-pin-1',
      type: 'circle',
      role: 'connector',
      pcbLayer: 'copper1',
      geom: { x: 10, y: 10, r: 1.5 },
      connector: {
        kind: 'through-hole',
        pin: 1,
        connectorId: 'connector0',
        svgId: 'connector0pin',
      },
    }

    const xml = exportProjectToFzpXml(makeProject([pin]))
    expect(xml).toContain('connector id="connector0" type="male"')
    expect(xml).toContain('<p layer="copper0" svgId="connector0pin" terminalId="connector0terminal"/>')
    expect(xml).toContain('<p layer="copper1" svgId="connector0pin" terminalId="connector0terminal"/>')
    expect(xml).toContain('<layer layerId="copper2"/>')
    expect(xml).toContain('<layer layerId="copper3"/>')
  })

  it('exports SVG with nested 4-layer copper groups and sub-pixel terminal nodes', () => {
    const pin: ElementState = {
      id: 'circle-pin-1',
      type: 'circle',
      role: 'connector',
      pcbLayer: 'copper1',
      geom: { x: 10, y: 10, r: 1.5 },
      connector: {
        kind: 'through-hole',
        pin: 1,
        connectorId: 'connector0',
        svgId: 'connector0pin',
      },
    }

    const svg = exportProjectToFritzingSvg(makeProject([pin]))
    expect(svg).toContain('<g id="copper1">')
    expect(svg).toContain('<g id="copper2">')
    expect(svg).toContain('<g id="copper3">')
    expect(svg).toContain('<g id="copper0">')
    
    // Check terminal rect node
    expect(svg).toContain('<rect id="connector0terminal" x="9.9995" y="9.9995" width="0.001" height="0.001"')
  })
})
