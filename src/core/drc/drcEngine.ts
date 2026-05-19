import type { ElementState } from '../types/pcb'

export type DrcViolation = {
  id: string
  type: 'clearance' | 'short'
  elementIds: [string, string]
  message: string
}

type BoundingBox = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export const getElementBoundingBox = (el: ElementState): BoundingBox | null => {
  if (el.type === 'circle') {
    const r = el.geom.r ?? 0
    return { minX: el.geom.x - r, minY: el.geom.y - r, maxX: el.geom.x + r, maxY: el.geom.y + r }
  }
  if (el.type === 'rect') {
    return {
      minX: el.geom.x,
      minY: el.geom.y,
      maxX: el.geom.x + (el.geom.w ?? 0),
      maxY: el.geom.y + (el.geom.h ?? 0),
    }
  }
  if (el.type === 'polygon' || el.type === 'polyline' || el.type === 'line') {
    const pts = el.geom.points ?? []
    if (pts.length === 0) {
      return { minX: el.geom.x, minY: el.geom.y, maxX: el.geom.x, maxY: el.geom.y }
    }
    const absXs = pts.map((p) => el.geom.x + p.x)
    const absYs = pts.map((p) => el.geom.y + p.y)
    return {
      minX: Math.min(...absXs),
      minY: Math.min(...absYs),
      maxX: Math.max(...absXs),
      maxY: Math.max(...absYs),
    }
  }
  return null
}

/** Axis-aligned minimum separation between two bounding boxes. Negative means overlap. */
const aabbSeparation = (a: BoundingBox, b: BoundingBox): number => {
  const gapX = Math.max(a.minX, b.minX) - Math.min(a.maxX, b.maxX)
  const gapY = Math.max(a.minY, b.minY) - Math.min(a.maxY, b.maxY)
  // If one gap is negative, the boxes overlap on that axis
  if (gapX < 0 && gapY < 0) return Math.max(gapX, gapY) // overlap — negative value
  if (gapX < 0) return gapY
  if (gapY < 0) return gapX
  return Math.sqrt(gapX * gapX + gapY * gapY)
}

/**
 * Run Design Rule Checks across all copper elements.
 * Checks clearance violations between elements on different nets.
 * Silkscreen and group elements are excluded.
 */
export const runDrc = (
  elements: Record<string, ElementState>,
  clearanceMm: number,
): DrcViolation[] => {
  const copperEls = Object.values(elements).filter(
    (el) => el.pcbLayer !== 'silkscreen' && el.type !== 'group' && el.role !== 'unassigned',
  )

  const violations: DrcViolation[] = []
  const seen = new Set<string>()

  for (let i = 0; i < copperEls.length; i++) {
    for (let j = i + 1; j < copperEls.length; j++) {
      const a = copperEls[i]
      const b = copperEls[j]

      // Skip same-net pairs
      if (a.net && b.net && a.net === b.net) continue

      const pairKey = [a.id, b.id].sort().join(':')
      if (seen.has(pairKey)) continue
      seen.add(pairKey)

      const bbA = getElementBoundingBox(a)
      const bbB = getElementBoundingBox(b)
      if (!bbA || !bbB) continue

      const sep = aabbSeparation(bbA, bbB)

      if (sep < clearanceMm) {
        const type: DrcViolation['type'] = sep < 0 ? 'short' : 'clearance'
        violations.push({
          id: pairKey,
          type,
          elementIds: [a.id, b.id],
          message:
            type === 'short'
              ? `Short circuit: ${a.id} and ${b.id} are overlapping.`
              : `Clearance violation: ${a.id} and ${b.id} are ${sep.toFixed(3)} mm apart (min ${clearanceMm} mm).`,
        })
      }
    }
  }

  return violations
}
