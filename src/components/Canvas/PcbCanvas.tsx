import { type PointerEvent, type WheelEvent, type MouseEvent, useEffect, useRef, useState } from 'react'

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
  offset: Coordinate
}

type ActivePointer = PanPointer | DragPointer | PointDragPointer

const GRID_VIEWBOX_SIZE = 120

const elementStroke = (element: ElementState): string => {
  if (element.role === 'group') {
    return '#91a1b6'
  }

  switch (element.pcbLayer) {
    case 'copper1':
      return '#da8a3a'
    case 'copper0':
      return '#8f3d03'
    case 'copper2':
      return '#a855f7'
    case 'copper3':
      return '#ec4899'
    case 'silkscreen':
      return '#ffffff'
    default:
      return '#91a1b6'
  }
}

const elementFill = (element: ElementState, selected: boolean): string => {
  const isOutline = element.role === 'silkscreen' || element.role === 'group'
  if (isOutline) return 'none'

  if (selected) {
    return 'rgba(64, 169, 255, 0.2)'
  }

  if (!element.geom.filled) {
    return 'transparent'
  }

  switch (element.pcbLayer) {
    case 'copper1':
      return 'rgba(218, 138, 58, 0.22)'
    case 'copper0':
      return 'rgba(143, 61, 3, 0.22)'
    case 'copper2':
      return 'rgba(168, 85, 247, 0.22)'
    case 'copper3':
      return 'rgba(236, 72, 153, 0.22)'
    default:
      return 'rgba(255, 255, 255, 0.1)'
  }
}

