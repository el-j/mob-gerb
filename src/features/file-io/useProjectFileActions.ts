import type { ChangeEvent } from 'react'

import { exportFritzingArchive } from '../../core/exporters/fritzingExporter'
import { exportGerberArchive } from '../../core/exporters'
import { clearDraft, loadDraft, validateDraftEnvelope } from '../../core/persistence/draftStorage'
import { parseFritzingArchive, parseSvg } from '../../core/parsers/fritzingParser'
import { useEditorStore } from '../../store/editorStore'

export const useProjectFileActions = () => {
  const importElements = useEditorStore((state) => state.importElements)
  const importProject = useEditorStore((state) => state.importProject)
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

  const handleExportDraft = () => {
    try {
      const json = JSON.stringify({ version: 1, project, savedAt: Date.now() }, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${project.projectId}.pcb-draft.json`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export draft', err)
      alert('Failed to export draft')
    }
  }

  const handleImportDraft = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed: unknown = JSON.parse(text)
      const validProject = validateDraftEnvelope(parsed)
      if (!validProject) {
        alert('Unrecognised draft format or version — file was not imported.')
        return
      }
      importProject(validProject)
    } catch (err) {
      console.error('Failed to import draft', err)
      alert('Failed to import draft — file may be corrupt.')
    }

    event.target.value = ''
  }

  const handleClearDraft = async () => {
    try {
      await clearDraft()
    } catch (err) {
      console.error('Failed to clear draft', err)
    }
  }

  const handleRestoreDraft = async () => {
    try {
      const saved = await loadDraft()
      if (saved) {
        importProject(saved)
      } else {
        alert('No saved draft found.')
      }
    } catch (err) {
      console.error('Failed to restore draft', err)
      alert('Failed to restore draft.')
    }
  }

  const handleExportGerbers = async () => {
    try {
      await exportGerberArchive(project, project.metadata.name || project.projectId)
    } catch (err) {
      console.error('Failed to export Gerbers', err)
      alert('Failed to export Gerbers')
    }
  }

  return {
    handleSvgUpload,
    handleFritzingUpload,
    handleExportFritzing,
    handleExportDraft,
    handleImportDraft,
    handleClearDraft,
    handleRestoreDraft,
    handleExportGerbers,
  }
}
