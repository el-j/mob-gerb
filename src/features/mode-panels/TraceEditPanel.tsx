import { useEditorStore } from '../../store/editorStore'

export const TraceEditPanel = () => {
  const drcViolations = useEditorStore((state) => state.drcViolations)
  const drcClearanceMm = useEditorStore((state) => state.drcClearanceMm)
  const exitTraceEdit = useEditorStore((state) => state.exitTraceEdit)
  const runDrcAction = useEditorStore((state) => state.runDrc)
  const setDrcClearance = useEditorStore((state) => state.setDrcClearance)

  return (
    <section className="creator-panel ui-panel" aria-label="Trace edit controls">
      <div className="drc-panel">
        <div className="shape-row">
          <span style={{ opacity: 0.7 }}>
            ✏️ Editing trace - drag waypoint handles to reshape. <kbd>Esc</kbd> to exit.
          </span>
          <button id="exit-trace-edit-btn" type="button" onClick={exitTraceEdit}>
            Exit Edit Mode
          </button>
        </div>
        <div className="tag-row">
          <label>
            Clearance (mm)
            <input
              className="ui-input"
              id="drc-clearance-input"
              type="number"
              min="0.05"
              step="0.05"
              value={drcClearanceMm}
              onChange={(event) => setDrcClearance(Number(event.target.value))}
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
            {drcViolations.map((violation) => (
              <li key={violation.id} className={`drc-violation-item ${violation.type}`}>
                {violation.type === 'short' ? '⚡ SHORT' : '⚠️ CLEARANCE'} - {violation.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
