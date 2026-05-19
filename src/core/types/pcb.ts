export type AppMode =
  | 'VIEW_MODE'
  | 'PLACE_MODE'
  | 'LOGICAL_MODE'
  | 'ROUTING_MODE'
  | 'EDIT_TRACE_MODE'
  | 'PART_CREATOR_MODE'

export type PcbLayer = 'copper0' | 'copper1' | 'silkscreen'

export type ElementType = 'rect' | 'circle' | 'line' | 'polygon' | 'polyline' | 'group'

export type ElementRole = 'connector' | 'silkscreen' | 'copper-surface' | 'unassigned' | 'group'
export type ConnectorKind = 'through-hole' | 'smd'

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
  points?: Coordinate[]
  strokeWidth?: number
  filled?: boolean
}

export type ElementState = {
  id: string
  type: ElementType
  role: ElementRole
  pcbLayer: PcbLayer
  geom: ElementGeometry
  groupId?: string | null
  children?: string[]
  outlinePaddingMm?: number
  connector?: {
    kind: ConnectorKind
    pin: number
    connectorId: string
    svgId: string
  }
  net?: string
}

export type ProjectMetadata = {
  name: string
  author: string
}

export type NetState = {
  id: string
  padIds: string[]
}

export type FootprintProject = {
  projectId: string
  lastModified: number
  metadata: ProjectMetadata
  gridSize: number
  elements: Record<string, ElementState>
  nets: Record<string, NetState>
}
