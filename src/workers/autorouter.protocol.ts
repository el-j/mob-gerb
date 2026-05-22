import type { ElementState, NetState } from '../core/types/pcb'

export type RoutingStrategy = 'mvp-grid' | 'tscircuit-prototype'

export type AutorouterRequest = {
  type: 'ROUTE_REQUEST'
  strategy: RoutingStrategy
  autolayout: boolean
  gridSize: number
  elements: Record<string, ElementState>
  nets: Record<string, NetState>
}

export type AutorouterResponse = {
  type: 'ROUTE_SUCCESS'
  strategyUsed: RoutingStrategy
  traces: ElementState[]
} | {
  type: 'ROUTE_ERROR'
  error: string
}
