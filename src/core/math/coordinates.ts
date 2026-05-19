import type { Coordinate } from '../types/pcb'

export const MM_PER_SVG_UNIT = 1

/**
 * Converts an SVG coordinate into millimeters.
 */
export const svgToMillimeters = (value: number): number => value * MM_PER_SVG_UNIT

/**
 * Snaps a single value to the nearest grid step.
 */
export const snapToGrid = (value: number, gridSize: number): number => {
  if (gridSize <= 0) {
    return value
  }

  return Math.round(value / gridSize) * gridSize
}

/**
 * Snaps X/Y coordinates to a grid in millimeters.
 */
export const snapCoordinate = (point: Coordinate, gridSize: number): Coordinate => ({
  x: snapToGrid(point.x, gridSize),
  y: snapToGrid(point.y, gridSize),
})
