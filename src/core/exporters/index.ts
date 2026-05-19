import JSZip from 'jszip'
import type { FootprintProject } from '../types/pcb'
import { generateGerberOutput } from './gerberExporter'

export { generateGerberOutput } from './gerberExporter'
export type { GerberOutput } from './gerberExporter'

/**
 * Generates Gerber + Excellon files from the project and triggers a ZIP download.
 * Returns the Blob for testing purposes.
 */
export async function exportGerberArchive(
  project: FootprintProject,
  projectName = 'gerbers',
): Promise<Blob> {
  const output = generateGerberOutput(project)

  const zip = new JSZip()
  const folder = zip.folder(projectName) ?? zip
  for (const [layerId, fileContent] of Object.entries(output.copperLayers)) {
    let extension = ''
    if (layerId === 'copper1') {
      extension = 'GTL'
    } else if (layerId === 'copper0') {
      extension = 'GBL'
    } else {
      const match = layerId.match(/^copper(\d+)$/)
      if (match) {
        const num = parseInt(match[1], 10)
        extension = `G${num - 1}`
      }
    }
    if (extension) {
      folder.file(`${projectName}.${extension}`, fileContent)
    }
  }
  folder.file(`${projectName}.GTO`, output.silkscreen)
  folder.file(`${projectName}.DRL`, output.drill)

  const blob = await zip.generateAsync({ type: 'blob' })

  // Trigger download in browser environments
  if (typeof document !== 'undefined') {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return blob
}
