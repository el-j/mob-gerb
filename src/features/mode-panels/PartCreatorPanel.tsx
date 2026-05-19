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
        <button
          type="button"
          className={drawTool === 'polyline' ? 'active-action' : ''}
          onClick={() => setDrawTool(drawTool === 'polyline' ? 'none' : 'polyline')}
        >
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
        <button
          type="button"
          onClick={() => selectedElement && selectedElement.type === 'group' && splitComposite(selectedElement.id)}
          disabled={!selectedElement || selectedElement.type !== 'group'}
        >
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
          <input className="ui-input" type="number" min="1" step="1" value={pinInput} onChange={(event) => setPinInput(event.target.value)} />
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
