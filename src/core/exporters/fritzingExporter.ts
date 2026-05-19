import JSZip from 'jszip'
import type { FootprintProject, ElementState } from '../types/pcb'

const renderElementToSvg = (el: ElementState): string => {
  const filledAttr = el.geom.filled ? `fill="${el.pcbLayer === 'silkscreen' ? '#f4f7fb' : '#f7bd13'}"` : 'fill="none"'
  const strokeAttr = `stroke="${el.pcbLayer === 'silkscreen' ? '#f4f7fb' : '#f7bd13'}"`
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
      // Group outline is not exported to actual SVG
      return ''
    default:
      return ''
  }
}

export const exportProjectToFritzingSvg = (project: FootprintProject): string => {
  const elements = Object.values(project.elements)
  
  const copper0 = elements.filter(e => e.pcbLayer === 'copper0')
  const copper1 = elements.filter(e => e.pcbLayer === 'copper1')
  const silkscreen = elements.filter(e => e.pcbLayer === 'silkscreen')

  const svgContent = `<?xml version="1.0" encoding="utf-8"?>
<svg version="1.2" baseProfile="tiny" id="svg2"
  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  viewBox="0 0 100 100">
  <g id="copper1">
    ${copper1.map(renderElementToSvg).join('\n    ')}
    <g id="copper0">
      ${copper0.map(renderElementToSvg).join('\n      ')}
    </g>
  </g>
  <g id="silkscreen">
    ${silkscreen.map(renderElementToSvg).join('\n    ')}
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
    connectorsXml += `
    <connector id="${c.connectorId}" type="pad" name="pin${c.pin}">
      <description>Pin ${c.pin}</description>
      <views>
        <pcbView>
          <p layer="copper0" svgId="${c.svgId}"/>
          <p layer="copper1" svgId="${c.svgId}"/>
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
