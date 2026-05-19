import { describe, expect, it } from 'vitest'
import type { ElementState } from '../types/pcb'
import { runDrc } from './drcEngine'

const makeRect = (
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  net?: string,
): ElementState => ({
  id,
  type: 'rect',
  role: 'copper-surface',
  pcbLayer: 'copper1',
  geom: { x, y, w, h },
  net,
})

describe('DRC Engine', () => {
  it('returns no violations when copper elements are far apart', () => {
    const elements = {
      a: makeRect('a', 0, 0, 2, 2, 'net-1'),
      b: makeRect('b', 10, 10, 2, 2, 'net-2'),
    }
    const violations = runDrc(elements, 0.2)
    expect(violations).toHaveLength(0)
  })

  it('flags a clearance violation when elements are too close', () => {
    const elements = {
      a: makeRect('a', 0, 0, 2, 2, 'net-1'),
      b: makeRect('b', 2.1, 0, 2, 2, 'net-2'),
    }
    const violations = runDrc(elements, 0.2)
    expect(violations).toHaveLength(1)
    expect(violations[0].type).toBe('clearance')
    expect(violations[0].elementIds).toContain('a')
    expect(violations[0].elementIds).toContain('b')
  })

  it('flags a short circuit when elements overlap', () => {
    const elements = {
      a: makeRect('a', 0, 0, 3, 3, 'net-1'),
      b: makeRect('b', 2, 2, 3, 3, 'net-2'),
    }
    const violations = runDrc(elements, 0.2)
    expect(violations).toHaveLength(1)
    expect(violations[0].type).toBe('short')
  })

  it('ignores same-net element pairs', () => {
    const elements = {
      a: makeRect('a', 0, 0, 2, 2, 'net-1'),
      b: makeRect('b', 2.05, 0, 2, 2, 'net-1'), // same net, very close
    }
    const violations = runDrc(elements, 0.2)
    expect(violations).toHaveLength(0)
  })

  it('ignores silkscreen elements', () => {
    const elements = {
      a: makeRect('a', 0, 0, 2, 2, 'net-1'),
      silk: {
        ...makeRect('silk', 2.05, 0, 2, 2, undefined),
        pcbLayer: 'silkscreen' as const,
        role: 'silkscreen' as const,
      },
    }
    const violations = runDrc(elements, 0.2)
    expect(violations).toHaveLength(0)
  })

  it('uses message text that includes element IDs', () => {
    const elements = {
      a: makeRect('a', 0, 0, 2, 2, 'net-1'),
      b: makeRect('b', 2.1, 0, 2, 2, 'net-2'),
    }
    const violations = runDrc(elements, 0.2)
    expect(violations[0].message).toContain('a')
    expect(violations[0].message).toContain('b')
  })
})
