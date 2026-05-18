import { type PointerEvent, type WheelEvent, useRef } from 'react'

import { snapCoordinate } from '../../core/math/coordinates'
import { useEditorStore } from '../../store/editorStore'

type ActivePointer = {
  id: number
  x: number
  y: number
}

const GRID_VIEWBOX_SIZE = 120

export const PcbCanvas = () => {
  const mode = useEditorStore((state) => state.mode)
  const pan = useEditorStore((state) => state.pan)
  const zoom = useEditorStore((state) => state.zoom)
  const gridSize = useEditorStore((state) => state.gridSize)
  const panBy = useEditorStore((state) => state.panBy)
  const setZoom = useEditorStore((state) => state.setZoom)

  const pointerRef = useRef<ActivePointer | null>(null)

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (mode !== 'VIEW_MODE') {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    pointerRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    }
  }

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const activePointer = pointerRef.current
    if (!activePointer || activePointer.id !== event.pointerId || mode !== 'VIEW_MODE') {
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
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    }
  }

  const handlePointerUp = (event: PointerEvent<SVGSVGElement>) => {
    if (pointerRef.current?.id === event.pointerId) {
      pointerRef.current = null
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault()
    const delta = event.deltaY < 0 ? 0.1 : -0.1
    setZoom(zoom + delta)
  }

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

      <rect width="100%" height="100%" fill="url(#grid)" />

      <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
        <g id="copper1">
          <g id="copper0">
            <circle id="connector0pin" cx="20" cy="20" r="1.2" fill="none" stroke="#f7bd13" strokeWidth="0.4" />
          </g>
        </g>
        <g id="silkscreen">
          <rect x="14" y="14" width="12" height="12" fill="none" stroke="#f4f7fb" strokeWidth="0.2" />
        </g>
      </g>
    </svg>
  )
}
