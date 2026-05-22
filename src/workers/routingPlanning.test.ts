import { describe, expect, it } from 'vitest'

import type { ElementState, NetState } from '../core/types/pcb'
import { createRouteTraceId, orderNetIdsForStrategy } from './routingPlanning'

const makePad = (id: string, x: number, y: number): ElementState => ({
  id,
  type: 'circle',
  role: 'connector',
  pcbLayer: 'copper1',
  geom: { x, y, r: 0.6 },
})

describe('routingPlanning', () => {
  it('orders net ids lexicographically for mvp-grid strategy', () => {
    const nets: Record<string, NetState> = {
      'net-2': { id: 'net-2', padIds: ['a', 'b'] },
      'net-1': { id: 'net-1', padIds: ['a', 'b'] },
    }

    const elements = {
      a: makePad('a', 0, 0),
      b: makePad('b', 5, 0),
    }

    expect(orderNetIdsForStrategy(nets, elements, 'mvp-grid')).toEqual(['net-1', 'net-2'])
  })

  it('prioritizes longer nets for tscircuit-prototype strategy', () => {
    const nets: Record<string, NetState> = {
      short: { id: 'short', padIds: ['a', 'b'] },
      long: { id: 'long', padIds: ['c', 'd'] },
    }

    const elements = {
      a: makePad('a', 0, 0),
      b: makePad('b', 2, 0),
      c: makePad('c', 0, 0),
      d: makePad('d', 20, 0),
    }

    expect(orderNetIdsForStrategy(nets, elements, 'tscircuit-prototype')).toEqual(['long', 'short'])
  })

  it('builds deterministic route trace ids', () => {
    expect(createRouteTraceId('net-4', 0)).toBe('route-net-4-1')
    expect(createRouteTraceId('net-4', 2)).toBe('route-net-4-3')
  })
})
