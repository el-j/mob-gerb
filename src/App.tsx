import { PcbCanvas } from './components/Canvas/PcbCanvas'
import { ModeToolbar } from './components/Toolbar/ModeToolbar'
import { useEditorStore } from './store/editorStore'

import './App.css'

function App() {
  const mode = useEditorStore((state) => state.mode)
  const gridSize = useEditorStore((state) => state.gridSize)
  const setGridSize = useEditorStore((state) => state.setGridSize)

  return (
    <main className="app-shell">
      <header>
        <h1>MOB-GERB</h1>
        <p>Mobile-first, Fritzing-compatible PCB editor foundation.</p>
      </header>

      <ModeToolbar />

      <section className="status-row" aria-live="polite">
        <span>Mode: {mode}</span>
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
      </section>

      <PcbCanvas />

      <footer>
        <span>Workflow: local Claude commands in .claude/commands</span>
        <span>Backlog: docs/backlog</span>
      </footer>
    </main>
  )
}

export default App
