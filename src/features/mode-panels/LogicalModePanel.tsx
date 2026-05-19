import { useLogicalPanelState } from './useLogicalPanelState'

export const LogicalModePanel = () => {
  const { isRouting, nets, triggerAutoroute } = useLogicalPanelState()

  return (
    <section className="creator-panel ui-panel" aria-label="Logical mode controls">
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
  )
}
