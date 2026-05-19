import JSZip from 'jszip'
import type { ElementState, Coordinate, PcbLayer, ElementRole } from '../types/pcb'

const generateId = () => Math.random().toString(36).substr(2, 9)

const parseSvgElement = (
  node: SVGElement,
  layer: PcbLayer
): ElementState | null => {
  const id = node.getAttribute('id') || `shape-${generateId()}`
  const strokeWidth = parseFloat(node.getAttribute('stroke-width') || '0.5')
  const filled = node.getAttribute('fill') !== 'none' && node.getAttribute('fill') !== 'transparent' && !!node.getAttribute('fill')

  let role: ElementRole = layer === 'silkscreen' ? 'silkscreen' : 'copper-surface'
  let connector: ElementState['connector'] = undefined

  // Fritzing conventions
  if (id.startsWith('connector') && (id.endsWith('pin') || id.endsWith('pad'))) {
    const match = id.match(/connector(\d+)(pin|pad)/)
    if (match) {
      role = 'connector'
      connector = {
        kind: id.endsWith('pad') ? 'smd' : 'through-hole',
        pin: parseInt(match[1], 10) + 1,
        connectorId: `connector${match[1]}`,
        svgId: id,
      }
    }
  }

  switch (node.tagName.toLowerCase()) {
    case 'rect': {
      const rect = node as SVGRectElement
      return {
        id,
        type: 'rect',
        role,
        pcbLayer: layer,
        geom: {
          x: parseFloat(rect.getAttribute('x') || '0'),
          y: parseFloat(rect.getAttribute('y') || '0'),
          w: parseFloat(rect.getAttribute('width') || '0'),
          h: parseFloat(rect.getAttribute('height') || '0'),
          strokeWidth,
          filled
        },
        connector
      }
    }
    case 'circle': {
      const circle = node as SVGCircleElement
      return {
        id,
        type: 'circle',
        role,
        pcbLayer: layer,
        geom: {
          x: parseFloat(circle.getAttribute('cx') || '0'),
          y: parseFloat(circle.getAttribute('cy') || '0'),
          r: parseFloat(circle.getAttribute('r') || '0'),
          strokeWidth,
          filled
        },
        connector
      }
    }
    case 'polygon':
    case 'polyline': {
      const poly = node as SVGPolygonElement | SVGPolylineElement
      const pointsStr = poly.getAttribute('points') || ''
      const points: Coordinate[] = pointsStr.split(/[\s,]+/)
        .reduce((acc: number[], cur: string) => {
          if (cur) acc.push(parseFloat(cur))
          return acc
        }, [])
        .reduce((acc: Coordinate[], cur: number, i: number, arr: number[]) => {
          if (i % 2 === 0 && i + 1 < arr.length) {
            acc.push({ x: cur, y: arr[i + 1] })
          }
          return acc
        }, [])
      
      if (points.length === 0) return null
      
      const minX = Math.min(...points.map(p => p.x))
      const minY = Math.min(...points.map(p => p.y))
      
      const normalizedPoints = points.map(p => ({ x: p.x - minX, y: p.y - minY }))

      return {
        id,
        type: node.tagName.toLowerCase() as 'polygon' | 'polyline',
        role,
        pcbLayer: layer,
        geom: {
          x: minX,
          y: minY,
          points: normalizedPoints,
          strokeWidth,
          filled
        },
        connector
      }
    }
    case 'line': {
      const line = node as SVGLineElement
      const x1 = parseFloat(line.getAttribute('x1') || '0')
      const y1 = parseFloat(line.getAttribute('y1') || '0')
      const x2 = parseFloat(line.getAttribute('x2') || '0')
      const y2 = parseFloat(line.getAttribute('y2') || '0')
      const minX = Math.min(x1, x2)
      const minY = Math.min(y1, y2)
      
      return {
        id,
        type: 'line',
        role,
        pcbLayer: layer,
        geom: {
          x: minX,
          y: minY,
          w: Math.abs(x2 - x1),
          h: Math.abs(y2 - y1),
          strokeWidth,
          filled
        },
        connector
      }
    }
    default:
      return null
  }
}

export const extractSvgElements = (svgString: string): ElementState[] => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgString, 'image/svg+xml')
  
  const elements: ElementState[] = []
  
  const processLayer = (layerId: string, layerName: PcbLayer) => {
    const layerGroup = doc.getElementById(layerId)
    if (!layerGroup) return
    
    const shapes = layerGroup.querySelectorAll('rect, circle, polygon, polyline, line')
    shapes.forEach(shape => {
      const el = parseSvgElement(shape as SVGElement, layerName)
      if (el) elements.push(el)
    })
  }

  processLayer('copper1', 'copper1')
  processLayer('copper0', 'copper0')
  processLayer('silkscreen', 'silkscreen')
  
  return elements
}

export const parseSvg = async (file: File): Promise<ElementState[]> => {
  const text = await file.text()
  return extractSvgElements(text)
}

export const parseFritzingArchive = async (file: File): Promise<ElementState[]> => {
  const zip = new JSZip()
  const loadedZip = await zip.loadAsync(file)
  
  let pcbSvgFile = null

  for (const [path, zipObj] of Object.entries(loadedZip.files)) {
    if (path.endsWith('.svg') && path.includes('pcb')) {
      pcbSvgFile = zipObj
    }
  }

  if (!pcbSvgFile) {
    throw new Error('No PCB SVG found in archive')
  }

  const svgText = await pcbSvgFile.async('text')
  return extractSvgElements(svgText)
}
