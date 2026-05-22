import type { Coordinate, ElementState, FootprintProject } from '../types/pcb'

type JsonRecord = Record<string, unknown>

export type TscircuitCircuitElement = JsonRecord & {
  type: string
}

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined

const asPoint = (value: unknown): Coordinate | undefined => {
  if (!isRecord(value)) return undefined
  const x = asNumber(value.x)
  const y = asNumber(value.y)
  if (x === undefined || y === undefined) return undefined
  return { x, y }
}

const toElementId = (element: TscircuitCircuitElement, index: number): string => {
  const idKeys = [
    'pcb_smtpad_id',
    'pcb_plated_hole_id',
    'pcb_hole_id',
    'pcb_trace_id',
    'pcb_silkscreen_line_id',
    'pcb_silkscreen_rect_id',
    'pcb_silkscreen_circle_id',
    'pcb_silkscreen_path_id',
    'source_component_id',
    'source_port_id',
  ]

  for (const key of idKeys) {
    const value = asString(element[key])
    if (value) return value
  }

  return `${element.type}-${index}`
}

const toRectFromCenter = (
  center: Coordinate,
  width: number,
  height: number,
): Pick<ElementState['geom'], 'x' | 'y' | 'w' | 'h'> => ({
  x: center.x - width / 2,
  y: center.y - height / 2,
  w: width,
  h: height,
})

const parsePcbSmtPad = (element: TscircuitCircuitElement, index: number): ElementState | null => {
  const layer = asString(element.layer) === 'bottom' ? 'copper0' : 'copper1'
  const shape = asString(element.shape)
  const x = asNumber(element.x)
  const y = asNumber(element.y)
  const strokeWidth = asNumber(element.stroke_width) ?? 0.2
  const pcbPortId = asString(element.pcb_port_id)
  const pinNumber = asNumber(element.pin_number)

  if (x === undefined || y === undefined) {
    return null
  }

  if (shape === 'circle') {
    const radius = asNumber(element.radius)
    if (radius === undefined) return null

    return {
      id: toElementId(element, index),
      type: 'circle',
      role: pcbPortId ? 'connector' : 'copper-surface',
      pcbLayer: layer,
      geom: { x, y, r: radius, strokeWidth, filled: true },
      connector: pcbPortId
        ? {
            kind: 'smd',
            pin: pinNumber ?? index + 1,
            connectorId: pcbPortId,
            svgId: pcbPortId,
          }
        : undefined,
    }
  }

  const width = asNumber(element.width)
  const height = asNumber(element.height)
  if (width === undefined || height === undefined) {
    return null
  }

  const rect = toRectFromCenter({ x, y }, width, height)
  return {
    id: toElementId(element, index),
    type: 'rect',
    role: pcbPortId ? 'connector' : 'copper-surface',
    pcbLayer: layer,
    geom: { ...rect, strokeWidth, filled: true },
    connector: pcbPortId
      ? {
          kind: 'smd',
          pin: pinNumber ?? index + 1,
          connectorId: pcbPortId,
          svgId: pcbPortId,
        }
      : undefined,
  }
}

const parsePcbPlatedHole = (element: TscircuitCircuitElement, index: number): ElementState | null => {
  const x = asNumber(element.x)
  const y = asNumber(element.y)
  const outerDiameter = asNumber(element.outer_diameter) ?? asNumber(element.diameter)
  const holeDiameter = asNumber(element.hole_diameter)
  const pcbPortId = asString(element.pcb_port_id)
  const pinNumber = asNumber(element.pin_number)

  if (x === undefined || y === undefined || outerDiameter === undefined) {
    return null
  }

  return {
    id: toElementId(element, index),
    type: 'circle',
    role: 'connector',
    pcbLayer: 'copper1',
    geom: {
      x,
      y,
      r: outerDiameter / 2,
      strokeWidth: holeDiameter ? Math.max(0.1, holeDiameter / 8) : 0.2,
      filled: true,
    },
    connector: {
      kind: 'through-hole',
      pin: pinNumber ?? index + 1,
      connectorId: pcbPortId ?? `connector-${index + 1}`,
      svgId: pcbPortId ?? `connector-${index + 1}`,
    },
  }
}

const parsePcbTrace = (element: TscircuitCircuitElement, index: number): ElementState | null => {
  const route = element.route
  if (!Array.isArray(route) || route.length < 2) {
    return null
  }

  const points: Coordinate[] = []
  let width: number | undefined
  for (const routePoint of route) {
    if (!isRecord(routePoint)) continue
    const x = asNumber(routePoint.x)
    const y = asNumber(routePoint.y)
    if (x === undefined || y === undefined) continue
    points.push({ x, y })
    if (width === undefined) {
      width = asNumber(routePoint.width)
    }
  }

  if (points.length < 2) {
    return null
  }

  const first = points[0]
  const normalized = points.map((point) => ({ x: point.x - first.x, y: point.y - first.y }))

  return {
    id: toElementId(element, index),
    type: 'polyline',
    role: 'copper-surface',
    pcbLayer: asString(element.layer) === 'bottom' ? 'copper0' : 'copper1',
    geom: {
      x: first.x,
      y: first.y,
      points: normalized,
      strokeWidth: width ?? asNumber(element.min_trace_thickness) ?? 0.2,
      filled: false,
    },
    net: asString(element.source_trace_id) ?? undefined,
  }
}

