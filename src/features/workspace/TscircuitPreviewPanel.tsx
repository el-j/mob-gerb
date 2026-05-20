import type { ReactElement } from 'react'
import { useMemo, useState } from 'react'

import { exportProjectToTscircuitCircuitJson } from '../../core/exporters'
import {
  createRegistryPublishPayload,
  fetchRegistryCircuitJson,
  importProjectFromRegistryCircuitJson,
} from '../../core/registry/tscircuitRegistry'
import { useEditorStore } from '../../store/editorStore'

type ViewerComponent = (props: { circuitJson: unknown[] }) => ReactElement

type ViewerState = {
  pcbViewer: ViewerComponent | null
  schematicViewer: ViewerComponent | null
  loaded: boolean
  error: string | null
}

const loadViewerModules = async (): Promise<ViewerState> => {
  const dynamicImport = (specifier: string): Promise<unknown> =>
    new Function('s', 'return import(s)')(specifier) as Promise<unknown>

  const pickViewer = (mod: unknown): ViewerComponent | null => {
    if (!mod || typeof mod !== 'object') return null
    const record = mod as Record<string, unknown>
    const candidates = [record.PcbViewer, record.PCBViewer, record.SchematicViewer, record.default]
    for (const candidate of candidates) {
      if (typeof candidate === 'function') {
        return candidate as ViewerComponent
      }
    }
    return null
  }

  const [pcbResult, schematicResult] = await Promise.allSettled([
    dynamicImport('@tscircuit/pcb-viewer'),
    dynamicImport('@tscircuit/schematic-viewer'),
  ])

  const pcbViewer = pcbResult.status === 'fulfilled' ? pickViewer(pcbResult.value) : null
  const schematicViewer = schematicResult.status === 'fulfilled' ? pickViewer(schematicResult.value) : null

  const failed = pcbResult.status === 'rejected' || schematicResult.status === 'rejected'

  return {
    pcbViewer,
    schematicViewer,
    loaded: true,
    error: failed ? 'tscircuit viewer packages are not installed in this workspace.' : null,
  }
}

export const TscircuitPreviewPanel = () => {
  const project = useEditorStore((state) => state.project)
  const importProject = useEditorStore((state) => state.importProject)
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'pcb' | 'schematic'>('pcb')
  const [registrySpec, setRegistrySpec] = useState('')
  const [publishName, setPublishName] = useState('')
  const [registryBusy, setRegistryBusy] = useState(false)
  const [registryStatus, setRegistryStatus] = useState<string | null>(null)
  const [viewerState, setViewerState] = useState<ViewerState>({
    pcbViewer: null,
    schematicViewer: null,
    loaded: false,
    error: null,
  })

  const circuitJson = useMemo(() => exportProjectToTscircuitCircuitJson(project), [project])

  const openPanel = async () => {
    setIsOpen(true)
    if (!viewerState.loaded) {
      const loaded = await loadViewerModules()
      setViewerState(loaded)
    }
  }

  const handleImportRegistry = async () => {
    setRegistryStatus(null)
    setRegistryBusy(true)
    try {
      const circuitJson = await fetchRegistryCircuitJson(registrySpec, fetch)
      const importedProject = importProjectFromRegistryCircuitJson(circuitJson, {
        packageName: registrySpec.trim() || undefined,
      })
      importProject(importedProject)
      setRegistryStatus(`Imported ${circuitJson.length} circuit-json elements from registry source.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setRegistryStatus(`Import failed: ${message}`)
    } finally {
      setRegistryBusy(false)
    }
  }

  const handleExportPublishPayload = () => {
    const packageName = publishName.trim() || project.projectId
    const payload = createRegistryPublishPayload(project, packageName)
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${packageName.replace(/[^a-zA-Z0-9._-]/g, '_')}.registry-publish.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setRegistryStatus('Publish payload downloaded. Use tscircuit CLI/API to submit.')
  }

  const ActiveViewer = activeTab === 'pcb' ? viewerState.pcbViewer : viewerState.schematicViewer

  return (
    <div className="tsc-preview-anchor">
      <button
        type="button"
        className="ui-btn tsc-preview-toggle"
        onClick={isOpen ? () => setIsOpen(false) : openPanel}
        aria-label={isOpen ? 'Hide tscircuit preview' : 'Show tscircuit preview'}
      >
        {isOpen ? 'Close Preview' : 'tscircuit Preview'}
      </button>

      {isOpen ? (
        <section className="tsc-preview-panel ui-panel" aria-label="tscircuit preview panel">
          <header className="tsc-preview-header">
            <strong>Live tscircuit Preview</strong>
            <span>{circuitJson.length} elements</span>
          </header>

          <div className="tsc-preview-tabs" role="tablist" aria-label="tscircuit preview tabs">
            <button
              type="button"
              role="tab"
              className={`ui-btn ${activeTab === 'pcb' ? 'ui-btn--active' : ''}`}
              aria-selected={activeTab === 'pcb'}
              onClick={() => setActiveTab('pcb')}
            >
              PCB
            </button>
            <button
              type="button"
              role="tab"
              className={`ui-btn ${activeTab === 'schematic' ? 'ui-btn--active' : ''}`}
              aria-selected={activeTab === 'schematic'}
              onClick={() => setActiveTab('schematic')}
            >
              Schematic
            </button>
          </div>

          <div className="tsc-preview-body" data-testid="tscircuit-preview-body">
            {ActiveViewer ? (
              <ActiveViewer circuitJson={circuitJson} />
            ) : (
              <>
                <p className="tsc-preview-note">
                  {viewerState.error ?? 'Install @tscircuit/pcb-viewer and @tscircuit/schematic-viewer for embedded rendering.'}
                </p>
                <pre className="tsc-preview-json" data-testid="tscircuit-preview-json">
                  {JSON.stringify(circuitJson.slice(0, 20), null, 2)}
                </pre>
              </>
            )}
          </div>

          <div className="tsc-registry-actions">
            <label className="tsc-registry-field">
              Registry package or URL
              <input
                className="ui-input"
                type="text"
                value={registrySpec}
                onChange={(event) => setRegistrySpec(event.target.value)}
                placeholder="scope/package or https://..."
                aria-label="Registry package or URL"
              />
            </label>
            <button
              className="ui-btn"
              type="button"
              onClick={handleImportRegistry}
              disabled={registryBusy || registrySpec.trim().length === 0}
              aria-label="Import from tscircuit registry"
            >
              {registryBusy ? 'Importing…' : 'Import From Registry'}
            </button>

            <label className="tsc-registry-field">
              Publish package name
              <input
                className="ui-input"
                type="text"
                value={publishName}
                onChange={(event) => setPublishName(event.target.value)}
                placeholder="scope/package"
                aria-label="Publish package name"
              />
            </label>
            <button
              className="ui-btn"
              type="button"
              onClick={handleExportPublishPayload}
              aria-label="Download registry publish payload"
            >
              Download Publish Payload
            </button>

            {registryStatus ? <p className="tsc-preview-note">{registryStatus}</p> : null}
          </div>
        </section>
      ) : null}
    </div>
  )
}
