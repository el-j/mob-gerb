import { CircleDot, Square, Minus, Hexagon, PenTool, Check, X, Link, Unlink, Eraser, Tag, Ban, Layers, XCircle } from 'lucide-react'
import { usePartCreatorState } from './usePartCreatorState'

export const PartCreatorPanel = () => {
  const {
    selectedElementId,
    selectedElementIds,
    selectedElement,
    drawTool,
    draftPoints,
    pinInput,
    requestedPin,
    setPinInput,
    addShape,
    selectElement,
    combineSelectedElements,
    splitComposite,
    setOutlinePadding,
    setSelectedFill,
    setSelectedStrokeWidth,
    updateSelectedPolylinePoint,
    setDrawTool,
    finishPolylineDraw,
    clearDraftPoints,
    applyTagToSelected,
  } = usePartCreatorState()

  return (
    <section className="creator-panel ui-panel" aria-label="Part creator controls">
      <div className="shape-row flex-wrap">
        <button type="button" onClick={() => addShape('circle')} className="flex items-center gap-1" title="Add Pad (Circle)" aria-label="Add Pad (Circle)">
          <CircleDot size={16} /> Pad
        </button>
        <button type="button" onClick={() => addShape('rect')} className="flex items-center gap-1" title="Add Rectangle" aria-label="Add Rectangle">
          <Square size={16} /> Rect
        </button>
        <button type="button" onClick={() => addShape('line')} className="flex items-center gap-1" title="Add Line" aria-label="Add Line">
          <Minus size={16} /> Line
        </button>
        <button type="button" onClick={() => addShape('polygon')} className="flex items-center gap-1" title="Add Copper Surface" aria-label="Add Copper Surface">
          <Hexagon size={16} /> Copper
        </button>
        <button
          type="button"
          className={`flex items-center gap-1 ${drawTool === 'polyline' ? 'active-action' : ''}`}
          onClick={() => setDrawTool(drawTool === 'polyline' ? 'none' : 'polyline')}
          title={drawTool === 'polyline' ? 'Exit Draw Tool' : 'Start Free Draw'}
          aria-label={drawTool === 'polyline' ? 'Exit Draw Tool' : 'Start Free Draw'}
        >
          {drawTool === 'polyline' ? <><X size={16} /> Exit Draw</> : <><PenTool size={16} /> Draw</>}
        </button>
        <button type="button" onClick={finishPolylineDraw} disabled={drawTool !== 'polyline' || draftPoints.length < 2} className="flex items-center gap-1" aria-label="Finish Polyline">
          <Check size={16} /> Finish
        </button>
        <button type="button" onClick={clearDraftPoints} disabled={drawTool !== 'polyline' && draftPoints.length === 0} className="flex items-center gap-1" aria-label="Cancel Draw">
          <Eraser size={16} /> Cancel
        </button>
      </div>

      <div className="shape-row flex-wrap">
        <button type="button" onClick={combineSelectedElements} disabled={selectedElementIds.length < 2} className="flex items-center gap-1" title="Combine Selected" aria-label="Combine Selected">
          <Link size={16} /> Combine
        </button>
        <button
          type="button"
          onClick={() => selectedElement && selectedElement.type === 'group' && splitComposite(selectedElement.id)}
          disabled={!selectedElement || selectedElement.type !== 'group'}
          className="flex items-center gap-1"
          title="Split Composite"
          aria-label="Split Composite"
        >
          <Unlink size={16} /> Split
        </button>
        <button type="button" onClick={() => selectElement(null)} disabled={selectedElementIds.length === 0} className="flex items-center gap-1" title="Clear Selection" aria-label="Clear Selection">
          <XCircle size={16} /> Deselect
        </button>
      </div>

      <div className="tag-row flex-wrap items-center">
        <span className="mr-2 text-sm">
          Selected: {selectedElementIds.length === 0 ? 'none' : selectedElementIds.length > 1 ? `${selectedElementIds.length} shapes` : selectedElementId ?? 'none'}
        </span>
        <label className="flex items-center gap-1">
          Pin
          <input className="ui-input w-16" type="number" min="1" step="1" value={pinInput} onChange={(event) => setPinInput(event.target.value)} />
        </label>
        <button type="button" onClick={() => applyTagToSelected('through-hole', requestedPin)} className="flex items-center gap-1" title="Tag Through-Hole Pad" aria-label="Tag Through-Hole Pad">
          <Tag size={16} /> TH
        </button>
        <button type="button" onClick={() => applyTagToSelected('smd', requestedPin)} className="flex items-center gap-1" title="Tag SMD Pad" aria-label="Tag SMD Pad">
          <Tag size={16} /> SMD
        </button>
        <button type="button" onClick={() => applyTagToSelected('silkscreen')} className="flex items-center gap-1" title="Tag Silkscreen" aria-label="Tag Silkscreen">
          <Layers size={16} /> Silk
        </button>
        <button type="button" onClick={() => applyTagToSelected('copper-surface')} className="flex items-center gap-1" title="Tag Copper Surface" aria-label="Tag Copper Surface">
          <Hexagon size={16} /> Copper
        </button>
        <button type="button" onClick={() => applyTagToSelected('unassigned')} className="flex items-center gap-1" title="Clear Tag" aria-label="Clear Tag">
          <Ban size={16} /> Clear
        </button>
      </div>

      <p className="tag-summary">Connector mapping: select one shape, choose Pin, then tag Through-Hole or SMD.</p>

      {selectedElement && selectedElement.type !== 'group' ? (
        <div className="tag-row">
          <label>
            Stroke
            <input
                className="ui-input"
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
                className="ui-input"
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
                className="ui-input"
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
              className="ui-input"
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
  )
}