const parsePcbSilkscreenLine = (element: TscircuitCircuitElement, index: number): ElementState | null => {
  const x1 = asNumber(element.x1)
  const y1 = asNumber(element.y1)
  const x2 = asNumber(element.x2)
  const y2 = asNumber(element.y2)

  if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) {
    return null
  }

  const minX = Math.min(x1, x2)
  const minY = Math.min(y1, y2)

  return {
    id: toElementId(element, index),
    type: 'line',
    role: 'silkscreen',
    pcbLayer: 'silkscreen',
    geom: {
      x: minX,
      y: minY,
      w: Math.abs(x2 - x1),
      h: Math.abs(y2 - y1),
      strokeWidth: asNumber(element.stroke_width) ?? 0.15,
      filled: false,
    },
  }
}

const parsePcbSilkscreenRect = (element: TscircuitCircuitElement, index: number): ElementState | null => {
  const center = asPoint(element.center)
  const width = asNumber(element.width)
  const height = asNumber(element.height)
  if (!center || width === undefined || height === undefined) {
    return null
  }

  return {
    id: toElementId(element, index),
    type: 'rect',
    role: 'silkscreen',
    pcbLayer: 'silkscreen',
    geom: {
      ...toRectFromCenter(center, width, height),
      strokeWidth: asNumber(element.stroke_width) ?? 0.15,
      filled: Boolean(element.is_filled),
    },
  }
}

const parsePcbSilkscreenCircle = (element: TscircuitCircuitElement, index: number): ElementState | null => {
  const center = asPoint(element.center)
  const radius = asNumber(element.radius)
  if (!center || radius === undefined) {
    return null
  }

  return {
    id: toElementId(element, index),
    type: 'circle',
    role: 'silkscreen',
    pcbLayer: 'silkscreen',
    geom: {
      x: center.x,
      y: center.y,
      r: radius,
      strokeWidth: asNumber(element.stroke_width) ?? 0.15,
      filled: Boolean(element.is_filled),
    },
  }
}

const parsePcbSilkscreenPath = (element: TscircuitCircuitElement, index: number): ElementState | null => {
  const route = element.route
  if (!Array.isArray(route) || route.length < 2) {
    return null
  }

  const points: Coordinate[] = []
  for (const routePoint of route) {
    if (!isRecord(routePoint)) continue
    const x = asNumber(routePoint.x)
    const y = asNumber(routePoint.y)
    if (x === undefined || y === undefined) continue
    points.push({ x, y })
  }

  if (points.length < 2) {
    return null
  }

  const first = points[0]
  const normalized = points.map((point) => ({ x: point.x - first.x, y: point.y - first.y }))

  return {
    id: toElementId(element, index),
    type: 'polyline',
    role: 'silkscreen',
    pcbLayer: 'silkscreen',
    geom: {
      x: first.x,
      y: first.y,
      points: normalized,
      strokeWidth: asNumber(element.stroke_width) ?? 0.15,
      filled: false,
    },
  }
}

const parseElement = (element: TscircuitCircuitElement, index: number): ElementState | null => {
  switch (element.type) {
    case 'pcb_smtpad':
      return parsePcbSmtPad(element, index)
    case 'pcb_plated_hole':
      return parsePcbPlatedHole(element, index)
    case 'pcb_trace':
      return parsePcbTrace(element, index)
    case 'pcb_silkscreen_line':
      return parsePcbSilkscreenLine(element, index)
    case 'pcb_silkscreen_rect':
      return parsePcbSilkscreenRect(element, index)
    case 'pcb_silkscreen_circle':
      return parsePcbSilkscreenCircle(element, index)
    case 'pcb_silkscreen_path':
      return parsePcbSilkscreenPath(element, index)
    default:
      return null
  }
}

export const parseTscircuitCircuitJson = (
  input: unknown,
  options?: { projectId?: string; projectName?: string },
): FootprintProject => {
  if (!Array.isArray(input)) {
    throw new Error('Expected circuit-json array input')
  }

  const elements: Record<string, ElementState> = {}
  const nets: FootprintProject['nets'] = {}

  input.forEach((rawElement, index) => {
    if (!isRecord(rawElement)) return
    const type = asString(rawElement.type)
    if (!type) return

    const element = rawElement as TscircuitCircuitElement
    if (type === 'source_net') {
      const netId = asString(element.source_net_id) ?? asString(element.name)
      if (netId) {
        nets[netId] = {
          id: netId,
          padIds: [],
        }
      }
      return
    }

    const parsed = parseElement(element, index)
    if (parsed) {
      elements[parsed.id] = parsed
    }
  })

  return {
    projectId: options?.projectId ?? 'tscircuit-import',
    lastModified: Date.now(),
    metadata: {
      name: options?.projectName ?? 'Imported tscircuit project',
      author: 'tscircuit',
    },
    gridSize: 1,
    layerCount: 2,
    elements,
    nets,
  }
}

export const parseTscircuitCircuitJsonString = (
  json: string,
  options?: { projectId?: string; projectName?: string },
): FootprintProject => {
  const parsed = JSON.parse(json)
  return parseTscircuitCircuitJson(parsed, options)
}
