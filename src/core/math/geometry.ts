import type { Coordinate, ElementState } from '../types/pcb'

export type Bounds = {
  x: number
  y: number
  width: number
  height: number
}

const EMPTY_BOUNDS: Bounds = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
}

export const boundsFromPoints = (points: Coordinate[]): Bounds => {
  if (points.length === 0) {
    return EMPTY_BOUNDS
  }

  let minX = points[0].x
  let maxX = points[0].x
  let minY = points[0].y
  let maxY = points[0].y

  for (const point of points) {
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minY = Math.min(minY, point.y)
    maxY = Math.max(maxY, point.y)
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

export const boundsFromElement = (element: ElementState): Bounds => {
  if (element.type === 'circle') {
    const radius = element.geom.r ?? 0
    return {
      x: element.geom.x - radius,
      y: element.geom.y - radius,
      width: radius * 2,
      height: radius * 2,
    }
  }

  if (element.type === 'rect' || element.type === 'group') {
    return {
      x: element.geom.x,
      y: element.geom.y,
      width: element.geom.w ?? 0,
      height: element.geom.h ?? 0,
    }
  }

  if (element.type === 'line') {
    const x2 = element.geom.x + (element.geom.w ?? 0)
    const y2 = element.geom.y + (element.geom.h ?? 0)
    return {
      x: Math.min(element.geom.x, x2),
      y: Math.min(element.geom.y, y2),
      width: Math.abs(x2 - element.geom.x),
      height: Math.abs(y2 - element.geom.y),
    }
  }

  if (element.type === 'polygon') {
    const points = element.geom.points ?? []
    if (points.length === 0) {
      return {
        x: element.geom.x,
        y: element.geom.y,
        width: 0,
        height: 0,
      }
    }

    return boundsFromPoints(
      points.map((point) => ({
        x: element.geom.x + point.x,
        y: element.geom.y + point.y,
      })),
    )
  }

  return EMPTY_BOUNDS
}

export const boundsToRect = (bounds: Bounds): { x: number; y: number; w: number; h: number } => ({
  x: bounds.x,
  y: bounds.y,
  w: bounds.width,
  h: bounds.height,
})

export const inflateBounds = (bounds: Bounds, padding: number): Bounds => ({
  x: bounds.x - padding,
  y: bounds.y - padding,
  width: bounds.width + padding * 2,
  height: bounds.height + padding * 2,
})

export const unionBounds = (boundsList: Bounds[]): Bounds => {
  if (boundsList.length === 0) {
    return EMPTY_BOUNDS
  }

  let minX = boundsList[0].x
  let minY = boundsList[0].y
  let maxX = boundsList[0].x + boundsList[0].width
  let maxY = boundsList[0].y + boundsList[0].height

  for (const bounds of boundsList.slice(1)) {
    minX = Math.min(minX, bounds.x)
    minY = Math.min(minY, bounds.y)
    maxX = Math.max(maxX, bounds.x + bounds.width)
    maxY = Math.max(maxY, bounds.y + bounds.height)
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}
