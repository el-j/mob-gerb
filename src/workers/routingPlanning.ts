import type { ElementState, NetState } from '../core/types/pcb'
import type { RoutingStrategy } from './autorouter.protocol'

type Coordinate = { x: number; y: number }

const centerOf = (element: ElementState): Coordinate => {
  if (element.type === 'rect') {
    return {
      x: element.geom.x + (element.geom.w ?? 0) / 2,
      y: element.geom.y + (element.geom.h ?? 0) / 2,
    }
  }
  return { x: element.geom.x, y: element.geom.y }
}

const manhattan = (a: Coordinate, b: Coordinate): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

const netPriorityScore = (net: NetState, elements: Record<string, ElementState>): number => {
  if (net.padIds.length < 2) return 0
  const start = elements[net.padIds[0]]
  const end = elements[net.padIds[net.padIds.length - 1]]
  if (!start || !end) return 0
  return manhattan(centerOf(start), centerOf(end))
}

export const orderNetIdsForStrategy = (
  nets: Record<string, NetState>,
  elements: Record<string, ElementState>,
  strategy: RoutingStrategy,
): string[] => {
  const netIds = Object.keys(nets)
  if (strategy === 'tscircuit-prototype') {
    return [...netIds].sort((left, right) => {
      const scoreDelta = netPriorityScore(nets[right], elements) - netPriorityScore(nets[left], elements)
      if (scoreDelta !== 0) return scoreDelta
      return left.localeCompare(right)
    })
  }

  return [...netIds].sort((left, right) => left.localeCompare(right))
}

export const createRouteTraceId = (netId: string, segmentIndex: number): string =>
  `route-${netId}-${segmentIndex + 1}`
