import { describe, expect, it } from 'vitest'
import { extractSvgElements } from './fritzingParser'

describe('fritzingParser', () => {
  it('extracts rect and circle elements correctly', () => {
    const svgStr = `
      <svg>
        <g id="copper1">
          <rect id="connector1pin" x="10" y="10" width="20" height="20" fill="none" stroke-width="0.5"/>
          <circle id="pad2" cx="50" cy="50" r="5" fill="#f7bd13"/>
        </g>
      </svg>
    `
    const elements = extractSvgElements(svgStr)
    expect(elements).toHaveLength(2)
    
    const connector = elements.find(e => e.id === 'connector1pin')
    expect(connector).toBeDefined()
    expect(connector?.type).toBe('rect')
    expect(connector?.role).toBe('connector')
    expect(connector?.connector?.pin).toBe(1)
    
    const pad = elements.find(e => e.id === 'pad2')
    expect(pad).toBeDefined()
    expect(pad?.type).toBe('circle')
    expect(pad?.role).toBe('copper-surface')
  })
})
