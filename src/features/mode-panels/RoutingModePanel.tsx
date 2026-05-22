import { Zap, Search, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'

export const RoutingModePanel = () => {
  const isRouting = useEditorStore((state) => state.isRouting)
  const nets = useEditorStore((state) => state.project.nets)
  const routingStrategy = useEditorStore((state) => state.routingStrategy)
  const drcViolations = useEditorStore((state) => state.drcViolations)
  const drcClearanceMm = useEditorStore((state) => state.drcClearanceMm)
  const triggerAutoroute = useEditorStore((state) => state.triggerAutoroute)
  const runDrc = useEditorStore((state) => state.runDrc)
  const setDrcClearance = useEditorStore((state) => state.setDrcClearance)
  const setRoutingStrategy = useEditorStore((state) => state.setRoutingStrategy)

  const hasNets = Object.keys(nets).length > 0

  return (
    <section className="creator-panel ui-panel" aria-label="Routing mode controls">
      <div className="drc-panel">
        <div className="shape-row flex-wrap items-center">
          <span className="text-sm font-medium mr-2" style={{ opacity: 0.8 }}>
            Routing Mode:
          </span>
          <button
            id="autoroute-btn"
            type="button"
            onClick={triggerAutoroute}
            disabled={isRouting || !hasNets}
            className="flex items-center gap-1"
            title="Trigger Autoroute Nets"
            aria-label="Autoroute Nets"
          >
            <Zap size={16} /> {isRouting ? '⏳ Routing…' : '⚡ Autoroute'}
          </button>
          <button
            id="run-drc-btn"
            type="button"
            onClick={runDrc}
            className="flex items-center gap-1"
            title="Run Design Rule Check (DRC)"
            aria-label="Run DRC"
          >
            <Search size={16} /> Run DRC
          </button>
        </div>

        <div className="tag-row flex-wrap items-center mt-1">
          <label className="flex items-center gap-1 text-xs">
            Strategy
            <select
              className="ui-input w-40"
              aria-label="Routing strategy"
              value={routingStrategy}
              onChange={(event) => setRoutingStrategy(event.target.value as 'mvp-grid' | 'tscircuit-prototype')}
            >
              <option value="mvp-grid">MVP Grid</option>
              <option value="tscircuit-prototype">tscircuit Prototype</option>
            </select>
          </label>
          <label className="flex items-center gap-1 text-xs">
            Clearance
            <input
              className="ui-input w-20"
              id="drc-clearance-input"
              type="number"
              min="0.05"
              step="0.05"
              value={drcClearanceMm}
              onChange={(event) => setDrcClearance(Number(event.target.value))}
            />
            mm
          </label>
        </div>

        {drcViolations.length === 0 ? (
          <p className="drc-ok flex items-center gap-1 text-xs mt-1">
            <CheckCircle size={14} className="text-green-400" /> No DRC violations
          </p>
        ) : (
          <div className="mt-1">
            <p className="text-red-300 font-medium text-xs flex items-center gap-1 mb-1">
              <ShieldAlert size={14} /> {drcViolations.length} DRC Violation(s):
            </p>
            <ul className="drc-violations-list" aria-label="DRC violations">
              {drcViolations.map((violation) => (
                <li key={violation.id} className={`drc-violation-item ${violation.type} flex items-center gap-1`}>
                  <AlertTriangle size={12} className="shrink-0" />
                  <span>
                    <strong>{violation.type.toUpperCase()}:</strong> {violation.message}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
