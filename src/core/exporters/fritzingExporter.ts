import JSZip from 'jszip'
import type { FootprintProject, ElementState } from '../types/pcb'

const getElementCenter = (el: ElementState): { cx: number; cy: number } => {
  switch (el.type) {
    case 'circle':
      return { cx: el.geom.x, cy: el.geom.y }
    case 'rect':
      return { cx: el.geom.x + (el.geom.w ?? 0) / 2, cy: el.geom.y + (el.geom.h ?? 0) / 2 }
    case 'polygon':
    case 'polyline': {
      const pts = el.geom.points ?? []
      if (pts.length > 0) {
        const sumX = pts.reduce((sum, p) => sum + p.x, 0)
        const sumY = pts.reduce((sum, p) => sum + p.y, 0)
        return { cx: el.geom.x + sumX / pts.length, cy: el.geom.y + sumY / pts.length }
      }
      return { cx: el.geom.x, cy: el.geom.y }
    }
    case 'line':
      return { cx: el.geom.x + (el.geom.w ?? 0) / 2, cy: el.geom.y + (el.geom.h ?? 0) / 2 }
    default:
      return { cx: el.geom.x, cy: el.geom.y }
  }
}

const renderTerminalSvg = (el: ElementState): string => {
  if (el.role !== 'connector' || !el.connector) return ''
  const c = el.connector
  const { cx, cy } = getElementCenter(el)
  return `<rect id="${c.connectorId}terminal" x="${cx - 0.0005}" y="${cy - 0.0005}" width="0.001" height="0.001" fill="none" stroke="none" opacity="0" />`
}

const renderElementToSvg = (el: ElementState): string => {
  const isSilkscreen = el.pcbLayer === 'silkscreen'
  const filledAttr = el.geom.filled ? `fill="${isSilkscreen ? '#ffffff' : '#da8a3a'}"` : 'fill="none"'
  const strokeAttr = `stroke="${isSilkscreen ? '#ffffff' : '#da8a3a'}"`
  const strokeWidthAttr = `stroke-width="${el.geom.strokeWidth ?? 0.5}"`
  const idAttr = `id="${el.connector?.svgId ?? el.id}"`

  switch (el.type) {
    case 'rect':
      return `<rect ${idAttr} x="${el.geom.x}" y="${el.geom.y}" width="${el.geom.w}" height="${el.geom.h}" ${filledAttr} ${strokeAttr} ${strokeWidthAttr} />`
    case 'circle':
      return `<circle ${idAttr} cx="${el.geom.x}" cy="${el.geom.y}" r="${el.geom.r}" ${filledAttr} ${strokeAttr} ${strokeWidthAttr} />`
    case 'polygon': {
      const points = (el.geom.points ?? []).map(p => `${el.geom.x + p.x},${el.geom.y + p.y}`).join(' ')
      return `<polygon ${idAttr} points="${points}" ${filledAttr} ${strokeAttr} ${strokeWidthAttr} />`
    }
    case 'polyline': {
      const points = (el.geom.points ?? []).map(p => `${el.geom.x + p.x},${el.geom.y + p.y}`).join(' ')
      return `<polyline ${idAttr} points="${points}" fill="none" ${strokeAttr} ${strokeWidthAttr} />`
    }
    case 'line':
      return `<line ${idAttr} x1="${el.geom.x}" y1="${el.geom.y}" x2="${el.geom.x + (el.geom.w ?? 0)}" y2="${el.geom.y + (el.geom.h ?? 0)}" fill="none" ${strokeAttr} ${strokeWidthAttr} />`
    case 'group':
      return ''
    default:
      return ''
  }
}

export const exportProjectToFritzingSvg = (project: FootprintProject): string => {
  const elements = Object.values(project.elements)
  
  const copper0 = elements.filter(e => e.pcbLayer === 'copper0')
  const copper1 = elements.filter(e => e.pcbLayer === 'copper1')
  const copper2 = elements.filter(e => e.pcbLayer === 'copper2')
  const copper3 = elements.filter(e => e.pcbLayer === 'copper3')
  const silkscreen = elements.filter(e => e.pcbLayer === 'silkscreen')

  const renderGroup = (el: ElementState) => {
    const main = renderElementToSvg(el)
    const term = renderTerminalSvg(el)
    return term ? `${main}\n    ${term}` : main
  }

  const svgContent = `<?xml version="1.0" encoding="utf-8"?>
<svg version="1.2" baseProfile="tiny" id="svg2"
  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  viewBox="0 0 100 100">
  <g id="copper1">
    ${copper1.map(renderGroup).join('\n    ')}
    <g id="copper2">
      ${copper2.map(renderGroup).join('\n      ')}
      <g id="copper3">
        ${copper3.map(renderGroup).join('\n        ')}
        <g id="copper0">
          ${copper0.map(renderGroup).join('\n          ')}
        </g>
      </g>
    </g>
  </g>
  <g id="silkscreen">
    ${silkscreen.map(renderGroup).join('\n    ')}
  </g>
</svg>
`
  return svgContent
}

export const exportProjectToFzpXml = (project: FootprintProject): string => {
  const elements = Object.values(project.elements)
  const connectors = elements.filter(e => e.role === 'connector' && e.connector)

  // Generate XML using simple string interpolation (in production, xmlbuilder is better)
  let connectorsXml = ''
  for (const el of connectors) {
    const c = el.connector!
    const isTht = c.kind === 'through-hole'
    const typeAttr = isTht ? 'male' : 'pad'
    
    let pcbViewXml = ''
    if (isTht) {
      pcbViewXml = `
          <p layer="copper0" svgId="${c.svgId}" terminalId="${c.connectorId}terminal"/>
          <p layer="copper1" svgId="${c.svgId}" terminalId="${c.connectorId}terminal"/>`
    } else {
      const layer = el.pcbLayer || 'copper1'
      pcbViewXml = `
          <p layer="${layer}" svgId="${c.svgId}" terminalId="${c.connectorId}terminal"/>`
    }

    connectorsXml += `
    <connector id="${c.connectorId}" type="${typeAttr}" name="Pin ${c.pin}">
      <description>Pin ${c.pin}</description>
      <views>
        <pcbView>${pcbViewXml}
        </pcbView>
      </views>
    </connector>`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<module fritzingVersion="0.9.3b" moduleId="${project.projectId}">
  <version>1</version>
  <title>${project.metadata.name}</title>
  <author>${project.metadata.author}</author>
  <description>Exported from Mob-Gerb</description>
  <views>
    <pcbView>
      <layers image="pcb/${project.projectId}.svg">
        <layer layerId="copper1"/>
        <layer layerId="copper2"/>
        <layer layerId="copper3"/>
        <layer layerId="copper0"/>
        <layer layerId="silkscreen"/>
      </layers>
    </pcbView>
  </views>
  <connectors>
    ${connectorsXml}
  </connectors>
</module>
`
}

export const exportFritzingArchive = async (project: FootprintProject): Promise<Blob> => {
  const zip = new JSZip()
  
  const svgContent = exportProjectToFritzingSvg(project)
  const xmlContent = exportProjectToFzpXml(project)
  
  zip.file(`part.${project.projectId}.fzp`, xmlContent)
  // Fritzing conventions expect SVGs in a folder structure inside the zip
  zip.file(`svg.pcb.${project.projectId}.svg`, svgContent)
  
  const blob = await zip.generateAsync({ type: 'blob' })
  return blob
}
