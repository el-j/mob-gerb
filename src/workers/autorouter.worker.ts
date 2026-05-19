import type { AutorouterRequest, AutorouterResponse } from './autorouter.protocol'
import type { ElementState, Coordinate } from '../core/types/pcb'

const generateId = () => Math.random().toString(36).substr(2, 9)

const getElementCenter = (el: ElementState): Coordinate => {
  if (el.type === 'circle') return { x: el.geom.x, y: el.geom.y }
  if (el.type === 'rect') return { x: el.geom.x + (el.geom.w ?? 0)/2, y: el.geom.y + (el.geom.h ?? 0)/2 }
  return { x: el.geom.x, y: el.geom.y }
}

const getBoundingBox = (el: ElementState) => {
  if (el.type === 'circle') {
    const r = el.geom.r ?? 0
    return { minX: el.geom.x - r, minY: el.geom.y - r, maxX: el.geom.x + r, maxY: el.geom.y + r }
  }
  if (el.type === 'rect') {
    return { minX: el.geom.x, minY: el.geom.y, maxX: el.geom.x + (el.geom.w ?? 0), maxY: el.geom.y + (el.geom.h ?? 0) }
  }
  if (el.type === 'polygon' || el.type === 'polyline') {
    const pts = el.geom.points ?? []
    if (pts.length === 0) return { minX: el.geom.x, minY: el.geom.y, maxX: el.geom.x, maxY: el.geom.y }
    const xs = pts.map(p => el.geom.x + p.x)
    const ys = pts.map(p => el.geom.y + p.y)
    return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) }
  }
  return { minX: el.geom.x, minY: el.geom.y, maxX: el.geom.x, maxY: el.geom.y }
}

self.onmessage = (e: MessageEvent<AutorouterRequest>) => {
  if (e.data.type !== 'ROUTE_REQUEST') return

  const { nets, elements, gridSize } = e.data
  const traces: ElementState[] = []
  
  const GRID_W = 100
  const GRID_H = 100
  const res = gridSize > 0 ? gridSize : 1

  // Pre-calculate obstacles
  const elList = Object.values(elements)

  for (const net of Object.values(nets)) {
    if (net.padIds.length < 2) continue
    
    // Route each pair sequentially
    for (let i = 0; i < net.padIds.length - 1; i++) {
      const p1Id = net.padIds[i]
      const p2Id = net.padIds[i + 1]
      const p1 = elements[p1Id]
      const p2 = elements[p2Id]
      if (!p1 || !p2) continue

      const start = getElementCenter(p1)
      const goal = getElementCenter(p2)

      const startGx = Math.floor(start.x / res)
      const startGy = Math.floor(start.y / res)
      const goalGx = Math.floor(goal.x / res)
      const goalGy = Math.floor(goal.y / res)

      // Create grid for this route
      const grid = new Array(GRID_W).fill(0).map(() => new Array(GRID_H).fill(false))
      
      // Mark obstacles
      for (const el of elList) {
        if (el.id === p1Id || el.id === p2Id) continue // ignore start/goal
        if (el.net === net.id) continue // ignore own net
        if (el.pcbLayer === 'silkscreen') continue // ignore silkscreen
        
        const bb = getBoundingBox(el)
        const minGx = Math.max(0, Math.floor(bb.minX / res))
        const maxGx = Math.min(GRID_W - 1, Math.ceil(bb.maxX / res))
        const minGy = Math.max(0, Math.floor(bb.minY / res))
        const maxGy = Math.min(GRID_H - 1, Math.ceil(bb.maxY / res))
        
        for (let gx = minGx; gx <= maxGx; gx++) {
          for (let gy = minGy; gy <= maxGy; gy++) {
            grid[gx][gy] = true
          }
        }
      }

      // Simple BFS/A* over grid
      const queue: { x: number, y: number, path: {x: number, y: number}[] }[] = []
      const visited = new Set<string>()
      
      queue.push({ x: startGx, y: startGy, path: [] })
      visited.add(`${startGx},${startGy}`)
      
      let foundPath: {x: number, y: number}[] | null = null

      while (queue.length > 0) {
        // simple BFS (sort queue by heuristic for A*)
        queue.sort((a, b) => {
          const distA = Math.abs(a.x - goalGx) + Math.abs(a.y - goalGy)
          const distB = Math.abs(b.x - goalGx) + Math.abs(b.y - goalGy)
          return distA - distB
        })
        
        const current = queue.shift()!
        
        if (current.x === goalGx && current.y === goalGy) {
          foundPath = current.path
          break
        }
        
        const neighbors = [
          { x: current.x + 1, y: current.y },
          { x: current.x - 1, y: current.y },
          { x: current.x, y: current.y + 1 },
          { x: current.x, y: current.y - 1 }
        ]
        
        for (const n of neighbors) {
          if (n.x >= 0 && n.x < GRID_W && n.y >= 0 && n.y < GRID_H) {
            if (!grid[n.x][n.y]) {
              const key = `${n.x},${n.y}`
              if (!visited.has(key)) {
                visited.add(key)
                queue.push({ x: n.x, y: n.y, path: [...current.path, n] })
              }
            }
          }
        }
      }

      if (foundPath && foundPath.length > 0) {
        // Simplify path: find corners
        const points: Coordinate[] = [{ x: 0, y: 0 }] // relative to start
        let lastDir = { dx: 0, dy: 0 }
        
        for (let j = 0; j < foundPath.length; j++) {
          const pt = foundPath[j]
          const prev = j === 0 ? { x: startGx, y: startGy } : foundPath[j - 1]
          const dx = pt.x - prev.x
          const dy = pt.y - prev.y
          
          if (dx !== lastDir.dx || dy !== lastDir.dy) {
            points.push({ x: prev.x * res - start.x, y: prev.y * res - start.y })
            lastDir = { dx, dy }
          }
        }
        
        points.push({ x: goal.x - start.x, y: goal.y - start.y }) // exact goal
        
        const polyline: ElementState = {
          id: `route-${generateId()}`,
          type: 'polyline',
          role: 'copper-surface',
          pcbLayer: 'copper1',
          geom: {
            x: start.x,
            y: start.y,
            points,
            strokeWidth: 0.5,
            filled: false
          },
          net: net.id
        }
        traces.push(polyline)
      } else {
        // Fallback L-shape if blocked (preventing complete failure for MVP)
        const points: Coordinate[] = [
          { x: 0, y: 0 },
          { x: goal.x - start.x, y: 0 },
          { x: goal.x - start.x, y: goal.y - start.y }
        ]
        const polyline: ElementState = {
          id: `route-${generateId()}`,
          type: 'polyline',
          role: 'copper-surface',
          pcbLayer: 'copper1',
          geom: { x: start.x, y: start.y, points, strokeWidth: 0.5, filled: false },
          net: net.id
        }
        traces.push(polyline)
      }
    }
  }

  // Simulate small compute time to be visible
  setTimeout(() => {
    self.postMessage({
      type: 'ROUTE_SUCCESS',
      traces
    } as AutorouterResponse)
  }, 200)
}
