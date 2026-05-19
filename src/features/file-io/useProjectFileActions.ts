import type { ChangeEvent } from 'react'

import { exportFritzingArchive } from '../../core/exporters/fritzingExporter'
import { parseFritzingArchive, parseSvg } from '../../core/parsers/fritzingParser'
import { useEditorStore } from '../../store/editorStore'

export const useProjectFileActions = () => {
  const importElements = useEditorStore((state) => state.importElements)
  const project = useEditorStore((state) => state.project)

  const handleSvgUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const elements = await parseSvg(file)
      importElements(elements)
    } catch (err) {
      console.error('Failed to parse SVG', err)
      alert('Failed to parse SVG')
    }

    event.target.value = ''
  }

  const handleFritzingUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const elements = await parseFritzingArchive(file)
      importElements(elements)
    } catch (err) {
      console.error('Failed to parse Fritzing archive', err)
      alert('Failed to parse Fritzing archive')
    }

    event.target.value = ''
  }

  const handleExportFritzing = async () => {
    try {
      const blob = await exportFritzingArchive(project)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `part.${project.projectId}.fzpz`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export', err)
      alert('Failed to export')
    }
  }

  return {
    handleSvgUpload,
    handleFritzingUpload,
    handleExportFritzing,
  }
}
