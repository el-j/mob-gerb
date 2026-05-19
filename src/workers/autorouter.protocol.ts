import type { ElementState, NetState } from '../core/types/pcb'

export type AutorouterRequest = {
  type: 'ROUTE_REQUEST'
  gridSize: number
  elements: Record<string, ElementState>
  nets: Record<string, NetState>
}

export type AutorouterResponse = {
  type: 'ROUTE_SUCCESS'
  traces: ElementState[]
} | {
  type: 'ROUTE_ERROR'
  error: string
}
