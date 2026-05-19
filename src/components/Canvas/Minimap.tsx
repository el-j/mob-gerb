import React, { useRef, useState, useEffect } from 'react'
import { useEditorStore } from '../../store/editorStore'
import type { Coordinate } from '../../core/types/pcb'

const GRID_VIEWBOX_SIZE = 120

export const Minimap: React.FC = () => {
  const elements = useEditorStore((state) => state.project.elements)
  const pan = useEditorStore((state) => state.pan)
  const zoom = useEditorStore((state) => state.zoom)
  const setMode = useEditorStore((state) => state.setMode)

  const minimapRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Calculations for visible viewport rectangle in world space
  const viewportWidth = GRID_VIEWBOX_SIZE / zoom
  const viewportHeight = GRID_VIEWBOX_SIZE / zoom
  const viewportX = -pan.x / zoom
  const viewportY = -pan.y / zoom

  const updatePanFromMinimap = (clientX: number, clientY: number) => {
    const rect = minimapRef.current?.getBoundingClientRect()
    if (!rect) return

    const rx = ((clientX - rect.left) / rect.width) * GRID_VIEWBOX_SIZE
    const ry = ((clientY - rect.top) / rect.height) * GRID_VIEWBOX_SIZE

    // Clamp coordinates to stay within map bounds
    const clampedRx = Math.max(0, Math.min(GRID_VIEWBOX_SIZE, rx))
    const clampedRy = Math.max(0, Math.min(GRID_VIEWBOX_SIZE, ry))

    // Set pan so the main canvas centers around the clicked/dragged coordinate
    const targetPanX = -zoom * clampedRx + GRID_VIEWBOX_SIZE / 2
    const targetPanY = -zoom * clampedRy + GRID_VIEWBOX_SIZE / 2

    // Update pan directly in store
    useEditorStore.setState({
      pan: { x: targetPanX, y: targetPanY },
    })
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    setIsDragging(true)
    updatePanFromMinimap(e.clientX, e.clientY)
    if (minimapRef.current && typeof minimapRef.current.setPointerCapture === 'function') {
      minimapRef.current.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    e.stopPropagation()
    updatePanFromMinimap(e.clientX, e.clientY)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false)
    if (minimapRef.current && typeof minimapRef.current.releasePointerCapture === 'function') {
      minimapRef.current.releasePointerCapture(e.pointerId)
    }
  }

  const elementList = Object.values(elements)

  return (
    <div
      ref={minimapRef}
      className="pcb-minimap-container"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-label="Workspace minimap preview"
    >
      <svg
        viewBox={`0 0 ${GRID_VIEWBOX_SIZE} ${GRID_VIEWBOX_SIZE}`}
        className="pcb-minimap-svg"
      >
        {/* Render board elements in miniature */}
        {elementList.map((el) => {
          if (el.type === 'circle') {
            return (
              <circle
                key={el.id}
                cx={el.geom.x}
                cy={el.geom.y}
                r={el.geom.r ?? 1}
                fill={el.pcbLayer === 'copper1' ? '#ff4d4f' : el.pcbLayer === 'copper0' ? '#52c41a' : '#ffffff'}
                fillOpacity={0.65}
              />
            )
          }
          if (el.type === 'rect') {
            return (
              <rect
                key={el.id}
                x={el.geom.x}
                y={el.geom.y}
                width={el.geom.w ?? 1}
                height={el.geom.h ?? 1}
                fill={el.pcbLayer === 'copper1' ? '#ff4d4f' : el.pcbLayer === 'copper0' ? '#52c41a' : '#ffffff'}
                fillOpacity={0.65}
              />
            )
          }
          if (el.type === 'polygon' || el.type === 'polyline') {
            const points = el.geom.points ?? []
            const ptsStr = points.map((p) => `${el.geom.x + p.x},${el.geom.y + p.y}`).join(' ')
            if (el.type === 'polygon') {
              return (
                <polygon
                  key={el.id}
                  points={ptsStr}
                  fill={el.pcbLayer === 'copper1' ? '#ff4d4f' : el.pcbLayer === 'copper0' ? '#52c41a' : '#ffffff'}
                  fillOpacity={0.6}
                />
              )
            } else {
              return (
                <polyline
                  key={el.id}
                  points={ptsStr}
                  fill="none"
                  stroke={el.pcbLayer === 'copper1' ? '#ff4d4f' : el.pcbLayer === 'copper0' ? '#52c41a' : '#ffffff'}
                  strokeWidth={el.geom.strokeWidth ?? 1}
                  strokeOpacity={0.65}
                  strokeLinecap="round"
                />
              )
            }
          }
          return null
        })}

        {/* Highlighted viewport rectangle */}
        <rect
          x={viewportX}
          y={viewportY}
          width={viewportWidth}
          height={viewportHeight}
          fill="rgba(64, 169, 255, 0.12)"
          stroke="#40a9ff"
          strokeWidth={0.75}
          strokeDasharray="2 1"
          pointerEvents="none"
        />
      </svg>
      <div className="pcb-minimap-indicator">PREVIEW</div>
    </div>
  )
}
