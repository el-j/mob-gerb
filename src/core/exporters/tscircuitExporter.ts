import type { ElementState, FootprintProject } from '../types/pcb'

export type TscircuitCircuitElement = Record<string, unknown> & {
  type: string
}

const toRoutePoint = (x: number, y: number, width: number) => ({
  route_type: 'wire',
  x,
  y,
  width,
})

const resolveLayer = (pcbLayer: string): 'top' | 'bottom' =>
  pcbLayer === 'copper0' ? 'bottom' : 'top'

const toConnectorElements = (element: ElementState, index: number): TscircuitCircuitElement[] => {
  if (element.role !== 'connector' || !element.connector) {
    return []
  }

  const connectorBaseId = element.connector.connectorId || `connector_${index + 1}`
  const sourceComponentId = `source_component_${connectorBaseId}`
  const sourcePortId = `source_port_${connectorBaseId}`
  const pcbPortId = `pcb_port_${connectorBaseId}`

  const sourceComponent: TscircuitCircuitElement = {
    type: 'source_component',
    source_component_id: sourceComponentId,
    ftype: 'simple_connector',
    name: element.name ?? connectorBaseId,
  }

  const sourcePort: TscircuitCircuitElement = {
    type: 'source_port',
    source_port_id: sourcePortId,
    source_component_id: sourceComponentId,
    pin_number: element.connector.pin,
    name: `pin${element.connector.pin}`,
  }

  const pcbPort: TscircuitCircuitElement = {
    type: 'pcb_port',
    pcb_port_id: pcbPortId,
    source_port_id: sourcePortId,
    x: element.geom.x,
    y: element.geom.y,
    layers: [resolveLayer(element.pcbLayer)],
  }

  if (element.connector.kind === 'through-hole') {
    const outerDiameter = (element.geom.r ?? 0.5) * 2
    return [
      sourceComponent,
      sourcePort,
      pcbPort,
      {
        type: 'pcb_plated_hole',
        pcb_plated_hole_id: `pcb_plated_hole_${connectorBaseId}`,
        pcb_port_id: pcbPortId,
        x: element.geom.x,
        y: element.geom.y,
        outer_diameter: outerDiameter,
        hole_diameter: Math.max(0.2, outerDiameter * 0.5),
        layers: ['top', 'bottom'],
      },
    ]
  }

  if (element.type === 'rect') {
    return [
      sourceComponent,
      sourcePort,
      pcbPort,
      {
        type: 'pcb_smtpad',
        pcb_smtpad_id: `pcb_smtpad_${connectorBaseId}`,
        pcb_port_id: pcbPortId,
        shape: 'rect',
        x: element.geom.x + (element.geom.w ?? 0) / 2,
        y: element.geom.y + (element.geom.h ?? 0) / 2,
        width: element.geom.w ?? 1,
        height: element.geom.h ?? 1,
        layer: resolveLayer(element.pcbLayer),
      },
    ]
  }

  return [
    sourceComponent,
    sourcePort,
    pcbPort,
    {
      type: 'pcb_smtpad',
      pcb_smtpad_id: `pcb_smtpad_${connectorBaseId}`,
      pcb_port_id: pcbPortId,
      shape: 'circle',
      x: element.geom.x,
      y: element.geom.y,
      radius: element.geom.r ?? 0.5,
      layer: resolveLayer(element.pcbLayer),
    },
  ]
}

const toTraceElement = (element: ElementState, index: number): TscircuitCircuitElement | null => {
  if (element.type !== 'polyline' || !element.geom.points || element.geom.points.length < 2) {
    return null
  }

  const width = element.geom.strokeWidth ?? 0.2
  const route = element.geom.points.map((point) =>
    toRoutePoint(element.geom.x + point.x, element.geom.y + point.y, width),
  )

  return {
    type: 'pcb_trace',
    pcb_trace_id: `pcb_trace_${index}`,
    source_trace_id: element.net ?? `source_trace_${index}`,
    route,
    layer: resolveLayer(element.pcbLayer),
    min_trace_thickness: width,
  }
}

