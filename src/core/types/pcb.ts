export type AppMode =
  | 'VIEW_MODE'
  | 'PLACE_MODE'
  | 'LOGICAL_MODE'
  | 'ROUTING_MODE'
  | 'EDIT_TRACE_MODE'
  | 'PART_CREATOR_MODE'

export type PcbLayer = 'copper0' | 'copper1' | 'silkscreen'

export type ElementType = 'rect' | 'circle' | 'line'

export type ElementRole = 'connector' | 'silkscreen' | 'unassigned'

export type Coordinate = {
  x: number
  y: number
}

export type ElementGeometry = {
  x: number
  y: number
  w?: number
  h?: number
  r?: number
}

export type ElementState = {
  id: string
  type: ElementType
  role: ElementRole
  pcbLayer: PcbLayer
  geom: ElementGeometry
  net?: string
}

export type FootprintProject = {
  projectId: string
  lastModified: number
  gridSize: number
  elements: Record<string, ElementState>
}
