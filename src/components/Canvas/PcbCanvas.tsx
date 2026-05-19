import { type PointerEvent, type WheelEvent, useRef } from 'react'

import { boundsFromElement } from '../../core/math/geometry'
import { snapCoordinate } from '../../core/math/coordinates'
import type { Coordinate, ElementState } from '../../core/types/pcb'
import { useEditorStore } from '../../store/editorStore'

type PanPointer = {
  kind: 'pan'
  id: number
  x: number
  y: number
}

type DragPointer = {
  kind: 'drag'
  id: number
  elementId: string
  offset: Coordinate
}

type PointDragPointer = {
  kind: 'point-drag'
  id: number
  elementId: string
  pointIndex: number
}

type ActivePointer = PanPointer | DragPointer | PointDragPointer

const GRID_VIEWBOX_SIZE = 120

const elementStroke = (element: ElementState): string => {
  if (element.role === 'connector') {
    return '#f7bd13'
  }

  if (element.role === 'copper-surface') {
    return '#f7bd13'
  }

  if (element.role === 'silkscreen') {
    return '#f4f7fb'
  }

  return '#91a1b6'
}

const outlineStroke = '#f4f7fb'

export const PcbCanvas = () => {
  const mode = useEditorStore((state) => state.mode)
  const pan = useEditorStore((state) => state.pan)
  const zoom = useEditorStore((state) => state.zoom)
  const gridSize = useEditorStore((state) => state.gridSize)
  const elements = useEditorStore((state) => state.project.elements)
  const selectedElementId = useEditorStore((state) => state.selectedElementId)
  const selectedElementIds = useEditorStore((state) => state.selectedElementIds)
  const drawTool = useEditorStore((state) => state.drawTool)
  const draftPoints = useEditorStore((state) => state.draftPoints)
  const panBy = useEditorStore((state) => state.panBy)
  const setZoom = useEditorStore((state) => state.setZoom)
  const selectElement = useEditorStore((state) => state.selectElement)
  const toggleElementSelection = useEditorStore((state) => state.toggleElementSelection)
  const setElementPosition = useEditorStore((state) => state.setElementPosition)
  const updateSelectedPointFromWorld = useEditorStore((state) => state.updateSelectedPointFromWorld)
  const addDraftPoint = useEditorStore((state) => state.addDraftPoint)

  const pointerRef = useRef<ActivePointer | null>(null)

  const clientToWorld = (clientX: number, clientY: number, svgElement: SVGSVGElement): Coordinate => {
    const rect = svgElement.getBoundingClientRect()
    const width = rect.width > 0 ? rect.width : GRID_VIEWBOX_SIZE
    const height = rect.height > 0 ? rect.height : GRID_VIEWBOX_SIZE

    const svgPoint = {
      x: ((clientX - rect.left) / width) * GRID_VIEWBOX_SIZE,
      y: ((clientY - rect.top) / height) * GRID_VIEWBOX_SIZE,
    }

    return {
      x: (svgPoint.x - pan.x) / zoom,
      y: (svgPoint.y - pan.y) / zoom,
    }
  }

  const handleElementPointerDown = (event: PointerEvent<SVGElement>, elementId: string) => {
    event.stopPropagation()

    if (mode !== 'PART_CREATOR_MODE') {
      return
    }

    const element = elements[elementId]
    const selectionTarget = element?.groupId ?? elementId

    if (event.shiftKey) {
      toggleElementSelection(selectionTarget)
    } else {
      selectElement(selectionTarget)
    }

    if (!element) {
      return
    }

    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId)
    }

    const svgElement = event.currentTarget.ownerSVGElement
    if (!svgElement) {
      return
    }

    const worldPoint = clientToWorld(event.clientX, event.clientY, svgElement)
    pointerRef.current = {
      kind: 'drag',
      id: event.pointerId,
      elementId,
      offset: {
        x: worldPoint.x - element.geom.x,
        y: worldPoint.y - element.geom.y,
      },
    }
  }

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (mode !== 'VIEW_MODE') {
      if (mode === 'PART_CREATOR_MODE') {
        if (drawTool === 'polyline') {
          const worldPoint = clientToWorld(event.clientX, event.clientY, event.currentTarget)
          addDraftPoint(snapCoordinate(worldPoint, gridSize))
          return
        }

        selectElement(null)
      }
      return
    }

    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    pointerRef.current = {
      kind: 'pan',
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    }
  }

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const activePointer = pointerRef.current
    if (!activePointer || activePointer.id !== event.pointerId) {
      return
    }

    if (activePointer.kind === 'pan') {
      if (mode !== 'VIEW_MODE') {
        return
      }

      const delta = snapCoordinate(
        {
          x: (event.clientX - activePointer.x) / zoom,
          y: (event.clientY - activePointer.y) / zoom,
        },
        0.1,
      )

      panBy(delta)
      pointerRef.current = {
        kind: 'pan',
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      }

      return
    }

    if (activePointer.kind !== 'drag' || mode !== 'PART_CREATOR_MODE') {
      if (activePointer.kind === 'point-drag' && mode === 'PART_CREATOR_MODE') {
        const worldPoint = clientToWorld(event.clientX, event.clientY, event.currentTarget)
        updateSelectedPointFromWorld(activePointer.pointIndex, snapCoordinate(worldPoint, gridSize))
      }
      return
    }

    const worldPoint = clientToWorld(event.clientX, event.clientY, event.currentTarget)
    const rawPosition = {
      x: worldPoint.x - activePointer.offset.x,
      y: worldPoint.y - activePointer.offset.y,
    }

    setElementPosition(activePointer.elementId, snapCoordinate(rawPosition, gridSize))
  }

  const handlePointHandlePointerDown = (
    event: PointerEvent<SVGCircleElement>,
    elementId: string,
    pointIndex: number,
  ) => {
    event.stopPropagation()

    if (mode !== 'PART_CREATOR_MODE') {
      return
    }

    selectElement(elementId)

    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId)
    }

    pointerRef.current = {
      kind: 'point-drag',
      id: event.pointerId,
      elementId,
      pointIndex,
    }
  }

  const handlePointerUp = (event: PointerEvent<SVGSVGElement>) => {
    if (pointerRef.current?.id !== event.pointerId) {
      return
    }

    pointerRef.current = null

    if (typeof event.currentTarget.hasPointerCapture === 'function' && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const renderElement = (element: ElementState) => {
    const selected = selectedElementIds.includes(element.id)

    if (element.type === 'group') {
      return null
    }

    if (element.type === 'circle') {
      return (
        <circle
          key={element.id}
          id={element.connector?.svgId ?? element.id}
          data-testid={`element-${element.id}`}
          data-selected={selected ? 'true' : 'false'}
          data-role={element.role}
          data-layer={element.pcbLayer}
          data-connector-id={element.connector?.connectorId ?? ''}
          cx={element.geom.x}
          cy={element.geom.y}
          r={element.geom.r ?? 1}
          fill={element.geom.filled ? 'rgba(247, 189, 19, 0.24)' : 'transparent'}
          stroke={selected ? '#40a9ff' : elementStroke(element)}
          strokeWidth={selected ? (element.geom.strokeWidth ?? 0.55) + 0.25 : (element.geom.strokeWidth ?? 0.55)}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          onPointerDown={(event) => handleElementPointerDown(event, element.id)}
        />
      )
    }

    if (element.type === 'rect') {
      const isOutline = element.role === 'silkscreen' || element.role === 'group'

      return (
        <rect
          key={element.id}
          id={element.connector?.svgId ?? element.id}
          data-testid={`element-${element.id}`}
          data-selected={selected ? 'true' : 'false'}
          data-role={element.role}
          data-layer={element.pcbLayer}
          data-connector-id={element.connector?.connectorId ?? ''}
          x={element.geom.x}
          y={element.geom.y}
          width={element.geom.w ?? 1}
          height={element.geom.h ?? 1}
          fill={isOutline ? 'none' : element.geom.filled ? 'rgba(247, 189, 19, 0.2)' : 'transparent'}
          stroke={selected ? '#40a9ff' : elementStroke(element)}
          strokeWidth={selected ? (element.geom.strokeWidth ?? 0.35) + 0.25 : (element.geom.strokeWidth ?? 0.35)}
          vectorEffect="non-scaling-stroke"
          pointerEvents={isOutline ? 'stroke' : 'visiblePainted'}
          onPointerDown={(event) => handleElementPointerDown(event, element.id)}
        />
      )
    }

    if (element.type === 'polygon') {
      const points = element.geom.points ?? []
      const pointString = points.map((point) => `${element.geom.x + point.x},${element.geom.y + point.y}`).join(' ')

      return (
        <polygon
          key={element.id}
          id={element.connector?.svgId ?? element.id}
          data-testid={`element-${element.id}`}
          data-selected={selected ? 'true' : 'false'}
          data-role={element.role}
          data-layer={element.pcbLayer}
          data-connector-id={element.connector?.connectorId ?? ''}
          points={pointString}
          fill={element.geom.filled ? (selected ? 'rgba(64, 169, 255, 0.2)' : 'rgba(247, 189, 19, 0.22)') : 'transparent'}
          stroke={selected ? '#40a9ff' : elementStroke(element)}
          strokeWidth={selected ? (element.geom.strokeWidth ?? 0.4) + 0.2 : (element.geom.strokeWidth ?? 0.4)}
          vectorEffect="non-scaling-stroke"
          onPointerDown={(event) => handleElementPointerDown(event, element.id)}
        />
      )
    }

    if (element.type === 'polyline') {
      const points = element.geom.points ?? []
      const pointString = points.map((point) => `${element.geom.x + point.x},${element.geom.y + point.y}`).join(' ')

      return (
        <polyline
          key={element.id}
          id={element.connector?.svgId ?? element.id}
          data-testid={`element-${element.id}`}
          data-selected={selected ? 'true' : 'false'}
          data-role={element.role}
          data-layer={element.pcbLayer}
          data-connector-id={element.connector?.connectorId ?? ''}
          points={pointString}
          fill="none"
          stroke={selected ? '#40a9ff' : elementStroke(element)}
          strokeWidth={selected ? (element.geom.strokeWidth ?? 0.5) + 0.25 : (element.geom.strokeWidth ?? 0.5)}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          onPointerDown={(event) => handleElementPointerDown(event, element.id)}
        />
      )
    }

    return (
      <line
        key={element.id}
        id={element.connector?.svgId ?? element.id}
        data-testid={`element-${element.id}`}
        data-selected={selected ? 'true' : 'false'}
        data-role={element.role}
        data-layer={element.pcbLayer}
        data-connector-id={element.connector?.connectorId ?? ''}
        x1={element.geom.x}
        y1={element.geom.y}
        x2={element.geom.x + (element.geom.w ?? 0)}
        y2={element.geom.y + (element.geom.h ?? 0)}
        fill="none"
        stroke={selected ? '#40a9ff' : elementStroke(element)}
        strokeWidth={selected ? (element.geom.strokeWidth ?? 0.5) + 0.25 : (element.geom.strokeWidth ?? 0.5)}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        onPointerDown={(event) => handleElementPointerDown(event, element.id)}
      />
    )
  }

  const renderGroupOutline = (group: ElementState) => {
    const selected = selectedElementId === group.id
    const bounds = boundsFromElement(group)

    return (
      <g key={group.id} data-testid={`group-${group.id}`}>
        <rect
          data-testid={`group-outline-${group.id}`}
          x={bounds.x}
          y={bounds.y}
          width={bounds.width}
          height={bounds.height}
          fill="transparent"
          stroke={selected ? '#ffffff' : outlineStroke}
          strokeDasharray={selected ? '0' : '2 1.5'}
          strokeWidth={selected ? 0.9 : 0.5}
          vectorEffect="non-scaling-stroke"
          pointerEvents="visiblePainted"
          onPointerDown={(event) => handleElementPointerDown(event as PointerEvent<SVGElement>, group.id)}
        />
        {selected ? (
          <>
            <circle cx={bounds.x} cy={bounds.y} r={0.7} fill="#ffffff" pointerEvents="none" />
            <circle cx={bounds.x + bounds.width} cy={bounds.y} r={0.7} fill="#ffffff" pointerEvents="none" />
            <circle cx={bounds.x} cy={bounds.y + bounds.height} r={0.7} fill="#ffffff" pointerEvents="none" />
            <circle
              cx={bounds.x + bounds.width}
              cy={bounds.y + bounds.height}
              r={0.7}
              fill="#ffffff"
              pointerEvents="none"
            />
          </>
        ) : null}
      </g>
    )
  }

  const renderSelectionBox = () => {
    if (!selectedElementId) {
      return null
    }

    const element = elements[selectedElementId]
    if (!element) {
      return null
    }

    const bounds = boundsFromElement(element)
    return (
      <g data-testid="selection-box" pointerEvents="none">
        <rect
          x={bounds.x - 0.8}
          y={bounds.y - 0.8}
          width={bounds.width + 1.6}
          height={bounds.height + 1.6}
          fill="none"
          stroke="#40a9ff"
          strokeWidth={0.35}
          strokeDasharray="2 1"
          vectorEffect="non-scaling-stroke"
        />
      </g>
    )
  }

  const renderPointHandles = () => {
    if (!selectedElementId) {
      return null
    }

    const element = elements[selectedElementId]
    if (!element || (element.type !== 'polyline' && element.type !== 'polygon')) {
      return null
    }

    const points = element.geom.points ?? []
    return (
      <g data-testid="point-handles">
        {points.map((point, index) => (
          <circle
            key={`${element.id}-point-${index}`}
            data-testid={`point-handle-${index}`}
            cx={element.geom.x + point.x}
            cy={element.geom.y + point.y}
            r={0.65}
            fill="#ffffff"
            stroke="#0b1117"
            strokeWidth={0.2}
            vectorEffect="non-scaling-stroke"
            onPointerDown={(event) => handlePointHandlePointerDown(event, element.id, index)}
          />
        ))}
      </g>
    )
  }

  const copper0Elements = Object.values(elements).filter((element) => element.pcbLayer === 'copper0')
  const copper1Elements = Object.values(elements).filter((element) => element.pcbLayer === 'copper1')
  const silkscreenElements = Object.values(elements).filter((element) => element.pcbLayer === 'silkscreen')
  const groupElements = Object.values(elements).filter((element) => element.type === 'group')

  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    const delta = event.deltaY < 0 ? 0.1 : -0.1
    setZoom(zoom + delta)
  }

  const draftPointString = draftPoints.map((point) => `${point.x},${point.y}`).join(' ')

  return (
    <svg
      viewBox={`0 0 ${GRID_VIEWBOX_SIZE} ${GRID_VIEWBOX_SIZE}`}
      className="pcb-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      role="img"
      aria-label="Mobile-first PCB workspace"
    >
      <defs>
        <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
          <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="#2a3440" strokeWidth="0.1" />
        </pattern>
      </defs>

      <g transform={`translate(${pan.x} ${pan.y})`}>
        <g transform={`scale(${zoom})`}>
          <rect
            x={-GRID_VIEWBOX_SIZE * 5}
            y={-GRID_VIEWBOX_SIZE * 5}
            width={GRID_VIEWBOX_SIZE * 10}
            height={GRID_VIEWBOX_SIZE * 10}
            fill="url(#grid)"
            pointerEvents="none"
          />
          <g id="copper1">
            {copper1Elements.map(renderElement)}
            <g id="copper0">
              {copper0Elements.map(renderElement)}
            </g>
          </g>
          <g id="silkscreen">
            {silkscreenElements.map(renderElement)}
          </g>
          {drawTool === 'polyline' && draftPoints.length > 0 ? (
            <polyline
              data-testid="draft-polyline"
              points={draftPointString}
              fill="none"
              stroke="#7eb7ff"
              strokeWidth={0.5}
              strokeDasharray="1.5 1"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          ) : null}
          {renderSelectionBox()}
          {renderPointHandles()}
          {groupElements.map(renderGroupOutline)}
        </g>
      </g>
    </svg>
  )
}