const outlineStroke = '#ffffff'

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
  const addPointToSelectedShape = useEditorStore((state) => state.addPointToSelectedShape)
  const removePointFromSelectedShape = useEditorStore((state) => state.removePointFromSelectedShape)
  const copySelected = useEditorStore((state) => state.copySelected)
  const pasteCopied = useEditorStore((state) => state.pasteCopied)
  const deleteSelected = useEditorStore((state) => state.deleteSelected)
  const addDraftPoint = useEditorStore((state) => state.addDraftPoint)
  const pendingNetConnection = useEditorStore((state) => state.pendingNetConnection)
  const logicalDraftPointer = useEditorStore((state) => state.logicalDraftPointer)
  const nets = useEditorStore((state) => state.project.nets)
  const startLogicalConnection = useEditorStore((state) => state.startLogicalConnection)
  const completeLogicalConnection = useEditorStore((state) => state.completeLogicalConnection)
  const cancelLogicalConnection = useEditorStore((state) => state.cancelLogicalConnection)
  const setLogicalDraftPointer = useEditorStore((state) => state.setLogicalDraftPointer)
  const isRouting = useEditorStore((state) => state.isRouting)
  const editingTraceId = useEditorStore((state) => state.editingTraceId)
  const drcViolations = useEditorStore((state) => state.drcViolations)
  const enterTraceEdit = useEditorStore((state) => state.enterTraceEdit)
  const exitTraceEdit = useEditorStore((state) => state.exitTraceEdit)
  const updateTraceVertex = useEditorStore((state) => state.updateTraceVertex)
  const hoveredElementId = useEditorStore((state) => state.hoveredElementId)
  const hiddenElementIds = useEditorStore((state) => state.hiddenElementIds)

  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const spacePressedRef = useRef(false)

  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const initialTouchDistance = useRef(0)
  const initialTouchZoom = useRef(1)
  const initialTouchCenter = useRef({ x: 0, y: 0 })
  const initialTouchPan = useRef({ x: 0, y: 0 })

  const pointerRef = useRef<ActivePointer | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        setIsSpacePressed(true)
        spacePressedRef.current = true
      }

      if (event.key === 'Escape' && mode === 'LOGICAL_MODE') {
        cancelLogicalConnection()
      }

      if (event.key === 'Escape' && mode === 'EDIT_TRACE_MODE') {
        exitTraceEdit()
      }

      if (mode !== 'PART_CREATOR_MODE') return

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const isCmdOrCtrl = isMac ? event.metaKey : event.ctrlKey

      if (isCmdOrCtrl && event.key === 'c') {
        copySelected()
      } else if (isCmdOrCtrl && event.key === 'v') {
        pasteCopied()
      } else if (event.key === 'Backspace' || event.key === 'Delete') {
        deleteSelected()
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setIsSpacePressed(false)
        spacePressedRef.current = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [mode, copySelected, pasteCopied, deleteSelected, cancelLogicalConnection, exitTraceEdit])

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

    if (isRouting) return // Lock canvas during autorouting

    if (mode === 'LOGICAL_MODE') {
      const element = elements[elementId]
      if (element?.role === 'connector') {
        if (pendingNetConnection) {
          completeLogicalConnection(elementId)
        } else {
          startLogicalConnection(elementId)
        }
      }
      return
    }

    // In view mode, tapping a routed polyline enters trace editing quickly.
    // In trace-edit mode, double-click on another polyline switches the edited trace.
    if (mode === 'VIEW_MODE' || mode === 'EDIT_TRACE_MODE') {
      const element = elements[elementId]
      if (element?.type === 'polyline' && (mode === 'VIEW_MODE' || event.detail >= 2)) {
        enterTraceEdit(elementId)
        return
      }
      // In EDIT_TRACE_MODE clicking a non-active element exits
      if (mode === 'EDIT_TRACE_MODE' && elementId !== editingTraceId) {
        exitTraceEdit()
      }
      return
    }

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

  const handleElementDoubleClick = (event: MouseEvent<SVGElement>, elementId: string) => {
    event.stopPropagation()

    if (mode !== 'VIEW_MODE' && mode !== 'EDIT_TRACE_MODE') {
      return
    }

    const element = elements[elementId]
    if (element?.type === 'polyline') {
      enterTraceEdit(elementId)
    }
  }

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (isRouting) return // Lock canvas during autorouting

    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    // Check for multi-pointer mobile touch gestures
    if (activePointers.current.size === 2) {
      const pts = Array.from(activePointers.current.values())
      const dx = pts[0].x - pts[1].x
      const dy = pts[0].y - pts[1].y
      initialTouchDistance.current = Math.sqrt(dx * dx + dy * dy)
      initialTouchZoom.current = zoom
      initialTouchCenter.current = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
      initialTouchPan.current = { ...pan }

      if (pointerRef.current) {
        if (typeof event.currentTarget.releasePointerCapture === 'function' && event.currentTarget.hasPointerCapture(pointerRef.current.id)) {
          event.currentTarget.releasePointerCapture(pointerRef.current.id)
        }
        pointerRef.current = null
      }
      return
    }

    const isPanning =
      spacePressedRef.current ||
      event.button === 1 ||
      event.button === 2 ||
      (mode === 'VIEW_MODE' && !event.defaultPrevented)

    if (isPanning) {
      if (typeof event.currentTarget.setPointerCapture === 'function') {
        event.currentTarget.setPointerCapture(event.pointerId)
      }
      pointerRef.current = {
        kind: 'pan',
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      }
      return
    }

    if (mode !== 'VIEW_MODE') {
      if (mode === 'PART_CREATOR_MODE') {
        if (drawTool === 'polyline') {
          const worldPoint = clientToWorld(event.clientX, event.clientY, event.currentTarget)
          addDraftPoint(snapCoordinate(worldPoint, gridSize))
          return
        }

        if (event.target === event.currentTarget) {
          selectElement(null)
        }
      }
      return
    }
  }

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (activePointers.current.has(event.pointerId)) {
      activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    }

    if (mode === 'LOGICAL_MODE' && pendingNetConnection) {
      const worldPoint = clientToWorld(event.clientX, event.clientY, event.currentTarget)
      setLogicalDraftPointer(snapCoordinate(worldPoint, gridSize))
    }

    // Handle 2-finger mobile gesture
    if (activePointers.current.size === 2) {
      const pts = Array.from(activePointers.current.values())
      const dx = pts[0].x - pts[1].x
      const dy = pts[0].y - pts[1].y
      const currentDist = Math.sqrt(dx * dx + dy * dy)
      const currentCenter = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }

      if (initialTouchDistance.current > 0) {
        const scale = currentDist / initialTouchDistance.current
        const newZoom = initialTouchZoom.current * scale
        setZoom(newZoom)

        const dCenterX = currentCenter.x - initialTouchCenter.current.x
        const dCenterY = currentCenter.y - initialTouchCenter.current.y

        panBy({
          x: dCenterX / zoom,
          y: dCenterY / zoom,
        })

        // Anchors tracking update
        initialTouchDistance.current = currentDist
        initialTouchCenter.current = currentCenter
        initialTouchZoom.current = newZoom
      }
      return
    }

    const activePointer = pointerRef.current
    if (!activePointer || activePointer.id !== event.pointerId) {
      return
    }

    if (activePointer.kind === 'pan') {
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
      if (activePointer.kind === 'point-drag' && mode === 'EDIT_TRACE_MODE' && editingTraceId) {
        const worldPoint = clientToWorld(event.clientX, event.clientY, event.currentTarget)
        const trace = elements[editingTraceId]
        if (trace) {
          const snapped = snapCoordinate(worldPoint, gridSize)
          // Convert world coords back to relative coords (relative to trace geom origin)
          updateTraceVertex(editingTraceId, activePointer.pointIndex, {
            x: snapped.x - trace.geom.x,
            y: snapped.y - trace.geom.y,
          })
        }
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
      offset: { x: 0, y: 0 },
    }
  }

  const handlePointHandleDoubleClick = (
    event: MouseEvent<SVGCircleElement>,
    _elementId: string,
    pointIndex: number,
  ) => {
    event.stopPropagation()
    if (mode !== 'PART_CREATOR_MODE') {
      return
    }

    removePointFromSelectedShape(pointIndex)
  }

  const handleMidpointPointerDown = (
    event: PointerEvent<SVGCircleElement>,
    elementId: string,
    insertIndex: number,
  ) => {
    event.stopPropagation()

    if (mode !== 'PART_CREATOR_MODE') {
      return
    }

    selectElement(elementId)

    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId)
    }

    const svgElement = event.currentTarget.ownerSVGElement
    if (!svgElement) {
      return
    }

    const worldPoint = clientToWorld(event.clientX, event.clientY, svgElement)
    const snappedPoint = snapCoordinate(worldPoint, gridSize)

    addPointToSelectedShape(insertIndex, snappedPoint)

    pointerRef.current = {
      kind: 'point-drag',
      id: event.pointerId,
      elementId,
      pointIndex: insertIndex,
      offset: { x: 0, y: 0 },
    }
  }

  const handlePointerUp = (event: PointerEvent<SVGSVGElement>) => {
    activePointers.current.delete(event.pointerId)

    if (activePointers.current.size < 2) {
      initialTouchDistance.current = 0
    }

    if (pointerRef.current?.id !== event.pointerId) {
      return
    }

    pointerRef.current = null

    if (typeof event.currentTarget.hasPointerCapture === 'function' && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const getElementCenter = (el: ElementState): Coordinate => {
    if (el.type === 'circle') return { x: el.geom.x, y: el.geom.y }
    if (el.type === 'rect') return { x: el.geom.x + (el.geom.w ?? 0)/2, y: el.geom.y + (el.geom.h ?? 0)/2 }
    return { x: el.geom.x, y: el.geom.y }
  }

  const renderAirwires = () => {
    const airwires = []
    
    Object.values(nets).forEach(net => {
      if (net.padIds.length < 2) return
      
      for (let i = 0; i < net.padIds.length - 1; i++) {
        const p1 = elements[net.padIds[i]]
        const p2 = elements[net.padIds[i + 1]]
        if (!p1 || !p2) continue
        
        const center1 = getElementCenter(p1)
        const center2 = getElementCenter(p2)
        
        airwires.push(
          <line
            key={`airwire-${net.id}-${i}`}
            x1={center1.x}
            y1={center1.y}
            x2={center2.x}
            y2={center2.y}
            stroke="#10b981"
            strokeWidth={Math.max(0.1, 0.4 / zoom)}
            strokeDasharray={`${Math.max(0.5, 2 / zoom)},${Math.max(0.5, 2 / zoom)}`}
            pointerEvents="none"
          />
        )
      }
    })
    
    if (mode === 'LOGICAL_MODE' && pendingNetConnection && logicalDraftPointer) {
      const p1 = elements[pendingNetConnection]
      if (p1) {
        const center1 = getElementCenter(p1)
        
        airwires.push(
          <line
            key="draft-airwire"
            x1={center1.x}
            y1={center1.y}
            x2={logicalDraftPointer.x}
            y2={logicalDraftPointer.y}
            stroke="#3b82f6"
            strokeWidth={Math.max(0.1, 0.4 / zoom)}
            strokeDasharray={`${Math.max(0.5, 2 / zoom)},${Math.max(0.5, 2 / zoom)}`}
            pointerEvents="none"
          />
        )
      }
    }
    
    return airwires
  }

  const handleTraceHandlePointerDown = (
    event: PointerEvent<SVGCircleElement>,
    traceId: string,
    pointIndex: number,
  ) => {
    event.stopPropagation()
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    const svgEl = event.currentTarget.ownerSVGElement
    if (!svgEl) return
    pointerRef.current = {
      kind: 'point-drag',
      id: event.pointerId,
      elementId: traceId,
      pointIndex,
      offset: { x: 0, y: 0 },
    }
  }

  const renderTraceHandles = () => {
    if (mode !== 'EDIT_TRACE_MODE' || !editingTraceId) return null
    const trace = elements[editingTraceId]
    if (!trace || trace.type !== 'polyline') return null
    const pts = trace.geom.points ?? []
    const handleR = Math.max(1, 3 / zoom)

    return pts.map((pt, i) => {
      const absX = trace.geom.x + pt.x
      const absY = trace.geom.y + pt.y
      return (
        <circle
          key={`trace-handle-${i}`}
          data-testid={`trace-handle-${i}`}
          cx={absX}
          cy={absY}
          r={handleR}
          fill="#3b82f6"
          stroke="#1e40af"
          strokeWidth={Math.max(0.1, 0.3 / zoom)}
          style={{ cursor: 'grab' }}
          onPointerDown={(e) => handleTraceHandlePointerDown(e, editingTraceId, i)}
        />
      )
    })
  }

  const renderDrcHalos = () => {
    if (drcViolations.length === 0) return null
    const violatingIds = new Set(drcViolations.flatMap((v) => v.elementIds))
    return Array.from(violatingIds).map((elId) => {
      const el = elements[elId]
      if (!el || el.type === 'group') return null
      const bb = el.type === 'circle'
        ? { x: el.geom.x - (el.geom.r ?? 0) - 0.5, y: el.geom.y - (el.geom.r ?? 0) - 0.5, w: (el.geom.r ?? 0) * 2 + 1, h: (el.geom.r ?? 0) * 2 + 1 }
        : { x: el.geom.x - 0.5, y: el.geom.y - 0.5, w: (el.geom.w ?? 2) + 1, h: (el.geom.h ?? 2) + 1 }
      return (
        <rect
          key={`drc-halo-${elId}`}
          className="drc-violation-halo"
          x={bb.x}
          y={bb.y}
          width={bb.w}
          height={bb.h}
          fill="none"
          stroke="#ef4444"
          strokeWidth={Math.max(0.1, 0.5 / zoom)}
          rx={0.3}
          pointerEvents="none"
        />
      )
    })
  }

  const renderElement = (element: ElementState) => {
    const selected = selectedElementIds.includes(element.id)
    const hovered = element.id === hoveredElementId || (element.groupId && element.groupId === hoveredElementId)

    if (element.type === 'group') {
      return null
    }

    if (element.type === 'circle') {
      return (
        <g key={element.id}>
          {hovered && (
            <circle
              cx={element.geom.x}
              cy={element.geom.y}
              r={(element.geom.r ?? 1) + 0.4}
              fill="none"
              stroke="#40a9ff"
              strokeWidth={1.5}
              strokeOpacity={0.6}
              pointerEvents="none"
              vectorEffect="non-scaling-stroke"
            />
          )}
          <circle
            id={element.connector?.svgId ?? element.id}
            data-testid={`element-${element.id}`}
            data-selected={selected ? 'true' : 'false'}
            data-role={element.role}
            data-layer={element.pcbLayer}
            data-connector-id={element.connector?.connectorId ?? ''}
            cx={element.geom.x}
            cy={element.geom.y}
            r={element.geom.r ?? 1}
            fill={elementFill(element, selected)}
            stroke={selected ? '#40a9ff' : elementStroke(element)}
            strokeWidth={selected ? (element.geom.strokeWidth ?? 1) + 0.25 : (element.geom.strokeWidth ?? 0.55)}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            onPointerDown={(event) => handleElementPointerDown(event, element.id)}
          />
        </g>
      )
    }

    if (element.type === 'rect') {
      const isOutline = element.role === 'silkscreen' || element.role === 'group'

      return (
        <g key={element.id}>
          {hovered && (
            <rect
              x={element.geom.x - 0.4}
              y={element.geom.y - 0.4}
              width={(element.geom.w ?? 1) + 0.8}
              height={(element.geom.h ?? 1) + 0.8}
              fill="none"
              stroke="#40a9ff"
              strokeWidth={1.5}
              strokeOpacity={0.6}
              pointerEvents="none"
              vectorEffect="non-scaling-stroke"
            />
          )}
          <rect
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
            fill={elementFill(element, selected)}
            stroke={selected ? '#40a9ff' : elementStroke(element)}
            strokeWidth={selected ? (element.geom.strokeWidth ?? 1) + 0.25 : (element.geom.strokeWidth ?? 1)}
            vectorEffect="non-scaling-stroke"
            pointerEvents={isOutline ? 'stroke' : 'visiblePainted'}
            onPointerDown={(event) => handleElementPointerDown(event, element.id)}
          />
        </g>
      )
    }

    if (element.type === 'polygon') {
      const points = element.geom.points ?? []
      const pointString = points.map((point) => `${element.geom.x + point.x},${element.geom.y + point.y}`).join(' ')

      return (
        <g key={element.id}>
          {hovered && (
            <polygon
              points={pointString}
              fill="none"
              stroke="#40a9ff"
              strokeWidth={(element.geom.strokeWidth ?? 1) + 1.2}
              strokeOpacity={0.6}
              pointerEvents="none"
              vectorEffect="non-scaling-stroke"
            />
          )}
          <polygon
            id={element.connector?.svgId ?? element.id}
            data-testid={`element-${element.id}`}
            data-selected={selected ? 'true' : 'false'}
            data-role={element.role}
            data-layer={element.pcbLayer}
            data-connector-id={element.connector?.connectorId ?? ''}
            points={pointString}
            fill={elementFill(element, selected)}
            stroke={selected ? '#40a9ff' : elementStroke(element)}
            strokeWidth={selected ? (element.geom.strokeWidth ?? 1) + 0.2 : (element.geom.strokeWidth ?? 1)}
            vectorEffect="non-scaling-stroke"
            onPointerDown={(event) => handleElementPointerDown(event, element.id)}
          />
        </g>
      )
    }

    if (element.type === 'polyline') {
      const points = element.geom.points ?? []
      const pointString = points.map((point) => `${element.geom.x + point.x},${element.geom.y + point.y}`).join(' ')

      return (
        <g
          key={element.id}
          data-testid={`element-${element.id}`}
          data-selected={selected ? 'true' : 'false'}
          data-role={element.role}
          data-layer={element.pcbLayer}
          data-connector-id={element.connector?.connectorId ?? ''}
          onPointerDown={(event) => handleElementPointerDown(event, element.id)}
          onDoubleClick={(event) => handleElementDoubleClick(event, element.id)}
        >
          {hovered && (
            <polyline
              points={pointString}
              fill="none"
              stroke="#40a9ff"
              strokeWidth={(element.geom.strokeWidth ?? 1) + 1.5}
              strokeOpacity={0.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {/* Fat transparent stroke for easier hit testing */}
          <polyline
            points={pointString}
            fill="none"
            stroke="transparent"
            strokeWidth={15}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            id={element.connector?.svgId ?? element.id}
            points={pointString}
            fill="none"
            stroke={selected ? '#40a9ff' : elementStroke(element)}
            strokeWidth={selected ? (element.geom.strokeWidth ?? 1) + 0.25 : (element.geom.strokeWidth ?? 1)}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      )
    }

    return (
      <g
        key={element.id}
        data-testid={`element-${element.id}`}
        data-selected={selected ? 'true' : 'false'}
        data-role={element.role}
        data-layer={element.pcbLayer}
        data-connector-id={element.connector?.connectorId ?? ''}
        onPointerDown={(event) => handleElementPointerDown(event, element.id)}
        onDoubleClick={(event) => handleElementDoubleClick(event, element.id)}
      >
        {hovered && (
          <line
            x1={element.geom.x}
            y1={element.geom.y}
            x2={element.geom.x + (element.geom.w ?? 0)}
            y2={element.geom.y + (element.geom.h ?? 0)}
            fill="none"
            stroke="#40a9ff"
            strokeWidth={(element.geom.strokeWidth ?? 1) + 1.5}
            strokeOpacity={0.5}
            strokeLinecap="round"
            pointerEvents="none"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {/* Fat transparent stroke for easier hit testing */}
        <line
          x1={element.geom.x}
          y1={element.geom.y}
          x2={element.geom.x + (element.geom.w ?? 0)}
          y2={element.geom.y + (element.geom.h ?? 0)}
          fill="none"
          stroke="transparent"
          strokeWidth={15}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <line
          id={element.connector?.svgId ?? element.id}
          x1={element.geom.x}
          y1={element.geom.y}
          x2={element.geom.x + (element.geom.w ?? 0)}
          y2={element.geom.y + (element.geom.h ?? 0)}
          fill="none"
          stroke={selected ? '#40a9ff' : elementStroke(element)}
          strokeWidth={selected ? (element.geom.strokeWidth ?? 1) + 0.25 : (element.geom.strokeWidth ?? 1)}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </g>
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
    
    const midpoints: React.ReactNode[] = []
    if (points.length >= 2) {
      const numSegments = element.type === 'polygon' ? points.length : points.length - 1
      for (let i = 0; i < numSegments; i++) {
        const p1 = points[i]
        const p2 = points[(i + 1) % points.length]
        const midX = (p1.x + p2.x) / 2
        const midY = (p1.y + p2.y) / 2

        midpoints.push(
          <circle
            key={`${element.id}-midpoint-${i}`}
            data-testid={`midpoint-handle-${i}`}
            cx={element.geom.x + midX}
            cy={element.geom.y + midY}
            r={0.5}
            fill="#7eb7ff"
            fillOpacity={0.6}
            stroke="#0b1117"
            strokeWidth={0.15}
            vectorEffect="non-scaling-stroke"
            onPointerDown={(event) => handleMidpointPointerDown(event, element.id, i + 1)}
          />
        )
      }
    }

    return (
      <g data-testid="point-handles">
        {midpoints}
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
            onDoubleClick={(event) => handlePointHandleDoubleClick(event, element.id, index)}
          />
        ))}
      </g>
    )
  }

  const visibleElements = Object.values(elements).filter((element) => !hiddenElementIds.includes(element.id))

  const copper0Elements = visibleElements.filter((element) => element.pcbLayer === 'copper0')
  const copper1Elements = visibleElements.filter((element) => element.pcbLayer === 'copper1')
  const silkscreenElements = visibleElements.filter((element) => element.pcbLayer === 'silkscreen')
  const groupElements = visibleElements.filter((element) => element.type === 'group')

  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault()
    if (event.ctrlKey) {
      const delta = event.deltaY < 0 ? 0.05 : -0.05
      setZoom(zoom + delta)
    } else {
      panBy({
        x: -event.deltaX / 10 / zoom,
        y: -event.deltaY / 10 / zoom,
      })
    }
  }

  const draftPointString = draftPoints.map((point) => `${point.x},${point.y}`).join(' ')

  return (
    <svg
      viewBox={`0 0 ${GRID_VIEWBOX_SIZE} ${GRID_VIEWBOX_SIZE}`}
      className={`pcb-canvas ${isSpacePressed ? 'space-grab' : ''} ${pointerRef.current?.kind === 'pan' ? 'space-grabbing' : ''}`}
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
              strokeWidth={0.75}
              strokeDasharray="1.5 1"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          ) : null}
          {renderAirwires()}
          {renderDrcHalos()}
          {renderSelectionBox()}
          {renderPointHandles()}
          {renderTraceHandles()}
          {groupElements.map(renderGroupOutline)}
        </g>
      </g>
      {isRouting ? (
        <rect
          x={0}
          y={0}
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.35)"
          data-testid="routing-overlay"
          pointerEvents="all"
        />
      ) : null}
      {mode === 'EDIT_TRACE_MODE' && editingTraceId ? (
        <rect
          x={0}
          y={0}
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.18)"
          data-testid="trace-edit-overlay"
          pointerEvents="none"
        />
      ) : null}
    </svg>
  )
}
