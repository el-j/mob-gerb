import { useState } from 'react'

import { PcbCanvas } from './components/Canvas/PcbCanvas'
import { ModeToolbar } from './components/Toolbar/ModeToolbar'
import { exportFritzingArchive } from './core/exporters/fritzingExporter'
import { parseFritzingArchive, parseSvg } from './core/parsers/fritzingParser'
import { useEditorStore } from './store/editorStore'

import './App.css'

function App() {
  const mode = useEditorStore((state) => state.mode)
  const gridSize = useEditorStore((state) => state.gridSize)
  const selectedElementId = useEditorStore((state) => state.selectedElementId)
  const selectedElementIds = useEditorStore((state) => state.selectedElementIds)
  const selectedElement = useEditorStore((state) =>
    state.selectedElementId ? state.project.elements[state.selectedElementId] : undefined,
  )
  const zoom = useEditorStore((state) => state.zoom)
  const drawTool = useEditorStore((state) => state.drawTool)
  const draftPoints = useEditorStore((state) => state.draftPoints)
  const setGridSize = useEditorStore((state) => state.setGridSize)
  const addShape = useEditorStore((state) => state.addShape)
  const selectElement = useEditorStore((state) => state.selectElement)
  const combineSelectedElements = useEditorStore((state) => state.combineSelectedElements)
  const splitComposite = useEditorStore((state) => state.splitComposite)
  const importElements = useEditorStore((state) => state.importElements)
  const project = useEditorStore((state) => state.project)
  const setOutlinePadding = useEditorStore((state) => state.setOutlinePadding)
  const setSelectedFill = useEditorStore((state) => state.setSelectedFill)
  const setSelectedStrokeWidth = useEditorStore((state) => state.setSelectedStrokeWidth)
  const updateSelectedPolylinePoint = useEditorStore((state) => state.updateSelectedPolylinePoint)
  const setDrawTool = useEditorStore((state) => state.setDrawTool)
  const finishPolylineDraw = useEditorStore((state) => state.finishPolylineDraw)
  const clearDraftPoints = useEditorStore((state) => state.clearDraftPoints)
  const applyTagToSelected = useEditorStore((state) => state.applyTagToSelected)
  const zoomBy = useEditorStore((state) => state.zoomBy)
  const resetView = useEditorStore((state) => state.resetView)
  const isRouting = useEditorStore((state) => state.isRouting)
  const triggerAutoroute = useEditorStore((state) => state.triggerAutoroute)
  const nets = useEditorStore((state) => state.project.nets)
  const drcViolations = useEditorStore((state) => state.drcViolations)
  const drcClearanceMm = useEditorStore((state) => state.drcClearanceMm)
  const exitTraceEdit = useEditorStore((state) => state.exitTraceEdit)
  const runDrcAction = useEditorStore((state) => state.runDrc)
  const setDrcClearance = useEditorStore((state) => state.setDrcClearance)

  const [pinInput, setPinInput] = useState('1')

  const parsedPin = Number(pinInput)
  const requestedPin = Number.isFinite(parsedPin) && parsedPin > 0 ? parsedPin : undefined

  const handleSvgUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleFritzingUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      const a = document.createElement('a')
      a.href = url
      a.download = `part.${project.projectId}.fzpz`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export', err)
      alert('Failed to export')
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header flex">
        <div className="flex flex-col">
          <h1>MOB-GERB</h1>
          <p>Mobile-first, Fritzing-compatible PCB editor foundation.</p>
        </div>
        <div className="flex shrink-0 gap-2 justify-center items-center" aria-label="File controls">
          <label className="file-upload-btn">
            SVG
            <input type="file" accept=".svg" onChange={handleSvgUpload} style={{ display: 'none' }} />
          </label>
          <label className="file-upload-btn">
            FZPZ
            <input type="file" accept=".fzpz,.fzz" onChange={handleFritzingUpload} style={{ display: 'none' }} />
          </label>
          <button type="button" onClick={handleExportFritzing}>
            FZPZ
          </button>
        </div>
      </header>
      <ModeToolbar />
    

      {mode === 'PART_CREATOR_MODE' ? (
        <section className="creator-panel" aria-label="Part creator controls">
          <div className="shape-row">
            <button type="button" onClick={() => addShape('circle')}>
              Add Pad (Circle)
            </button>
            <button type="button" onClick={() => addShape('rect')}>
              Add Rectangle
            </button>
            <button type="button" onClick={() => addShape('line')}>
              Add Line
            </button>
            <button type="button" onClick={() => addShape('polygon')}>
              Add Copper Surface
            </button>
            <button type="button" className={drawTool === 'polyline' ? 'active-action' : ''} onClick={() => setDrawTool(drawTool === 'polyline' ? 'none' : 'polyline')}>
              {drawTool === 'polyline' ? 'Exit Draw Tool' : 'Start Free Draw'}
            </button>
            <button type="button" onClick={finishPolylineDraw} disabled={drawTool !== 'polyline' || draftPoints.length < 2}>
              Finish Polyline
            </button>
            <button type="button" onClick={clearDraftPoints} disabled={drawTool !== 'polyline' && draftPoints.length === 0}>
              Cancel Draw
            </button>
          </div>

          <div className="shape-row">
            <button type="button" onClick={combineSelectedElements} disabled={selectedElementIds.length < 2}>
              Combine Selected
            </button>
            <button type="button" onClick={() => selectedElement && selectedElement.type === 'group' && splitComposite(selectedElement.id)} disabled={!selectedElement || selectedElement.type !== 'group'}>
              Split Composite
            </button>
            <button type="button" onClick={() => selectElement(null)} disabled={selectedElementIds.length === 0}>
              Clear Selection
            </button>
          </div>

          <div className="tag-row">
            <span>
              Selected: {selectedElementIds.length === 0 ? 'none' : selectedElementIds.length > 1 ? `${selectedElementIds.length} shapes` : selectedElementId ?? 'none'}
            </span>
            <label>
              Pin
              <input
                type="number"
                min="1"
                step="1"
                value={pinInput}
                onChange={(event) => setPinInput(event.target.value)}
              />
            </label>
            <button type="button" onClick={() => applyTagToSelected('through-hole', requestedPin)}>
              Tag Through-Hole Pad
            </button>
            <button type="button" onClick={() => applyTagToSelected('smd', requestedPin)}>
              Tag SMD Pad
            </button>
            <button type="button" onClick={() => applyTagToSelected('silkscreen')}>
              Tag Silkscreen
            </button>
            <button type="button" onClick={() => applyTagToSelected('copper-surface')}>
              Tag Copper Surface
            </button>
            <button type="button" onClick={() => applyTagToSelected('unassigned')}>
              Clear Tag
            </button>
          </div>

          <p className="tag-summary">Connector mapping: select one shape, choose Pin, then tag Through-Hole or SMD.</p>

          {selectedElement && selectedElement.type !== 'group' ? (
            <div className="tag-row">
              <label>
                Stroke
                <input
                  type="number"
                  min="0.1"
                  max="4"
                  step="0.1"
                  value={selectedElement.geom.strokeWidth ?? 1}
                  onChange={(event) => setSelectedStrokeWidth(Number(event.target.value))}
                />
              </label>

              {selectedElement.type === 'rect' || selectedElement.type === 'circle' || selectedElement.type === 'polygon' ? (
                <button type="button" onClick={() => setSelectedFill(!(selectedElement.geom.filled ?? false))}>
                  {selectedElement.geom.filled ? 'Set Outline Only' : 'Set Filled'}
                </button>
              ) : null}

              <span className="tag-summary">
                Connector: {selectedElement.connector ? `${selectedElement.connector.connectorId} (${selectedElement.connector.kind})` : 'none'}
              </span>
            </div>
          ) : null}

          {selectedElement?.type === 'polyline' ? (
            <div className="polyline-editor" aria-label="Polyline point editor">
              {(selectedElement.geom.points ?? []).map((point, index) => (
                <label key={`${selectedElement.id}-pt-${index}`}>
                  P{index + 1}
                  <input
                    type="number"
                    step="0.1"
                    value={point.x}
                    onChange={(event) =>
                      updateSelectedPolylinePoint(index, {
                        x: Number(event.target.value),
                        y: point.y,
                      })
                    }
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={point.y}
                    onChange={(event) =>
                      updateSelectedPolylinePoint(index, {
                        x: point.x,
                        y: Number(event.target.value),
                      })
                    }
                  />
                </label>
              ))}
            </div>
          ) : null}

          {selectedElement?.type === 'group' ? (
            <div className="tag-row">
              <label>
                Outline Padding
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={selectedElement.outlinePaddingMm ?? 0.8}
                  onChange={(event) => setOutlinePadding(selectedElement.id, Number(event.target.value))}
                />
              </label>
              <span className="tag-summary">Group outline can be expanded or tightened here.</span>
            </div>
          ) : null}

          {selectedElement ? (
            <p className="tag-summary">
              Role: {selectedElement.role} | Layer: {selectedElement.pcbLayer}
              {selectedElement.connector ? ` | Connector: ${selectedElement.connector.connectorId}` : ''}
            </p>
          ) : null}
        </section>
      ) : null}

      {mode === 'LOGICAL_MODE' ? (
        <section className="creator-panel" aria-label="Logical mode controls">
          <div className="shape-row">
            <span style={{ opacity: 0.7 }}>
              Click two connector pads to create a logical net. Press <kbd>Esc</kbd> to cancel.
            </span>
            <button
              id="autoroute-btn"
              type="button"
              onClick={triggerAutoroute}
              disabled={isRouting || Object.keys(nets).length === 0}
              style={isRouting ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              {isRouting ? '⏳ Routing…' : '⚡ Autoroute Nets'}
            </button>
          </div>
        </section>
      ) : null}

      {mode === 'EDIT_TRACE_MODE' ? (
        <section className="creator-panel" aria-label="Trace edit controls">
          <div className="drc-panel">
            <div className="shape-row">
              <span style={{ opacity: 0.7 }}>
                ✏️ Editing trace — drag waypoint handles to reshape. <kbd>Esc</kbd> to exit.
              </span>
              <button id="exit-trace-edit-btn" type="button" onClick={exitTraceEdit}>
                Exit Edit Mode
              </button>
            </div>
            <div className="tag-row">
              <label>
                Clearance (mm)
                <input
                  id="drc-clearance-input"
                  type="number"
                  min="0.05"
                  step="0.05"
                  value={drcClearanceMm}
                  onChange={(e) => setDrcClearance(Number(e.target.value))}
                  style={{ width: '4.5rem' }}
                />
              </label>
              <button id="run-drc-btn" type="button" onClick={runDrcAction}>
                🔍 Run DRC
              </button>
            </div>
            {drcViolations.length === 0 ? (
              <p className="drc-ok">✅ No DRC violations</p>
            ) : (
              <ul className="drc-violations-list" aria-label="DRC violations">
                {drcViolations.map((v) => (
                  <li key={v.id} className={`drc-violation-item ${v.type}`}>
                    {v.type === 'short' ? '⚡ SHORT' : '⚠️ CLEARANCE'} — {v.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      <section className="workspace-frame" aria-label="Workspace">
        <div className="floating-zoom" aria-label="Zoom controls">
          <button type="button" onClick={() => zoomBy(0.1)}>
            +
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => zoomBy(-0.1)}>
            -
          </button>
          <button type="button" onClick={resetView}>
            1:1
          </button>
           <label>
            Grid (mm)
            <input
              type="number"
              min="0.1"
              step="0.01"
              value={gridSize}
              onChange={(event) => setGridSize(Number(event.target.value))}
            />
          </label>
        </div>
        <PcbCanvas />
      </section>

      <footer className="app-footer">
        <span>Workflow: local Claude commands in .claude/commands</span>
        <span>Backlog: docs/backlog</span>
      </footer>
    </main>
  )
}

export default App