const toSilkscreenElement = (element: ElementState, index: number): TscircuitCircuitElement | null => {
  if (element.role !== 'silkscreen') return null

  if (element.type === 'line') {
    return {
      type: 'pcb_silkscreen_line',
      pcb_silkscreen_line_id: `pcb_silkscreen_line_${index}`,
      x1: element.geom.x,
      y1: element.geom.y,
      x2: element.geom.x + (element.geom.w ?? 0),
      y2: element.geom.y + (element.geom.h ?? 0),
      stroke_width: element.geom.strokeWidth ?? 0.15,
      layer: 'top',
    }
  }

  if (element.type === 'rect') {
    return {
      type: 'pcb_silkscreen_rect',
      pcb_silkscreen_rect_id: `pcb_silkscreen_rect_${index}`,
      center: {
        x: element.geom.x + (element.geom.w ?? 0) / 2,
        y: element.geom.y + (element.geom.h ?? 0) / 2,
      },
      width: element.geom.w ?? 0,
      height: element.geom.h ?? 0,
      stroke_width: element.geom.strokeWidth ?? 0.15,
      is_filled: Boolean(element.geom.filled),
      layer: 'top',
    }
  }

  if (element.type === 'circle') {
    return {
      type: 'pcb_silkscreen_circle',
      pcb_silkscreen_circle_id: `pcb_silkscreen_circle_${index}`,
      center: {
        x: element.geom.x,
        y: element.geom.y,
      },
      radius: element.geom.r ?? 0,
      stroke_width: element.geom.strokeWidth ?? 0.15,
      is_filled: Boolean(element.geom.filled),
      layer: 'top',
    }
  }

  if (element.type === 'polyline' && element.geom.points && element.geom.points.length >= 2) {
    return {
      type: 'pcb_silkscreen_path',
      pcb_silkscreen_path_id: `pcb_silkscreen_path_${index}`,
      route: element.geom.points.map((point) => ({
        x: element.geom.x + point.x,
        y: element.geom.y + point.y,
      })),
      stroke_width: element.geom.strokeWidth ?? 0.15,
      layer: 'top',
    }
  }

  return null
}

const computeBoardBounds = (elements: ElementState[]) => {
  const xValues: number[] = []
  const yValues: number[] = []

  for (const element of elements) {
    xValues.push(element.geom.x)
    yValues.push(element.geom.y)

    if (element.geom.w !== undefined) xValues.push(element.geom.x + element.geom.w)
    if (element.geom.h !== undefined) yValues.push(element.geom.y + element.geom.h)
    if (element.geom.r !== undefined) {
      xValues.push(element.geom.x - element.geom.r)
      xValues.push(element.geom.x + element.geom.r)
      yValues.push(element.geom.y - element.geom.r)
      yValues.push(element.geom.y + element.geom.r)
    }

    if (element.geom.points) {
      for (const point of element.geom.points) {
        xValues.push(element.geom.x + point.x)
        yValues.push(element.geom.y + point.y)
      }
    }
  }

  if (xValues.length === 0 || yValues.length === 0) {
    return { centerX: 0, centerY: 0, width: 10, height: 10 }
  }

  const minX = Math.min(...xValues)
  const maxX = Math.max(...xValues)
  const minY = Math.min(...yValues)
  const maxY = Math.max(...yValues)

  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  }
}

export const exportProjectToTscircuitCircuitJson = (
  project: FootprintProject,
): TscircuitCircuitElement[] => {
  const elements = Object.values(project.elements)
  const circuitJson: TscircuitCircuitElement[] = []

  const boardBounds = computeBoardBounds(elements)
  circuitJson.push({
    type: 'pcb_board',
    pcb_board_id: 'pcb_board_0',
    center: { x: boardBounds.centerX, y: boardBounds.centerY },
    width: boardBounds.width,
    height: boardBounds.height,
    layer_count: project.layerCount ?? 2,
  })

  for (const [netId, net] of Object.entries(project.nets)) {
    circuitJson.push({
      type: 'source_net',
      source_net_id: netId,
      name: net.id,
    })
  }

  elements.forEach((element, index) => {
    const connectorElements = toConnectorElements(element, index)
    if (connectorElements.length > 0) {
      circuitJson.push(...connectorElements)
      return
    }

    const traceElement = toTraceElement(element, index)
    if (traceElement) {
      circuitJson.push(traceElement)
      return
    }

    const silkscreenElement = toSilkscreenElement(element, index)
    if (silkscreenElement) {
      circuitJson.push(silkscreenElement)
    }
  })

  return circuitJson
}

export const exportProjectToTscircuitCircuitJsonString = (
  project: FootprintProject,
): string => JSON.stringify(exportProjectToTscircuitCircuitJson(project), null, 2)
