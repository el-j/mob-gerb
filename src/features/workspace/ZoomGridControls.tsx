import { useWorkspaceControls } from './useWorkspaceControls'

export const ZoomGridControls = () => {
  const { gridSize, zoom, setGridSize, zoomBy, resetView } = useWorkspaceControls()

  return (
    <div className="floating-zoom ui-floating" aria-label="Zoom controls">
      <button className="ui-btn" type="button" onClick={() => zoomBy(0.1)}>
        +
      </button>
      <span>{Math.round(zoom * 100)}%</span>
      <button className="ui-btn" type="button" onClick={() => zoomBy(-0.1)}>
        -
      </button>
      <button className="ui-btn" type="button" onClick={resetView}>
        1:1
      </button>
      <label>
        Grid (mm)
        <input
          className="ui-input"
          type="number"
          min="0.1"
          step="0.01"
          value={gridSize}
          onChange={(event) => setGridSize(Number(event.target.value))}
        />
      </label>
    </div>
  )
}
